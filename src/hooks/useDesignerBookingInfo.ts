import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BusinessHours } from '../types/businessHours';
import type { Designer } from '../types/designer';

interface DesignerBookingInfo {
  closedDays: Date[];
  customSettingDays: Date[];
  bookingDeadline: Date | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch a summary of a specific designer's business hours and booking deadline.
 * @param designerId The ID of the designer. If null, returns default/empty state.
 * @returns An object containing closed dates, custom setting dates, booking deadline, loading state, and error state.
 */
export const useDesignerBookingInfo = (designerId: string | null): DesignerBookingInfo => {
  const [closedDays, setClosedDays] = useState<Date[]>([]);
  const [customSettingDays, setCustomSettingDays] = useState<Date[]>([]);
  const [bookingDeadline, setBookingDeadline] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!designerId) {
      setClosedDays([]);
      setCustomSettingDays([]);
      setBookingDeadline(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let unsubscribe: () => void;

    const fetchData = async () => {
      try {
        // Fetch designer's general info for bookingDeadline
        const designerDocRef = doc(db, 'designers', designerId);
        const designerSnap = await getDoc(designerDocRef);
        if (designerSnap.exists()) {
          const data = designerSnap.data() as Designer;
          setBookingDeadline(data.bookingDeadline?.toDate() || null);
        } else {
          setBookingDeadline(null);
        }

        // Listen for designer's daily business hours
        const hoursCollectionRef = collection(db, `designers/${designerId}/businessHours`);
        const q = query(hoursCollectionRef);

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const closed: Date[] = [];
            const custom: Date[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data() as BusinessHours;
              // Assuming doc.id is 'YYYY-MM-DD'
              const date = new Date(doc.id + 'T00:00:00'); 
              custom.push(date);
              if (data.isClosed) {
                closed.push(date);
              }
            });
            setClosedDays(closed);
            setCustomSettingDays(custom);
            setLoading(false);
          },
          (err) => {
            console.error("Error fetching designer business hours summary:", err);
            setError("無法載入設計師營業時間摘要。");
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Error fetching designer data:", err);
        setError("無法載入設計師基本資料。");
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [designerId]);

  return { closedDays, customSettingDays, bookingDeadline, loading, error };
};
