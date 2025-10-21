import type { Timestamp } from 'firebase/firestore';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

// This represents the data stored in the /bookings/{bookingId} document
export interface BookingDocument {
  userId: string;
  serviceId: string;
  dateTime: Timestamp;
  status: BookingStatus;
  amount: number;
  paymentStatus: PaymentStatus;
  createdAt: Timestamp;
  notes?: string; // Optional notes from the customer
}

/**
 * Represents a booking document enriched with related user and service names.
 * This is primarily for display purposes in the admin dashboard.
 */
export interface EnrichedBooking extends BookingDocument {
  id: string;
  userName: string;
  serviceName: string;
  serviceDuration: number;
}