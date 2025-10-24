import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { startOfDay, endOfDay, parse, set, addMinutes } from 'date-fns';
import type { BookingDocument } from '../types/booking';
import type { BusinessHours, TimeSlot } from '../types/businessHours';

const DEFAULT_BUSINESS_HOURS: TimeSlot[] = [{ start: '10:00', end: '19:00' }];

export const useAvailableSlots = (date: string | null, serviceDuration: number | null) => {
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Explicitly check for null or non-positive serviceDuration to help TypeScript's control flow analysis.
    if (!date || serviceDuration === null || serviceDuration <= 0) {
      setAvailableSlots([]);
      setLoading(false);
      return;
    }

    const fetchSlots = async () => {
      setLoading(true);
      setError(null);

      try {
        const selectedDate = parse(date, 'yyyy-MM-dd', new Date());

        // 1. Fetch business hours for the selected date
        const businessHoursRef = doc(db, 'businessHours', date);
        const businessHoursSnap = await getDoc(businessHoursRef);
        let dayTimeSlots: TimeSlot[] = DEFAULT_BUSINESS_HOURS;
        let isClosed = false;

        if (businessHoursSnap.exists()) {
          const data = businessHoursSnap.data() as BusinessHours;
          isClosed = data.isClosed;
          // If time slots are defined and not empty, use them. Otherwise, stick to default.
          if (data.timeSlots && data.timeSlots.length > 0) {
            dayTimeSlots = data.timeSlots;
          }
        }

        if (isClosed) {
          setAvailableSlots([]);
          setLoading(false);
          return;
        }

        // 2. Fetch existing bookings for the selected date
        const startOfSelectedDay = startOfDay(selectedDate);
        const endOfSelectedDay = endOfDay(selectedDate);

        const bookingsQuery = query(
          collection(db, 'bookings'),
          // To completely avoid any composite index requirement, query only by date range.
          // We will filter the status on the client-side.
          where('dateTime', '>=', startOfSelectedDay),
          where('dateTime', '<', endOfSelectedDay)
        );

        const querySnapshot = await getDocs(bookingsQuery);
        const allBookingsForDay = querySnapshot.docs.map(doc => doc.data() as BookingDocument);

        // Filter out cancelled bookings on the client side. This is more robust than complex queries.
        const validStatuses: BookingDocument['status'][] = ['pending_payment', 'pending_confirmation', 'confirmed', 'completed'];
        const existingBookings = allBookingsForDay.filter(booking => validStatuses.includes(booking.status));

        // 3. Generate all possible slots and filter out conflicts
        const slots: Date[] = [];
        const slotInterval = 15; // Generate slots every 15 minutes

        dayTimeSlots.forEach(timeSlot => {
          const [startHour, startMinute] = timeSlot.start.split(':').map(Number);
          const [endHour, endMinute] = timeSlot.end.split(':').map(Number);

          let currentTime = set(selectedDate, { hours: startHour, minutes: startMinute, seconds: 0, milliseconds: 0 });
          const endTime = set(selectedDate, { hours: endHour, minutes: endMinute, seconds: 0, milliseconds: 0 });

          while (addMinutes(currentTime, serviceDuration) <= endTime) {
            const slotStart = currentTime;
            const slotEnd = addMinutes(slotStart, serviceDuration);

            const isOverlapping = existingBookings.some(booking => {
              const bookingStart = (booking.dateTime as any).toDate();
              // Ensure we only check bookings within the selected day
              if (bookingStart >= endOfSelectedDay) {
                return false;
              }

              const bookingEnd = addMinutes(bookingStart, booking.duration);
              // Check for overlap: (StartA < EndB) and (EndA > StartB)
              return slotStart < bookingEnd && slotEnd > bookingStart;
            });

            if (!isOverlapping) {
              slots.push(slotStart);
            }

            currentTime = addMinutes(currentTime, slotInterval);
          }
        });

        setAvailableSlots(slots);
      } catch (err) {
        console.error("Error fetching available slots:", err);
        setError("無法讀取可預約時段，請稍後再試。");
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [date, serviceDuration]);

  return { availableSlots, loading, error };
};