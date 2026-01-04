import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { GiftCard } from '../types/giftcard';

export const useGiftCards = () => {
    const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'gift_cards'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as GiftCard));
                setGiftCards(data);
                setIsLoading(false);
            },
            (err) => {
                console.error("Error fetching gift cards:", err);
                setError("無法載入商品卡");
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const addGiftCard = async (giftCard: Omit<GiftCard, 'id' | 'createdAt'>) => {
        try {
            await addDoc(collection(db, 'gift_cards'), {
                ...giftCard,
                createdAt: serverTimestamp()
            });
        } catch (err) {
            console.error("Error adding gift card:", err);
            throw err;
        }
    };

    const updateGiftCard = async (id: string, updates: Partial<GiftCard>) => {
        try {
            const docRef = doc(db, 'gift_cards', id);
            await updateDoc(docRef, updates);
        } catch (err) {
            console.error("Error updating gift card:", err);
            throw err;
        }
    };

    const deleteGiftCard = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'gift_cards', id));
        } catch (err) {
            console.error("Error deleting gift card:", err);
            throw err;
        }
    };

    return {
        giftCards,
        isLoading,
        error,
        addGiftCard,
        updateGiftCard,
        deleteGiftCard
    };
};
