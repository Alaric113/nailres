import { doc, getDoc, serverTimestamp, writeBatch, arrayUnion, Timestamp, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ActiveFollowUp } from '../types/user';
import type { Service } from '../types/service';

/**
 * Distributes the "New User Coupon" to a specific user.
 * Searches for an active coupon marked as 'isNewUserCoupon'.
 * If found, creates a user_coupon record.
 */
export const distributeNewUserCoupon = async (userId: string): Promise<boolean> => {
    try {
        const couponsRef = collection(db, 'coupons');
        const q = query(couponsRef, where('isNewUserCoupon', '==', true), where('isActive', '==', true), limit(1));
        const couponSnapshot = await getDocs(q);
        
        if (couponSnapshot.empty) {
            console.log("No active new user coupon found.");
            return false;
        }

        const newUserCoupon = couponSnapshot.docs[0];
        const couponData = newUserCoupon.data();
        const batch = writeBatch(db);

        // Create in ROOT collection 'user_coupons'
        const userCouponRef = doc(collection(db, 'user_coupons'));

        const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        
        // Default to 90 days validity for new user coupon if not specified in template (mimicking useAuth.ts behavior)
        // Ideally we should check if couponData.validUntil exists, but useAuth.ts hardcodes 90 days.
        // We will stick to the pattern: Use 90 days from NOW.
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 90);

        batch.set(userCouponRef, {
            userId: userId,
            couponId: newUserCoupon.id,
            code: `${couponData.code}-${uniqueSuffix}`,
            title: couponData.title,
            status: 'active',
            value: couponData.value,
            type: couponData.type,
            minSpend: couponData.minSpend || 0,
            scopeType: couponData.scopeType || 'all',
            scopeIds: couponData.scopeIds || [],
            details: couponData.details || '',
            createdAt: serverTimestamp(),
            validFrom: serverTimestamp(),
            validUntil: Timestamp.fromDate(validUntil),
            redemptionSource: 'new_user_gift'
        });

        await batch.commit();
        console.log(`Distributed new user coupon ${newUserCoupon.id} to user ${userId}`);
        return true;

    } catch (error) {
        console.error("Error distributing new user coupon:", error);
        return false;
    }
};

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

/**
 * Issues follow-up service eligibility to user after booking completion.
 * Checks all services in the booking and issues follow-up for those with enabled followUpConfig.
 */
export const issueFollowUpEligibility = async (
    booking: { 
        id: string; 
        userId: string; 
        serviceIds: string[]; 
        dateTime: Timestamp; 
        amount: number;
        items?: { serviceId: string; price: number }[]; // Include items with actual prices
    }
): Promise<number> => {
    try {
        let issuedCount = 0;
        const followUpsToAdd: ActiveFollowUp[] = [];

        // Check each service in the booking
        for (const serviceId of booking.serviceIds) {
            const serviceDoc = await getDoc(doc(db, 'services', serviceId));
            if (!serviceDoc.exists()) continue;

            const service = { id: serviceDoc.id, ...serviceDoc.data() } as Service;
            
            // Check if this service has follow-up enabled
            if (!service.followUpConfig?.enabled) continue;

            // Calculate expiry date
            const completedDate = booking.dateTime.toDate();
            const expiryDate = new Date(completedDate);
            expiryDate.setDate(expiryDate.getDate() + service.followUpConfig.validDays);

            // Get actual price from booking items (includes options), fallback to service base price
            const bookingItem = booking.items?.find(item => item.serviceId === serviceId);
            const actualPrice = bookingItem?.price ?? service.price;

            // Create follow-up eligibility
            const followUp: ActiveFollowUp = {
                id: `${booking.id}_${serviceId}_${Date.now()}`,
                serviceId: service.id,
                serviceName: service.name,
                followUpName: service.followUpConfig.name,
                originalPrice: actualPrice, // Use booking item price which includes options
                completedAt: booking.dateTime,
                expiresAt: Timestamp.fromDate(expiryDate),
                pricingTiers: service.followUpConfig.pricingTiers,
                bookingId: booking.id,
                status: 'active'
            };

            followUpsToAdd.push(followUp);
            issuedCount++;
        }

        // Add all follow-ups to user document
        if (followUpsToAdd.length > 0 && booking.userId) {
            const batch = writeBatch(db);
            const userRef = doc(db, 'users', booking.userId);
            
            for (const followUp of followUpsToAdd) {
                batch.update(userRef, {
                    activeFollowUps: arrayUnion(followUp)
                });
            }
            
            await batch.commit();
            console.log(`Issued ${issuedCount} follow-up eligibilities for booking ${booking.id}`);
        }

        return issuedCount;
    } catch (error) {
        console.error("Error issuing follow-up eligibility:", error);
        throw error;
    }
};

/**
 * Marks follow-up eligibilities as used after booking completion.
 * Updates the status from 'active' to 'used'.
 */
export const markFollowUpsAsUsed = async (
    userId: string,
    followUpIds: string[]
): Promise<void> => {
    if (!userId || followUpIds.length === 0) return;

    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            console.warn(`User ${userId} not found when marking follow-ups as used`);
            return;
        }

        const userData = userSnap.data();
        const activeFollowUps = (userData.activeFollowUps || []) as ActiveFollowUp[];
        
        // Update status for matching follow-ups
        const updatedFollowUps = activeFollowUps.map(fu => {
            if (followUpIds.includes(fu.id)) {
                return { ...fu, status: 'used' as const };
            }
            return fu;
        });

        const batch = writeBatch(db);
        batch.update(userRef, { activeFollowUps: updatedFollowUps });
        await batch.commit();

        console.log(`Marked ${followUpIds.length} follow-ups as used for user ${userId}`);
    } catch (error) {
        console.error("Error marking follow-ups as used:", error);
        throw error;
    }
};
