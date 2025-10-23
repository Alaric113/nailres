import type { Timestamp, FieldValue } from 'firebase/firestore';


export interface TimeSlot {
  start: string; // "HH:mm" format
  end: string;   // "HH:mm" format
}
// Represents the business hours settings for a specific day (doc ID: YYYY-MM-DD)
export interface BusinessHours {
  timeSlots: TimeSlot[];
  isClosed: boolean;   // true if it's a day off
  updatedAt?: Timestamp | FieldValue;
}