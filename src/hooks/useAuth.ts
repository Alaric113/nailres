import { useEffect } from 'react';
import { onAuthStateChanged, getRedirectResult, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
    let unsubscribe = () => {};

    // This function handles fetching or creating user profiles.
    const handleUser = async (firebaseUser: User) => {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          // Existing user, just set the state
          setAuthState(firebaseUser, userDocSnap.data() as UserDocument);
        } else {
          // New user (e.g., via social sign-in). Create their profile.
          console.log('User profile not found, creating a new one...');
          const socialProviderData = firebaseUser.providerData[0];
          const isLineLogin = socialProviderData?.providerId.includes('line');

          const newUserProfile: UserDocument = {
            email: firebaseUser.email || `${socialProviderData?.providerId}-${firebaseUser.uid}@placeholder.com`,
            profile: {
              displayName: firebaseUser.displayName || '新使用者',
              avatarUrl: firebaseUser.photoURL || '',
            },
            role: 'user',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            ...(isLineLogin && { lineUserId: socialProviderData.uid }),
          };
          await setDoc(userDocRef, newUserProfile);
          setAuthState(firebaseUser, newUserProfile);
        }
      } catch (error) {
        console.error('Error handling user state:', error);
        setAuthState(firebaseUser, null); // Set user but with null profile on error
      }
    };

    // First, process any redirect result. This is crucial.
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // User signed in via redirect. The handleUser logic below will now
          // correctly create their profile if it's their first time.
          console.log('Handled redirect result for user:', result.user.uid);
        }
      })
      .catch((error) => {
        console.error('Error from getRedirectResult:', error);
      })
      .finally(() => {
        // AFTER processing the redirect, set up the normal auth state listener.
        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            handleUser(firebaseUser);
          } else {
            setAuthState(null, null);
          }
        });
      });

    return () => unsubscribe();
  }, []);
};