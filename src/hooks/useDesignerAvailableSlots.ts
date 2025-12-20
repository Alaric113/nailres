import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BusinessHours } from '../types/businessHours';
import type { BookingDocument } from '../types/booking';
import { format, parseISO, addMinutes, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

interface AvailableSlots {
  availableSlots: Date[];
  loading: boolean;
  error: string | null;
}

const SLOT_INTERVAL = 15; // Set slot interval to 15 minutes
const BUFFER_TIME = 15;   // Set buffer time to 15 minutes

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
        // 1. Fetch Business Hours
        const docRef = doc(db, `designers/${designerId}/businessHours`, selectedDate);
        const actualDocSnap = await getDoc(docRef);

        if (!actualDocSnap.exists()) {
          setAvailableSlots([]);
          return;
        }

        const businessData = actualDocSnap.data() as BusinessHours;

        if (businessData.isClosed) {
          setAvailableSlots([]);
          return;
        }

        // 2. Fetch Existing Bookings
        const startOfSelectedDay = startOfDay(parseISO(selectedDate));
        const endOfSelectedDay = endOfDay(parseISO(selectedDate));

        const bookingsRef = collection(db, 'bookings');
        const q = query(
          bookingsRef,
          where('designerId', '==', designerId),
          where('dateTime', '>=', Timestamp.fromDate(startOfSelectedDay)),
          where('dateTime', '<=', Timestamp.fromDate(endOfSelectedDay))
        );

        const bookingsSnapshot = await getDocs(q);
        const existingBookings: { start: Date; end: Date }[] = [];

        bookingsSnapshot.forEach(doc => {
          const data = doc.data() as BookingDocument;
          if (data.status !== 'cancelled') {
            const bookingStart = data.dateTime.toDate();
            // Add buffer to the end of the booking
            const bookingEnd = addMinutes(bookingStart, data.duration + BUFFER_TIME);
            existingBookings.push({ start: bookingStart, end: bookingEnd });
          }
        });

        const slots: Date[] = [];
        const today = new Date();
        const nowTime = format(today, 'HH:mm');

        businessData.timeSlots.forEach(slot => {
          let currentSlotStart = parseISO(`${selectedDate}T${slot.start}:00`);
          const slotEnd = parseISO(`${selectedDate}T${slot.end}:00`);

          // Ensure slots are not in the past relative to the current time if it's today
          if (format(currentSlotStart, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
            const currentDateTime = parseISO(`${selectedDate}T${nowTime}:00`);
            if (isAfter(currentDateTime, currentSlotStart)) {
              // Adjust start time to next interval
              const minutesPastHour = currentDateTime.getMinutes();
              let adjustedMinutes = Math.ceil(minutesPastHour / SLOT_INTERVAL) * SLOT_INTERVAL;
              if (adjustedMinutes === 60) adjustedMinutes = 0;

              const adjustedHour = currentDateTime.getHours() + (adjustedMinutes === 0 && minutesPastHour > 0 ? 1 : 0);
              const nextValidStart = parseISO(`${selectedDate}T${String(adjustedHour).padStart(2, '0')}:${String(adjustedMinutes).padStart(2, '0')}:00`);

              if (!isAfter(currentSlotStart, nextValidStart)) {
                currentSlotStart = nextValidStart;
              }
            }
          }

          while (true) {
            const potentialSlotEnd = addMinutes(currentSlotStart, serviceDuration);

            // Check if potential slot ends within the current business hour slot
            if (isAfter(potentialSlotEnd, slotEnd)) {
              break;
            }

            // Check collision with existing bookings
            let isConflict = false;
            for (const booking of existingBookings) {
              // Check if (StartA < EndB) and (EndA > StartB)
              if (isBefore(currentSlotStart, booking.end) && isAfter(potentialSlotEnd, booking.start)) {
                isConflict = true;
                break;
              }
            }

            if (!isConflict) {
              slots.push(currentSlotStart);
            }

            // Move to the next potential slot start
            currentSlotStart = addMinutes(currentSlotStart, SLOT_INTERVAL);
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