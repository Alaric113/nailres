import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc, Timestamp, where } from 'firebase/firestore';
import { addMinutes } from 'date-fns';
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
  isConflicting?: boolean;
  designerId?: string;
}

/**
 * Custom hook to fetch all bookings from Firestore,
 * enriching them with user and service details.
 */
export const useAllBookings = (dateRange: { start: Date; end: Date } | null, designerId?: string | null) => {
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const bookingsRef = collection(db, 'bookings');

    let constraints: any[] = [orderBy('dateTime', 'desc')];

    if (dateRange) {
      constraints.push(where('dateTime', '>=', Timestamp.fromDate(dateRange.start)));
      constraints.push(where('dateTime', '<=', Timestamp.fromDate(dateRange.end)));
    }

    if (designerId) {
      constraints.push(where('designerId', '==', designerId));
    }

    const q = query(bookingsRef, ...constraints);

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setError(null);
      try {
        const rawBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (BookingDocument & { id: string })[];

        // --- Conflict Detection Logic ---
        const bookingsWithDates = rawBookings
          .filter(b => b.status !== 'cancelled') // Ignore cancelled bookings for conflict detection
          .map(b => ({
            id: b.id,
            start: (b.dateTime as Timestamp).toDate(),
            end: addMinutes((b.dateTime as Timestamp).toDate(), b.duration),
          }))
          .sort((a, b) => a.start.getTime() - b.start.getTime());

        const conflictingIds = new Set<string>();
        for (let i = 0; i < bookingsWithDates.length - 1; i++) {
          const current = bookingsWithDates[i];
          const next = bookingsWithDates[i + 1];
          // If the next booking starts before the current one ends, it's a conflict
          if (next.start < current.end) {
            conflictingIds.add(current.id);
            conflictingIds.add(next.id);
          }
        }

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
            isConflicting: conflictingIds.has(booking.id),
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
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [dateRange, designerId]);

  return { bookings, loading, error };
};