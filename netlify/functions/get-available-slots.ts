import type { Handler, HandlerEvent } from '@netlify/functions';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { format, parseISO, addMinutes, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

// Constants matching frontend logic
const SLOT_INTERVAL = 30; // 30 minutes
const BUFFER_TIME = 15;   // 15 minutes

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
                    console.warn("[get-available-slots] Failed to decode FIREBASE_SERVICE_ACCOUNT from Base64, attempting raw value.");
                }
            }
            try {
                serviceAccount = JSON.parse(serviceAccountJson);
            } catch (e) {
                console.error("[get-available-slots] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", e);
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
            console.log("[get-available-slots] Firebase Admin initialized successfully.");
            return true;
        } else {
            console.error("[get-available-slots] No valid credentials found for Firebase Admin.");
            return false;
        }
    } catch (e: any) {
        console.error(`[get-available-slots] Error init firebase admin: ${e.message}`, e);
        return false;
    }
}

const handler: Handler = async (event: HandlerEvent) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        if (!initializeFirebase()) {
            return { statusCode: 500, body: JSON.stringify({ message: "Firebase init failed" }) };
        }
        const db = getFirestore();

        const { designerId, date, duration } = event.queryStringParameters || {};

        if (!designerId || !date || !duration) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing required parameters: designerId, date, duration' })
            };
        }

        const serviceDuration = parseInt(duration);
        if (isNaN(serviceDuration) || serviceDuration <= 0) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Invalid duration.' }) };
        }

        // 1. Fetch Business Hours
        const businessDocRef = db.doc(`designers/${designerId}/businessHours/${date}`);
        const businessDocSnap = await businessDocRef.get();

        if (!businessDocSnap.exists) {
            return { statusCode: 200, body: JSON.stringify({ slots: [] }) };
        }

        const businessData = businessDocSnap.data();
        if (!businessData || businessData.isClosed) {
            return { statusCode: 200, body: JSON.stringify({ slots: [] }) };
        }

        // 2. Fetch Existing Bookings
        // Note: Admin SDK uses Timestamp for queries, need to convert JS Date
        const startOfSelectedDay = startOfDay(parseISO(date));
        const endOfSelectedDay = endOfDay(parseISO(date));

        const bookingsRef = db.collection('bookings');
        const bookingsSnapshot = await bookingsRef
            .where('designerId', '==', designerId)
            .where('dateTime', '>=', startOfSelectedDay)
            .where('dateTime', '<=', endOfSelectedDay)
            .get();

        const existingBookings: { start: Date; end: Date }[] = [];

        bookingsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status !== 'cancelled') {
                const bookingStart = data.dateTime.toDate(); // Convert Firestore Timestamp to Date
                // Add buffer to the end of the booking
                const bookingEnd = addMinutes(bookingStart, (data.duration || 0) + BUFFER_TIME);
                existingBookings.push({ start: bookingStart, end: bookingEnd });
            }
        });

        // 3. Calculate Slots
        const slots: string[] = [];
        const timeSlots = businessData.timeSlots || [];

        // 確保日期解析正確
        const [year, month, day] = date.split('-').map(Number);

        timeSlots.forEach((slot: any) => {
            // 解析營業時間 (假設資料庫現在已改回正確的 "10:00")
            const [startH, startM] = slot.start.split(':').map(Number);
            const [endH, endM] = slot.end.split(':').map(Number);

            // 建立 UTC 時間點（台灣時間 10:00 = UTC 02:00）
            const currentSlotStartUTC = new Date(Date.UTC(year, month - 1, day, startH - 8, startM));
            const slotEndUTC = new Date(Date.UTC(year, month - 1, day, endH - 8, endM));

            console.log(`[DEBUG] 處理時段: ${slot.start} ~ ${slot.end}`);
            console.log(`[DEBUG] 起始 UTC: ${currentSlotStartUTC.toISOString()}`);

            let cursor = new Date(currentSlotStartUTC);

            // 迴圈生成 Slot
            // 使用 cursor <= slotEndUTC 確保「最後一個起點」可以是營業結束時間
            while (cursor.getTime() <= slotEndUTC.getTime()) {

                // 預計服務結束時間 (用於碰撞檢查)
                const potentialSlotEnd = addMinutes(cursor, serviceDuration);

                // 碰撞檢查 (與現有預約 + BUFFER_TIME 比對)
                let isConflict = false;
                for (const booking of existingBookings) {
                    // 邏輯：新預約開始 < 舊預約結束 且 新預約結束 > 舊預約開始
                    if (isBefore(cursor, booking.end) && isAfter(potentialSlotEnd, booking.start)) {
                        isConflict = true;
                        break;
                    }
                }

                if (!isConflict) {
                    // 存入 ISO 字串供前端使用
                    slots.push(cursor.toISOString());
                }

                // 往下移動一個間隔 (30分鐘)
                cursor = addMinutes(cursor, SLOT_INTERVAL);

                // 安全機制：避免無限迴圈
                if (isAfter(cursor, addMinutes(slotEndUTC, SLOT_INTERVAL))) break;
            }
        });
        return {
            statusCode: 200,
            body: JSON.stringify({ slots })
        };

    } catch (error: any) {
        console.error("[get-available-slots] Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
        };
    }
};

export { handler };
