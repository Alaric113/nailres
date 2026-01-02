import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import type { BookingDocument } from '../types/booking';
import type { Service } from '../types/service';

// Create a new type that combines booking data with service details
export interface BookingWithService extends Omit<BookingDocument, 'dateTime' | 'createdAt'> {
  id: string;
  dateTime: Date;
  createdAt: Date;
  serviceName: string; // Keep it simple for display
  designerName?: string;
}

export const useBookings = (userId?: string) => {
  const [bookings, setBookings] = useState<BookingWithService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuthStore();


  const fetchData = async () => {
    // If userId provided, query Firestore directly (Admin View)
    if (userId) {
      setIsLoading(true);
      try {
        // Fetch services/designers first for mapping
        const servicesMap = new Map<string, Service>();
        const designersMap = new Map<string, any>();

        const [servicesSnapshot, designersSnapshot] = await Promise.all([
          getDocs(collection(db, 'services')),
          getDocs(collection(db, 'designers'))
        ]);

        servicesSnapshot.forEach(doc => servicesMap.set(doc.id, { id: doc.id, ...doc.data() } as Service));
        designersSnapshot.forEach(doc => designersMap.set(doc.id, { id: doc.id, ...doc.data() }));

        // Query bookings by userId
        const bookingsQ = query(collection(db, 'bookings'), where('userId', '==', userId), orderBy('dateTime', 'desc'));
        const snapshot = await getDocs(bookingsQ);

        const bookingsData = snapshot.docs.map(doc => {
          const data = doc.data();
          const designer = data.designerId ? designersMap.get(data.designerId) : null;
          return {
            id: doc.id,
            ...data,
            dateTime: data.dateTime?.toDate(),
            createdAt: data.createdAt?.toDate(),
            serviceName: Array.isArray(data.serviceNames)
              ? data.serviceNames.join('、')
              : data.serviceName || '未知服務',
            designerName: designer ? (designer.name || designer.displayName) : undefined,
          } as BookingWithService;
        });
        setBookings(bookingsData);
      } catch (e) {
        console.error(e);
        setError("Failed to load user bookings");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Default: Fetch current user's bookings via API
    if (!currentUser) {
      setBookings([]); // Clear bookings on logout
      setIsLoading(false);
      return;
    }

    try {
      const [servicesSnapshot, designersSnapshot] = await Promise.all([
        getDocs(collection(db, 'services')),
        getDocs(collection(db, 'designers'))
      ]);

      const servicesMap = new Map<string, Service>();
      const designersMap = new Map<string, any>();

      servicesSnapshot.forEach(doc => {
        servicesMap.set(doc.id, { id: doc.id, ...doc.data() } as Service);
      });

      designersSnapshot.forEach(doc => {
        designersMap.set(doc.id, { id: doc.id, ...doc.data() });
      });

      // Use API to fetch bookings (Bypass Firestore Rules)
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/get-my-bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      const rawBookings = data.bookings || [];

      const bookingsData = rawBookings.map((data: any) => {
        const designer = data.designerId ? designersMap.get(data.designerId) : null;
        return {
          ...data,
          // Parse ISO strings back to Date objects
          dateTime: new Date(data.dateTime),
          createdAt: new Date(data.createdAt),
          serviceName: Array.isArray(data.serviceNames)
            ? data.serviceNames.join('、')
            : data.serviceName || '未知服務',
          designerName: designer ? (designer.name || designer.displayName) : undefined,
        };
      });

      setBookings(bookingsData);
      setIsLoading(false);

    } catch (err) {
      console.error("Error loading bookings:", err);
      setError('Failed to load booking history.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, userId]);

  const cancelBooking = async (bookingId: string) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status: 'cancelled',
    });
    // For local update, we might need to refresh or manually update state
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
  };


  return { bookings, isLoading, error, cancelBooking, refetch: fetchData };
};