
import { useEffect } from 'react';
import { onAuthStateChanged, getRedirectResult, type User } from 'firebase/auth';
import { doc, serverTimestamp, collection, query, where, limit, getDocs, writeBatch, onSnapshot, Timestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import type { UserDocument } from '../types/user';

/**
 * Custom hook to manage and sync Firebase authentication state with the app's global state.
 * It listens for auth changes, fetches the user's profile from Firestore on login,
 * and updates the Zustand store.
 *
 * IMPORTANT: This hook no longer blocks rendering. Auth loads in the background.
 */
export const useAuth = () => {
  // Get the state-setting function once from the store.
  const { setAuthState } = useAuthStore.getState();

  useEffect(() => {
    let unsubscribeAuth: () => void = () => { };
    let unsubscribeProfile: () => void = () => { };

    // Helper to create profile if not exists
    const createUserProfile = async (firebaseUser: User) => {
      try {
        const batch = writeBatch(db);
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        // Find the new user coupon
        const couponsRef = collection(db, 'coupons');
        const q = query(couponsRef, where('isNewUserCoupon', '==', true), where('isActive', '==', true), limit(1));
        const couponSnapshot = await getDocs(q);
        const newUserCoupon = couponSnapshot.docs.length > 0 ? couponSnapshot.docs[0] : null;

        // If a new user coupon is found, prepare to assign it
        if (newUserCoupon) {
          const couponData = newUserCoupon.data();
          // Create in ROOT collection 'user_coupons'
          const userCouponRef = doc(collection(db, 'user_coupons'));

          const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
          const validUntil = new Date();
          validUntil.setDate(validUntil.getDate() + 90);

          batch.set(userCouponRef, {
            userId: firebaseUser.uid,
            couponId: newUserCoupon.id,
            code: `${couponData.code}-${uniqueSuffix}`,
            title: couponData.title,
            status: 'active',
            value: couponData.value,
            type: couponData.type,
            minSpend: couponData.minSpend || 0,
            scopeType: couponData.scopeType || 'all',
            scopeIds: couponData.scopeIds || [],
            details: couponData.details || '',
            createdAt: serverTimestamp(),
            validFrom: serverTimestamp(),
            validUntil: Timestamp.fromDate(validUntil),
            redemptionSource: 'new_user_gift'
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
        console.log(`[Auth] New user document created for ${firebaseUser.uid}.`);
      } catch (error) {
        console.error('Error creating user profile:', error);
      }
    };

    // Fire getRedirectResult in background (non-blocking) - needed for OAuth redirect flow
    getRedirectResult(auth).then((result) => {
      if (result) console.log('Handled redirect result for user:', result.user.uid);
    }).catch((error) => console.error('Error from getRedirectResult:', error));

    localStorage.removeItem('firebaseAuthRedirect');

    // Set up onAuthStateChanged immediately (does not block rendering)
    unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Unsubscribe previous profile listener if exists (e.g. user switch)
      if (unsubscribeProfile) unsubscribeProfile();

      if (firebaseUser) {
        // Set up real-time listener for user profile
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as UserDocument;

            // Check if we need to backfill lineUserId for existing users
            const socialProviderData = firebaseUser.providerData.find(p => p.providerId.includes('line'));
            if (socialProviderData && !userData.lineUserId) {
              console.log('[Auth] Backfilling lineUserId for existing user...');
              updateDoc(userDocRef, {
                lineUserId: socialProviderData.uid
              }).catch(e => console.error('Error backfilling lineUserId:', e));

              // Optimistically update local state
              userData.lineUserId = socialProviderData.uid;
            }

            setAuthState(firebaseUser, userData);
          } else {
            // Start creation process if doc doesn't exist
            createUserProfile(firebaseUser);
          }
        }, (error) => {
          console.error("Profile snapshot error:", error);
          setAuthState(firebaseUser, null);
        });
      } else {
        setAuthState(null, null);
      }
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);
};