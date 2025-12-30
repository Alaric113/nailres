import { useState, useEffect } from 'react';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    doc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import type { SeasonPassOrder, OrderStatus } from '../types/order';

export const useSeasonPassOrder = () => {
    const { userProfile, currentUser } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Create a new order
    const createOrder = async (
        passId: string,
        passName: string,
        variantName: string,
        price: number,
        note: string = ''
    ) => {
        if (!currentUser) throw new Error('User not logged in');

        setLoading(true);
        setError(null);

        try {
            const orderData: Omit<SeasonPassOrder, 'id'> = {
                userId: currentUser.uid,
                userEmail: currentUser.email || userProfile?.email || '',
                userName: userProfile?.profile?.displayName || currentUser.displayName || 'Unknown User',
                passId,
                passName,
                variantName,
                price,
                status: 'pending_payment',
                paymentMethod: 'transfer',
                paymentNote: note,
                createdAt: serverTimestamp() as any, // Firestore timestamp
                updatedAt: serverTimestamp() as any,
            };

            const docRef = await addDoc(collection(db, 'orders'), orderData);
            return docRef.id;
        } catch (err: any) {
            console.error('Error creating order:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Admin: Update order status
    const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
        setLoading(true);
        try {
            await updateDoc(doc(db, 'orders', orderId), {
                status,
                updatedAt: serverTimestamp(),
                ...(status === 'completed' ? { completedAt: serverTimestamp() } : {})
            });
        } catch (err: any) {
            console.error('Error updating order:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createOrder,
        updateOrderStatus,
        loading,
        error
    };
};

// Hook to fetch orders for current user
export const useUserOrders = () => {
    const { currentUser } = useAuthStore();
    const [orders, setOrders] = useState<SeasonPassOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setOrders([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'orders'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SeasonPassOrder[];
            setOrders(fetchedOrders);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser?.uid]);

    return { orders, loading };
};

// Hook to fetch ALL orders (for Admin)
export const useAllOrders = () => {
    const [orders, setOrders] = useState<SeasonPassOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Admin check should technically be here or in component, 
        // but for now we assume this is used in protected admin pages.

        const q = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SeasonPassOrder[];
            setOrders(fetchedOrders);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { orders, loading };
};
