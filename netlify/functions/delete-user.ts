import type { Handler, HandlerEvent } from '@netlify/functions';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const initFirebase = () => {
    if (admin.apps.length > 0) {
        return;
    }

    console.log('[delete-user] Initializing Firebase Admin...');
    let serviceAccount: any = null;

    try {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (serviceAccountJson) {
            try {
                let jsonStr = serviceAccountJson;
                if (!jsonStr.trim().startsWith('{')) {
                    try {
                        jsonStr = Buffer.from(jsonStr, 'base64').toString('utf-8');
                    } catch (e) {
                        console.warn("[delete-user] Failed to decode FIREBASE_SERVICE_ACCOUNT from Base64, attempting to use raw value.");
                    }
                }
                serviceAccount = JSON.parse(jsonStr);
            } catch (e) {
                console.error('[delete-user] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e);
                serviceAccount = null;
            }
        }

        if (!serviceAccount && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            let privateKey = process.env.FIREBASE_PRIVATE_KEY;
            if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
            if (privateKey.startsWith("'") && privateKey.endsWith("'")) privateKey = privateKey.slice(1, -1);
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
            console.log('[delete-user] Firebase initialized successfully.');
        } else {
            console.warn("[delete-user] Firebase credentials missing.");
            throw new Error("Missing Firebase Credentials");
        }
    } catch (e) {
        console.error("[delete-user] Error init firebase admin:", e);
        throw e;
    }
};

const handler: Handler = async (event: HandlerEvent) => {
    // 1. Setup CORS/Method check
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    try {
        // 2. Initialize Firebase (Lazy)
        initFirebase();
        const db = getFirestore();
        const auth = admin.auth();

        // 3. Parse Body
        let body;
        try {
            body = JSON.parse(event.body || '{}');
        } catch (e) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Invalid JSON body.' }) };
        }
        const { targetUserId } = body;

        // 4. Authorization
        const authHeader = event.headers.authorization || event.headers.Authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized: Missing Token' }) };
        }
        const idToken = authHeader.split('Bearer ')[1];

        // 5. Verify Requester
        const decodedToken = await auth.verifyIdToken(idToken);
        const requesterUid = decodedToken.uid;

        // 6. Check Admin Permission
        const requesterDoc = await db.collection('users').doc(requesterUid).get();
        if (!requesterDoc.exists || requesterDoc.data()?.role !== 'admin') {
            console.warn(`[delete-user] Access denied for ${requesterUid} (Role: ${requesterDoc.data()?.role})`);
            return { statusCode: 403, body: JSON.stringify({ message: 'Forbidden: Admin access required.' }) };
        }

        if (!targetUserId) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Missing targetUserId.' }) };
        }

        console.log(`[delete-user] Admin ${requesterUid} request delete for ${targetUserId}`);

        // 7. Perform Deletion
        // A. Auth
        try {
            await auth.deleteUser(targetUserId);
            console.log(`[delete-user] Auth deleted: ${targetUserId}`);
        } catch (err: any) {
            if (err.code === 'auth/user-not-found') {
                console.log(`[delete-user] User not in auth.`);
            } else {
                throw err;
            }
        }

        // B. Firestore
        await db.collection('users').doc(targetUserId).delete();
        console.log(`[delete-user] Firestore deleted: ${targetUserId}`);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'User deleted successfully.' })
        };

    } catch (error: any) {
        // Catch-all for init errors, auth errors, etc.
        console.error('[delete-user] Handler error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal Server Error',
                error: error.message || String(error)
            })
        };
    }
};

export { handler };
