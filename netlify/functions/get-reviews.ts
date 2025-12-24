
import type { Handler } from '@netlify/functions';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK (Reuse logic from send-line-message)
if (!admin.apps.length) {
    let serviceAccount: any = null;

    try {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (serviceAccountJson) {
            let jsonStr = serviceAccountJson;
            if (!jsonStr.trim().startsWith('{')) {
                try {
                    jsonStr = Buffer.from(jsonStr, 'base64').toString('utf-8');
                } catch (e) { /* ignore */ }
            }
            serviceAccount = JSON.parse(jsonStr);
        } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
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
        }
    } catch (e) {
        console.error("Error init firebase admin:", e);
    }
}

const db = admin.firestore();

const handler: Handler = async (event) => {
    // Only allow GET
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        if (admin.apps.length === 0) {
            throw new Error("Firebase Admin not initialized.");
        }

        // Fetch Completed Bookings
        // We fetch a batch and filter in memory to avoid complex indexes for now
        const bookingsRef = db.collection('bookings');
        const snapshot = await bookingsRef
            .where('status', '==', 'completed')
            .limit(50) // Fetch last 50 completed bookings
            .get();

        console.log(`[get-reviews] Found ${snapshot.size} completed bookings.`);

        if (snapshot.empty) {
            return {
                statusCode: 200,
                body: JSON.stringify([])
            };
        }

        const reviews = snapshot.docs
            .map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Normalize timestamps for client
                    dateTime: data.dateTime?.toDate?.()?.toISOString() || data.dateTime
                };
            })
            .filter((booking: any) => {
                const hasFeedback = !!booking.customerFeedback;
                const highRating = booking.customerFeedback?.rating >= 4;
                const hasComment = !!booking.customerFeedback?.comment;

                if (hasFeedback) {
                    console.log(`[get-reviews] Booking ${booking.id}: Rating=${booking.customerFeedback.rating}, Comment?=${hasComment}`);
                }

                return hasFeedback && highRating && hasComment;
            })
            .sort((a: any, b: any) => {
                // Sort by feedback creation time if available, else booking time
                const timeA = a.customerFeedback?.createdAt?.toDate ? a.customerFeedback.createdAt.toDate().getTime() : new Date(a.dateTime).getTime();
                const timeB = b.customerFeedback?.createdAt?.toDate ? b.customerFeedback.createdAt.toDate().getTime() : new Date(b.dateTime).getTime();
                return timeB - timeA;
            })
            .slice(0, 5) // Top 5
            .map((booking: any) => ({
                id: booking.id,
                rating: booking.customerFeedback.rating,
                comment: booking.customerFeedback.comment,
                serviceNames: booking.serviceNames || [],
                // We don't have user name easily here unless we fetch user doc.
                // For now, return generic or maybe partial info if stored in booking.
                // The bookings usually don't store user name directly at top level (only in some implementations).
                // But our send-line-message fetched it.
                // Let's just return what we have. Home.tsx uses '貴賓客戶' anyway.
            }));

        return {
            statusCode: 200,
            body: JSON.stringify(reviews),
        };

    } catch (error: any) {
        console.error('Error fetching reviews:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

export { handler };
