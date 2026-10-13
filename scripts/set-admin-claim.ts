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
} catch (e) {
  console.warn('Could not read firebase-applet-config.json, using default projectId:', projectId);
}

function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // 1. Check GOOGLE_APPLICATION_CREDENTIALS
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    console.log(`[AUTH] Using credentials from GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
    const serviceAccount = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf-8'));
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || projectId,
    });
  }

  // 2. Check FIREBASE_SERVICE_ACCOUNT_KEY in .env
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.log('[AUTH] Using credentials from FIREBASE_SERVICE_ACCOUNT_KEY env var.');
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || projectId,
    });
  }

  // 3. Check for any service-account file in current directory
  const files = fs.readdirSync(process.cwd());
  const saFile = files.find(
    (f) => (f.includes('service-account') || f.includes('firebase-adminsdk')) && f.endsWith('.json')
  );
  if (saFile) {
    const fullPath = path.resolve(process.cwd(), saFile);
    console.log(`[AUTH] Discovered service account key file: ${saFile}`);
    const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || projectId,
    });
  }

  // 4. Fallback to ADC / Project ID
  console.log(`[AUTH] Initializing with Application Default Credentials for project: ${projectId}`);
  return initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

async function main() {
  const args = process.argv.slice(2);
  const target = args[0];
  const shouldRevoke = args.includes('--revoke');

  if (!target) {
    console.error(`
========================================================================
AURELIA LUXE — SECURE ADMIN CUSTOM CLAIM ASSIGNMENT CLI
========================================================================
Usage:
  npx tsx scripts/set-admin-claim.ts <user-email-or-uid> [--revoke]

Examples:
  npx tsx scripts/set-admin-claim.ts asif.al.azad201m@gmail.com
  npx tsx scripts/set-admin-claim.ts usr_123456789
  npx tsx scripts/set-admin-claim.ts former_admin@example.com --revoke

Requirements:
  1. A Firebase Service Account Key from Firebase Console:
     Go to: Project Settings -> Service accounts -> Generate new private key
  2. Save it as "service-account.json" in this directory, OR set:
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
      console.log(`[SEARCH] Querying Firebase Auth for email: ${target}...`);
      userRecord = await auth.getUserByEmail(target);
    } else {
      console.log(`[SEARCH] Querying Firebase Auth for UID: ${target}...`);
      userRecord = await auth.getUser(target);
    }

    const currentClaims = userRecord.customClaims || {};
    console.log(`[STATUS] Found user: ${userRecord.email} (UID: ${userRecord.uid})`);
    console.log(`[STATUS] Existing Custom Claims:`, currentClaims);

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
Custom Claims: ${JSON.stringify(newClaims)}
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
      console.error(`Please ensure the user has signed in at least once so their account exists in Firebase Auth.`);
    } else if (error.code === 'auth/internal-error' || error.message?.includes('Identity Toolkit')) {
      console.error(`Google Cloud Service Account credentials are required.`);
      console.error(`Please provide a service-account.json file or set GOOGLE_APPLICATION_CREDENTIALS.`);
    } else {
      console.error(error.message || error);
    }
    process.exit(1);
  }
}

main();
