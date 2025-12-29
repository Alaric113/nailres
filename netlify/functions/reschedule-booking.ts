import type { Handler, HandlerEvent } from '@netlify/functions';
import admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { parseISO } from 'date-fns';

const initFirebase = () => {
    if (!admin.apps.length) {
        try {
            const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
            const privateKey = process.env.FIREBASE_PRIVATE_KEY;
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
            const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

            let credential;

            if (serviceAccountEnv) {
                let jsonStr = serviceAccountEnv;
                if (!jsonStr.trim().startsWith('{')) {
                    try {
                        jsonStr = Buffer.from(jsonStr, 'base64').toString('utf-8');
                    } catch (e) {
                        console.warn("[reschedule-booking] Failed to decode base64, using raw.");
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
        } catch (error: any) {
            console.error("[reschedule-booking] Init failed:", error);
            throw error;
        }
    }
};

const handler: Handler = async (event: HandlerEvent) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    // 1. Authorization
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
    }
    const idToken = authHeader.split('Bearer ')[1];

    try {
        initFirebase();
        const auth = admin.auth();
        const db = getFirestore();

        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const { bookingId, newDateTime } = JSON.parse(event.body || '{}');

        if (!bookingId || !newDateTime) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Missing bookingId or newDateTime' }) };
        }

        // 2. Fetch Booking
        const bookingRef = db.collection('bookings').doc(bookingId);
        const bookingSnap = await bookingRef.get();

        if (!bookingSnap.exists) {
            return { statusCode: 404, body: JSON.stringify({ message: 'Booking not found' }) };
        }

        const bookingData = bookingSnap.data() || {};

        // 3. Verify Ownership & Eligibility
        if (bookingData.userId !== uid) {
            return { statusCode: 403, body: JSON.stringify({ message: 'Forbidden' }) };
        }

        if (bookingData.status === 'cancelled' || bookingData.status === 'completed') {
            return { statusCode: 400, body: JSON.stringify({ message: 'Cannot reschedule cancelled or completed bookings.' }) };
        }

        const currentRescheduleCount = bookingData.rescheduleCount || 0;
        if (currentRescheduleCount >= 1) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Reschedule limit reached (Max: 1).' }) };
        }

        // 4. Update Booking
        // Status Policy: If previously 'confirmed', usually we might want to re-confirm if the date is drastically different,
        // or just keep it confirmed if it's auto-accepted. The prompt Plan said "Set status to pending_confirmation".
        // Let's stick to the plan: 'pending_confirmation'.

        const currentStatus = bookingData.status === "pending_payment" ? "pending_payment" : "pending_confirmation";


        await bookingRef.update({
            dateTime: Timestamp.fromDate(new Date(newDateTime)),
            rescheduleCount: admin.firestore.FieldValue.increment(1),
            status: currentStatus,
            updatedAt: admin.firestore.FieldValue.serverTimestamp() // Good practice
        });

        // 5. Notify (Optional) - Can trigger LINE notify here if needed, but existing triggers might handle it.
        // For now, minimal viable.

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Reschedule successful' })
        };

    } catch (error: any) {
        console.error('[reschedule-booking] Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
        };
    }
};

export { handler };
