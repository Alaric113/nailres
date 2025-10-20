import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import { Booking } from '../types';

/**
 * Custom hook to fetch all bookings from the 'bookings' collection in real-time.
 * @returns An object containing the list of bookings, a loading state, and an error state.
 */
export const useAllBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const bookingsCollection = collection(db, 'bookings');
    const q = query(bookingsCollection, orderBy('dateTime', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const bookingsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Booking));
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
  }, []);

  return { bookings, loading, error };
};