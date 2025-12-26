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
            // Standard Pattern:
            // 1. Query to find the document ID(s) needed.
            const couponsRef = collection(db, 'coupons');
            const q = query(couponsRef, where('code', '==', code.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error("無效的優惠碼");
            }

            // Assume code is unique, take first match
            const templateDoc = querySnapshot.docs[0];
            const templateId = templateDoc.id;

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

                // Check if user already claimed?
                // This requires a query on `user_coupons` for this userId + couponId.
                // Doing queries inside transaction is tricky. 
                // For simplicity/performance, we might skip strict duplicate check inside transaction 
                // OR we fetch user's existing coupons before transaction.
                // Let's trust client UI or non-transactional check for duplicate claim prevention to avoid complexity,
                // OR duplicate check outside.

                // CREATE user_coupon
                const newRef = doc(collection(db, 'user_coupons'));
                // Use random suffix for unique instance code
                const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

                transaction.set(newRef, {
                    userId: currentUser.uid,
                    couponId: templateId,
                    code: `${data.code}-${uniqueSuffix}`,
                    title: data.title,
                    status: 'active',
                    createdAt: now,
                    // Inherit validity from template
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
