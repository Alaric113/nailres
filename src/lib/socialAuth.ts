import {
  signInWithPopup,
  signInWithRedirect,
  type AuthProvider,
} from 'firebase/auth';
import { auth } from './firebase';

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
 * @param authProvider - The Firebase AuthProvider instance.
 */
export const handleSocialSignIn = async (
  authProvider: AuthProvider
) => {
  if (isLineBrowser()) {
    // For LINE's in-app browser, redirect is more reliable.
    await signInWithRedirect(auth, authProvider);
    // The page will redirect. All user creation/update logic is now handled
    // by the onAuthStateChanged listener in useAuth.ts when the user returns.
    return;
  }

  // For desktop browsers, popup is a better UX.
  await signInWithPopup(auth, authProvider);
  // After the popup closes, the onAuthStateChanged listener in useAuth.ts
  // will fire and handle user creation/update.
};