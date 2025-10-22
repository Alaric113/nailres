import {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Handles the sign-in process for social providers (Google, LINE).
 * It attempts sign-in with popup first, and falls back to redirect if popup is blocked or fails.
 * It also creates a user document in Firestore if the user is new.
 *
 * @param providerName - The name of the provider ('google' or 'line').
 */
export const handleSocialSignIn = async (
  providerName: 'google' | 'line'
) => {
  const provider = providerName === 'google' ? new GoogleAuthProvider() : new OAuthProvider('oidc.line');
  
  try {
    // Always attempt popup first for better UX
    await signInWithPopup(auth, provider);
  } catch (error) {
    // If popup is blocked (e.g., by browser settings) or fails, fall back to redirect
    console.warn("Popup sign-in failed, attempting redirect...", error);
    // Set a flag in localStorage to indicate a redirect is in progress.
    // This helps us handle the auth state correctly on return.
    localStorage.setItem('firebaseAuthRedirect', 'true');
    await signInWithRedirect(auth, provider);
    // The page will redirect. All user creation/update logic is now handled
    // by the onAuthStateChanged listener in useAuth.ts when the user returns.
  }
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

  const method = getAuthMethod(); // Determines 'popup' or 'redirect'

  // Per expert recommendation, explicitly set persistence to localStorage
  // to mitigate issues with Safari's Intelligent Tracking Prevention (ITP).
  await setPersistence(auth, browserLocalPersistence);

  if (method === 'redirect') {
    // Set a flag in localStorage to indicate a redirect is in progress.
    // This helps us handle the auth state correctly on return.
    localStorage.setItem('firebaseAuthRedirect', 'true');
    await signInWithRedirect(auth, provider);
    // The page will redirect. All user creation/update logic is now handled
    // by the onAuthStateChanged listener in useAuth.ts when the user returns.
  } else {
    // For desktop browsers, popup is a better UX.
    await signInWithPopup(auth, provider);
    // After the popup closes, the onAuthStateChanged listener in useAuth.ts
    // will fire and handle user creation/update.
  }
};