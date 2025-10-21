import { useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth'; // Use 'type' for type-only imports
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  const { setAuthState } = useAuthStore.getState();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // User is signed in, now fetch their profile from Firestore.
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            // Existing user, just set the state
            const userProfileData = userDocSnap.data() as UserDocument;
            setAuthState(firebaseUser, userProfileData);
          } else {
            // This is a new user (e.g., via social sign-in redirect or just created).
            // We create their profile document here to avoid race conditions.
            console.log('User profile not found, creating a new one...');
            const socialProviderData = firebaseUser.providerData[0]; // The first entry is the primary provider
            const isLineLogin = socialProviderData?.providerId.includes('line'); // Checks for 'oidc.line' or 'line.me'

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
            
            // Set the auth state with the newly created profile
            // We don't need to re-fetch because we already have the data.
            setAuthState(firebaseUser, newUserProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // In case of permissions error or network error, still set the auth user but with a null profile.
          setAuthState(firebaseUser, null);
        }
      } else {
        // User is signed out.
        setAuthState(null, null);
      }
    });

    return () => unsubscribe();
    // By using getState(), we can remove the dependencies, ensuring this effect runs only once.
  }, []);
};