import type { Handler, HandlerEvent } from '@netlify/functions';
import admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK (Reusing robust init logic)
const initFirebase = () => {
    if (admin.apps.length > 0) {
        return;
    }

    console.log('[submit-payment] Initializing Firebase Admin...');
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
                        console.warn("[submit-payment] Failed to decode FIREBASE_SERVICE_ACCOUNT from Base64, attempting to use raw value.");
                    }
                }
                serviceAccount = JSON.parse(jsonStr);
            } catch (e) {
                console.error('[submit-payment] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e);
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
            console.log('[submit-payment] Firebase initialized successfully.');
        } else {
            console.warn("[submit-payment] Firebase credentials missing.");
            throw new Error("Missing Firebase Credentials");
        }
    } catch (e) {
        console.error("[submit-payment] Error init firebase admin:", e);
        throw e;
    }
};

const handler: Handler = async (event: HandlerEvent) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    // 1. Authorization Check
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized: Missing Token' }) };
    }
    const idToken = authHeader.split('Bearer ')[1];

    try {
        initFirebase();
        const auth = admin.auth();
        const db = getFirestore();

        // 2. Verify Token
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // 3. Parse Body
        const { bookingId, note } = JSON.parse(event.body || '{}');

        if (!bookingId || !note) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Missing bookingId or note' }) };
        }

        const bookingRef = db.collection('bookings').doc(bookingId);
        const docSnap = await bookingRef.get();

        if (!docSnap.exists) {
            return { statusCode: 404, body: JSON.stringify({ message: 'Booking not found' }) };
        }

        const bookingData = docSnap.data();

        // 4. Verify Ownership
        if (bookingData?.userId !== uid) {
            return { statusCode: 403, body: JSON.stringify({ message: 'Forbidden: You do not own this booking' }) };
        }

        // 5. Update Booking (Notes Only)
        const paymentNote = `[訂金已已匯款通知] 末五碼: ${note}`;
        const updatedNotes = bookingData?.notes
            ? `${paymentNote}\n\n${bookingData.notes}`
            : paymentNote;

        await bookingRef.update({
            // status: 'pending_confirmation', // REMOVED per user request
            notes: updatedNotes,
            updatedAt: Timestamp.now()
        });

        // 6. Notify Admins/Managers via FCM
        try {
            const messaging = admin.messaging();
            const tokens: string[] = [];

            // Fetch Admins/Managers
            const staffSnapshot = await db.collection('users')
                .where('role', 'in', ['admin', 'manager'])
                .get();

            staffSnapshot.forEach(doc => {
                const data = doc.data();
                if (!data.receivesPwaNotifications) return;

                // For payment notifications, we notify all admins/managers subscribed to 'all' or implies active management
                // Simplified: Check if they have tokens
                if (data.fcmToken) tokens.push(data.fcmToken);
                if (data.fcmTokens && Array.isArray(data.fcmTokens)) tokens.push(...data.fcmTokens);
            });

            // Fetch Linked Designer (if any)
            if (bookingData?.designerId) {
                const designerDoc = await db.collection('designers').doc(bookingData.designerId).get();
                if (designerDoc.exists) {
                    const linkedUserId = designerDoc.data()?.linkedUserId;
                    if (linkedUserId) {
                        const userDoc = await db.collection('users').doc(linkedUserId).get();
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            if (userData?.receivesPwaNotifications) {
                                if (userData.fcmToken) tokens.push(userData.fcmToken);
                                if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) tokens.push(...userData.fcmTokens);
                            }
                        }
                    }
                }
            }

            const uniqueTokens = [...new Set(tokens)];

            if (uniqueTokens.length > 0) {
                const customerName = bookingData.customerName || '客戶'; // Or fetch user
                const message = {
                    notification: {
                        title: '訂金匯款通知',
                        body: `末五碼: ${note}\n訂單: ${bookingData.serviceNames ? bookingData.serviceNames[0] : ''}...`,
                    },
                    data: {
                        bookingId: bookingId,
                        type: 'payment_report'
                    },
                    tokens: uniqueTokens,
                };
                await messaging.sendEachForMulticast(message);
                console.log(`[submit-payment] Notification sent to ${uniqueTokens.length} devices.`);
            }

        } catch (notifyErr) {
            console.error('[submit-payment] Notification failed:', notifyErr);
            // Don't fail the request just because notification failed
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Payment reported successfully' })
        };

    } catch (error: any) {
        console.error('[submit-payment] Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
        };
    }
};

export { handler };
