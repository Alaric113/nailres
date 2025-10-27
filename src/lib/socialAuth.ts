import {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  OAuthProvider,
  type AuthError,
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Detects if the current browser is the LINE in-app browser.
 * @returns {boolean} True if it's the LINE browser, false otherwise.
 */
const isLineBrowser = () => /Line\//.test(navigator.userAgent);

/**
 * Detects if the app is running in standalone (PWA) mode.
 * @returns {boolean} True if it's a standalone PWA, false otherwise.
 */
const isPwaStandalone = () => window.matchMedia('(display-mode: standalone)').matches;

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
  if (isLineBrowser()) {
    console.log("LINE browser detected. Using redirect method for LINE sign-in.");
    await performRedirect();
  } else if (isPwaStandalone()) {
    // For standalone PWAs (especially on iOS), always use popup to avoid breaking out of the app context.
    // Redirect will fail to return to the PWA instance.
    console.log("PWA standalone mode detected. Using popup method.");
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Popup sign-in failed in PWA mode:", error);
      // You might want to show a message to the user here, e.g., "請允許彈出式視窗以完成登入。"
      alert("登入失敗。請確認您已允許本網站的彈出式視窗，然後再試一次。");
    }
  } else {
    try {
      // Always attempt popup first for better UX
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      // If popup is blocked (e.g., by browser settings) or fails, fall back to redirect
      console.warn("Popup sign-in failed, attempting redirect...", error);
      await performRedirect();
    }
  }
};