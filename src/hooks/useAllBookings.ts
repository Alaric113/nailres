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
    let usersMap = new Map<string, UserDocument>();
    let servicesMap = new Map<string, Service>();

    const initialize = async () => {
      try {
        const [usersSnapshot, servicesSnapshot] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'services')),
        ]);
        usersMap = new Map(usersSnapshot.docs.map(doc => [doc.id, doc.data() as UserDocument]));
        servicesMap = new Map(servicesSnapshot.docs.map(doc => [doc.id, doc.data() as Service]));
      } catch (err) {
        console.error("Error fetching related data: ", err);
        setError(err as Error);
        setLoading(false);
        return; // Stop if we can't get the related data
      }

      const bookingsCollection = collection(db, 'bookings');
      const q = query(bookingsCollection, orderBy('dateTime', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setLoading(true);
          const bookingsData = snapshot.docs.map((doc): EnrichedBooking => {
            const bookingData = doc.data() as BookingDocument;
            const user = usersMap.get(bookingData.userId);
            const service = servicesMap.get(bookingData.serviceId);

            return {
              id: doc.id,
              ...bookingData,
              userName: user?.profile?.displayName || '未知用戶',
              serviceName: service?.name || '未知服務',
            };
          });

          setBookings(bookingsData);
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching bookings: ", err);
          setError(err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    };

    const unsubscribePromise = initialize();

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, []);

  return { bookings, loading, error };
};