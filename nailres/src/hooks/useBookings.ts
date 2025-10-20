import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuthStore } from '../store/authStore';
import type { Service } from '../types/service';

// Create a new type that combines booking data with service details
export interface BookingWithService extends Omit<BookingDocument, 'dateTime' | 'createdAt'> {
  id: string;
  dateTime: Date;
  createdAt: Date;
  service: Service | null; // Include the full service object
}

import type { BookingDocument } from '../types/booking';

export const useBookings = () => {
  const [bookings, setBookings] = useState<BookingWithService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        // This part can be optimized later by fetching all services once
        const servicesSnapshot = await getDocs(collection(db, 'services'));
        const servicesMap = new Map(servicesSnapshot.docs.map(doc => [doc.id, doc.data() as Service]));

        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, where('userId', '==', user.uid), orderBy('dateTime', 'desc'));
        const querySnapshot = await getDocs(q);

        const bookingsData = querySnapshot.docs.map(doc => {
          const data = doc.data() as BookingDocument;
          return {
            id: doc.id,
            ...data,
            dateTime: (data.dateTime as Timestamp).toDate(),
            createdAt: (data.createdAt as Timestamp).toDate(),
            service: servicesMap.get(data.serviceId) || null,
          };
        });

        setBookings(bookingsData);
      } catch (err) {
        console.error("Error fetching bookings: ", err);
        setError('Failed to load booking history.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  return { bookings, isLoading, error };
};