import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useAuthStore } from '../../store/authStore';
import { UserProfile } from '../../types';

/**
 * Custom hook to manage and sync Firebase authentication state with the app's global state.
 * It listens for auth changes, fetches the user's profile from Firestore on login,
 * and updates the Zustand store.
 */
export const useAuth = () => {
  const { setCurrentUser, setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, now fetch their profile from Firestore.
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userProfile = userDocSnap.data() as UserProfile;
          setCurrentUser(user, userProfile);
        } else {
          // Handle case where user exists in Auth but not in Firestore.
          console.error("User profile not found in Firestore.");
          setCurrentUser(user, null);
        }
      } else {
        // User is signed out.
        setCurrentUser(null, null);
      }
    });

    return () => unsubscribe();
  }, [setCurrentUser, setLoading]);
};