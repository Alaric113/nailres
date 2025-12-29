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
  description?: string; // Markdown or text description
  options?: ServiceOption[];
  supportedDesigners?: string[]; // IDs of designers who can perform this service
  order?: number; // Added order field
}

export interface ServiceOption {
  id: string;
  name: string; // e.g., "加購項目", "卸甲"
  required: boolean;
  multiSelect: boolean;
  items: ServiceOptionItem[];
}

export interface ServiceOptionItem {
  id: string;
  name: string; // e.g., "單色", "造型", "本店卸甲"
  price: number;
  duration?: number; // Extra time in minutes
  allowQuantity?: boolean; // New: Allow selecting quantity for this specific item
  maxQuantity?: number;    // New: Max quantity (default 10)
  quantity?: number; // Selected quantity (for cart/booking state)
}