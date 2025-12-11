import type { Timestamp, FieldValue } from 'firebase/firestore';

export type UserRole = 'user' | 'admin' | 'platinum' | 'designer' | 'manager';

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
}

// This represents the user document with its ID from the collection
export interface EnrichedUser extends UserDocument {
  id: string;
}