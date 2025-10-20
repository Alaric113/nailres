import { create } from 'zustand';
import { User } from 'firebase/auth';
import { UserProfile } from '../../types';

interface AuthState {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  setCurrentUser: (user: User | null, profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Zustand store for authentication state.
 * Manages the Firebase user object and the user's profile from Firestore.
 */
export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  userProfile: null,
  isLoading: true,
  setCurrentUser: (user, profile) =>
    set({ currentUser: user, userProfile: profile, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
}));