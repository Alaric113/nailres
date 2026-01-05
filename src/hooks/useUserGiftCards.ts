import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import type { UserGiftCard } from '../types/giftcard';

export const useUserGiftCards = () => {
  const { currentUser } = useAuthStore();
  const [userGiftCards, setUserGiftCards] = useState<UserGiftCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setUserGiftCards([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const q = query(
      collection(db, 'user_giftcards'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const giftCards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserGiftCard[];

      // Sort by createdAt desc
      giftCards.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setUserGiftCards(giftCards);
      setIsLoading(false);
      setError(null);
    }, (err) => {
      console.error("Error fetching user gift cards:", err);
      setError("無法載入商品卡");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const redeemGiftCard = async (giftCardId: string) => {
    try {
      const cardRef = doc(db, 'user_giftcards', giftCardId);
      await updateDoc(cardRef, {
        status: 'redeemed',
        redeemedAt: serverTimestamp()
      });
      return true;
    } catch (err) {
      console.error("Error redeeming gift card:", err);
      throw err;
    }
  };

  return { userGiftCards, isLoading, error, redeemGiftCard };
};
