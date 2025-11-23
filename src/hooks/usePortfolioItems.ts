import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { PortfolioItem } from '../types/portfolio';

const usePortfolioItems = () => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'portfolioItems'), orderBy('order', 'asc'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const items: PortfolioItem[] = querySnapshot.docs.map((doc) => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            title: data.title,
            description: data.description,
            category: data.category,
            imageUrls: data.imageUrls || [],
            order: data.order || 0,
            isActive: data.isActive ?? true, // Default to true if not set
            createdAt: data.createdAt,
            updatedAt: data.updatedAt || null,
          };
        });
        setPortfolioItems(items);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching portfolio items:", err);
        setError("無法載入作品集項目。");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { portfolioItems, loading, error };
};

export default usePortfolioItems;