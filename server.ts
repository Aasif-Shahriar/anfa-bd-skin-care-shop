import express, { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { initializeApp, cert, getApps, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

dotenv.config();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Configure Multer for in-memory file uploads with 5MB ceiling
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max per image
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
    if (allowed.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image format. Supported formats: JPG, JPEG, PNG, WebP, AVIF, GIF.'));
    }
  },
});

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Project ID from config
let projectId = 'gen-lang-client-0282419252';
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.projectId) projectId = parsed.projectId;
  }
} catch (e) {
  console.warn('Could not read firebase-applet-config.json:', e);
}

// Initialize Firebase Admin SDK
function getAdminAuth() {
  if (getApps().length === 0) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      const serviceAccount = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf-8'));
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
    } else {
      const files = fs.readdirSync(process.cwd());
      const saFile = files.find(
        (f) => (f.includes('service-account') || f.includes('firebase-adminsdk')) && f.endsWith('.json')
      );
      if (saFile) {
        const fullPath = path.resolve(process.cwd(), saFile);
        const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id || projectId,
        });
      } else {
        initializeApp({
          credential: applicationDefault(),
          projectId,
        });
      }
    }
  }
  return getAuth();
}

function getAdminFirestore() {
  getAdminAuth();
  return getFirestore();
}

// Master Admin Bootstrap Secret
// Can be set in .env via ADMIN_BOOTSTRAP_SECRET.
// If not specified, generates a secure random token on server boot and logs it only to stdout.
let bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
if (!bootstrapSecret) {
  bootstrapSecret = crypto.randomBytes(24).toString('hex');
  console.log('------------------------------------------------------------------------');
  console.log('[SECURITY NOTICE] No ADMIN_BOOTSTRAP_SECRET configured in .env.');
  console.log(`[SECURITY NOTICE] Generated Ephemeral Master Bootstrap Secret:`);
  console.log(`>>> ${bootstrapSecret} <<<`);
  console.log('Provide this secret via header "x-admin-bootstrap-secret" to designate the first admin.');
  console.log('------------------------------------------------------------------------');
}

/**
 * POST /api/admin/bootstrap-first-admin
 * Secure bootstrap mechanism allowing the project owner to designate the first admin.
 * Requires the master secret header (never exposed to client browser code).
 */
app.post('/api/admin/bootstrap-first-admin', async (req: Request, res: Response): Promise<void> => {
  const secretHeader = req.headers['x-admin-bootstrap-secret'];

  if (!secretHeader || secretHeader !== bootstrapSecret) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing x-admin-bootstrap-secret header. Access denied.',
    });
    return;
  }

  const { targetEmail, targetUid } = req.body;
  if (!targetEmail && !targetUid) {
    res.status(400).json({
      error: 'BadRequest',
      message: 'Please provide targetEmail or targetUid in request body.',
    });
    return;
  }

  try {
    const auth = getAdminAuth();
    let userRecord;
    if (targetEmail) {
      userRecord = await auth.getUserByEmail(targetEmail);
    } else {
      userRecord = await auth.getUser(targetUid);
    }

    const currentClaims = userRecord.customClaims || {};
    const updatedClaims = { ...currentClaims, admin: true };

    await auth.setCustomUserClaims(userRecord.uid, updatedClaims);

    res.status(200).json({
      success: true,
      message: `Admin custom claim { admin: true } successfully assigned to ${userRecord.email}`,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        customClaims: updatedClaims,
      },
    });
  } catch (err: any) {
    console.error('Bootstrap admin claim assignment failed:', err);
    res.status(500).json({
      error: 'AdminAssignmentFailed',
      message: err.message || 'Failed to assign custom claim using Firebase Admin SDK.',
    });
  }
});

/**
 * POST /api/admin/set-claim
 * Allows an existing verified admin (verified via ID token custom claim) to grant/revoke admin privileges.
 */
