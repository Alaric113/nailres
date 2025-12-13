import type { Timestamp } from 'firebase/firestore';

export type BookingStatus = 'pending_payment' | 'pending_confirmation' | 'confirmed' | 'completed' | 'cancelled';

// This represents the data stored in the /bookings/{bookingId} document
export interface BookingDocument {
  userId: string;
  designerId?: string; // ID of the assigned designer
  serviceIds: string[];
  serviceNames: string[];
  dateTime: Timestamp;
  status: BookingStatus;
  amount: number;
  createdAt: Timestamp;
  notes?: string; // Optional notes from the customer
  duration: number;
}