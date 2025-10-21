import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BookingDocument, EnrichedBooking } from '../types/booking';
import type { UserDocument } from '../types/user';
import type { Service } from '../types/service';

/**
 * Custom hook to fetch all bookings from the 'bookings' collection in real-time.
 * It also fetches related user and service data to enrich the booking information.
 * @returns An object containing the list of bookings, a loading state, and an error state.
 */
export const useAllBookings = () => {
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const bookingsCollection = collection(db, 'bookings');
    const q = query(bookingsCollection, orderBy('dateTime', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setLoading(true);
      try {
        // Pre-fetch all users and services to create a lookup map for this snapshot
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersMap = new Map<string, UserDocument>();
        usersSnapshot.forEach(doc => {
          usersMap.set(doc.id, doc.data() as UserDocument);
        });

        const servicesSnapshot = await getDocs(collection(db, 'services'));
        const servicesMap = new Map<string, Service>();
        servicesSnapshot.forEach(doc => {
          servicesMap.set(doc.id, { id: doc.id, ...doc.data() } as Service);
        });

        const bookingsData = snapshot.docs.map((doc): EnrichedBooking => {
          const booking = doc.data() as BookingDocument;
          const user = usersMap.get(booking.userId);
          const service = servicesMap.get(booking.serviceId);

          return {
            id: doc.id,
            ...booking,
            userName: user?.profile.displayName || '未知用戶',
            serviceName: service?.name || '未知服務',
            serviceDuration: service?.duration || 60,
          };
        });

        setBookings(bookingsData);
      } catch (err) {
        console.error("Error enriching bookings data: ", err);
        setError(err instanceof Error ? err : new Error('Failed to enrich booking data'));
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error("Error fetching bookings: ", err);
      setError(err);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { bookings, loading, error };
};