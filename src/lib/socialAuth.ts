import {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Detects if the current browser is on a mobile device.
 * @returns {boolean} True if it's a mobile browser, false otherwise.
 */
const isMobileBrowser = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Handles the sign-in process for social providers (Google, LINE).
 * It automatically chooses between popup and redirect based on the browser environment.
 * It also creates a user document in Firestore if the user is new.
 *
 * @param providerName - The name of the provider ('google' or 'line').
 */
export const handleSocialSignIn = async (
  providerName: 'google' | 'line'
) => {
  const provider = providerName === 'google' ? new GoogleAuthProvider() : new OAuthProvider('oidc.line');

  if (isMobileBrowser()) {
    // For all mobile browsers, redirect is more reliable than popup.
    // Set a flag in localStorage to indicate a redirect is in progress.
    // This helps us handle the auth state correctly on return.
    localStorage.setItem('firebaseAuthRedirect', 'true');
    await signInWithRedirect(auth, provider);
    // The page will redirect. All user creation/update logic is now handled
    // by the onAuthStateChanged listener in useAuth.ts when the user returns.
    return;
  }

  // For desktop browsers, popup is a better UX.
  await signInWithPopup(auth, provider);
  // After the popup closes, the onAuthStateChanged listener in useAuth.ts
  // will fire and handle user creation/update.
};