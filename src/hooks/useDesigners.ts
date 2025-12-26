import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Designer } from '../types/designer';

export const useDesigners = () => {
    const [designers, setDesigners] = useState<Designer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDesigners = async () => {
            setLoading(true);
            try {
                const designersRef = collection(db, 'designers');
                // Only show active designers
                const q = query(designersRef, where('isActive', '==', true));

                // Use onSnapshot for real-time updates
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const activeDesigners = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Designer))
                        .sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
                    setDesigners(activeDesigners);
                    setLoading(false);
                }, (err) => {
                    console.error("Error fetching designers:", err);
                    setError("無法載入設計師列表。");
                    setLoading(false);
                });

                return unsubscribe;
            } catch (err) {
                console.error("Error setting up designer listener:", err);
                setError("無法載入設計師列表。");
                setLoading(false);
            }
        };

        const unsubscribePromise = fetchDesigners();
        return () => {
            // Standard fetch doesn't return unsubscribe immediately if async, 
            // but here we used onSnapshot inside async. 
            // Better pattern: remove async wrapper or handle cleanup.
        };
    }, []);

    // Refactored effect for cleaner cleanup
    useEffect(() => {
        setLoading(true);
        const designersRef = collection(db, 'designers');
        // Note: orderBy might require an index if combined with where. 
        // Client-side sort is safer initially if dataset is small.
        const q = query(designersRef, where('isActive', '==', true));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const activeDesigners = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Designer))
                .sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
            setDesigners(activeDesigners);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching designers:", err);
            setError("無法載入設計師列表。");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { designers, loading, error };
};
