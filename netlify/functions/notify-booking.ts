import type { Handler } from "@netlify/functions";
import * as admin from "firebase-admin";

// Use a singleton pattern to prevent multiple initializations in the same container
if (!admin.apps.length) {
    let serviceAccount: any = null;

    try {
        // Option 1: Full JSON in FIREBASE_SERVICE_ACCOUNT
        let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

        if (serviceAccountJson) {
            // Check if base64 encoded (starts with 'e' commonly for {"type"...) or doesn't start with '{'
            if (!serviceAccountJson.trim().startsWith('{')) {
                try {
                    serviceAccountJson = Buffer.from(serviceAccountJson, 'base64').toString('utf-8');
                } catch (e) {
                    console.warn("Failed to decode FIREBASE_SERVICE_ACCOUNT from Base64, attempting to use raw value.");
                }
            }
            serviceAccount = JSON.parse(serviceAccountJson);
        }
        // Option 2: Individual variables
        else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            serviceAccount = {
                projectId: process.env.VITE_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Replace literal \n with actual newlines if they are escaped
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            };
        }

        if (serviceAccount && (serviceAccount.project_id || serviceAccount.projectId)) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } else {
            console.warn("Missing valid Firebase Service Account credentials (FIREBASE_SERVICE_ACCOUNT or FIREBASE_PRIVATE_KEY+FIREBASE_CLIENT_EMAIL).");
        }
    } catch (error) {
        console.error("Error initializing Firebase Admin:", error);
    }
}

interface NotifyRequestBody {
    bookingId: string;
    customerName: string;
    serviceNames: string[];
    bookingTime: string; // ISO string or formatted
    designerId?: string; // Optional
}

const handler: Handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    // Ensure Firebase Admin is initialized
    if (!admin.apps.length) {
        return { statusCode: 500, body: "Firebase Admin not initialized" };
    }

    try {
        const bodyContent = event.body || "{}";
        const body = JSON.parse(bodyContent) as NotifyRequestBody;
        const { bookingId, customerName, serviceNames, bookingTime, designerId } = body;

        console.log(`Processing notification for booking ${bookingId}`);

        const db = admin.firestore();
        const messaging = admin.messaging();
        const tokens: string[] = [];

        // 1. Fetch Admins and Managers
        const staffSnapshot = await db.collection('users')
            .where('role', 'in', ['admin', 'manager'])
            .get();

        staffSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.fcmToken) {
                tokens.push(data.fcmToken);
            }
            // Support array of tokens if implemented
            if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
                tokens.push(...data.fcmTokens);
            }
        });

        // 2. Fetch Assigned Designer (if applicable)
        if (designerId) {
            console.log(`Fetching linked user for designer ${designerId}`);
            const designerDoc = await db.collection('designers').doc(designerId).get();
            if (designerDoc.exists) {
                const designerData = designerDoc.data();
                const linkedUserId = designerData?.linkedUserId;

                if (linkedUserId) {
                    const userDoc = await db.collection('users').doc(linkedUserId).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        if (userData?.fcmToken) {
                            // Add only if not already present (set handles uniqueness later)
                            tokens.push(userData.fcmToken);
                        }
                        if (userData?.fcmTokens && Array.isArray(userData.fcmTokens)) {
                            userData.fcmTokens.forEach((t: string) => tokens.push(t));
                        }
                    }
                }
            }
        }

        if (tokens.length === 0) {
            console.log("No FCM tokens found for recipients.");
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "No recipients found" })
            };
        }

        // Deduplicate tokens
        const uniqueTokens = [...new Set(tokens)];

        console.log(`Sending notifications to ${uniqueTokens.length} devices.`);

        const message = {
            notification: {
                title: '新預約通知',
                body: `${customerName} 預約了 ${serviceNames.join(', ')}\n時間: ${bookingTime}`,
            },
            data: {
                bookingId: bookingId,
                type: 'new_booking'
            },
            tokens: uniqueTokens,
        };

        const response = await messaging.sendEachForMulticast(message);
        console.log(`${response.successCount} messages were sent successfully`);

        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp: admin.messaging.SendResponse, idx: number) => {
                if (!resp.success) {
                    failedTokens.push(uniqueTokens[idx]);
                }
            });
            console.log('List of tokens that caused failures: ' + failedTokens);
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ success: true, count: response.successCount })
        };

    } catch (error) {
        console.error("Error sending notification:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" })
        };
    }
};

export { handler };
