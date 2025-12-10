import type { Handler, HandlerEvent } from '@netlify/functions';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import axios from 'axios'; // For making HTTP requests to LINE API

const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;
const LINE_CHANNEL_ID = process.env.VITE_LIFF_ID; // Assuming LIFF_ID is stored in VITE_LIFF_ID or similar and passed to env

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  if (!FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('Firebase service account is not configured. Check FIREBASE_SERVICE_ACCOUNT environment variable.');
  }
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT)),
  });
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
    return { statusCode: 500, body: JSON.stringify({ message: 'Server configuration error: LINE_CHANNEL_ID missing.' }) };
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
    const userRef = db.collection('users').doc(verifiedLineUserId);
    await userRef.set({
      lineUserId: verifiedLineUserId,
      profile: {
        displayName: displayName || lineProfile.name,
        avatarUrl: pictureUrl || lineProfile.picture,
        // Add other LINE profile fields if necessary
      },
      // Keep existing fields or set defaults
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      // role: 'customer' // Set default role if not existing
    }, { merge: true }); // Use merge to avoid overwriting existing user data

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