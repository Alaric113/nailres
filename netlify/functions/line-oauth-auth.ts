import type { Handler, HandlerEvent } from '@netlify/functions';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import axios from 'axios';

const LINE_CHANNEL_ID = process.env.VITE_LINE_CHANNEL_ID;
const LINE_CHANNEL_SECRET = process.env.VITE_LINE_CHANNEL_SECRET;

// Helper to safely initialize Firebase Admin
function initializeFirebase() {
  if (admin.apps.length > 0) {
    return true; // Already initialized
  }

  let serviceAccount: any = null;

  try {
    // Option 1: Full JSON in FIREBASE_SERVICE_ACCOUNT
    let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountJson) {
      if (!serviceAccountJson.trim().startsWith('{')) {
        try {
          serviceAccountJson = Buffer.from(serviceAccountJson, 'base64').toString('utf-8');
        } catch (e) {
          console.warn("[line-oauth-auth] Failed to decode FIREBASE_SERVICE_ACCOUNT from Base64, attempting raw value.");
        }
      }
      try {
        serviceAccount = JSON.parse(serviceAccountJson);
      } catch (e) {
        console.error("[line-oauth-auth] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", e);
      }
    }

    // Option 2: Individual variables (Fallback)
    if (!serviceAccount && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      // Handle potential wrapping quotes
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
      console.log("[line-oauth-auth] Firebase Admin initialized successfully.");
      return true;
    } else {
      console.error("[line-oauth-auth] No valid credentials found for Firebase Admin.");
      return false;
    }
  } catch (e: any) {
    console.error(`[line-oauth-auth] Error init firebase admin: ${e.message}`, e);
    return false;
  }
}

const handler: Handler = async (event: HandlerEvent) => {
  // Initialize Firebase First
  if (!initializeFirebase()) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error: Firebase Initialization Failed' })
    };
  }

  const auth = admin.auth();
  const db = getFirestore();

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let parsedBody;
  try {
    parsedBody = event.body ? JSON.parse(event.body) : {};
  } catch (e: any) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Invalid JSON in body.', error: e.message }) };
  }

  const { code, redirectUri } = parsedBody;

  if (!code || !redirectUri) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Authorization code and redirect URI are required.' }) };
  }
  if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET) {
    console.error('LINE_CHANNEL_ID or LINE_CHANNEL_SECRET is not set in environment variables.');
    return { statusCode: 500, body: JSON.stringify({ message: 'Server configuration error: LINE Channel credentials missing.' }) };
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenResponse = await axios.post('https://api.line.me/oauth2/v2.1/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { id_token, access_token } = tokenResponse.data;

    // 2. Verify the ID token (optional but good for security, can also be done by LINE's verify endpoint)
    // For now, we trust LINE's token endpoint to give a valid ID token.
    // The sub (user ID) can be extracted from the ID token directly.
    const decodedIdToken = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64').toString());
    const lineUserId = decodedIdToken.sub;
    const displayName = decodedIdToken.name || '';
    const pictureUrl = decodedIdToken.picture || '';

    if (!lineUserId) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Invalid LINE ID Token: User ID not found.' }) };
    }

    // 3. Create a Firebase custom token
    const firebaseCustomToken = await auth.createCustomToken(lineUserId);

    // --- NEW: Save token to Firestore for PWA Handoff ---
    // This allows the PWA (which is listening to this doc) to pickup the token 
    // without needing a redirect back to the app (which fails on iOS).
    if (parsedBody.state) {
      try {
        await db.collection('temp_auth_tokens').doc(parsedBody.state).set({
          token: firebaseCustomToken,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          // Auto-expire via Cloud Functions or just let it rot (add TTL index in Firebase Console ideally)
        });
        console.log(`Saved auth token for state ${parsedBody.state}`);
      } catch (dbError) {
        console.error("Error saving temp token to Firestore:", dbError);
        // We proceed, as standard redirect flow might still work for some devices
      }
    }
    // ----------------------------------------------------

    // 4. Update or create user profile in Firestore
    const userRef = db.collection('users').doc(lineUserId);
    const userDoc = await userRef.get();

    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const profileData = {
      displayName: displayName,
      avatarUrl: pictureUrl,
    };

    if (!userDoc.exists) {
      // --- NEW USER FLOW ---
      console.log(`Creating new user (OAuth): ${lineUserId}`);

      // A. Create User Document
      await userRef.set({
        lineUserId: lineUserId,
        profile: profileData,
        createdAt: timestamp,
        updatedAt: timestamp,
        role: 'user', // Default Role
      });

      // B. Distribute "New User" Coupons
      try {
        const couponsSnapshot = await db.collection('coupons')
          .where('isNewUserCoupon', '==', true)
          .where('isActive', '==', true)
          .get();

        if (!couponsSnapshot.empty) {
          const batch = db.batch();
          let count = 0;

          couponsSnapshot.forEach(doc => {
            const couponData = doc.data();
            const newUserCouponRef = db.collection('user_coupons').doc();

            const validUntil = couponData.validUntil || null;

            batch.set(newUserCouponRef, {
              userId: lineUserId,
              couponId: doc.id,
              title: couponData.title,
              description: couponData.description || '',
              details: couponData.details || '',
              type: couponData.type || 'fixed',
              value: couponData.value || 0,
              minSpend: couponData.minSpend || 0,
              status: 'active',
              isUsed: false,
              usageCount: 0,
              createdAt: timestamp,
              receivedAt: timestamp,
              validUntil: validUntil,
              scopeType: couponData.scopeType || 'all',
              scopeIds: couponData.scopeIds || [],
            });
            count++;
          });

          if (count > 0) await batch.commit();
          console.log(`Distributed ${count} new user coupons to ${lineUserId}`);
        }
      } catch (err) {
        console.error("Failed to distribute new user coupons (OAuth):", err);
      }
    } else {
      // --- EXISTING USER FLOW ---
      await userRef.set({
        lineUserId: lineUserId, // Ensure this is always backfilled/updated
        profile: profileData,
        updatedAt: timestamp,
      }, { merge: true });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ firebaseCustomToken, lineUserId }),
    };
  } catch (error: any) {
    console.error('Error in LINE OAuth authentication function:', error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.response?.data || error.message }),
    };
  }
};

export { handler };