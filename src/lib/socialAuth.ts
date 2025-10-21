import {
  signInWithPopup,
  signInWithRedirect,
  type AuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { UserDocument } from '../types/user';

/**
 * Detects if the current browser is the LINE in-app browser.
 * @returns {boolean} True if it's the LINE browser, false otherwise.
 */
const isLineBrowser = (): boolean => {
  return /Line\//i.test(navigator.userAgent);
};

/**
 * Handles the sign-in process for social providers (Google, LINE).
 * It automatically chooses between popup and redirect based on the browser environment.
 * It also creates a user document in Firestore if the user is new.
 *
 * @param providerName - The name of the provider ('google' or 'line').
 * @param authProvider - The Firebase AuthProvider instance.
 */
export const handleSocialSignIn = async (
  providerName: 'google' | 'line',
  authProvider: AuthProvider
) => {
  if (isLineBrowser()) {
    // For LINE's in-app browser, redirect is more reliable.
    await signInWithRedirect(auth, authProvider);
    // The page will redirect, and the result is handled by onAuthStateChanged when the user returns.
    // We need to ensure our useAuth hook can create the user on return.
    return;
  }

  // For desktop browsers, popup is a better UX.
  const result = await signInWithPopup(auth, authProvider);
  const user = result.user;
  const userDocRef = doc(db, 'users', user.uid);
  const userDocSnap = await getDoc(userDocRef);

  const socialProviderData = user.providerData.find(p =>
    p.providerId.includes(providerName)
  );

  if (userDocSnap.exists()) {
    // Existing user, update last login and lineUserId if applicable
    await setDoc(userDocRef, {
      lastLogin: serverTimestamp(),
      ...(providerName === 'line' && { lineUserId: socialProviderData?.uid }),
    }, { merge: true });
  } else {
    // New user
    const newUserDocument: UserDocument = {
      email: user.email || `${providerName}-${user.uid}@placeholder.com`,
      profile: {
        displayName: user.displayName || `${providerName} User`,
        avatarUrl: user.photoURL || '',
      },
      role: 'user',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      ...(providerName === 'line' && { lineUserId: socialProviderData?.uid }),
    };
    await setDoc(userDocRef, newUserDocument);
  }
};