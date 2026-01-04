import { useState } from 'react';
import {
    doc,
    runTransaction,
    Timestamp,
    collection
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import type { RedemptionItem } from './useRedemptionItems';
import type { Coupon } from '../types/coupon';
import type { GiftCard } from '../types/giftcard';

export const useRedemption = () => {
    const { currentUser } = useAuthStore();
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const redeemReward = async (reward: RedemptionItem) => {
        if (!currentUser?.uid) {
            setError("請先登入");
            return false;
        }

        setIsRedeeming(true);
        setError(null);

        try {
            await runTransaction(db, async (transaction) => {
                // 1. Get latest user data to ensure sufficient points
                const userRef = doc(db, 'users', currentUser.uid);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) throw new Error("User not found");

                const currentPoints = userDoc.data().loyaltyPoints || 0;

                if (currentPoints < reward.points) {
                    throw new Error("點數不足");
                }

                // 2. If reward is linked to a coupon, fetch coupon template
                let couponData: Coupon | null = null;
                if (reward.redemptionType === 'coupon' && reward.linkedCouponId) {
                    const couponRef = doc(db, 'coupons', reward.linkedCouponId);
                    const couponDoc = await transaction.get(couponRef);
                    if (couponDoc.exists()) {
                        couponData = { id: couponDoc.id, ...couponDoc.data() } as Coupon;
                    }
                }

                // 2b. If reward is linked to a gift card, fetch gift card template
                let giftCardData: GiftCard | null = null;
                if (reward.redemptionType === 'giftcard' && reward.linkedGiftCardId) {
                    const giftCardRef = doc(db, 'gift_cards', reward.linkedGiftCardId);
                    const giftCardDoc = await transaction.get(giftCardRef);
                    if (giftCardDoc.exists()) {
                        giftCardData = { id: giftCardDoc.id, ...giftCardDoc.data() } as GiftCard;
                    }
                }

                // 3. Deduct Points
                transaction.update(userRef, {
                    loyaltyPoints: currentPoints - reward.points
                });

                // 4. Create Point Transaction Record
                const pointTxRef = doc(collection(db, 'point_transactions'));
                transaction.set(pointTxRef, {
                    userId: currentUser.uid,
                    points: -reward.points,
                    type: 'redemption',
                    description: `兌換: ${reward.title}`,
                    createdAt: Timestamp.now()
                });

                // 5. Issue Coupon if applicable
                if (couponData) {
                    const userCouponRef = doc(collection(db, 'user_coupons'));

                    // Create unique code: TemplateCode-RandomSuffix (e.g. VIP2024-X9Y2)
                    const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
                    const userCouponCode = `${couponData.code}-${uniqueSuffix}`;

                    // Set validity to 90 days from now
                    const validUntil = new Date();
                    validUntil.setDate(validUntil.getDate() + 90);

                    transaction.set(userCouponRef, {
                        userId: currentUser.uid,
                        couponId: couponData.id,
                        code: userCouponCode,
                        title: couponData.title,
                        status: 'active',
                        createdAt: Timestamp.now(),
                        validFrom: Timestamp.now(),
                        validUntil: Timestamp.fromDate(validUntil),
                        value: couponData.value,
                        type: couponData.type,
                        minSpend: couponData.minSpend || 0,
                        scopeType: couponData.scopeType || 'all',
                        scopeIds: couponData.scopeIds || [],
                        details: couponData.details || '',
                        redemptionSource: reward.title
                    });
                }

                // 6. Issue Gift Card if applicable
                if (giftCardData) {
                    const userGiftCardRef = doc(collection(db, 'user_giftcards'));
                    transaction.set(userGiftCardRef, {
                        userId: currentUser.uid,
                        giftCardId: giftCardData.id,
                        name: giftCardData.name,
                        description: giftCardData.description || '',
                        imageUrl: giftCardData.imageUrl || null,
                        status: 'active',
                        createdAt: Timestamp.now(),
                        redemptionSource: reward.title
                    });
                }
            });

            setIsRedeeming(false);
            return true;
        } catch (err: any) {
            console.error("Redemption failed:", err);
            setError(err.message || "兌換失敗");
            setIsRedeeming(false);
            return false;
        }
    };

    return { redeemReward, isRedeeming, error };
};

