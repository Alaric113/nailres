import {
    doc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    limit,
    getDocs,
    writeBatch,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BookingStatus } from '../types/booking';
import { issueFollowUpEligibility } from './userActions';

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



    // Handle Season Pass Deduction
    // Condition: New status is 'confirmed' AND plain pass usage exists AND hasn't been deducted yet
    if (newStatus === 'confirmed' &&
        bookingData.passUsage &&
        bookingData.userId &&
        !bookingData.passUsageDeducted) {

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
                }
            }
        } catch (err) {
            console.error("Error processing pass refund:", err);
        }
    }

    // Handle Actions when booking is completed (Role Upgrade, Loyalty Points, Follow-up Eligibility)
    if (newStatus === 'completed' && bookingData.userId) {
        // A. Handle Automatic Role Upgrade (General -> Platinum)
        try {
            const userRef = doc(db, 'users', bookingData.userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                if (userData.role === 'user') {
                    await updateDoc(userRef, { role: 'platinum' });
                    console.log(`[Role Upgrade] User ${bookingData.userId} upgraded to platinum.`);
                }
            }
        } catch (err) {
            console.error("Error processing role upgrade:", err);
        }

        // B. Handle Loyalty Points
        try {
            if (bookingData.amount > 0) {
                const batch = writeBatch(db);
                await grantLoyaltyPoints(batch, bookingId, bookingData);
                await batch.commit();
            }
        } catch (err) {
            console.error("Error processing loyalty points:", err);
        }

        // C. Handle Follow-up Service Eligibility (售後服務)
        try {
            // Check dateTime format
            let dateTimeTimestamp: Timestamp;
            if (bookingData.dateTime instanceof Timestamp) {
                dateTimeTimestamp = bookingData.dateTime;
            } else if (bookingData.dateTime && typeof bookingData.dateTime.toDate === 'function') {
                dateTimeTimestamp = bookingData.dateTime as Timestamp;
            } else if (bookingData.dateTime && bookingData.dateTime.seconds !== undefined) {
                dateTimeTimestamp = new Timestamp(bookingData.dateTime.seconds, bookingData.dateTime.nanoseconds || 0);
            } else {
                dateTimeTimestamp = Timestamp.fromDate(new Date(bookingData.dateTime));
            }

            const issuedCount = await issueFollowUpEligibility({
                id: bookingId,
                userId: bookingData.userId,
                serviceIds: bookingData.serviceIds || [],
                dateTime: dateTimeTimestamp,
                amount: bookingData.amount || 0,
                items: bookingData.items || []
            });
            if (issuedCount > 0) {
                console.log(`Issued ${issuedCount} follow-up eligibilities for booking ${bookingId}`);
            }
        } catch (err) {
            console.error("Error issuing follow-up eligibility:", err);
        }
    }

    await updateDoc(bookingRef, updates);
};

/**
 * Grant loyalty points to user on booking completion
 */
const grantLoyaltyPoints = async (batch: ReturnType<typeof writeBatch>, bookingId: string, bookingData: any) => {
    if (!bookingData.userId || bookingData.amount <= 0) return;
    try {
        // 1. Check if points already granted for this booking
        const historyRef = collection(db, 'point_history');
        const q = query(
            historyRef,
            where('refId', '==', bookingId),
            where('type', '==', 'earned'),
            limit(1)
        );
        const historySnap = await getDocs(q);

        if (!historySnap.empty) {
            console.log(`Points already granted for booking ${bookingId}, skipping.`);
            return;
        }

        const settingsRef = doc(db, 'globals', 'settings');
        const settingsSnap = await getDoc(settingsRef);
        const loyaltySettings = settingsSnap.data()?.loyaltySettings;

        if (loyaltySettings && loyaltySettings.pointsPerAmount > 0) {
            const userRef = doc(db, 'users', bookingData.userId);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data() || {};
            const currentPoints = userData.loyaltyPoints || 0;

            // Check previous unclaimed spending & expiration (3 months)
            const now = new Date();
            let previousRemainder = Number(userData.unclaimedSpending) || 0;
            if (userData.unclaimedSpendingExpiresAt) {
                const expiresAt = typeof userData.unclaimedSpendingExpiresAt.toDate === 'function'
                    ? userData.unclaimedSpendingExpiresAt.toDate()
                    : new Date(userData.unclaimedSpendingExpiresAt.seconds * 1000);
                if (expiresAt < now) {
                    // Expired
                    previousRemainder = 0;
                }
            }

            const totalAmount = previousRemainder + bookingData.amount;
            const pointsEarned = Math.floor(totalAmount / loyaltySettings.pointsPerAmount);
            const newRemainder = totalAmount % loyaltySettings.pointsPerAmount;

            // Rolling 3 months expiration (90 days from now)
            const newExpiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

            // Update user document
            batch.update(userRef, {
                loyaltyPoints: currentPoints + pointsEarned,
                unclaimedSpending: newRemainder,
                unclaimedSpendingExpiresAt: Timestamp.fromDate(newExpiresAt),
            });

            // Create record in point_history
            const newHistoryRef = doc(collection(db, 'point_history'));
            const historyReason = previousRemainder > 0
                ? `完成預約 #${bookingId.substring(0, 6)}（消費 $${bookingData.amount} + 前次餘額 $${previousRemainder}，兌換 ${pointsEarned} 點，保留餘額 $${newRemainder}）`
                : `完成預約 #${bookingId.substring(0, 6)}（消費 $${bookingData.amount}，兌換 ${pointsEarned} 點，保留餘額 $${newRemainder}）`;

            batch.set(newHistoryRef, {
                userId: bookingData.userId,
                amount: pointsEarned,
                type: 'earned',
                reason: historyReason,
                refId: bookingId,
                spendingAmount: bookingData.amount,
                previousRemainder: previousRemainder,
                newRemainder: newRemainder,
                createdAt: serverTimestamp(),
            });

            // Legacy log
            const logRef = doc(db, 'loyaltyPointLogs', `${bookingId}_${Date.now()}`);
            batch.set(logRef, {
                userId: bookingData.userId,
                pointsChange: pointsEarned,
                reason: historyReason,
                createdAt: new Date(),
            });
        }
    } catch (e) {
        console.error("Error granting points:", e);
    }
};
