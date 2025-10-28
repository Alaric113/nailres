import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import type { Coupon } from '../types/coupon';

export const useUserCoupons = () => {
  const [userCoupons, setUserCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuthStore();

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const fetchUserCoupons = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Get user's coupon references
        const userCouponsRef = collection(db, 'users', currentUser.uid, 'userCoupons');
        const userCouponsQuery = query(userCouponsRef, where('isUsed', '==', false));
        const userCouponsSnap = await getDocs(userCouponsQuery);
        const couponIds = userCouponsSnap.docs.map(doc => doc.data().couponId as string);

        if (couponIds.length === 0) {
          setUserCoupons([]);
          setIsLoading(false);
          return;
        }

        // 2. Fetch full coupon details for valid coupons
        const couponPromises = couponIds.map(id => getDoc(doc(db, 'coupons', id)));
        const couponDocs = await Promise.all(couponPromises);

        const now = Timestamp.now();
        const validCoupons = couponDocs
          .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Coupon))
          .filter(coupon => 
            coupon.isActive &&
            coupon.validFrom.seconds <= now.seconds &&
            coupon.validUntil.seconds >= now.seconds &&
            // Add check for usage limit
            (coupon.usageLimit === -1 || coupon.usageCount < coupon.usageLimit)
          );

        setUserCoupons(validCoupons);
      } catch (err) {
        console.error("Error fetching user coupons:", err);
        setError('讀取您的優惠券失敗。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserCoupons();
  }, [currentUser]);

  return { userCoupons, isLoading, error };
};