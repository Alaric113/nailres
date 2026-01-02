import { doc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Marks a user as "No Show" (放鳥).
 * Actions:
 * 1. Downgrade user role to 'user' (general member).
 * 2. Set 'isPlatinumBlacklisted' to true.
 * 3. Update the booking status to 'cancelled' (optional but logical for no-show).
 */
export const markUserAsNoShow = async (bookingId: string, userId: string): Promise<void> => {
    try {
        const batch = writeBatch(db);

        // 1. Update User
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
            role: 'user',                  // Downgrade to general member
            isPlatinumBlacklisted: true,   // Prevent future upgrades
            lastUpdated: serverTimestamp()
        });

        // 2. Update Booking (Cancel it for record keeping as "No Show" isn't a separate status yet, or just keep it confirmed? User implies penalty. Usually No Show = Cancelled with penalty)
        // User request: "當這個按鈕被按下 該預約客戶的帳號會被降至一班會員" -> The button is called "放鳥" (No Show).
        // It's probably best to cancel the booking so it doesn't stay in "Confirmed" forever.
        // Let's assume we cancel it.
        const bookingRef = doc(db, 'bookings', bookingId);
        batch.update(bookingRef, {
            status: 'cancelled',
            cancellationReason: 'No Show (放鳥)',
            updatedAt: serverTimestamp()
        });

        await batch.commit();
        console.log(`User ${userId} marked as No Show for booking ${bookingId}`);

    } catch (error) {
        console.error("Error marking user as no show:", error);
        throw error;
    }
};
