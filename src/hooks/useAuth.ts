import { useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth'; // Use 'type' for type-only imports
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import type { UserDocument } from '../types/user';

/**
 * Custom hook to manage and sync Firebase authentication state with the app's global state.
 * It listens for auth changes, fetches the user's profile from Firestore on login,
 * and updates the Zustand store.
 */
export const useAuth = () => {
  // Get the state-setting function once from the store.
  const { setAuthState } = useAuthStore.getState();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      console.log('[Auth Checkpoint 1] onAuthStateChanged triggered. User:', firebaseUser?.email);

      if (firebaseUser) {
        // User is signed in, now fetch their profile from Firestore.
        try {
          console.log('[Auth Checkpoint 3.1] Fetching user profile from Firestore...');
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userProfileData = userDocSnap.data() as UserDocument;
            console.log('[Auth Checkpoint 3] User profile fetched:', userProfileData);
            setAuthState(firebaseUser, userProfileData);
            console.log('[Auth Checkpoint 3.2] Zustand state updated with user, profile, and loading set to false.');
          } else {
            // This can happen during registration race conditions or if the doc was deleted manually.
            console.error('User profile not found in Firestore.');
            setAuthState(firebaseUser, null);
          }
        } catch (error) {
          console.error('[Auth Checkpoint 4] Error fetching user profile:', error);
          // In case of permissions error or network error, still set the auth user but with a null profile.
          setAuthState(firebaseUser, null);
        }
      } else {
        // User is signed out.
        console.log('[Auth Checkpoint 6] User is logged out.');
        setAuthState(null, null);
      }
    });

    return () => unsubscribe();
    // By using getState(), we can remove the dependencies, ensuring this effect runs only once.
  }, []);
};