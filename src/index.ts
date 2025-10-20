import { Timestamp } from 'firebase/firestore';

/**
 * Represents the user profile data stored in Firestore.
 */
export interface UserProfile {
  email: string;
  role: 'admin' | 'user';
  createdAt: Timestamp;
}

/**
 * Represents a booking document in Firestore.
 */
export interface Booking {
  id: string; // Document ID from Firestore
  userId: string;
  serviceId: string;
  dateTime: Timestamp;
  status: 'confirmed' | 'completed' | 'cancelled';
  // Add other fields as needed from your Firestore structure
}