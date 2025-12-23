import type { Timestamp } from 'firebase/firestore';

export type BookingStatus = 'pending_payment' | 'pending_confirmation' | 'confirmed' | 'completed' | 'cancelled';

export interface BookingItem {
  serviceId: string;
  serviceName: string;
  price: number;
  duration: number;
  options?: Record<string, { name: string; price: number; duration: number }[]>; // optionName -> selected items
}

// This represents the data stored in the /bookings/{bookingId} document
export interface BookingDocument {
  userId: string;
  designerId?: string; // ID of the assigned designer
  serviceIds: string[];
  serviceNames: string[];
  items?: BookingItem[]; // NEW: Detailed items with options
  dateTime: Timestamp;
  status: BookingStatus;
  amount: number;
  createdAt: Timestamp;
  notes?: string; // Optional notes from the customer
  duration: number;
  couponId?: string | null;
  couponName?: string | null;
}