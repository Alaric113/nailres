import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Coupon } from '../types/coupon';

export const useCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const couponsData: Coupon[] = [];
        querySnapshot.forEach((doc) => {
          couponsData.push({ id: doc.id, ...doc.data() } as Coupon);
        });
        setCoupons(couponsData);
        setIsLoading(false);
      }, 
      (err) => {
        console.error("Error fetching coupons:", err);
        setError('讀取優惠券資料失敗。');
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { coupons, isLoading, error };
};