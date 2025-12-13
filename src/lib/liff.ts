import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID || 'YOUR_LIFF_ID_HERE'; // Use environment variable

export const initializeLiff = async () => {
  try {
    if (!LIFF_ID || LIFF_ID === 'YOUR_LIFF_ID_HERE') {
      console.warn('LIFF ID is invalid or missing:', LIFF_ID);
    }
    // Always initialize LIFF
    await liff.init({ liffId: LIFF_ID });

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
