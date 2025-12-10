import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID || 'YOUR_LIFF_ID_HERE'; // Use environment variable

export const initializeLiff = async () => {
  try {
    if (!liff.isInClient() && !liff._is        // Don't initialize if already initialized or not in LIFF
    ) {
      await liff.init({ liffId: LIFF_ID });
    }
    return liff; // Return liff instance
  } catch (error) {
    console.error('LIFF initialization failed', error);
    return null;
  }
};

export const getLiffProfile = async () => {
  try {
    if (liff.isLoggedIn()) {
      return await liff.getProfile();
    }
  } catch (error) {
    console.error('Failed to get LIFF profile', error);
  }
  return null;
};

export const getLiffIdToken = () => {
  try {
    if (liff.isLoggedIn()) {
      return liff.getIDToken();
    }
  } catch (error) {
    console.error('Failed to get LIFF ID Token', error);
  }
  return null;
};

export const liffLogin = (redirectUri?: string) => {
  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri });
  }
};

export const isLiffBrowser = () => {
  return liff.isInClient();
};
