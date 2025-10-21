import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { parse } from 'date-fns';

/**
 * Custom hook to fetch a summary of business hours, specifically which days are marked as closed.
 * @returns An object containing an array of closed dates, a loading state, and an error state.
 */
export const useBusinessHoursSummary = () => {
  const [closedDays, setClosedDays] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const hoursCollection = collection(db, 'businessHours');
    // Query for documents where isClosed is true
    const q = query(hoursCollection, where('isClosed', '==', true));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const dates = snapshot.docs.map((doc) => {
          // The doc.id is in 'yyyy-MM-dd' format, parse it into a Date object.
          return parse(doc.id, 'yyyy-MM-dd', new Date());
        });
        setClosedDays(dates);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching business hours summary:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { closedDays, loading, error };
};