import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BusinessHours } from '../types/businessHours';

/**
 * Custom hook to fetch a summary of business hours, specifically which days are marked as closed.
 * @returns An object containing an array of closed dates, a loading state, and an error state.
 */
export const useBusinessHoursSummary = () => {
  const [closedDays, setClosedDays] = useState<Date[]>([]);
  const [customSettingDays, setCustomSettingDays] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hoursCollection = collection(db, 'businessHours');
    const q = query(hoursCollection);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const closed: Date[] = [];
        const custom: Date[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as BusinessHours;
          // Any document in businessHours is considered a custom setting
          custom.push(new Date(doc.id + 'T00:00:00')); // Add T00:00:00 to avoid timezone issues
          if (data.isClosed) {
            closed.push(new Date(doc.id + 'T00:00:00'));
          }
        });
        setClosedDays(closed);
        setCustomSettingDays(custom);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching business hours summary:", err);
        setError("無法載入營業時間摘要。");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { closedDays, customSettingDays, loading, error };
};