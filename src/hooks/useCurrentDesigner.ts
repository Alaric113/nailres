import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import type { Designer } from '../types/designer';

export const useCurrentDesigner = () => {
    const { currentUser, userProfile } = useAuthStore();
    const [designer, setDesigner] = useState<Designer | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDesigner = async () => {
            if (!currentUser || userProfile?.role !== 'designer') {
                setDesigner(null);
                setLoading(false);
                return;
            }

            try {
                // Find designer profile linked to this user ID
                const q = query(collection(db, 'designers'), where('linkedUserId', '==', currentUser.uid));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const doc = snapshot.docs[0];
                    setDesigner({ id: doc.id, ...doc.data() } as Designer);
                } else {
                    setDesigner(null);
                }
            } catch (error) {
                console.error("Error fetching current designer:", error);
                setDesigner(null);
            } finally {
                setLoading(false);
            }
        };

        fetchDesigner();
    }, [currentUser, userProfile]);

    return { designer, loading };
};
