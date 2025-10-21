import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BookingDocument } from '../types/booking';
import type { UserDocument } from '../types/user';
import type { Service } from '../types/service';

// 擴充 Booking 介面，包含從其他集合獲取的資料
export interface EnrichedBooking extends BookingDocument {
  id: string;
  userName?: string;
  serviceName?: string;
  serviceDuration?: number;
}

/**
 * Custom hook to fetch all bookings from Firestore,
 * enriching them with user and service details.
 */
export const useAllBookings = () => {
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, orderBy('dateTime', 'desc'));

    let isInitialLoad = true;

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setError(null);
      try {
        const rawBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (BookingDocument & { id: string })[];
        
        const enrichedBookingsPromises = rawBookings.map(async (booking) => {
          let userName: string | undefined;
          let serviceName: string | undefined;
          let serviceDuration: number | undefined;

          // Fetch user data
          if (booking.userId) {
            const userDocRef = doc(db, 'users', booking.userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data() as UserDocument;
              // Safeguard: Correctly access displayName from the profile object
              userName = userData.profile?.displayName ?? '未知使用者';
            } else {
              userName = '使用者已刪除';
            }
          } else {
            userName = '無使用者ID';
          }

          // Fetch service data
          if (booking.serviceId) {
            const serviceDocRef = doc(db, 'services', booking.serviceId);
            const serviceDocSnap = await getDoc(serviceDocRef);
            if (serviceDocSnap.exists()) {
              const serviceData = serviceDocSnap.data() as Service;
              // Safeguard: Use optional chaining and nullish coalescing for name and duration
              serviceName = serviceData.name ?? '未知服務';
              serviceDuration = serviceData.duration ?? 60; // Default to 60 minutes if duration is missing
            } else {
              serviceName = '服務已刪除';
              serviceDuration = 60; // Default duration if service not found
            }
          } else {
            serviceName = '無服務ID';
            serviceDuration = 60; // Default duration if no service ID
          }

          return {
            ...booking,
            userName,
            serviceName,
            serviceDuration,
          };
        });

        const enrichedBookings = await Promise.all(enrichedBookingsPromises);
        setBookings(enrichedBookings);
      } catch (err) {
        console.error("Error enriching bookings data:", err);
        setError("無法載入預約資料。");
      } finally {
        if (isInitialLoad) {
          setLoading(false);
          isInitialLoad = false;
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return { bookings, loading, error };
};