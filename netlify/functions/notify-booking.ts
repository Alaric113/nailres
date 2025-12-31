import type { Handler } from "@netlify/functions";
import * as admin from "firebase-admin";

// Helper to safely initialize Firebase Admin
function initializeFirebase() {
    if (admin.apps.length > 0) {
        return true; // Already initialized
    }

    let serviceAccount: any = null;

    try {
        // Option 1: Full JSON in FIREBASE_SERVICE_ACCOUNT
        let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

        if (serviceAccountJson) {
            if (!serviceAccountJson.trim().startsWith('{')) {
                try {
                    serviceAccountJson = Buffer.from(serviceAccountJson, 'base64').toString('utf-8');
                } catch (e) {
                    console.warn("[notify-booking] Failed to decode FIREBASE_SERVICE_ACCOUNT from Base64, attempting raw value.");
                }
            }
            try {
                serviceAccount = JSON.parse(serviceAccountJson);
            } catch (e) {
                console.error("[notify-booking] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", e);
            }
        }

        // Option 2: Individual variables (Fallback)
        if (!serviceAccount && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            let privateKey = process.env.FIREBASE_PRIVATE_KEY;

            // Handle potential wrapping quotes
            if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
                privateKey = privateKey.slice(1, -1);
            }
            if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
                privateKey = privateKey.slice(1, -1);
            }

            // Replace escaped newlines (handle both \\n and \n)
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
            console.log("[notify-booking] Firebase Admin initialized successfully.");
            return true;
        } else {
            console.error("[notify-booking] No valid credentials found for Firebase Admin.");
            return false;
        }
    } catch (e: any) {
        console.error(`[notify-booking] Error init firebase admin: ${e.message}`, e);
        return false;
    }
}

interface NotifyRequestBody {
    bookingId?: string;
    customerName?: string;
    serviceNames?: string[];
    bookingTime?: string; // ISO string or formatted
    designerId?: string; // Optional
    type?: 'new_booking' | 'test_notification';
    targetToken?: string; // For test notifications
}

const handler: Handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    // Ensure Firebase Admin is initialized
    if (!initializeFirebase()) {
        return { statusCode: 500, body: "Firebase Admin not initialized" };
    }

    try {
        const bodyContent = event.body || "{}";
        const body = JSON.parse(bodyContent) as NotifyRequestBody;
        // Destructure with defaults or optionals to avoid runtime crashes on test
        const { bookingId, customerName, serviceNames, bookingTime, designerId, type = 'new_booking', targetToken } = body;

        console.log(`Processing notification: Type=${type}`);

        const db = admin.firestore();
        const messaging = admin.messaging();
        const tokens: string[] = [];

        // --- Handle Test Notification ---
        if (type === 'test_notification') {
            if (targetToken) {
                tokens.push(targetToken);
            } else {
                // Fallback: Send to all admins if no specific token provided (optional behavior, maybe safer to require token for personal test)
                // For now, let's require check if targetToken is present, or fetch admins if meant to be a broadcast test.
                // Given the user wants to test "pwa push", usually means "test on my device".
                // So we will rely on targetToken being passed from frontend.
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: "Missing targetToken for test notification" })
                };
            }

            const message = {
                notification: {
                    title: 'PWA 推播測試',
                    body: `這是一則測試訊息！收到此訊息代表您的裝置已成功設定推播通知。\n時間: ${new Date().toLocaleString('zh-TW')}`,
                },
                token: targetToken,
            };

            try {
                // Use send for single token
                await messaging.send(message);
                return {
                    statusCode: 200,
                    body: JSON.stringify({ success: true, message: "Test notification sent" })
                };
            } catch (err: any) {
                console.error("Error sending test notification:", err);
                return {
                    statusCode: 500,
                    body: JSON.stringify({ error: err.message || "Failed to send test notification" })
                };
            }
        }

        // --- Handle Regular Booking Notification ---
        if (!bookingId || !customerName || !serviceNames || !bookingTime) {
            return { statusCode: 400, body: JSON.stringify({ message: "Missing required booking information" }) };
        }


        // 1. Fetch Admins and Managers
        console.log(`Checking Admins/Managers for subscriptions to Designer: ${designerId || 'None'}`);
        const staffSnapshot = await db.collection('users')
            .where('role', 'in', ['admin', 'manager'])
            .get();

        staffSnapshot.forEach(doc => {
            const data = doc.data();

            // Check Master Switch
            if (!data.receivesPwaNotifications) return;

            // Check Subscription
            const subs = data.pwaSubscriptions || [];
            const isSubscribedToAll = subs.includes('all');
            const isSubscribedToDesigner = designerId && subs.includes(designerId);

            if (isSubscribedToAll || isSubscribedToDesigner) {
                if (data.fcmToken) tokens.push(data.fcmToken);
                if (data.fcmTokens && Array.isArray(data.fcmTokens)) tokens.push(...data.fcmTokens);
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

                        // Check Master Switch for Designer
                        if (userData?.receivesPwaNotifications) {
                            if (userData.fcmToken) tokens.push(userData.fcmToken);
                            if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
                                userData.fcmTokens.forEach((t: string) => tokens.push(t));
                            }
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
