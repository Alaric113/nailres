
import type { Handler } from '@netlify/functions';
import admin from 'firebase-admin';

if (!admin.apps.length) {
    let serviceAccount: any = null;
    try {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (serviceAccountJson) {
            let jsonStr = serviceAccountJson;
            if (!jsonStr.trim().startsWith('{')) {
                try { jsonStr = Buffer.from(jsonStr, 'base64').toString('utf-8'); } catch (e) { }
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
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        }
    } catch (e) {
        console.error("Error init firebase admin:", e);
    }
}

const db = admin.firestore();

const handler: Handler = async (event) => {
    // Only allow POST to trigger migration
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Use POST' };
    }

    try {
        const bookingsRef = db.collection('bookings');
        const snapshot = await bookingsRef.get(); // Get ALL bookings (might be heavy if huge DB, but fine for now)

        let count = 0;
        const batch = db.batch();

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.customerFeedback) {
                const reviewRef = db.collection('public_reviews').doc(doc.id);
                batch.set(reviewRef, {
                    bookingId: doc.id,
                    userId: data.userId,
                    rating: data.customerFeedback.rating,
                    comment: data.customerFeedback.comment || '',
                    photos: data.customerFeedback.photos || [],
                    designerName: data.designerId ? 'Designer' : 'Unknown', // We don't have designer Name easily here without join, keep simpler
                    // Or we can try to use what we have. 
                    // Actually, let's just copy what we can. Home.tsx renders '貴賓客戶' anyway.
                    serviceNames: data.serviceNames || [],
                    createdAt: data.customerFeedback.createdAt || data.dateTime || admin.firestore.FieldValue.serverTimestamp()
                });
                count++;
            }
        });

        if (count > 0) {
            await batch.commit();
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Migrated ${count} reviews.` }),
        };

    } catch (error: any) {
        console.error('Migration error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

export { handler };
