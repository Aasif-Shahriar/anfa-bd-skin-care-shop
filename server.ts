import express, { Request, Response, NextFunction } from "express";
import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv";
import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";
import {
  initializeApp,
  cert,
  getApps,
  applicationDefault,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

dotenv.config();

// ============================================================================
// 1. CLOUDINARY CONFIGURATION & STRICT VALIDATION
// ============================================================================
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const CLOUD_API_KEY = process.env.CLOUDINARY_API_KEY?.trim();
const CLOUD_API_SECRET = process.env.CLOUDINARY_API_SECRET?.trim();

const isCloudinaryConfigured = Boolean(
  CLOUD_NAME && CLOUD_API_KEY && CLOUD_API_SECRET,
);

if (!isCloudinaryConfigured) {
  console.error(
    "========================================================================\n" +
      "[STARTUP CONFIGURATION ERROR] Missing required Cloudinary credentials!\n" +
      "Missing: " +
      [
        !CLOUD_NAME && "CLOUDINARY_CLOUD_NAME",
        !CLOUD_API_KEY && "CLOUDINARY_API_KEY",
        !CLOUD_API_SECRET && "CLOUDINARY_API_SECRET",
      ]
        .filter(Boolean)
        .join(", ") +
      "\nPlease set these in your server environment (.env). Cloudinary upload/delete\n" +
      "endpoints will return HTTP 503 until configured.\n" +
      "========================================================================",
  );
} else {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_API_KEY,
    api_secret: CLOUD_API_SECRET,
    secure: true,
  });
}

// Helper to inspect magic bytes for supported image formats
function isValidImageMagicBytes(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 12) return false;

  // JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true;
  }

  // GIF: GIF87a or GIF89a (47 49 46 38)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return true;
  }

  // WebP: RIFF....WEBP (bytes 0-3 'RIFF' and bytes 8-11 'WEBP')
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return true;
  }

  // AVIF / HEIF: bytes 4-8 'ftyp'
  if (buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12).toLowerCase();
    if (["avif", "avis", "mif1", "msf1", "heic"].includes(brand)) {
      return true;
    }
  }

  return false;
}

// Multer memory storage with 5 MB ceiling and strict MIME check
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max per image
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/gif",
    ];
    if (allowed.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid image format. Supported formats: JPG, JPEG, PNG, WebP, AVIF, GIF.",
        ),
      );
    }
  },
});

// ============================================================================
// 2. FIREBASE ADMIN SDK INITIALIZATION
// ============================================================================
// Clean up invalid GOOGLE_APPLICATION_CREDENTIALS pointing to non-existent files
if (
  process.env.GOOGLE_APPLICATION_CREDENTIALS &&
  !fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
) {
  console.warn(
    `[AUTH NOTICE] GOOGLE_APPLICATION_CREDENTIALS points to non-existent file: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}. Ignoring invalid path.`,
  );
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

let projectId = "gen-lang-client-0282419252";
let firestoreDatabaseId: string | undefined = "ai-studio-06f97065-14c1-4a3a-9fd1-24d4abb659a8";
try {
  const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed.projectId) projectId = parsed.projectId;
    if (parsed.firestoreDatabaseId) firestoreDatabaseId = parsed.firestoreDatabaseId;
  }
} catch {
  // Use default project ID and database ID if file is not readable
}

function getAdminApp() {
  if (getApps().length === 0) {
    if (
      process.env.GOOGLE_APPLICATION_CREDENTIALS &&
      fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    ) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf-8"),
      );
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      );
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
    } else {
      const files = fs.readdirSync(process.cwd());
      const saFile = files.find(
        (f) =>
          (f.includes("service-account") || f.includes("firebase-adminsdk")) &&
          f.endsWith(".json"),
      );
      if (saFile) {
        const fullPath = path.resolve(process.cwd(), saFile);
        const serviceAccount = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        return initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id || projectId,
        });
      } else {
        return initializeApp({
          credential: applicationDefault(),
          projectId,
        });
      }
    }
  }
  return getApps()[0];
}

function getAdminAuth() {
  const app = getAdminApp();
  return getAuth(app);
}

function getAdminFirestore() {
  const app = getAdminApp();
  if (firestoreDatabaseId) {
    return getFirestore(app, firestoreDatabaseId);
  }
  return getFirestore(app);
}

