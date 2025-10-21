import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BusinessHours } from '../types/businessHours';
import type { BookingDocument } from '../types/booking';
import type { Service } from '../types/service';

export const useAvailableSlots = (selectedDate: string, serviceDuration: number | null) => {
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDate || !serviceDuration) {
      setAvailableSlots([]);
      return;
    }

    const fetchAndCalculateSlots = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // --- 1. Fetch Business Hours for the selected date ---
        const businessHoursRef = doc(db, 'businessHours', selectedDate);
        const businessHoursSnap = await getDoc(businessHoursRef);

        let openingHour = 10; // Default opening hour
        let closingHour = 19; // Default closing hour
        let isDayOff = false;

        if (businessHoursSnap.exists()) {
          const data = businessHoursSnap.data() as BusinessHours;
          if (data.isClosed) {
            isDayOff = true;
          } else {
            openingHour = parseInt(data.openingTime.split(':')[0], 10);
            closingHour = parseInt(data.closingTime.split(':')[0], 10);
          }
        }

        if (isDayOff) {
          setAvailableSlots([]);
          setIsLoading(false);
          return;
        }
        const slotInterval = 15; // Check for a new slot every 15 minutes

        // --- 2. Fetch Existing Bookings for the Selected Date ---
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const bookingsRef = collection(db, 'bookings');
        const q = query(
          bookingsRef,
          where('dateTime', '>=', Timestamp.fromDate(startOfDay)),
          where('dateTime', '<=', Timestamp.fromDate(endOfDay))
        );
        const querySnapshot = await getDocs(q);
        const bookingsData = querySnapshot.docs.map(doc => doc.data() as BookingDocument);

        // --- Pre-fetch all services to get their durations efficiently ---
        const servicesSnapshot = await getDocs(collection(db, 'services'));
        const servicesMap = new Map<string, Service>();
        servicesSnapshot.forEach(doc => {
          servicesMap.set(doc.id, { id: doc.id, ...doc.data() } as Service);
        });



        // --- 3. Generate All Potential Slots for the Day ---
        const potentialSlots: Date[] = [];
        const day = new Date(selectedDate);
        for (let hour = openingHour; hour < closingHour; hour++) {
          for (let minute = 0; minute < 60; minute += slotInterval) {
            const slot = new Date(day);
            slot.setHours(hour, minute, 0, 0);
            potentialSlots.push(slot);
          }
        }

        // --- 4. Filter Out Unavailable Slots ---
        const slots = potentialSlots.filter(slot => {
          const slotStart = slot.getTime();
          const slotEnd = slotStart + serviceDuration * 60 * 1000;

          // Check if slot ends after closing time
          const closingTime = new Date(day);
          closingTime.setHours(closingHour, 0, 0, 0);
          if (slotEnd > closingTime.getTime()) {
            return false;
          }

          // Check for conflicts with existing bookings
          return !bookingsData.some(booking => {
            const bookingStart = booking.dateTime.toDate().getTime();
            const bookedService = servicesMap.get(booking.serviceId);
            const bookedServiceDuration = bookedService?.duration || 60; // Default to 60 mins if service not found
            const bookingEnd = bookingStart + bookedServiceDuration * 60 * 1000;

            // Conflict if the new slot overlaps with an existing booking
            // A new slot [slotStart, slotEnd] overlaps with an existing booking [bookingStart, bookingEnd] if:
            // slotStart is before bookingEnd AND slotEnd is after bookingStart.
            return slotStart < bookingEnd && slotEnd > bookingStart;
          });
        });

        setAvailableSlots(slots);
      } catch (err) {
        console.error("Error calculating slots: ", err);
        setError('Could not load available times. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndCalculateSlots();
  }, [selectedDate, serviceDuration]);

  return { availableSlots, isLoading, error };
};