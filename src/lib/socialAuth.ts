import {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Detects if the current browser is the LINE in-app browser.
 * @returns {boolean} True if it's the LINE browser, false otherwise.
 */
const isLineBrowser = () => /Line\//.test(navigator.userAgent);

/**
 * Handles the sign-in process for social providers (Google, LINE).
 * It attempts sign-in with popup first, and falls back to redirect if popup is blocked or fails.
 * For LINE's in-app browser, it directly uses redirect to avoid issues.
 *
 * @param providerName - The name of the provider ('google' or 'line').
 */
export const handleSocialSignIn = async (
  providerName: 'google' | 'line'
) => {
  const provider = providerName === 'google' ? new GoogleAuthProvider() : new OAuthProvider('oidc.line');

  const performRedirect = async () => {
    localStorage.setItem('firebaseAuthRedirect', 'true');
    await signInWithRedirect(auth, provider);
  };

  // LINE's in-app browser often has issues with popups.
  // If the user is signing in with LINE inside the LINE app, force redirect.
  if (providerName === 'line' && isLineBrowser()) {
    console.log("LINE browser detected. Using redirect method for LINE sign-in.");
    await performRedirect();
  } else {
    try {
      // Always attempt popup first for better UX
      await signInWithPopup(auth, provider);
    } catch (error) {
      // If popup is blocked (e.g., by browser settings) or fails, fall back to redirect
      console.warn("Popup sign-in failed, attempting redirect...", error);
      await performRedirect();
    }
  }
};