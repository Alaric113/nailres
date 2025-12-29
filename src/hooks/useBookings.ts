import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
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

export const useBookings = () => {
  const [bookings, setBookings] = useState<BookingWithService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useAuthStore((state) => state.currentUser);

  useEffect(() => {
    if (!currentUser) {
      setBookings([]); // Clear bookings on logout
      setIsLoading(false);
      return;
    }

    // Pre-fetch all services and designers
    const servicesMap = new Map<string, Service>();
    const designersMap = new Map<string, any>(); // Using any or Designer type if imported

    const fetchData = async () => {
      try {
        const [servicesSnapshot, designersSnapshot] = await Promise.all([
          getDocs(collection(db, 'services')),
          getDocs(collection(db, 'designers'))
        ]);

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

    fetchData();

    // No return cleanup needed for fetch (unless we implement abort controller, but ok for now)
  }, [currentUser]);

  const cancelBooking = async (bookingId: string) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status: 'cancelled',
    });
    // The onSnapshot listener will automatically update the state.
  };


  return { bookings, isLoading, error, cancelBooking };
};