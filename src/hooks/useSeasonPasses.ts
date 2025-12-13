import { useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy
} from 'firebase/firestore';
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

    return { passes, loading, error, addPass, updatePass, deletePass };
};
