import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Service } from '../types/service';

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const servicesCollection = collection(db, 'services');
    // Order by 'order' asc first, then 'createdAt' desc
    const q = query(servicesCollection, orderBy('order', 'asc'), orderBy('createdAt', 'desc'));

    // onSnapshot sets up a real-time listener.
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const servicesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Service));
        setServices(servicesData);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching services: ", err);
        setError('Failed to load services. Please try again later.');
        setIsLoading(false);
      }
    );

    // Cleanup the listener when the component unmounts.
    return () => unsubscribe();
  }, []);

  return { services, isLoading, error };
};