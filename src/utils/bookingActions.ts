import {
    doc,
    getDoc,
    updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BookingStatus } from '../types/booking';

/**
 * Updates a booking status and handles related logic (like Season Pass usage deduction).
 * 
 * @param bookingId The ID of the booking to update.
 * @param newStatus The new status to set.
 * @returns Promise<void>
 */
export const updateBookingStatus = async (bookingId: string, newStatus: BookingStatus): Promise<void> => {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
        throw new Error('Booking not found');
    }

    const bookingData = bookingSnap.data();
    const updates: any = { status: newStatus };

    // DEBUG LOG
    console.log(`[updateBookingStatus] ID: ${bookingId}, New: ${newStatus}, Curr: ${bookingData.status}, Deducted: ${bookingData.passUsageDeducted}, HasUsage: ${!!bookingData.passUsage}`);

    // Handle Season Pass Deduction
    // Condition: New status is 'confirmed' AND plain pass usage exists AND hasn't been deducted yet
    if (newStatus === 'confirmed' &&
        bookingData.passUsage &&
        bookingData.userId &&
        !bookingData.passUsageDeducted) {

        console.log("Attempting deduction...");

        try {
            const userRef = doc(db, 'users', bookingData.userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                const activePasses = userData.activePasses || [];
                const usedPassId = bookingData.passUsage.passId;

                // Fetch Pass Definition for ID mapping
                const passRef = doc(db, 'season_passes', usedPassId);
                const passSnap = await getDoc(passRef);
                const passDef = passSnap.exists() ? passSnap.data() : null;

                let deductionHappened = false;

                const updatedPasses = activePasses.map((pass: any) => {
                    if (pass.passId === usedPassId) {
                        const updatedUsages = { ...pass.remainingUsages };
                        const serviceIds = bookingData.passUsage.contentItemsUsed || [];

                        serviceIds.forEach((sId: string) => {
                            let usageKey = sId;
                            // Map Service ID -> Content Item ID
                            if (passDef && passDef.contentItems) {
                                const contentItem = passDef.contentItems.find((item: any) => item.serviceId === sId);
                                if (contentItem) {
                                    usageKey = contentItem.id;
                                }
                            }

                            if (updatedUsages[usageKey] && updatedUsages[usageKey] > 0) {
                                updatedUsages[usageKey] -= 1;
                                deductionHappened = true;
                            }
                        });
                        return { ...pass, remainingUsages: updatedUsages };
                    }
                    return pass;
                });

                if (deductionHappened) {
                    await updateDoc(userRef, { activePasses: updatedPasses });
                    // Mark as deducted to prevent double deduction
                    updates.passUsageDeducted = true;
                    console.log("Deduction successful.");
                }
            }
        } catch (err) {
            console.error("Error processing pass deduction:", err);
        }
    }

    // Handle Refund
    // Condition: Status is cancelled 
    // AND (flag is true OR (status was confirmed and passUsage exists))
    // This covers legacy bookings that were confirmed (deducted) but might not have flag.
    const shouldRefund = newStatus === 'cancelled' &&
        bookingData.passUsage &&
        bookingData.userId &&
        (bookingData.passUsageDeducted === true || bookingData.status === 'confirmed');

    if (shouldRefund) {
        // ... existing refund logic
    } else if (newStatus === 'cancelled') {
        console.log("Refund skipped. Condition failed:", {
            hasUsage: !!bookingData.passUsage,
            hasUserId: !!bookingData.userId,
            isDeducted: bookingData.passUsageDeducted === true,
            isConfirmed: bookingData.status === 'confirmed'
        });
    }

    if (shouldRefund) {
        console.log(`Attempting refund for booking ${bookingId}. Reason: Cancelled and previously deducted/confirmed.`);
        try {
            const userRef = doc(db, 'users', bookingData.userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                const activePasses = userData.activePasses || [];
                const usedPassId = bookingData.passUsage.passId;

                // Fetch Pass Definition for ID mapping
                const passRef = doc(db, 'season_passes', usedPassId);
                const passSnap = await getDoc(passRef);
                const passDef = passSnap.exists() ? passSnap.data() : null;

                let refundHappened = false;

                const updatedPasses = activePasses.map((pass: any) => {
                    // Match pass by ID. Note: Ideally should match by purchaseDate too if available, 
                    // but bookingData.passUsage currently only has passId. 
                    // This assumes one active pass of this type, or refunds the first one found.
                    if (pass.passId === usedPassId) {
                        const updatedUsages = { ...pass.remainingUsages };
                        const serviceIds = bookingData.passUsage.contentItemsUsed || [];

                        serviceIds.forEach((sId: string) => {
                            let usageKey = sId;
                            // Map Service ID -> Content Item ID
                            if (passDef && passDef.contentItems) {
                                const contentItem = passDef.contentItems.find((item: any) => item.serviceId === sId);
                                if (contentItem) {
                                    usageKey = contentItem.id;
                                }
                            }
                            // Init key if not exists
                            if (updatedUsages[usageKey] === undefined) updatedUsages[usageKey] = 0;

                            updatedUsages[usageKey] += 1;
                            refundHappened = true;
                        });
                        return { ...pass, remainingUsages: updatedUsages };
                    }
                    return pass;
                });

                if (refundHappened) {
                    await updateDoc(userRef, { activePasses: updatedPasses });
                    updates.passUsageDeducted = false;
                    console.log("Refund successful for booking", bookingId);
                } else {
                    console.log("No matching pass found to refund for booking", bookingId);
                }
            }
        } catch (err) {
            console.error("Error processing pass refund:", err);
        }
    }

    await updateDoc(bookingRef, updates);
};