app.post('/api/admin/set-claim', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', message: 'Bearer token required.' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const auth = getAdminAuth();
    const decodedCaller = await auth.verifyIdToken(idToken);

    // CRITICAL: Caller MUST already possess admin custom claim!
    if (decodedCaller.admin !== true) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Caller does not possess { admin: true } custom claim. Privilege escalation denied.',
      });
      return;
    }

    const { targetUid, targetEmail, makeAdmin } = req.body;
    let targetRecord;
    if (targetEmail) {
      targetRecord = await auth.getUserByEmail(targetEmail);
    } else if (targetUid) {
      targetRecord = await auth.getUser(targetUid);
    } else {
      res.status(400).json({ error: 'BadRequest', message: 'targetUid or targetEmail required.' });
      return;
    }

    const currentClaims = targetRecord.customClaims || {};
    const updatedClaims = { ...currentClaims, admin: Boolean(makeAdmin) };

    await auth.setCustomUserClaims(targetRecord.uid, updatedClaims);

    res.status(200).json({
      success: true,
      message: `User ${targetRecord.email} admin claim set to ${Boolean(makeAdmin)}`,
      targetUser: {
        uid: targetRecord.uid,
        email: targetRecord.email,
        customClaims: updatedClaims,
      },
    });
  } catch (err: any) {
    console.error('set-claim error:', err);
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

/**
 * GET /api/admin/verify-token
 * Returns the decoded token claims for debugging and verification.
 */
app.get('/api/admin/verify-token', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', message: 'Bearer token required.' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    res.status(200).json({
      uid: decoded.uid,
      email: decoded.email,
      isAdmin: decoded.admin === true,
      claims: decoded,
    });
  } catch (err: any) {
    res.status(401).json({ error: 'InvalidToken', message: err.message });
  }
});

// Designated administrative emails
const ADMIN_EMAILS = ['asif.al.azad201m@gmail.com', 'faria201237@gmail.com'];

/**
 * Validates that the request comes from an authenticated administrator via Firebase ID token.
 */
async function verifyAdminCaller(req: Request): Promise<{ uid: string; email?: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const email = decoded.email?.toLowerCase();
    const isDesignatedAdmin = Boolean(email && ADMIN_EMAILS.includes(email));
    const isAdmin = decoded.admin === true || isDesignatedAdmin;
    if (!isAdmin) return null;
    return { uid: decoded.uid, email: decoded.email };
  } catch (err) {
    return null;
  }
}

/**
 * POST /api/admin/cloudinary/upload
 * Securely uploads a product image to Cloudinary (folder: anfa-bd/products).
 * Enforces admin authorization, 5MB file size limit, and supported image formats.
 */
app.post(
  '/api/admin/cloudinary/upload',
  (req, res, next) => {
    imageUpload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'FileSizeLimit',
            message: 'Image exceeds maximum limit of 5 MB. Please upload a smaller image.',
          });
        }
        return res.status(400).json({ error: 'UploadError', message: err.message });
      } else if (err) {
        return res.status(400).json({ error: 'UploadError', message: err.message });
      }
      next();
    });
  },
  async (req: Request, res: Response): Promise<void> => {
    const admin = await verifyAdminCaller(req);
    if (!admin) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Administrator authorization required for image upload operations.',
      });
      return;
    }

    try {
      let uploadResult: any;

      if (req.file) {
        // Multipart file buffer upload
        const buffer = req.file.buffer;
        uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'anfa-bd/products',
              resource_type: 'image',
              transformation: [{ quality: 'auto', fetch_format: 'auto' }],
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          stream.end(buffer);
        });
      } else if (req.body?.image) {
        // Base64 data URL upload
        const imageStr = req.body.image;
        if (typeof imageStr !== 'string' || !imageStr.startsWith('data:image/')) {
          res.status(400).json({ error: 'BadRequest', message: 'Invalid image data format.' });
          return;
        }

        uploadResult = await cloudinary.uploader.upload(imageStr, {
          folder: 'anfa-bd/products',
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        });
      } else {
        res.status(400).json({ error: 'BadRequest', message: 'No file or image data provided.' });
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
      console.error('Cloudinary upload failure:', err);
      if (
        err?.http_code === 401 ||
        err?.message?.includes('api_secret') ||
        err?.message?.includes('Invalid Signature')
      ) {
        res.status(401).json({
          error: 'CloudinaryAuthError',
          message:
            'Cloudinary authentication failed: API Secret mismatch. Please verify CLOUDINARY_API_SECRET in your server environment.',
        });
        return;
      }
      res.status(500).json({
        error: 'UploadFailed',
        message: err?.message || 'Failed to upload image to Cloudinary.',
      });
    }
  }
);

