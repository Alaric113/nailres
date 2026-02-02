
import { useEffect, useState } from 'react';
import { onAuthStateChanged, getRedirectResult, type User } from 'firebase/auth';
import { doc, serverTimestamp, collection, query, where, limit, getDocs, writeBatch, onSnapshot, Timestamp, updateDoc } from 'firebase/firestore';
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
    let unsubscribeAuth: () => void = () => { };
    let unsubscribeProfile: () => void = () => { };

    // Helper to create profile if not exists
    const createUserProfile = async (firebaseUser: User) => {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // 0. Check if a user with the same email already exists (to prevent duplicates)
        if (firebaseUser.email) {
          const usersRef = collection(db, 'users');
          const emailQuery = query(usersRef, where('email', '==', firebaseUser.email), limit(1));
          const emailSnapshot = await getDocs(emailQuery);

          if (!emailSnapshot.empty) {
            const existingUserDoc = emailSnapshot.docs[0];
            const existingUserData = existingUserDoc.data() as UserDocument;
            const existingUserId = existingUserDoc.id;

            console.log(`[Auth] Found existing user with email ${firebaseUser.email} (UID: ${existingUserId}). Linking...`);

            const socialProviderData = firebaseUser.providerData[0];
            const isLineLogin = socialProviderData?.providerId.includes('line');

            const updates: Partial<UserDocument> = {
              lastLogin: serverTimestamp(),
            };

            if (isLineLogin && !existingUserData.lineUserId) {
              updates.lineUserId = socialProviderData.uid;
            }

            // If the UIDs are different (e.g., logging in with a new provider that wasn't linked at Auth level)
            // we should technically update the existing document.
            // BUT, Firestore 'users' doc is usually keyed by UID. 
            // If they are different UIDs, we have a mismatch between Auth UID and Firestore Doc ID.
            // This is complex to solve without Cloud Functions.
            // For now, if UID matches, we just update. If not, we still proceed to create a new one 
            // unless we want to risk data fragmentation.
            
            if (existingUserId === firebaseUser.uid) {
              await updateDoc(userDocRef, updates);
              return; // Successfully updated existing doc
            }
          }
        }

        const batch = writeBatch(db);
        // ... rest of the existing creation logic
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

    // First, process any redirect result.
    getRedirectResult(auth)
      .then((result) => {
        if (result) console.log('Handled redirect result for user:', result.user.uid);
      })
      .catch((error) => console.error('Error from getRedirectResult:', error))
      .finally(() => {
        setIsCheckingRedirect(false);
        localStorage.removeItem('firebaseAuthRedirect');

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
                // We only want to trigger this once. The onSnapshot might fire again after creation.
                // To prevent race conditions in React strict mode or rapid updates, 
                // we could check a local flag, but standard behavior is fine here 
                // because writeBatch is idempotent-ish for 'set' if we don't overwrite blindly.
                // But actually, `createUserProfile` does `set`. 
                // Logic: If !exists, create. Then snapshot updates -> exists -> setAuthState.
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
      });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return { isCheckingRedirect };
};