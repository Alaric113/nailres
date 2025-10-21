import { create } from 'zustand';
import { signOut, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import type { UserDocument as UserProfile } from '../types/user';

interface AuthState {
  currentUser: User | null;
  // Renamed for clarity
  userProfile: UserProfile | null;
  authIsLoading: boolean;
  // This is now the single source of truth for setting auth state.
  // It also handles the loading state change.
  setAuthState: (user: User | null, profile: UserProfile | null) => void;
  logout: () => Promise<void>;
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
  logout: async () => {
    await signOut(auth);
    set({ currentUser: null, userProfile: null });
  },
}));