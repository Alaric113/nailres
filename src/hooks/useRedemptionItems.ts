import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface RedemptionItem {
    id: string;
    title: string;
    points: number;
    colorTheme: 'orange' | 'blue' | 'green' | 'pink' | 'gray';
    isActive: boolean;
    redemptionType: 'coupon' | 'giftcard';
    linkedCouponId?: string; // Used when redemptionType is 'coupon'
    linkedGiftCardId?: string; // Used when redemptionType is 'giftcard'
    createdAt?: Timestamp;
}

export const useRedemptionItems = () => {
    const [items, setItems] = useState<RedemptionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'redemption_items'), orderBy('points', 'asc')); // Default sort by points

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as RedemptionItem));
                setItems(data);
                setIsLoading(false);
            },
            (err) => {
                console.error("Error fetching redemption items:", err);
                setError("無法載入兌換項目");
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const addItem = async (item: Omit<RedemptionItem, 'id' | 'createdAt'>) => {
        try {
            await addDoc(collection(db, 'redemption_items'), {
                ...item,
                createdAt: serverTimestamp()
            });
        } catch (err) {
            console.error("Error adding redemption item:", err);
            throw err;
        }
    };

    const updateItem = async (id: string, updates: Partial<RedemptionItem>) => {
        try {
            const docRef = doc(db, 'redemption_items', id);
            await updateDoc(docRef, updates);
        } catch (err) {
            console.error("Error updating redemption item:", err);
            throw err;
        }
    };

    const deleteItem = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'redemption_items', id));
        } catch (err) {
            console.error("Error deleting redemption item:", err);
            throw err;
        }
    };

    return {
        items,
        isLoading,
        error,
        addItem,
        updateItem,
        deleteItem
    };
};
