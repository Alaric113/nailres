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
 * Detects if the app is running in standalone (PWA) mode.
 * @returns {boolean} True if it's a standalone PWA, false otherwise.
 */
const isPwaStandalone = () => window.matchMedia('(display-mode: standalone)').matches;

/**
 * Handles the sign-in process for social providers (Google, LINE).
 * It attempts sign-in with popup first, and falls back to redirect if popup is blocked or fails.
 * Special handling for LINE in-app browser and standalone PWA mode.
 *
 * @param {('google' | 'line')} providerName - The name of the provider.
 */
export const handleSocialSignIn = async (
  providerName: 'google' | 'line'
) => {
  const provider = providerName === 'google' ? new GoogleAuthProvider() : new OAuthProvider('oidc.line');

  const performRedirect = async () => {
    localStorage.setItem('firebaseAuthRedirect', 'true');
    await signInWithRedirect(auth, provider);
  };

  // Case 1: In LINE's in-app browser, popups are problematic. Force redirect.
  if (isLineBrowser()) {
    console.log("LINE browser detected. Forcing redirect method.");
    await performRedirect();
  } else if (isPwaStandalone()) {
    // Case 2: In a standalone PWA (especially on iOS), redirect breaks the flow. Force popup.
    console.log("PWA standalone mode detected. Forcing popup method.");
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Popup sign-in failed in PWA mode:", error);
      // In PWA mode, we cannot fall back to redirect. We must inform the user.
      alert("登入失敗。請確認您已允許本網站的彈出式視窗，然後再試一次。");
    }
  } else {
    // Case 3: Standard browser behavior. Try popup first, fall back to redirect.
    try {
      console.log("Standard browser. Attempting popup sign-in.");
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.warn("Popup sign-in failed, attempting redirect...", error);
      await performRedirect();
    }
  }
};