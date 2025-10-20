import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthStore } from '../store/authStore';

/**
 * A custom hook to synchronize Firebase auth state with the Zustand store.
 * This hook should be called once in the root component of the application (e.g., App.tsx).
 */
export const useAuth = () => {
  // Get the setUser function from our Zustand store.
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // When the auth state changes, update the store.
      setUser(user);
    });

    // Cleanup subscription on unmount.
    return () => unsubscribe();
  }, [setUser]); // The effect depends on the setUser function.
};