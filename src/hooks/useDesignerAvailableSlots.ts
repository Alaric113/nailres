import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore'; // Corrected imports
import { db } from '../lib/firebase';
import type { BusinessHours } from '../types/businessHours';
import { format, parseISO, addMinutes, isAfter } from 'date-fns';

interface AvailableSlots {
  availableSlots: Date[];
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch available time slots for a specific designer on a given date.
 * @param designerId The ID of the designer.
 * @param selectedDate The date in 'yyyy-MM-dd' format.
 * @param serviceDuration The total duration of selected services in minutes.
 * @returns An object containing available time slots (as Date objects), loading state, and error state.
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
        const docRef = doc(db, `designers/${designerId}/businessHours`, selectedDate);
        const actualDocSnap = await getDoc(docRef); 
        
        if (!actualDocSnap.exists()) {
          setAvailableSlots([]);
          return;
        }

        const data = actualDocSnap.data() as BusinessHours;

        if (data.isClosed) {
          setAvailableSlots([]);
          return;
        }

        const slots: Date[] = [];
        const today = new Date();
        const nowTime = format(today, 'HH:mm');

        data.timeSlots.forEach(slot => {
          let currentSlotStart = parseISO(`${selectedDate}T${slot.start}:00`);
          const slotEnd = parseISO(`${selectedDate}T${slot.end}:00`);

          // Ensure slots are not in the past relative to the current time if it's today
          if (format(currentSlotStart, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
            const currentDateTime = parseISO(`${selectedDate}T${nowTime}:00`);
            if (isAfter(currentDateTime, currentSlotStart)) {
              // If current time is after the start of this business slot, adjust currentSlotStart
              // to be the next 30-minute interval after current time, but not before original slot start.
              const minutesPastHour = currentDateTime.getMinutes();
              let adjustedMinutes = Math.ceil(minutesPastHour / 30) * 30;
              if (adjustedMinutes === 60) adjustedMinutes = 0; // if it's 10:30, it should be 10:30. if 10:01, it should be 10:30. if 10:31, it should be 11:00.
              
              const adjustedHour = currentDateTime.getHours() + (adjustedMinutes === 0 && minutesPastHour > 0 ? 1 : 0);
              const nextValidStart = parseISO(`${selectedDate}T${String(adjustedHour).padStart(2, '0')}:${String(adjustedMinutes).padStart(2, '0')}:00`);
              
              // Only update currentSlotStart if the next valid time is within the current business slot
              if (!isAfter(currentSlotStart, nextValidStart)) { // Make sure we don't jump before the original slot start
                 currentSlotStart = nextValidStart;
              }
            }
          }
          
          while (true) {
            const potentialSlotEnd = addMinutes(currentSlotStart, serviceDuration);

            // Check if potential slot ends within the current business hour slot
            if (isAfter(potentialSlotEnd, slotEnd)) {
              break; // This service won't fit
            }
            
            // Add current potential slot
            slots.push(currentSlotStart);

            // Move to the next potential slot start (e.g., 30-minute intervals)
            currentSlotStart = addMinutes(currentSlotStart, 30); // Assuming 30-minute booking increments
          }
        });

        setAvailableSlots(slots);

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