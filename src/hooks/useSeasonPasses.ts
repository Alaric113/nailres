import { useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    getDoc,
    arrayUnion,
    Timestamp,
    increment,
    serverTimestamp
} from 'firebase/firestore';
import type { ActivePass } from '../types/user';
import { db } from '../lib/firebase';
import type { SeasonPass } from '../types/seasonPass';

export const useSeasonPasses = () => {
    const [passes, setPasses] = useState<SeasonPass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'season_passes'), orderBy('order', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const passList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as SeasonPass));
            setPasses(passList);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching season passes:", err);
            setError("Failed to load season passes");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addPass = async (passData: Omit<SeasonPass, 'id'>) => {
        try {
            await addDoc(collection(db, 'season_passes'), passData);
        } catch (err) {
            console.error("Error adding pass:", err);
            throw err;
        }
    };

    const updatePass = async (id: string, data: Partial<SeasonPass>) => {
        try {
            await updateDoc(doc(db, 'season_passes', id), data);
        } catch (err) {
            console.error("Error updating pass:", err);
            throw err;
        }
    };

    const deletePass = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'season_passes', id));
        } catch (err) {
            console.error("Error deleting pass:", err);
            throw err;
        }
    };

    const activatePass = async (userId: string, passId: string, variantName: string) => {
        try {
            // 1. Get the Pass Definition
            const passDoc = await getDoc(doc(db, 'season_passes', passId));
            if (!passDoc.exists()) throw new Error('Pass not found');
            const passDef = { id: passDoc.id, ...passDoc.data() } as SeasonPass;
            console.log(passDoc);

            // 2. Calculate Expiry
            // Simple parsing: '3個月' -> 3 months, '1年' -> 1 year
            // Fallback to 3 months if parsing fails
            let monthsToAdd = 3;
            if (passDef.duration.includes('個月')) {
                monthsToAdd = parseInt(passDef.duration) || 3;
            } else if (passDef.duration.includes('年')) {
                monthsToAdd = (parseInt(passDef.duration) || 1) * 12;
            }

            const startDate = new Date();
            const expiryDate = new Date();
            expiryDate.setMonth(startDate.getMonth() + monthsToAdd);

            // 3. Initialize Usages
            const remainingUsages: Record<string, number> = {};
            passDef.contentItems.forEach(item => {
                // If it's a benefit (權益), valid status is tracked by existence or maybe -1/1
                // For countable services, setting initial quantity
                if (item.category === '服務' && item.quantity) {
                    console.log(item.id)
                    remainingUsages[item.serviceId] = item.quantity;
                } else if (item.category === '權益') {
                    // -1 indicates "Active Benefit" without countdown
                    remainingUsages[item.id] = -1;
                } else {
                    // Unlimited service?
                    remainingUsages[item.id] = -1;
                }
            });

            // 4. Construct Active Pass Object
            const newActivePass: ActivePass = {
                passId: passDef.id,
                passName: passDef.name,
                variantName: variantName,
                purchaseDate: Timestamp.now(),
                expiryDate: Timestamp.fromDate(expiryDate),
                remainingUsages
            };


            // 5. Calculate Points & Update User
            const variant = passDef.variants.find(v => v.name === variantName);
            const price = variant ? variant.price : 0;
            const pointsEarned = Math.floor(price / 1000);

            const userRef = doc(db, 'users', userId);
            console.log('User Reference:', userRef);

            await updateDoc(userRef, {
                activePasses: arrayUnion(newActivePass),
                loyaltyPoints: increment(pointsEarned)
            });

            // 6. Create Point History Record
            if (pointsEarned > 0) {
                await addDoc(collection(db, 'point_history'), {
                    userId,
                    amount: pointsEarned,
                    type: 'earned',
                    reason: `購買季票: ${passDef.name} ${variantName}`,
                    refId: `sp_${passId}_${Date.now()}`,
                    createdAt: serverTimestamp()
                });
            }

        } catch (err) {
            console.error("Error activating pass:", err);
            throw err;
        }
    };

    return { passes, loading, error, addPass, updatePass, deletePass, activatePass };
};