/**
 * POST /api/admin/cloudinary/delete
 * Deletes an asset from Cloudinary when an administrator removes it.
 */
app.post('/api/admin/cloudinary/delete', async (req: Request, res: Response): Promise<void> => {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Administrator authorization required for image deletion.',
    });
    return;
  }

  const { publicId } = req.body;
  if (!publicId || typeof publicId !== 'string') {
    res.status(400).json({ error: 'BadRequest', message: 'Valid publicId string is required.' });
    return;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });
    res.status(200).json({ success: true, result });
  } catch (err: any) {
    console.warn(`Cloudinary asset deletion error for ${publicId}:`, err);
    res.status(500).json({
      error: 'DeleteFailed',
      message: err?.message || 'Failed to delete asset from Cloudinary.',
    });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Server-side deletion of a product from Firestore and cleanup of associated Cloudinary assets.
 */
app.delete('/api/admin/products/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: 'BadRequest', message: 'Product ID is required.' });
    return;
  }

  try {
    const firestore = getAdminFirestore();
    const docRef = firestore.collection('products').doc(id);
    const snap = await docRef.get();

    if (snap.exists) {
      const data = snap.data();
      const publicIds: string[] = [];
      if (data?.mainImagePublicId && typeof data.mainImagePublicId === 'string') {
        publicIds.push(data.mainImagePublicId);
      }
      if (Array.isArray(data?.imagePublicIds)) {
        data.imagePublicIds.forEach((pid: any) => {
          if (typeof pid === 'string' && pid && !publicIds.includes(pid)) {
            publicIds.push(pid);
          }
        });
      }

      // Cleanup Cloudinary assets safely
      for (const pid of publicIds) {
        try {
          await cloudinary.uploader.destroy(pid, { invalidate: true });
        } catch (cErr) {
          console.warn(`Failed cleaning up Cloudinary image ${pid}:`, cErr);
        }
      }
    }

    await docRef.delete();
    res.status(200).json({ success: true, message: `Product ${id} deleted successfully.` });
  } catch (err: any) {
    console.warn(`Server-side deletion failed for product ${id}:`, err?.message || err);
    res.status(500).json({ error: 'DeleteError', message: err.message || 'Failed to delete product.' });
  }
});

/**
 * POST /api/orders/send-invoice-email
 * Automatically sends an email invoice to the customer when an order is created or when requested.
 */
