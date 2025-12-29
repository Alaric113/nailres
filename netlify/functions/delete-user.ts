import type { Handler, HandlerEvent } from '@netlify/functions';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const initFirebase = () => {
    if (!admin.apps.length) {
        try {
            const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
            const privateKey = process.env.FIREBASE_PRIVATE_KEY;
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
            const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

            let credential;

            if (serviceAccountEnv) {
                // Determine if base64
                let jsonStr = serviceAccountEnv;
                if (!jsonStr.trim().startsWith('{')) {
                    try {
                        jsonStr = Buffer.from(jsonStr, 'base64').toString('utf-8');
                    } catch (e) {
                        console.warn("[delete-user] Failed to decode base64, using raw.");
                    }
                }
                credential = admin.credential.cert(JSON.parse(jsonStr));
            } else if (privateKey && clientEmail) {
                credential = admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey: privateKey.replace(/\\n/g, '\n')
                });
            } else {
                throw new Error("Missing Firebase credentials.");
            }

            admin.initializeApp({ credential });
            console.log("[delete-user] Initialized Firebase Admin.");

        } catch (error: any) {
            console.error("[delete-user] Init failed:", error);
            throw error;
        }
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
