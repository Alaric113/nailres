import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import type { UserCoupon } from '../types/coupon';

export const useUserCoupons = () => {
  const { currentUser } = useAuthStore();
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setUserCoupons([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Note: Querying a root collection with `where` might require an index if combined with orderBy.
    // For now, we fetch first then sort in memory to avoid blocking development with index creation requirements.
    const q = query(
      collection(db, 'user_coupons'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const coupons = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserCoupon[];

      // Sort in memory: Active first, then by Expiry closest first?
      // Or just by CreatedAt desc?
      // Let's sort by Status (Active -> Used -> Expired) then by ValidUntil?
      // Let's just sort by CreatedAt desc for raw list, filtering handles UI.
      coupons.sort((a, b) => {
        // Sort by createdAt desc
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setUserCoupons(coupons);
      setIsLoading(false);
      setError(null);
    }, (err) => {
      console.error("Error fetching user coupons:", err);
      setError("無法載入優惠券");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return { userCoupons, isLoading, error };
};