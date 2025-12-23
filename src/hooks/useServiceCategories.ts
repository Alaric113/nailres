import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ServiceCategory {
  id: string;
  name: string;
  order?: number; // Added order field
}

export const useServiceCategories = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const categoriesCollection = collection(db, 'serviceCategories');
    // Sort by order first, then name
    const q = query(categoriesCollection, orderBy('order', 'asc'), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCategories: ServiceCategory[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as ServiceCategory));
      setCategories(fetchedCategories);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching service categories:", err);
      setError('讀取分類失敗');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { categories, isLoading, error };
};
