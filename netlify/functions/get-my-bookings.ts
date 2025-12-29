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
                let jsonStr = serviceAccountEnv;
                if (!jsonStr.trim().startsWith('{')) {
                    try {
                        jsonStr = Buffer.from(jsonStr, 'base64').toString('utf-8');
                    } catch (e) {
                        console.warn("[get-my-bookings] Failed to decode base64, using raw.");
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
            console.error("[get-my-bookings] Init failed:", error);
            throw error;
        }
    }
};

const handler: Handler = async (event: HandlerEvent) => {
    if (event.httpMethod !== 'GET') {
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

        // 2. Verify Token & Get UID
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // 3. Fetch Bookings for this User
        // Order by dateTime desc
        const bookingsSnapshot = await db.collection('bookings')
            .where('userId', '==', uid)
            .orderBy('dateTime', 'desc')
            .get();

        // 4. Transform Data
        // We also need to fetch Service and Designer info to match the hook's expectation
        // However, doing so here might be heavy. 
        // The original hook fetched ALL services and designers client-side to map names.
        // We can replicate that mapping here or send raw IDs and let client map (if client still has access to services/designers).
        // Rules available for Services/Designers: 
        //   match /designers/{designerId} { allow read: if true; }
        //   match /services/{serviceId} { allow read: if true; }
        // So client CAN fetch services/designers.
        // BUT, looking at `useBookings.ts`, it processes the data to include `serviceName` and `designerName`.
        // To be helpful and reduce client complexity, let's fetch names here IF feasible, OR just return raw data and let client map.
        // The client-side hook uses `servicesMap` and `designersMap`.
        // If I return raw data, I need to update the hook to still fetch services/designers and map them.
        // If I do it server-side, it's cleaner for the client.
        // Let's do it SERVER-SIDE for better performance (one request vs many).
        // But fetching ALL services/designers every time might be slow?
        // Actually, we can fetch only referenced ones or cache.
        // For simplicity and matching typical patterns, let's just fetch the bookings and maybe populate names if easy.
        // The Booking object typically has `serviceNames` array (see BookingPage.tsx line 192).
        // The `useBookings.ts` line 68 says: `serviceName: Array.isArray(data.serviceNames) ? data.serviceNames.join('、') : ...`
        // So `serviceNames` IS stored in the booking document! We don't need to join with Services collection for names, only maybe for details.
        // Designer Name: The booking has `designerId`. It might NOT have designerName stored (BookingPage saves it? No, line 190 just designerId).
        // So we might need to fetch Designer Name.
        // Let's optimize: Fetch all designers (usually small list) or just the ones needed.
        // Given the scale typically small, I'll just return the booking data. 
        // Client `useBookings` ALREADY fetches services/designers map. 
        // Making `get-my-bookings` just return the booking documents is the most "RESTful" way, and let the existing client logic handle mapping (since it already does `designersMap.get(...)`).
        // Wait, the client Logic in `useBookings` fetches services/designers `const [servicesSnapshot, designersSnapshot] = await Promise.all(...)`.
        // I will KEEP that part in the hook, but replace the `onSnapshot` of bookings with `fetch('/api/get-my-bookings')`.
        // Then I combine the data in the hook.

        const bookings = bookingsSnapshot.docs.map(doc => {
            const data = doc.data();
            // Convert Timestamps to ISO strings for JSON
            return {
                id: doc.id,
                ...data,
                dateTime: (data.dateTime as FirebaseFirestore.Timestamp)?.toDate().toISOString(),
                createdAt: (data.createdAt as FirebaseFirestore.Timestamp)?.toDate().toISOString(),
            };
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ bookings })
        };

    } catch (error: any) {
        console.error('[get-my-bookings] Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
        };
    }
};

export { handler };
