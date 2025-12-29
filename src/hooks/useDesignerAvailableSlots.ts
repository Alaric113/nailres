import { useState, useEffect } from 'react';
import { parseISO, isAfter } from 'date-fns';

interface AvailableSlots {
  availableSlots: Date[];
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch available time slots for a specific designer on a given date.
 * Uses the server-side API /api/get-available-slots to bypass security rules.
 */
export const useDesignerAvailableSlots = (designerId: string | null, selectedDate: string, serviceDuration: number | null): AvailableSlots => {
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!designerId || !selectedDate || serviceDuration === null || serviceDuration <= 0) {
        setAvailableSlots([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setAvailableSlots([]);

      try {
        const queryParams = new URLSearchParams({
          designerId,
          date: selectedDate,
          duration: serviceDuration.toString()
        });

        const response = await fetch(`/api/get-available-slots?${queryParams.toString()}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch slots');
        }

        const data = await response.json();
        const rawSlots: string[] = data.slots || [];

        // Parse IDs and Filter Past Slots (Client-side logic for correct local time)
        const now = new Date();
        const validSlots = rawSlots
          .map(ts => parseISO(ts))
          .filter(dateObj => isAfter(dateObj, now));

        setAvailableSlots(validSlots);

      } catch (err) {
        console.error("Error fetching available slots:", err);
        setError("無法載入可用時段。");
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [designerId, selectedDate, serviceDuration]);

  return { availableSlots, loading, error };
};