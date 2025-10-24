import type { Timestamp } from 'firebase/firestore';

// This represents the data stored in the /services/{serviceId} document
export interface Service {
  id: string; // The document ID
  name: string;
  price: number;
  platinumPrice?: number | null;
  duration: number; // Duration in minutes
  category: string;
  available: boolean;
  imageUrl?: string;
  createdAt: Timestamp;
}