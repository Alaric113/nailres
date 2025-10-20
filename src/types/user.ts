import type { Timestamp, FieldValue } from 'firebase/firestore';

export interface UserProfile {
  displayName: string | null;
  avatarUrl?: string;
}

// This represents the data stored in the /users/{uid} document
export interface UserDocument {
  email: string;
  profile: UserProfile;
  role: 'user' | 'admin';
  createdAt: Timestamp | FieldValue;
  lastLogin: Timestamp | FieldValue;
}