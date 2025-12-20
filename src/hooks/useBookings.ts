import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import type { BookingDocument } from '../types/booking';
import type { Service } from '../types/service';

// Create a new type that combines booking data with service details
export interface BookingWithService extends Omit<BookingDocument, 'dateTime' | 'createdAt'> {
  id: string;
  dateTime: Date;
  createdAt: Date;
  serviceName: string; // Keep it simple for display
  designerName?: string;
}

export const useBookings = () => {
  const [bookings, setBookings] = useState<BookingWithService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useAuthStore((state) => state.currentUser);

  useEffect(() => {
    if (!currentUser) {
      setBookings([]); // Clear bookings on logout
      setIsLoading(false);
      return;
    }

    // Pre-fetch all services and designers
    const servicesMap = new Map<string, Service>();
    const designersMap = new Map<string, any>(); // Using any or Designer type if imported

    const fetchData = async () => {
      const [servicesSnapshot, designersSnapshot] = await Promise.all([
        getDocs(collection(db, 'services')),
        getDocs(collection(db, 'designers'))
      ]);

      servicesSnapshot.forEach(doc => {
        servicesMap.set(doc.id, { id: doc.id, ...doc.data() } as Service);
      });

      designersSnapshot.forEach(doc => {
        designersMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
    };

    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('userId', '==', currentUser.uid), orderBy('dateTime', 'desc'));

    // Set up the real-time listener
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      // Ensure data is fetched
      if (servicesMap.size === 0) {
        await fetchData();
      }

      const bookingsData = querySnapshot.docs.map(doc => {
        const data = doc.data() as BookingDocument;
        const designer = data.designerId ? designersMap.get(data.designerId) : null;

        return {
          id: doc.id,
          ...data,
          dateTime: (data.dateTime as Timestamp).toDate(),
          createdAt: (data.createdAt as Timestamp).toDate(),
          serviceName: Array.isArray(data.serviceNames)
            ? data.serviceNames.join('、')
            : (data as any).serviceName || '未知服務', // Fallback for old data structure
          designerName: designer ? (designer.name || designer.displayName) : undefined,
        };
      });

      setBookings(bookingsData);
      setIsLoading(false);
    }, (err) => {
      console.error("Error listening to bookings: ", err);
      setError('Failed to load booking history.');
      setIsLoading(false);
    });

    // Cleanup the listener when the component unmounts or the user changes
    return () => unsubscribe();
  }, [currentUser]);

  const cancelBooking = async (bookingId: string) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status: 'cancelled',
    });
    // The onSnapshot listener will automatically update the state.
  };


  return { bookings, isLoading, error, cancelBooking };
};