// ============================================================================
// 3. CENTRALIZED ADMIN AUTHORIZATION VERIFICATION
// ============================================================================
/**
 * Strictly verifies the Firebase ID token using the Firebase Admin SDK.
 * Authorization requires:
 * 1. Cryptographically valid, non-expired ID token
 * 2. Verified custom claim: decoded.admin === true
 *
 * NOTE: Returns 401 Unauthorized for both missing auth and unprivileged tokens
 * to prevent upstream proxy 403 error interception (which converts 403 to HTML).
 * Unverified JWT payload decodes and hardcoded email authorizations are strictly disallowed.
 */
async function verifyAdminCaller(
  req: Request,
): Promise<{ uid: string; email?: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const idToken = authHeader.split("Bearer ")[1]?.trim();
  if (!idToken) return null;

  try {
    const auth = getAdminAuth();
    // Cryptographically verify token signature with Google certificates
    const decoded = await auth.verifyIdToken(idToken, true);

    // Require custom claim: admin === true
    if (decoded.admin === true) {
      return { uid: decoded.uid, email: decoded.email };
    }
  } catch (err: any) {
    // ID token signature invalid, expired, revoked, or malformed
    return null;
  }

  return null;
}

// HTML Escaping helper to prevent injection in generated email templates
function escapeHtml(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================================
// 4. EXPRESS APP & RATE LIMITING
// ============================================================================
const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// Trust first proxy hop so rate-limit correctly tracks client IPs behind reverse proxies
app.set("trust proxy", 1);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Standard rate limiter for general API endpoints: 120 req / 15 min
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "TooManyRequests",
    message: "Too many requests. Please try again later.",
  },
});

// Strict rate limiter for uploads: 30 uploads / 15 min per IP
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "TooManyRequests",
    message: "Image upload limit reached. Please wait before uploading more assets.",
  },
});

// Strict rate limiter for invoice email requests: 15 emails / 15 min per IP
const invoiceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "TooManyRequests",
    message: "Too many invoice dispatch requests. Please try again later.",
  },
});

// Admin management rate limiter: 30 req / 15 min per IP
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "TooManyRequests",
    message: "Too many administrative requests. Please try again later.",
  },
});

/**
 * GET /api/health
 * Backend health check endpoint
 */
app.get("/api/health", (_req: Request, res: Response): void => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "ANFA BD API",
    cloudinaryConfigured: isCloudinaryConfigured,
  });
});

// ============================================================================
// 5. ADMIN AUTHENTICATION & CLAIM MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/admin/verify-token
 * Validates the caller's ID token and reports their admin status.
 */
app.get(
  "/api/admin/verify-token",
  adminLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Bearer ID token required in Authorization header.",
      });
      return;
    }

    const idToken = authHeader.split("Bearer ")[1]?.trim();
    if (!idToken) {
      res.status(401).json({ error: "Unauthorized", message: "Token missing." });
      return;
    }

    try {
      const auth = getAdminAuth();
      const decoded = await auth.verifyIdToken(idToken);
      res.status(200).json({
        uid: decoded.uid,
        email: decoded.email,
        isAdmin: decoded.admin === true,
      });
    } catch (err: any) {
      res.status(401).json({
        error: "InvalidToken",
        message: "ID token is invalid or expired.",
      });
    }
  },
);

/**
 * POST /api/admin/set-claim
 * Allows a verified administrator to assign or revoke admin custom claims for other users.
 */
app.post(
  "/api/admin/set-claim",
  adminLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const admin = await verifyAdminCaller(req);
    if (!admin) {
      res.status(401).json({
        error: "Unauthorized",
        message:
          "Administrator authorization required. Caller must possess verified { admin: true } claim.",
      });
      return;
    }

    const { targetUid, targetEmail, makeAdmin } = req.body;
    if (!targetUid && !targetEmail) {
      res.status(400).json({
        error: "BadRequest",
        message: "targetUid or targetEmail required in request body.",
      });
      return;
    }

    try {
      const auth = getAdminAuth();
      let targetRecord;
      if (targetEmail && typeof targetEmail === "string") {
        targetRecord = await auth.getUserByEmail(targetEmail.trim().toLowerCase());
      } else if (targetUid && typeof targetUid === "string") {
        targetRecord = await auth.getUser(targetUid.trim());
      } else {
        res.status(400).json({ error: "BadRequest", message: "Invalid target identifier." });
        return;
      }

      const currentClaims = targetRecord.customClaims || {};
      const updatedClaims = { ...currentClaims, admin: Boolean(makeAdmin) };

      await auth.setCustomUserClaims(targetRecord.uid, updatedClaims);

      res.status(200).json({
        success: true,
        message: `Admin claim set to ${Boolean(makeAdmin)} for ${targetRecord.email}`,
        targetUser: {
          uid: targetRecord.uid,
          email: targetRecord.email,
          admin: Boolean(makeAdmin),
        },
      });
    } catch (err: any) {
      res.status(500).json({
        error: "ClaimAssignmentFailed",
        message: err.message || "Failed to assign custom claim.",
      });
    }
  },
);

