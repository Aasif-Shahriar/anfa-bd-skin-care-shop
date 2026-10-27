import { initializeApp, cert, getApps, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// Read firebase-applet-config.json for project ID
let projectId = 'gen-lang-client-0282419252';
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.projectId) projectId = parsed.projectId;
  }
} catch {
  // Use fallback projectId if config not present
}

// Clean up invalid GOOGLE_APPLICATION_CREDENTIALS pointing to non-existent files
if (
  process.env.GOOGLE_APPLICATION_CREDENTIALS &&
  !fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
) {
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // 1. Check GOOGLE_APPLICATION_CREDENTIALS
  if (
    process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  ) {
    const serviceAccount = JSON.parse(
      fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf-8')
    );
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || projectId,
    });
  }

  // 2. Check FIREBASE_SERVICE_ACCOUNT_KEY in environment
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || projectId,
    });
  }

  // 3. Check for any service-account key file in current directory
  const files = fs.readdirSync(process.cwd());
  const saFile = files.find(
    (f) =>
      (f.includes('service-account') || f.includes('firebase-adminsdk')) &&
      f.endsWith('.json')
  );
  if (saFile) {
    const fullPath = path.resolve(process.cwd(), saFile);
    const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || projectId,
    });
  }

  // 4. Application Default Credentials
  return initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

async function main() {
  const args = process.argv.slice(2);
  const target =
    args[0] ||
    process.env.ADMIN_EMAIL ||
    process.env.TARGET_EMAIL ||
    process.env.TARGET_UID;

  const shouldRevoke = args.includes('--revoke');

  if (!target) {
    console.error(`
========================================================================
ANFA BD — SECURE ADMIN CUSTOM CLAIM ASSIGNMENT CLI
========================================================================
Usage:
  npm run set-admin <user-email-or-uid> [--revoke]
  OR:
  npx tsx scripts/set-admin-claim.ts <user-email-or-uid> [--revoke]

Examples:
  npm run set-admin asif.al.azad201m@gmail.com
  npm run set-admin usr_123456789
  npm run set-admin former_admin@example.com --revoke

Requirements:
  1. A Firebase Service Account Key from Firebase Console:
     Go to: Project Settings -> Service accounts -> Generate new private key
  2. Save it as "service-account.json" or set:
     export GOOGLE_APPLICATION_CREDENTIALS="./service-account.json"
========================================================================
`);
    process.exit(1);
  }

  try {
    const app = initializeFirebaseAdmin();
    const auth = getAuth(app);

    let userRecord;
    if (target.includes('@')) {
      console.log(`[AUTH] Searching Firebase Auth for user email: ${target}...`);
      userRecord = await auth.getUserByEmail(target.trim().toLowerCase());
    } else {
      console.log(`[AUTH] Searching Firebase Auth for user UID: ${target}...`);
      userRecord = await auth.getUser(target.trim());
    }

    const currentClaims = userRecord.customClaims || {};
    console.log(`[STATUS] Found user: ${userRecord.email} (UID: ${userRecord.uid})`);

    const newClaims = shouldRevoke
      ? { ...currentClaims, admin: false }
      : { ...currentClaims, admin: true };

    console.log(`[ACTION] Setting custom claim { admin: ${!shouldRevoke} }...`);
    await auth.setCustomUserClaims(userRecord.uid, newClaims);

    console.log(`
========================================================================
SUCCESS: Admin custom claim updated!
------------------------------------------------------------------------
User Email:    ${userRecord.email}
User UID:      ${userRecord.uid}
Status:        ${shouldRevoke ? 'REVOKED (No Admin Privileges)' : 'GRANTED (Full Admin Privileges)'}
------------------------------------------------------------------------
IMPORTANT:
The client user must refresh their token to load this claim in their session.
In the application UI, they can click "Refresh Admin Claims" in their account
or sign in again. The token will then include:
  request.auth.token.admin == true
========================================================================
`);
    process.exit(0);
  } catch (error: any) {
    console.error('\n[ERROR] Failed to set admin custom claim:');
    if (error.code === 'auth/user-not-found') {
      console.error(`User "${target}" was not found in Firebase Authentication.`);
      console.error(
        `Please ensure the user has signed in at least once so their account exists in Firebase Auth.`
      );
    } else if (
      error.code === 'auth/internal-error' ||
      error.message?.includes('Identity Toolkit')
    ) {
      console.error(`Google Cloud Service Account credentials are required.`);
      console.error(
        `Please provide a service-account.json file or set GOOGLE_APPLICATION_CREDENTIALS.`
      );
    } else {
      console.error(error.message || error);
    }
    process.exit(1);
  }
}

main();
