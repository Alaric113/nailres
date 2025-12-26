import { useState } from 'react';
import {
    collection,
    query,
    where,
    getDocs,
    runTransaction,
    doc,
    Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import type { Coupon } from '../types/coupon';

export const useCouponClaim = () => {
    const { currentUser } = useAuthStore();
    const [isClaiming, setIsClaiming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const claimCoupon = async (code: string) => {
        if (!currentUser?.uid) {
            setError("請先登入");
            return false;
        }

        if (!code.trim()) {
            setError("請輸入優惠碼");
            return false;
        }

        setIsClaiming(true);
        setError(null);

        try {
            // 1. Find Coupon by Code
            const couponsRef = collection(db, 'coupons');
            const q = query(couponsRef, where('code', '==', code.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error("無效的優惠碼");
            }

            const templateDoc = querySnapshot.docs[0];
            const templateId = templateDoc.id;
            const templateData = templateDoc.data() as Coupon;

            // 2. Check isClaimable
            if (templateData.isClaimable === false) {
                throw new Error("此優惠券無法通過代碼領取");
            }

            // 3. Check User Usage Limit
            // Note: This check is outside transaction for query simplicity. 
            // In high concurrency, a user might claim twice, but low risk for this app.
            const userLimit = templateData.userLimit ?? 1;
            const userCouponsQuery = query(
                collection(db, 'user_coupons'),
                where('userId', '==', currentUser.uid),
                where('couponId', '==', templateId)
            );
            const userClaimsSnapshot = await getDocs(userCouponsQuery);

            if (userClaimsSnapshot.size >= userLimit) {
                throw new Error(`每人限領 ${userLimit} 次`);
            }

            await runTransaction(db, async (transaction) => {
                const couponRef = doc(db, 'coupons', templateId);
                const couponDoc = await transaction.get(couponRef);

                if (!couponDoc.exists()) throw new Error("優惠券不存在");

                const data = couponDoc.data() as Coupon;

                // Check Validity
                if (!data.isActive) throw new Error("此優惠券已失效");

                const now = Timestamp.now();
                if (data.validUntil.seconds < now.seconds) throw new Error("此優惠券已過期");
                if (data.validFrom.seconds > now.seconds) throw new Error("此優惠券尚未開始");

                if (data.usageLimit !== -1 && data.usageCount >= data.usageLimit) {
                    throw new Error("此優惠券已達兌換上限");
                }

                // CREATE user_coupon
                const newRef = doc(collection(db, 'user_coupons'));
                const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

                transaction.set(newRef, {
                    userId: currentUser.uid,
                    couponId: templateId,
                    code: `${data.code}-${uniqueSuffix}`,
                    title: data.title,
                    status: 'active',
                    createdAt: now,
                    updatedAt: now,
                    // Inherit schema
                    validFrom: data.validFrom,
                    validUntil: data.validUntil,
                    value: data.value,
                    type: data.type,
                    minSpend: data.minSpend || 0,
                    scopeType: data.scopeType || 'all',
                    scopeIds: data.scopeIds || [],
                    details: data.details || '',
                    redemptionSource: 'code_claim'
                });

                // Increment Usage Count
                transaction.update(couponRef, {
                    usageCount: (data.usageCount || 0) + 1
                });
            });

            setIsClaiming(false);
            return true;
        } catch (err: any) {
            console.error("Claim failed:", err);
            setError(err.message || "領取失敗");
            setIsClaiming(false);
            return false;
        }
    };

    return { claimCoupon, isClaiming, error };
};
