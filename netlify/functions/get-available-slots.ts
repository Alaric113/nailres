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
        const slots: string[] = []; // Return ISO strings

        // Parse date as TW time (UTC+8) logic
        // We assume input `date` is YYYY-MM-DD.
        // We assume `slot.start` is HH:mm.
        // We construct "YYYY-MM-DDTHH:mm:00+08:00" to ensure consistent absolute time regardless of server TZ.

        const timeSlots = businessData.timeSlots || [];
        console.log(serviceDuration)

        timeSlots.forEach((slot: any) => {
            // Force +08:00 timezone
            let currentSlotStart = parseISO(`${date}T${slot.start}:00+08:00`);
            // slot.end might be smaller than start if overnight? Assuming same day for now as per simple logic
            // But usually slot.end is just time string.
            // If slot.end < slot.start (e.g. 02:00 next day), we'd need to handle date rollover.
            // Basic assumption: Business hours within single day.
            const slotEnd = parseISO(`${date}T${slot.end}:00+08:00`);

            while (true) {
                const potentialSlotEnd = addMinutes(currentSlotStart, serviceDuration);

                // Check bounds
                if (isAfter(potentialSlotEnd, slotEnd)) {
                    break;
                }

                // Check collision
                let isConflict = false;
                for (const booking of existingBookings) {
                    if (isBefore(currentSlotStart, booking.end) && isAfter(potentialSlotEnd, booking.start)) {
                        isConflict = true;
                        break;
                    }
                }

                if (!isConflict) {
                    slots.push(currentSlotStart.toISOString());
                }

                currentSlotStart = addMinutes(currentSlotStart, SLOT_INTERVAL);
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
