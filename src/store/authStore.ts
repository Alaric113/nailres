import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { UserDocument as UserProfile } from '../types/user';

interface AuthState {
  currentUser: User | null;
  // Renamed for clarity
  userProfile: UserProfile | null;
  authIsLoading: boolean;
  // This is now the single source of truth for setting auth state.
  // It also handles the loading state change.
  setAuthState: (user: User | null, profile: UserProfile | null) => void;
}

/**
 * Zustand store for authentication state.
 * Manages the Firebase user object and the user's profile from Firestore.
 */
export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  userProfile: null,
  authIsLoading: true,
  // When auth state is set, loading is automatically finished.
  setAuthState: (user, profile) => set({ currentUser: user, userProfile: profile, authIsLoading: false }),
}));