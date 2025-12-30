import type { Timestamp, FieldValue } from 'firebase/firestore';

export type UserRole = 'user' | 'admin' | 'platinum' | 'designer' | 'manager';

// Active Season Pass held by a user
export interface ActivePass {
  passId: string;          // Reference to SeasonPass.id
  passName: string;        // e.g., "柔卡"
  variantName?: string;    // e.g., "150本"
  purchaseDate: Timestamp;
  expiryDate: Timestamp;
  remainingUsages: {       // Track remaining uses per content item
    [contentItemId: string]: number;
  };
}

// This represents the data stored in the /users/{uid} document
export interface UserDocument {
  email: string;
  profile: {
    displayName: string | null;
    avatarUrl?: string | null;
  };
  loyaltyPoints?: number;
  role: UserRole; // Use the UserRole union type
  createdAt: Timestamp | FieldValue;
  lastLogin: Timestamp | FieldValue;
  notes?: string;
  lineUserId?: string;
  receivesAdminNotifications?: boolean;
  receivesPwaNotifications?: boolean; // Master switch for PWA
  pwaSubscriptions?: string[]; // 'all' or specific designer IDs
  activePasses?: ActivePass[]; // Active season passes
}

// This represents the user document with its ID from the collection
export interface EnrichedUser extends UserDocument {
  id: string;
}