// ============================================================================
// 6. CLOUDINARY PRODUCT IMAGE UPLOAD & ASSET MANAGEMENT ROUTES
// ============================================================================

/**
 * POST /api/admin/cloudinary/upload
 * Securely uploads a product image to Cloudinary folder 'anfa-bd/products'.
 * Requires:
 * - Verified admin caller with { admin: true }
 * - File size <= 5 MB
 * - Valid image format and verified binary magic bytes
 */
app.post(
  "/api/admin/cloudinary/upload",
  uploadLimiter,
  (req, res, next) => {
    imageUpload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "FileSizeLimit",
            message: "Image exceeds maximum allowed size of 5 MB.",
          });
        }
        return res
          .status(400)
          .json({ error: "UploadError", message: err.message });
      } else if (err) {
        return res
          .status(400)
          .json({ error: "UploadError", message: err.message });
      }
      next();
    });
  },
  async (req: Request, res: Response): Promise<void> => {
    const admin = await verifyAdminCaller(req);
    if (!admin) {
      // Return 401 to prevent upstream proxy from rewriting 403 to HTML
      res.status(401).json({
        error: "Unauthorized",
        message:
          "Administrator authorization required. Caller must possess verified { admin: true } claim.",
      });
      return;
    }

    if (!isCloudinaryConfigured) {
      res.status(503).json({
        error: "ServiceUnavailable",
        message:
          "Cloudinary credentials are not configured on the server. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in the server environment.",
      });
      return;
    }

    try {
      let uploadResult: any;

      if (req.file) {
        const buffer = req.file.buffer;

        // Verify non-empty buffer
        if (!buffer || buffer.length === 0) {
          res.status(400).json({
            error: "EmptyFile",
            message: "Selected file is empty (0 bytes). Please upload a valid image.",
          });
          return;
        }

        // Verify actual image file content via magic bytes inspection
        if (!isValidImageMagicBytes(buffer)) {
          res.status(400).json({
            error: "InvalidFileContent",
            message:
              "File content does not match a supported image format (JPEG, PNG, WebP, AVIF, GIF).",
          });
          return;
        }

        uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "anfa-bd/products",
              resource_type: "image",
              transformation: [{ quality: "auto", fetch_format: "auto" }],
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            },
          );
          stream.end(buffer);
        });
      } else if (req.body?.image) {
        // Base64 Data URL upload
        const imageStr = req.body.image;
        if (
          typeof imageStr !== "string" ||
          !imageStr.startsWith("data:image/")
        ) {
          res.status(400).json({
            error: "BadRequest",
            message: "Invalid image data format. Expected base64 data:image/* URL.",
          });
          return;
        }

        // Check decoded base64 size ceiling (approx 5MB)
        const base64Data = imageStr.split(",")[1];
        if (base64Data) {
          const byteLength = Buffer.byteLength(base64Data, "base64");
          if (byteLength > 5 * 1024 * 1024) {
            res.status(400).json({
              error: "FileSizeLimit",
              message: "Image payload exceeds maximum allowed size of 5 MB.",
            });
            return;
          }
        }

        uploadResult = await cloudinary.uploader.upload(imageStr, {
          folder: "anfa-bd/products",
          resource_type: "image",
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        });
      } else {
        res.status(400).json({
          error: "BadRequest",
          message: "No image file or image data provided in request.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        image: {
          url: uploadResult.secure_url || uploadResult.url,
          secureUrl: uploadResult.secure_url || uploadResult.url,
          publicId: uploadResult.public_id,
          format: uploadResult.format,
          width: uploadResult.width,
          height: uploadResult.height,
          bytes: uploadResult.bytes,
        },
      });
    } catch (err: any) {
      console.error("[CLOUDINARY UPLOAD ERROR]", err?.message || err);
      res.status(500).json({
        error: "UploadFailed",
        message: err?.message || "Failed to upload image to Cloudinary.",
      });
    }
  },
);

