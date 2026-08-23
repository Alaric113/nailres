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
  customerName?: string;
  customerPhone?: string;
  designerName?: string;
  userAvatarUrl?: string;
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

        // --- Conflict Detection Logic (Per Designer) ---
        // Overlapping bookings are only conflicting if they belong to the SAME designer
        const bookingsByDesigner: Record<string, { id: string; start: Date; end: Date }[]> = {};

        rawBookings
          .filter(b => b.status !== 'cancelled')
          .forEach(b => {
            const designerKey = b.designerId || 'unassigned';
            if (!bookingsByDesigner[designerKey]) {
              bookingsByDesigner[designerKey] = [];
            }
            bookingsByDesigner[designerKey].push({
              id: b.id,
              start: (b.dateTime as Timestamp).toDate(),
              end: addMinutes((b.dateTime as Timestamp).toDate(), b.duration || 60),
            });
          });

        const conflictingIds = new Set<string>();

        Object.values(bookingsByDesigner).forEach(designerBookings => {
          designerBookings.sort((a, b) => a.start.getTime() - b.start.getTime());
          for (let i = 0; i < designerBookings.length - 1; i++) {
            const current = designerBookings[i];
            const next = designerBookings[i + 1];
            // If the next booking starts before the current one ends for the same designer
            if (next.start < current.end) {
              conflictingIds.add(current.id);
              conflictingIds.add(next.id);
            }
          }
        });

        // Batch-fetch unique users
        const uniqueUserIds = [...new Set(rawBookings.map(b => b.userId).filter((id): id is string => !!id))];
        const userEntries = await Promise.all(
          uniqueUserIds.map(async (uid) => {
            const userDocRef = doc(db, 'users', uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data() as UserDocument;
              return [uid, {
                displayName: userData.profile?.displayName || '未知使用者',
                avatarUrl: userData.profile?.avatarUrl || '',
                phone: (userData.profile as any)?.phone || ''
              }] as const;
            }
            return [uid, { displayName: '使用者已刪除', avatarUrl: '', phone: '' }] as const;
          })
        );
        const userMap = new Map<string, { displayName: string; avatarUrl: string; phone: string }>(userEntries);

        // Batch-fetch unique designers
        const uniqueDesignerIds = [...new Set(rawBookings.map(b => b.designerId).filter((id): id is string => !!id))];
        const designerEntries = await Promise.all(
          uniqueDesignerIds.map(async (did) => {
            const dDocRef = doc(db, 'designers', did);
            const dDocSnap = await getDoc(dDocRef);
            if (dDocSnap.exists()) {
              return [did, dDocSnap.data()?.name || '指定設計師'] as const;
            }
            return [did, '設計師'] as const;
          })
        );
        const designerMap = new Map<string, string>(designerEntries);

        const enrichedBookings = rawBookings.map((booking) => {
          let userName: string = '未知使用者';
          let userAvatarUrl: string = '';
          let customerPhone: string = '';
          if (booking.userId && userMap.has(booking.userId)) {
            const user = userMap.get(booking.userId)!;
            userName = user.displayName;
            userAvatarUrl = user.avatarUrl;
            customerPhone = user.phone;
          } else if (booking.userId && !userMap.has(booking.userId)) {
            userName = '無使用者ID';
          }

          const designerName = booking.designerId && designerMap.has(booking.designerId)
            ? designerMap.get(booking.designerId)
            : '不指定設計師';

          return {
            ...booking,
            userName,
            customerName: userName,
            customerPhone,
            designerName,
            userAvatarUrl,
            serviceName: booking.serviceNames?.join('、') || '',
            serviceDuration: booking.duration,
            isConflicting: conflictingIds.has(booking.id),
            dateTime: (booking.dateTime as Timestamp).toDate(),
            createdAt: (booking.createdAt as Timestamp).toDate(),
          };
        });
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