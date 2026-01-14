import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import type { ActiveFollowUp } from '../types/user';

/**
 * Hook to get user's active follow-up service eligibilities
 * Returns only non-expired follow-ups with status 'active'
 */
export const useUserFollowUps = () => {
  const [followUps, setFollowUps] = useState<ActiveFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuthStore();

  useEffect(() => {
    if (!currentUser?.uid) {
      setFollowUps([]);
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', currentUser.uid);
    
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const allFollowUps = (data.activeFollowUps || []) as ActiveFollowUp[];
          const now = new Date();
          
          // Filter: only active and not expired
          const activeFollowUps = allFollowUps.filter(fu => {
            if (fu.status !== 'active') return false;
            const expiryDate = fu.expiresAt.toDate();
            return expiryDate > now;
          });
          
          setFollowUps(activeFollowUps);
        } else {
          setFollowUps([]);
        }
      } catch (err) {
        console.error('Error loading follow-ups:', err);
        setFollowUps([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  return { followUps, loading };
};

/**
 * Calculate follow-up price based on booking date
 */
export const getFollowUpPrice = (
  followUp: ActiveFollowUp,
  bookingDate: Date
): { price: number; tier: { withinDays: number; discountRate: number; label?: string } | null; expired: boolean } => {
  const completedDate = followUp.completedAt.toDate();
  const daysDiff = Math.floor((bookingDate.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));

  // Sort tiers by days
  const sortedTiers = [...followUp.pricingTiers].sort((a, b) => a.withinDays - b.withinDays);

  // Check if expired (beyond max tier days)
  const maxDays = sortedTiers[sortedTiers.length - 1]?.withinDays || 0;
  if (daysDiff > maxDays) {
    return { price: followUp.originalPrice, tier: null, expired: true };
  }

  // Find applicable tier
  for (const tier of sortedTiers) {
    if (daysDiff <= tier.withinDays) {
      return {
        price: Math.round(followUp.originalPrice * tier.discountRate),
        tier,
        expired: false,
      };
    }
  }

  return { price: followUp.originalPrice, tier: null, expired: true };
};

/**
 * Get price range for display (min to max)
 */
export const getFollowUpPriceRange = (
  followUp: ActiveFollowUp
): { minPrice: number; maxPrice: number; minRate: number; maxRate: number } => {
  const sortedTiers = [...followUp.pricingTiers].sort((a, b) => a.discountRate - b.discountRate);
  
  if (sortedTiers.length === 0) {
    return { minPrice: followUp.originalPrice, maxPrice: followUp.originalPrice, minRate: 1, maxRate: 1 };
  }

  const minRate = sortedTiers[0].discountRate;
  const maxRate = sortedTiers[sortedTiers.length - 1].discountRate;
  
  return {
    minPrice: Math.round(followUp.originalPrice * minRate),
    maxPrice: Math.round(followUp.originalPrice * maxRate),
    minRate,
    maxRate,
  };
};