/**
 * POST /api/admin/cloudinary/delete
 * Deletes an image from Cloudinary when an administrator removes it.
 * Enforces admin authorization and namespace restriction (publicId must start with 'anfa-bd/').
 */
app.post(
  "/api/admin/cloudinary/delete",
  adminLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const admin = await verifyAdminCaller(req);
    if (!admin) {
      res.status(401).json({
        error: "Unauthorized",
        message:
          "Administrator authorization required for asset deletion operations.",
      });
      return;
    }

    if (!isCloudinaryConfigured) {
      res.status(503).json({
        error: "ServiceUnavailable",
        message:
          "Cloudinary credentials are not configured on the server. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in the server environment.",
      });
      return;
    }

    const { publicId } = req.body;
    if (!publicId || typeof publicId !== "string") {
      res.status(400).json({
        error: "BadRequest",
        message: "Valid publicId string is required.",
      });
      return;
    }

    // Security check: restrict deletions strictly to the anfa-bd namespace
    if (!publicId.startsWith("anfa-bd/")) {
      res.status(400).json({
        error: "InvalidNamespace",
        message:
          "Deletion restricted: Target asset does not belong to the anfa-bd namespace.",
      });
      return;
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
      });
      res.status(200).json({ success: true, result });
    } catch (err: any) {
      console.error(`[CLOUDINARY DELETE ERROR for ${publicId}]`, err?.message || err);
      res.status(500).json({
        error: "DeleteFailed",
        message: err?.message || "Failed to delete asset from Cloudinary.",
      });
    }
  },
);

/**
 * DELETE /api/admin/products/:id
 * Server-side deletion of a product from Firestore and safe cleanup of associated Cloudinary assets.
 * Requires verified administrator authorization.
 */
app.delete(
  "/api/admin/products/:id",
  adminLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const admin = await verifyAdminCaller(req);
    if (!admin) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Administrator authorization required to delete products.",
      });
      return;
    }

    const { id } = req.params;
    if (!id || typeof id !== "string" || id.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      res.status(400).json({
        error: "BadRequest",
        message: "Invalid product ID format.",
      });
      return;
    }

    try {
      const firestore = getAdminFirestore();
      const docRef = firestore.collection("products").doc(id);
      const snap = await docRef.get();

      if (!snap.exists) {
        res.status(404).json({
          error: "NotFound",
          message: `Product "${id}" was not found in Firestore.`,
        });
        return;
      }

      const data = snap.data();
      const publicIds: string[] = [];

      if (
        data?.mainImagePublicId &&
        typeof data.mainImagePublicId === "string" &&
        data.mainImagePublicId.startsWith("anfa-bd/")
      ) {
        publicIds.push(data.mainImagePublicId);
      }

      if (Array.isArray(data?.imagePublicIds)) {
        data.imagePublicIds.forEach((pid: any) => {
          if (
            typeof pid === "string" &&
            pid.startsWith("anfa-bd/") &&
            !publicIds.includes(pid)
          ) {
            publicIds.push(pid);
          }
        });
      }

      if (isCloudinaryConfigured) {
        // Cleanup associated Cloudinary assets under anfa-bd/
        for (const pid of publicIds) {
          try {
            await cloudinary.uploader.destroy(pid, { invalidate: true });
          } catch (cErr: any) {
            console.warn(`Failed cleaning up Cloudinary image ${pid}:`, cErr?.message || cErr);
          }
        }
      }

      // Delete the Firestore document
      await docRef.delete();

      res.status(200).json({
        success: true,
        message: `Product ${id} and associated assets deleted successfully.`,
      });
    } catch (err: any) {
      console.error(`[PRODUCT DELETE ERROR for ${id}]`, err?.message || err);
      res.status(500).json({
        error: "DeleteError",
        message: err.message || "Failed to delete product.",
      });
    }
  },
);

// ============================================================================
// 7. ORDER INVOICE EMAIL DISPATCH ROUTE
// ============================================================================

