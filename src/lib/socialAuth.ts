import {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  OAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Detects if the current browser is on any mobile device.
 */
const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Detects if the current browser is Safari on an iOS device.
 * This is a special case due to Safari's strict tracking prevention (ITP).
 */
const isIosSafari = (): boolean => {
  const ua = navigator.userAgent;
  return /iP(ad|hone|od)/.test(ua) && /Safari/.test(ua) && !/CriOS|EdgiOS/.test(ua);
};


/**
 * Determines the appropriate sign-in method based on the environment.
 * @returns 'popup' for desktop and iOS Safari, 'redirect' for other mobile browsers.
 */
const getAuthMethod = (): 'popup' | 'redirect' => {
  // iOS Safari has issues with redirects, so we prefer popups there.
  // For other mobile browsers, redirect is more reliable.
  if (isIosSafari()) return 'popup';
  return isMobile() ? 'redirect' : 'popup';
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