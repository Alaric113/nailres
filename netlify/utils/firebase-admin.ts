
import admin from 'firebase-admin';

export const initializeFirebase = () => {
  if (admin.apps.length > 0) {
    console.log('[firebase-admin] Firebase already initialized.');
    return admin;
  }

  console.log('[firebase-admin] Initializing Firebase Admin...');
  let serviceAccount: any = null;

  try {
    // Option 1: Full JSON in FIREBASE_SERVICE_ACCOUNT
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountJson) {
      console.log('[firebase-admin] Found FIREBASE_SERVICE_ACCOUNT');
      try {
        let jsonStr = serviceAccountJson;
        // Check if base64 encoded
        if (!jsonStr.trim().startsWith('{')) {
          try {
            jsonStr = Buffer.from(jsonStr, 'base64').toString('utf-8');
          } catch (e) {
            console.warn("[firebase-admin] Failed to decode FIREBASE_SERVICE_ACCOUNT from Base64, attempting to use raw value.");
          }
        }
        serviceAccount = JSON.parse(jsonStr);
        console.log('[firebase-admin] Successfully parsed FIREBASE_SERVICE_ACCOUNT JSON');
      } catch (e) {
        console.error('[firebase-admin] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e);
        serviceAccount = null;
      }
    }

    // Option 2: Individual variables (Fallback or Primary if Option 1 missing)
    if (!serviceAccount && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('[firebase-admin] Using FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL');
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      // Fix potential formatting issues with env vars
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
        privateKey = privateKey.slice(1, -1);
      }

      // Replace escaped newlines (handle both \\n and \n)
      privateKey = privateKey.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n');

      serviceAccount = {
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      };
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[firebase-admin] Firebase initialized successfully.');
      return admin;
    } else {
      console.warn("[firebase-admin] Firebase credentials missing. Functions depending on Firestore will fail.");
      return null;
    }
  } catch (e) {
    console.error("[firebase-admin] Error init firebase admin:", e);
    return null;
  }
};