/**
 * POST /api/orders/send-invoice-email
 * Dispatches an official order confirmation & tax invoice email.
 * Security & Reliability Constraints:
 * 1. Retrieves trusted order data and totals from Firestore (never trusts client price/shipping payload).
 * 2. Enforces server-side delivery fee calculation (Dhaka ৳80, Sub-area ৳120, Outside Dhaka ৳150).
 * 3. Escapes all dynamic text to prevent HTML injection.
 * 4. Strictly validates recipients (prevents open email relay abuse).
 * 5. Returns accurate HTTP 503 if SMTP is unconfigured (never simulates success).
 * 6. Does not return generated HTML in API responses.
 */
app.post(
  "/api/orders/send-invoice-email",
  invoiceLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const rawOrderId =
      req.body.orderId ||
      req.body.order?.id ||
      req.body.orderNumber ||
      req.body.order?.orderNumber;

    if (!rawOrderId || typeof rawOrderId !== "string") {
      res.status(400).json({
        error: "BadRequest",
        message: "Valid orderId is required.",
      });
      return;
    }

    const orderId = rawOrderId.trim();

    try {
      const firestore = getAdminFirestore();

      // Retrieve trusted order document from Firestore
      let orderDoc: any = null;
      let orderDocId = orderId;

      const directSnap = await firestore.collection("orders").doc(orderId).get();
      if (directSnap.exists) {
        orderDoc = directSnap.data();
        orderDocId = directSnap.id;
      } else {
        // Query by orderNumber
        const qSnap = await firestore
          .collection("orders")
          .where("orderNumber", "==", orderId)
          .limit(1)
          .get();

        if (!qSnap.empty) {
          orderDoc = qSnap.docs[0].data();
          orderDocId = qSnap.docs[0].id;
        }
      }

      if (!orderDoc) {
        res.status(404).json({
          error: "NotFound",
          message: `Order "${orderId}" was not found in the database.`,
        });
        return;
      }

      const trustedCustomerEmail = orderDoc.customer?.email?.trim().toLowerCase();
      if (!trustedCustomerEmail) {
        res.status(400).json({
          error: "InvalidOrderRecord",
          message: "Order record is missing customer email address.",
        });
        return;
      }

      // Check caller authorization
      const adminCaller = await verifyAdminCaller(req);
      const requestedRecipient = req.body.recipient?.trim().toLowerCase();

      let finalRecipient = trustedCustomerEmail;

      if (requestedRecipient) {
        // Non-admin callers can only request invoice dispatch to the order's registered customer email
        if (!adminCaller && requestedRecipient !== trustedCustomerEmail) {
          res.status(401).json({
            error: "Unauthorized",
            message:
              "Invoice email can only be dispatched to the order customer's verified email address.",
          });
          return;
        }
        finalRecipient = requestedRecipient;
      }

      // Basic RFC 5322 email regex check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(finalRecipient)) {
        res.status(400).json({
          error: "BadRequest",
          message: "Invalid recipient email address format.",
        });
        return;
      }

      // Recalculate trusted financial figures on the server
      const items = Array.isArray(orderDoc.items) ? orderDoc.items : [];
      let calculatedSubtotal = 0;
      for (const item of items) {
        const itemPrice = Math.max(0, Number(item.price) || 0);
        const itemQuantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
        calculatedSubtotal += itemPrice * itemQuantity;
      }

      // Determine delivery fee strictly based on delivery zone
      const rawZone = (
        orderDoc.deliveryZone ||
        orderDoc.customer?.deliveryZone ||
        ""
      ).toLowerCase();

      let zoneFee = 80;
      let zoneLabel = "Inside Dhaka (৳80)";

      if (
        rawZone.includes("sub") ||
        rawZone === "dhaka_sub_area" ||
        rawZone === "dhaka sub-area"
      ) {
        zoneFee = 120;
        zoneLabel = "Dhaka sub-area (৳120)";
      } else if (
        rawZone.includes("outside") ||
        rawZone === "outside_dhaka" ||
        rawZone === "outside dhaka"
      ) {
        zoneFee = 150;
        zoneLabel = "Outside Dhaka (৳150)";
      }

      const calculatedTotal = calculatedSubtotal + zoneFee;
      const orderNumber = orderDoc.orderNumber || orderDocId;

      // Check SMTP configuration
      const smtpHost = process.env.SMTP_HOST?.trim();
      const smtpUser = (process.env.SMTP_USER || process.env.EMAIL_USER)?.trim();
      const smtpPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS)?.trim();
      const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);

      if (!smtpHost || !smtpUser || !smtpPass) {
        console.warn(
          `[SMTP NOTICE] Invoice dispatch requested for Order #${orderNumber}, but SMTP is unconfigured (SMTP_HOST, SMTP_USER, SMTP_PASS missing).`,
        );
        res.status(503).json({
          error: "ServiceUnavailable",
          message:
            "Automated email service is unconfigured on the server. Please configure SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.",
        });
        return;
      }

      // Format date
      const formattedDate = new Date(
        orderDoc.createdAt || Date.now(),
      ).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Escape all variables to prevent HTML injection
      const safeCustomerName = escapeHtml(orderDoc.customer?.name || "Valued Customer");
      const safeCustomerAddress = escapeHtml(orderDoc.customer?.address || "Address");
      const safeCustomerCity = escapeHtml(orderDoc.customer?.city || "Dhaka");
      const safeCustomerPostal = escapeHtml(orderDoc.customer?.postalCode || "");
      const safeCustomerCountry = escapeHtml(orderDoc.customer?.country || "Bangladesh");
      const safeCustomerPhone = escapeHtml(orderDoc.customer?.phone || "");
      const safeCustomerEmail = escapeHtml(trustedCustomerEmail);
      const safePaymentMethod = escapeHtml(orderDoc.paymentMethod || "Cash on Delivery");
      const safeDeliveryNotes = escapeHtml(orderDoc.customer?.deliveryNotes || "");

      // Render escaped items table rows
      const itemsHtml = items
        .map((item: any) => {
          const safeName = escapeHtml(item.productName || "Product");
          const safeVarName = escapeHtml(item.variation?.name || "Standard");
          const safeVarColor = escapeHtml(item.variation?.color || "");
          const safeSku = escapeHtml(item.variation?.sku || "");
          const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
          const rate = Math.max(0, Number(item.price) || 0);
          const lineTotal = rate * qty;

          return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 8px; font-size: 13px; color: #1e293b;">
          <strong>${safeName}</strong><br/>
          <span style="font-size: 11px; color: #64748b;">Variant: ${safeVarName}${safeVarColor ? " (" + safeVarColor + ")" : ""}${safeSku ? " • SKU: " + safeSku : ""}</span>
        </td>
        <td style="padding: 12px 8px; text-align: center; font-size: 13px; color: #1e293b;">
          ${qty}
        </td>
        <td style="padding: 12px 8px; text-align: right; font-size: 13px; color: #1e293b;">
          ৳${rate.toLocaleString()}
        </td>
        <td style="padding: 12px 8px; text-align: right; font-size: 13px; font-weight: 600; color: #0f172a;">
          ৳${lineTotal.toLocaleString()}
        </td>
      </tr>`;
        })
        .join("");

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ANFA BD - Order Invoice #${escapeHtml(orderNumber)}</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fff8fa; margin: 0; padding: 24px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #ffc1e3; box-shadow: 0 4px 20px rgba(255,20,147,0.08);">
    
    <!-- Brand Header -->
    <tr>
      <td style="background: #18020d; padding: 32px 28px; text-align: center; border-bottom: 3px solid #ff1493;">
        <h1 style="margin: 0; font-size: 26px; letter-spacing: 0.18em; color: #ffffff; font-weight: 800; text-transform: uppercase;">
          ANFA BD
        </h1>
        <p style="margin: 4px 0 0; font-size: 10px; letter-spacing: 0.28em; color: #ff1493; font-weight: 700; text-transform: uppercase;">
          GIRLS SKIN CARE BOUTIQUE • AUTHENTIC K-BEAUTY
        </p>
      </td>
    </tr>

    <!-- Order Notice -->
    <tr>
      <td style="padding: 28px 28px 12px;">
        <div style="background: #fff0f6; border: 1px solid #ffc1e3; border-radius: 12px; padding: 16px; text-align: center;">
          <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; color: #ff1493; text-transform: uppercase;">Order Confirmed • Official Tax Invoice</span>
          <h2 style="margin: 6px 0 2px; font-size: 20px; color: #0f172a;">Invoice #${escapeHtml(orderNumber)}</h2>
          <p style="margin: 0; font-size: 12px; color: #64748b;">Issued on ${escapeHtml(formattedDate)}</p>
        </div>
      </td>
    </tr>

    <!-- Customer & Shipping Grid -->
    <tr>
      <td style="padding: 12px 28px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td width="50%" valign="top" style="padding-right: 12px;">
              <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #ff1493; letter-spacing: 0.1em;">Bill To & Deliver To:</p>
              <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">${safeCustomerName}</p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #475569; line-height: 1.5;">
                ${safeCustomerAddress}<br/>
                ${safeCustomerCity}${safeCustomerPostal ? " - " + safeCustomerPostal : ""}, ${safeCustomerCountry}<br/>
                <strong>Phone:</strong> ${safeCustomerPhone}<br/>
                <strong>Email:</strong> ${safeCustomerEmail}
              </p>
            </td>
            <td width="50%" valign="top" style="padding-left: 12px; border-left: 1px solid #f1f5f9;">
              <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #ff1493; letter-spacing: 0.1em;">Dispatch Details:</p>
              <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.6;">
                <strong>Payment Method:</strong> ${safePaymentMethod}<br/>
                <strong>Delivery Zone:</strong> ${escapeHtml(zoneLabel)}<br/>
                <strong>Courier:</strong> Insured Express Delivery<br/>
                ${safeDeliveryNotes ? "<strong>Delivery Notes:</strong> " + safeDeliveryNotes : ""}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Itemized Table -->
    <tr>
      <td style="padding: 16px 28px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
          <thead>
            <tr style="background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; letter-spacing: 0.05em;">Product</th>
              <th style="padding: 10px 8px; text-align: center; font-size: 11px; text-transform: uppercase; color: #475569; letter-spacing: 0.05em;">Qty</th>
              <th style="padding: 10px 8px; text-align: right; font-size: 11px; text-transform: uppercase; color: #475569; letter-spacing: 0.05em;">Rate</th>
              <th style="padding: 10px 8px; text-align: right; font-size: 11px; text-transform: uppercase; color: #475569; letter-spacing: 0.05em;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </td>
    </tr>

    <!-- Financial Totals -->
    <tr>
      <td style="padding: 0 28px 24px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td width="55%"></td>
            <td width="45%">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px;">
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Items Subtotal:</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #1e293b;">৳${calculatedSubtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Delivery Fee:</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #1e293b;">৳${zoneFee.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">VAT / Taxes:</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #10b981;">Included</td>
                </tr>
                <tr style="border-top: 2px solid #ff1493;">
                  <td style="padding: 8px 0; font-size: 15px; font-weight: 800; color: #0f172a;">Total Payable:</td>
                  <td style="padding: 8px 0; text-align: right; font-size: 17px; font-weight: 800; color: #ff1493;">৳${calculatedTotal.toLocaleString()}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer Guarantee & Support -->
    <tr>
      <td style="background: #fff0f6; border-top: 1px solid #ffc1e3; padding: 24px 28px; text-align: center;">
        <p style="margin: 0; font-size: 12px; font-weight: 700; color: #ff1493;">
          100% Authentic Korean Skincare Guarantee
        </p>
        <p style="margin: 4px 0 12px; font-size: 11px; color: #64748b; line-height: 1.5;">
          Directly imported from Seoul. All products come in sealed packaging with verifiable batch codes.
          For questions or support, contact us at <strong>support@anfabd.com</strong>.
        </p>
        <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">
          ANFA BD • GIRLS SKIN CARE BOUTIQUE • DHAKA, BANGLADESH
        </div>
      </td>
    </tr>

  </table>
</body>
</html>`;

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"ANFA BD Boutique" <${smtpUser}>`,
        to: finalRecipient,
        subject: `Your Invoice for Order #${orderNumber} • ANFA BD`,
        html: emailHtml,
      });

      console.log(
        `[INVOICE EMAIL] Sent invoice for Order #${orderNumber} to ${finalRecipient}`,
      );

      res.status(200).json({
        success: true,
        emailSent: true,
        recipient: finalRecipient,
        orderNumber,
        message: `Invoice email successfully sent to ${finalRecipient}`,
      });
    } catch (err: any) {
      console.error("[INVOICE EMAIL ERROR]", err?.message || err);
      res.status(500).json({
        error: "EmailDispatchFailed",
        message: err.message || "Failed to dispatch invoice email.",
      });
    }
  },
);

// ============================================================================
// 8. DEV VITE MIDDLEWARE & PRODUCTION STATIC SERVING
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `[SERVER] ANFA BD Girls Skincare running at http://0.0.0.0:${PORT}`,
    );
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
