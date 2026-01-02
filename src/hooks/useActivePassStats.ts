import { useState, useEffect } from 'react';
import { collection, getDocs, query, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ActivePass } from '../types/user';

export interface PassStats {
    [passName: string]: number;
}

export const useActivePassStats = () => {
    const [stats, setStats] = useState<PassStats>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch all users
                // Note: As user base grows, this should be optimized 
                // (e.g., dedicated stats document updated via Cloud Functions)
                const q = query(collection(db, 'users'));
                const snapshot = await getDocs(q);

                const counts: PassStats = {};
                const now = new Date();

                snapshot.docs.forEach(doc => {
                    const userData = doc.data();
                    const activePasses = userData.activePasses as ActivePass[] | undefined;

                    if (activePasses && Array.isArray(activePasses)) {
                        activePasses.forEach(pass => {
                            // Check expiry
                            const expiryDate = pass.expiryDate instanceof Timestamp
                                ? pass.expiryDate.toDate()
                                : new Date(pass.expiryDate); // Handle potential non-timestamp legacy data

                            if (expiryDate > now) {
                                const name = pass.passName || 'Unknown Pass';
                                counts[name] = (counts[name] || 0) + 1;
                            }
                        });
                    }
                });

                setStats(counts);
            } catch (err) {
                console.error("Error fetching active pass stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return { stats, loading };
};
