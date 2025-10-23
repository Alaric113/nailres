import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserDocument } from '../types/user';
import type { BookingDocument } from '../types/booking'; // Ensure BookingDocument is imported

// 擴充 Booking 介面，包含從其他集合獲取的資料
// Omit the original Timestamp fields and redefine them as Date
export interface EnrichedBooking extends Omit<BookingDocument, 'dateTime' | 'createdAt'> {
  dateTime: Date;
  createdAt: Date;
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
          let userName: string = '未知使用者'; // Default value

          // Fetch user data
          if (booking.userId) {
            const userDocRef = doc(db, 'users', booking.userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data() as UserDocument; // Cast to UserDocument
              userName = userData.profile?.displayName || '未知使用者';
            } else {
              userName = '使用者已刪除';
            }
          } else {
            userName = '無使用者ID';
          }
          
          return {
            ...booking,
            userName,
            // serviceName and serviceDuration are now directly available from BookingDocument
            // We join serviceNames for display and use the total duration
            serviceName: booking.serviceNames.join('、'),
            serviceDuration: booking.duration,
            dateTime: (booking.dateTime as Timestamp).toDate(), // Convert Timestamp to Date
            createdAt: (booking.createdAt as Timestamp).toDate(), // Convert Timestamp to Date
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