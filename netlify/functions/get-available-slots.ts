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
        const today = new Date();

        // Use Taiwan/Local time for "now" comparison if possible, but server usually UTC.
        // Ideally we should handle timezone carefully. For now assuming server time is acceptable or we rely on client to filter past slots if needed.
        // Actually, let's trust the input 'date' is YYYY-MM-DD.
        // We need 'now' to prevent booking past slots if date is today.
        // Since Netlify functions run in UTC usually, we should be careful.
        // Let's assume input date is effectively "local date string".

        // Simpler approach: Just return all slots for that day that are valid by logic, 
        // frontend can filter out "past" slots relative to user's browser time if needed, 
        // OR we try to estimate "now". 
        // Logic in hook used `new Date()` (client time).
        // Here `new Date()` is server time.
        // Let's perform the "Is Past" check on client side for better accuracy? 
        // OR we accept we might return past slots and client filters them.
        // UseDesignerAvailableSlots.ts logic: "Ensure slots are not in the past relative to the current time if it's today"

        // I will replicate the logic but be aware of timezone diffs. 
        // To be safe, I'll calculate all valid slots based on conflict/business hours,
        // And let the Client do the final "is this time in the past?" check because Client knows its own timezone best.
        // Wait, if I return past slots, the hook might show them?
        // The original hook had `if (isAfter(currentDateTime, currentSlotStart))` logic.
        // I will keep the collision logic here. The "past check" might be better on client, but the current hook REPLACES `availableSlots` with the result.
        // I will comment out the strict "past check" on server side to avoid TZ issues, and let client filter if needed, 
        // OR I just return them and client logic handles display.
        // Actually, the hook sets state `setAvailableSlots(slots)`.
        // I will implement "past check" locally in the hook after receiving data, or just return everything and update hook to filter.
        // Let's update hook to filter past slots.

        const timeSlots = businessData.timeSlots || [];

        timeSlots.forEach((slot: any) => {
            let currentSlotStart = parseISO(`${date}T${slot.start}:00`);
            const slotEnd = parseISO(`${date}T${slot.end}:00`);

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
