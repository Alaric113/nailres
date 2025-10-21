import type { Timestamp, FieldValue } from 'firebase/firestore';

// Represents the business hours settings for a specific day (doc ID: YYYY-MM-DD)
export interface BusinessHours {
  openingTime: string; // "HH:mm" format, e.g., "09:00"
  closingTime: string; // "HH:mm" format, e.g., "18:00"
  isClosed: boolean;   // true if it's a day off
  updatedAt?: Timestamp | FieldValue;
}