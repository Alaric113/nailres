import type { Handler, HandlerEvent } from '@netlify/functions';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import axios from 'axios'; // For making HTTP requests to LINE API

const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;
const LINE_CHANNEL_ID = process.env.VITE_LINE_CHANNEL_ID; // Channel ID is required for verify API
// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  let serviceAccount: any = null;

  try {
    let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountJson) {
      if (!serviceAccountJson.trim().startsWith('{')) {
        try {
          serviceAccountJson = Buffer.from(serviceAccountJson, 'base64').toString('utf-8');
        } catch (e) {
          console.warn("Failed to decode FIREBASE_SERVICE_ACCOUNT from Base64, attempting to use raw value.");
        }
      }
      serviceAccount = JSON.parse(serviceAccountJson);
    }
    else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      serviceAccount = {
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      };
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      throw new Error("Firebase configuration missing");
    }
  } catch (e) {
    console.error("Error init firebase admin:", e);
    throw new Error("Failed to initialize Firebase Admin");
  }
}
const auth = admin.auth();
const db = getFirestore();

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { idToken, displayName, pictureUrl, lineUserId } = JSON.parse(event.body || '{}');

  if (!idToken) {
    return { statusCode: 400, body: JSON.stringify({ message: 'LINE ID Token is required.' }) };
  }
  if (!LINE_CHANNEL_ID) {
    console.error('LINE_CHANNEL_ID is not set in environment variables.');
    return { statusCode: 500, body: JSON.stringify({ message: 'Server configuration error: LINE_CHANNEL_ID (VITE_LINE_CHANNEL_ID) missing.' }) };
  }

  try {
    // 1. Verify the LINE ID Token
    // Send the ID token to LINE's token verification endpoint
    const lineVerifyResponse = await axios.post('https://api.line.me/oauth2/v2.1/verify',
      new URLSearchParams({
        id_token: idToken,
        client_id: LINE_CHANNEL_ID,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const lineProfile = lineVerifyResponse.data;
    const verifiedLineUserId = lineProfile.sub; // 'sub' field contains the user ID

    if (!verifiedLineUserId) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Invalid LINE ID Token: User ID not found.' }) };
    }

    // 2. Create a Firebase custom token
    const firebaseCustomToken = await auth.createCustomToken(verifiedLineUserId);

    // 3. Update or create user profile in Firestore
    // 3. Check if user exists to determine if we need to distribute coupons or set default role
    const userRef = db.collection('users').doc(verifiedLineUserId);
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : null;

    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const profileData = {
      displayName: displayName || lineProfile.name,
      avatarUrl: pictureUrl || lineProfile.picture,
    };

    // Treat as NEW USER if document doesn't exist OR if it was soft-deleted
    if (!userDoc.exists || userData?.deleted) {
      // --- NEW USER / REACTIVATION FLOW ---
      console.log(`Creating new user (or reactivating): ${verifiedLineUserId}`);

      // A. Create/Overwrite User Document
      // We use set() without merge to ensure a clean slate, removing 'deleted' flags etc.
      // BUT we might want to keep some history? 
      // If we want to keep history, we should use { merge: true } but explicitly set deleted: false.
      // However, to ensure they get "fresh" status, let's reset key fields.
      
      const newUserData = {
        lineUserId: verifiedLineUserId,
        profile: profileData,
        createdAt: userDoc.exists ? userData?.createdAt : timestamp, // Keep original creation date if reactivating? Or reset? Let's keep original.
        updatedAt: timestamp,
        role: 'user', // Reset Role
        deleted: false, // Reactivate
        deletedAt: admin.firestore.FieldValue.delete(), // Remove deletion timestamp
      };

      await userRef.set(newUserData, { merge: true });

      // B. Distribute "New User" Coupons (Only if they don't have them? Or just give them?)
      // Simplest is to just run the distribution logic. 
      // Note: If they previously had these coupons, they will get duplicates unless we check `user_coupons`.
      // The current logic creates a NEW user_coupon doc, so they will get new ones. This is likely desired for a "fresh start".
      
      try {
        const couponsSnapshot = await db.collection('coupons')
          .where('isNewUserCoupon', '==', true)
          .where('isActive', '==', true)
          .get();

        console.log(`[line-liff-auth] Found ${couponsSnapshot.size} potential new user coupons.`);

        if (!couponsSnapshot.empty) {
          const batch = db.batch();
          let count = 0;

          couponsSnapshot.forEach(doc => {
            const couponData = doc.data();
            const newUserCouponRef = db.collection('user_coupons').doc();

            // Logic to determine expiry
            // If master coupon has validUntil, use it.
            // (Optional) If we supported "Valid for X days after receipt", we'd calc it here.
            const validUntil = couponData.validUntil || null;

            batch.set(newUserCouponRef, {
              userId: verifiedLineUserId,
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
              // Copy scope rules if present
              scopeType: couponData.scopeType || 'all',
              scopeIds: couponData.scopeIds || [],
            });
            count++;
          });

          if (count > 0) await batch.commit();
          console.log(`Distributed ${count} new user coupons to ${verifiedLineUserId}`);
        }
      } catch (err) {
        console.error("Failed to distribute new user coupons:", err);
        // Non-fatal, continue login
      }

    } else {
      // --- EXISTING USER FLOW ---
      // Just update profile logic
      await userRef.set({
        profile: profileData,
        updatedAt: timestamp,
        // Do NOT overwrite role or createdAt
      }, { merge: true });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ firebaseCustomToken, lineUserId: verifiedLineUserId }),
    };
  } catch (error: any) {
    console.error('Error in LINE LIFF authentication function:', error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.response?.data || error.message }),
    };
  }
};

export { handler };