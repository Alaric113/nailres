import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Service } from '../types/service';

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesCollection = collection(db, 'services');
        // Query for available services, ordered by category then name
        const q = query(servicesCollection, where('available', '==', true), orderBy('category'), orderBy('name'));
        const querySnapshot = await getDocs(q);

        const servicesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Service));

        setServices(servicesData);
      } catch (err) {
        console.error("Error fetching services: ", err);
        setError('Failed to load services. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  return { services, isLoading, error };
};