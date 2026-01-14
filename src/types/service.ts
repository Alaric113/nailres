// import type { Timestamp } from 'firebase/firestore';

export interface PlatinumDiscount {
  type: 'percentage' | 'fixed';
  value: number;
}

// Follow-up service pricing tier (e.g., 50% off within 2 weeks)
export interface FollowUpPricingTier {
  withinDays: number;    // e.g., 14 (2 weeks)
  discountRate: number;  // e.g., 0.5 (50% of original price)
  label?: string;        // e.g., "2週內"
}

// Follow-up service configuration
export interface FollowUpConfig {
  enabled: boolean;
  name: string;           // e.g., "補睫毛"
  description?: string;   // Optional description
  validDays: number;      // Maximum valid days, e.g., 21
  pricingTiers: FollowUpPricingTier[];
}

// This represents the data stored in the /services/{serviceId} document
export interface Service {
  id: string; // The document ID
  name: string;
  price: number;
  duration: number; // Duration in minutes
  category: string;
  platinumPrice?: number | null; // Deprecated, kept for backward compatibility
  platinumDiscount?: PlatinumDiscount; // New field
  imageUrl?: string;
  description?: string; // Markdown or text description
  available: boolean;
  createdAt: any;
  options?: ServiceOption[];
  supportedDesigners?: string[]; // IDs of designers who can perform this service
  order?: number; // Added order field
  isPlanOnly?: boolean; // If true, hidden from public booking menu
  followUpConfig?: FollowUpConfig; // Follow-up service configuration
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