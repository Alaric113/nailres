import type { Handler, HandlerEvent } from '@netlify/functions';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import axios from 'axios';

const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;
const LINE_CHANNEL_ID = process.env.VITE_LINE_CHANNEL_ID; // Your LINE Login Channel ID
const LINE_CHANNEL_SECRET = process.env.VITE_LINE_CHANNEL_SECRET; // Your LINE Login Channel Secret

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  if (!FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('Firebase service account is not configured. Check FIREBASE_SERVICE_ACCOUNT environment variable.');
  }
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(Buffer.from(FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8'))),
  });
}
const auth = admin.auth();
const db = getFirestore();

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // --- Environment Variables Debugging ---
  console.log('line-oauth-auth function triggered.');
  console.log('--- Environment Variables ---');
  console.log('LINE_CHANNEL_ID:', LINE_CHANNEL_ID ? 'Set' : 'Not Set');
  console.log('LINE_CHANNEL_SECRET:', LINE_CHANNEL_SECRET ? 'Set' : 'Not Set');
  console.log('FIREBASE_SERVICE_ACCOUNT:', FIREBASE_SERVICE_ACCOUNT ? 'Set' : 'Not Set');
  console.log('-----------------------------');
  // --- End Environment Variables Debugging ---
  
  let parsedBody;
  try {
    parsedBody = event.body ? JSON.parse(event.body) : {};
  } catch (e: any) {
    console.error('Failed to parse event.body as JSON:', event.body, e);
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

    // 4. Update or create user profile in Firestore
    const userRef = db.collection('users').doc(lineUserId);
    await userRef.set({
      lineUserId: lineUserId,
      profile: {
        displayName: displayName,
        avatarUrl: pictureUrl,
        // Other profile fields can be added from decodedIdToken if needed
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      // role: 'customer' // Set default role if not existing
    }, { merge: true }); // Use merge to avoid overwriting existing user data

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