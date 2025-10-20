import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  displayName: string;
  avatarUrl?: string;
  phone?: string;
}

// This represents the data stored in the /users/{uid} document
export interface UserDocument {
  email: string;
  profile: UserProfile;
  role: 'admin' | 'user';
  createdAt: Timestamp;
  lastLogin: Timestamp;
}