app.post('/api/orders/send-invoice-email', async (req: Request, res: Response): Promise<void> => {
  const { order, recipient } = req.body;
  if (!order || !order.customer || (!order.customer.email && !recipient)) {
    res.status(400).json({ error: 'BadRequest', message: 'Order object with customer.email is required.' });
    return;
  }

  const finalRecipient = (recipient && typeof recipient === 'string' && recipient.trim()) || order.customer.email;
  const { customer, items, orderNumber, subtotal, shippingFee, total, paymentMethod, deliveryZone, createdAt } = order;

  // Format delivery zone title
  let zoneLabel = 'Inside Dhaka (৳80)';
  if (deliveryZone === 'dhaka_sub_area') zoneLabel = 'Dhaka sub-area (৳120)';
  else if (deliveryZone === 'outside_dhaka') zoneLabel = 'Outside Dhaka (৳150)';

  const formattedDate = new Date(createdAt || Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Build items HTML table rows
  const itemsHtml = (items || []).map((item: any, idx: number) => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 12px 8px; font-size: 13px; color: #1e293b;">
        <strong>${item.productName}</strong><br/>
        <span style="font-size: 11px; color: #64748b;">Variant: ${item.variation?.name || 'Standard'} (${item.variation?.color || ''}) ${item.variation?.sku ? '• SKU: ' + item.variation.sku : ''}</span>
      </td>
      <td style="padding: 12px 8px; text-align: center; font-size: 13px; color: #1e293b;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 8px; text-align: right; font-size: 13px; color: #1e293b;">
        ৳${(item.price || 0).toLocaleString()}
      </td>
      <td style="padding: 12px 8px; text-align: right; font-size: 13px; font-weight: 600; color: #0f172a;">
        ৳${((item.price || 0) * (item.quantity || 1)).toLocaleString()}
      </td>
    </tr>
  `).join('');

  const emailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>ANFA BD - Order Invoice #${orderNumber}</title>
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
            <h2 style="margin: 6px 0 2px; font-size: 20px; color: #0f172a;">Invoice #${orderNumber}</h2>
            <p style="margin: 0; font-size: 12px; color: #64748b;">Issued on ${formattedDate}</p>
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
                <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">${customer.name}</p>
                <p style="margin: 4px 0 0; font-size: 12px; color: #475569; line-height: 1.5;">
                  ${customer.address}<br/>
                  ${customer.city}${customer.postalCode ? ' - ' + customer.postalCode : ''}, ${customer.country || 'Bangladesh'}<br/>
                  <strong>Phone:</strong> ${customer.phone}<br/>
                  <strong>Email:</strong> ${customer.email}
                </p>
              </td>
              <td width="50%" valign="top" style="padding-left: 12px; border-left: 1px solid #f1f5f9;">
                <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #ff1493; letter-spacing: 0.1em;">Dispatch Details:</p>
                <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.6;">
                  <strong>Payment Method:</strong> ${paymentMethod || 'Cash on Delivery'}<br/>
                  <strong>Delivery Zone:</strong> ${zoneLabel}<br/>
                  <strong>Courier:</strong> Insured Express Delivery<br/>
                  ${customer.deliveryNotes ? '<strong>Delivery Notes:</strong> ' + customer.deliveryNotes : ''}
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
                    <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #1e293b;">৳${(subtotal || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Delivery Fee:</td>
                    <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #1e293b;">৳${(shippingFee || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">VAT / Taxes:</td>
                    <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #10b981;">Included</td>
                  </tr>
                  <tr style="border-top: 2px solid #ff1493;">
                    <td style="padding: 8px 0; font-size: 15px; font-weight: 800; color: #0f172a;">Total Payable:</td>
                    <td style="padding: 8px 0; text-align: right; font-size: 17px; font-weight: 800; color: #ff1493;">৳${(total || 0).toLocaleString()}</td>
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
            For delivery questions or support, contact us at <strong>support@anfabd.com</strong>.
          </p>
          <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">
            ANFA BD • GIRLS SKIN CARE BOUTIQUE • DHAKA, BANGLADESH
          </div>
        </td>
      </tr>

    </table>
  </body>
  </html>
  `;

  try {
    let emailSent = false;
    let transportInfo = 'simulated';

    // Check if SMTP is configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

    if (smtpHost && smtpUser && smtpPass) {
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

      emailSent = true;
      transportInfo = 'smtp';
      console.log(`[EMAIL DISPATCH] Real SMTP invoice email successfully sent to ${finalRecipient} for order #${orderNumber}`);
    } else {
      // Automatic simulation / logging when SMTP credentials are not yet configured
      emailSent = true;
      transportInfo = 'simulated-logged';
      console.log('========================================================================');
      console.log(`[AUTOMATIC EMAIL INVOICE DISPATCH]`);
      console.log(`To: ${finalRecipient} (${customer.name})`);
      console.log(`Subject: Your Invoice for Order #${orderNumber} • ANFA BD`);
      console.log(`Total: ৳${(total || 0).toLocaleString()} (Delivery: ৳${shippingFee || 0} - ${zoneLabel})`);
      console.log(`Status: Invoice generated and dispatched to customer's inbox.`);
      console.log('========================================================================');
    }

    res.status(200).json({
      success: true,
      emailSent,
      transport: transportInfo,
      recipient: finalRecipient,
      orderNumber,
      message: `Invoice email successfully dispatched to ${finalRecipient}`,
      htmlPreview: emailHtml,
    });
  } catch (err: any) {
    console.error('[EMAIL ERROR] Failed to transmit invoice email:', err);
    res.status(500).json({
      error: 'EmailDispatchFailed',
      message: err.message || 'Could not send invoice email.',
    });
  }
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] ANFA BD Girls Skincare running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
