import { Timestamp } from 'firebase/firestore';

// Represents a single portfolio item document in Firestore
export interface PortfolioItem {
  id: string; // Document ID
  title: string;
  description: string;
  category: string; // e.g., '美甲', '美睫', '霧眉'
  imageUrls: string[];
  order: number; // For sorting or manual ordering
  isActive: boolean; // To control visibility on the frontend
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
