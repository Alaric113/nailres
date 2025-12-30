import type { Handler, HandlerEvent } from '@netlify/functions';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { format, parseISO, addMinutes, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

// Constants matching frontend logic
const SLOT_INTERVAL = 30; // 30 minutes
const BUFFER_TIME = 15;   // 15 minutes

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
                        console.warn("[get-available-slots] Failed to decode base64, using raw.");
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
            console.error("[get-available-slots] Init failed:", error);
            throw error;
        }
    }
};

const handler: Handler = async (event: HandlerEvent) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        initFirebase();
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
