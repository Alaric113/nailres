import { useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth'; // Use 'type' for type-only imports
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { useAuthStore } from './store/authStore';
import type { UserDocument } from './types/user';

/**
 * Custom hook to manage and sync Firebase authentication state with the app's global state.
 * It listens for auth changes, fetches the user's profile from Firestore on login,
 * and updates the Zustand store.
 */
export const useAuth = () => {
  // Get the state-setting functions once from the store.
  const { setCurrentUser, setLoading } = useAuthStore.getState();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // User is signed in, now fetch their profile from Firestore.
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userProfileData = userDocSnap.data() as UserDocument;
            setCurrentUser(firebaseUser, userProfileData);
          } else {
            // This can happen during registration race conditions or if the doc was deleted manually.
            console.error('User profile not found in Firestore.');
            setCurrentUser(firebaseUser, null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // In case of permissions error or network error, still set the auth user but with a null profile.
          setCurrentUser(firebaseUser, null);
        } finally {
          setLoading(false);
        }
      } else {
        // User is signed out.
        setCurrentUser(null, null);
        setLoading(false); // Also ensure loading is false on logout.
      }
    });

    return () => unsubscribe();
    // By using getState(), we can remove the dependencies, ensuring this effect runs only once.
  }, []);
};