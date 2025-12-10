import { useEffect, useState } from 'react';
import { onAuthStateChanged, getRedirectResult, type User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, collection, query, where, limit, getDocs, writeBatch } from 'firebase/firestore';
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

  // A local state to manage the redirect check, preventing the main app from rendering prematurely.
  // We only need to check for redirect if the flag is set in localStorage.
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(
    localStorage.getItem('firebaseAuthRedirect') === 'true'
  );

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
          
          const batch = writeBatch(db);

          // Find the new user coupon
          const couponsRef = collection(db, 'coupons');
          const q = query(couponsRef, where('isNewUserCoupon', '==', true), where('isActive', '==', true), limit(1));
          const couponSnapshot = await getDocs(q);
          const newUserCoupon = couponSnapshot.docs.length > 0 ? couponSnapshot.docs[0] : null;

          // If a new user coupon is found, prepare to assign it
          if (newUserCoupon) {
            const userCouponRef = doc(db, 'users', firebaseUser.uid, 'userCoupons', newUserCoupon.id);
            batch.set(userCouponRef, {
              couponId: newUserCoupon.id,
              isUsed: false,
              receivedAt: serverTimestamp(),
            });
          }

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

          batch.set(userDocRef, newUserProfile);
          await batch.commit();
          setAuthState(firebaseUser, newUserProfile);
          console.log(`[Auth] New user document created for ${firebaseUser.uid}. ${newUserCoupon ? `Assigned new user coupon: ${newUserCoupon.id}` : 'No new user coupon found.'}`);
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
        // The flag will be removed in the finally block to ensure it's always cleared.
      })
      .catch((error) => {
        console.error('Error from getRedirectResult:', error);
      })
      .finally(() => {
        // AFTER processing the redirect, set up the normal auth state listener.
        setIsCheckingRedirect(false); // Allow the app to proceed
        localStorage.removeItem('firebaseAuthRedirect'); // Clean up the flag
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

  // Return a flag indicating if we are in the critical redirect-checking phase.
  return { isCheckingRedirect };
};