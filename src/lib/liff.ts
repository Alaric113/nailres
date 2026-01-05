import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID || 'YOUR_LIFF_ID_HERE'; // Use environment variable

export const initializeLiff = async () => {
  try {
    // Check for mock flag
    const searchParams = new URLSearchParams(window.location.search);
    const isMock = searchParams.get('liff_mock') === 'true';

    if (isMock) {
      console.log('⚠️ LIFF Mock Mode Activated');
      // Return a Mock LIFF object
      return {
        init: async () => Promise.resolve(),
        isLoggedIn: () => {
          // Mock login state if needed, or default to false to test login flow
          // But if we want to simulate "Liff Browser", we often imply logged in context
          // For now, let's return true to simulate "already inside Line"
          // Or allow controlling it via another param?
          // Let's assume true for "liff_mock" often means "Testing inside LIFF"
          return true;
        },
        isInClient: () => true,
        getProfile: async () => ({
          userId: 'mock_user_id',
          displayName: 'Mock User',
          pictureUrl: 'https://placehold.co/200',
          statusMessage: 'Mocking LIFF'
        }),
        getIDToken: () => 'mock_id_token',
        getDecodedIDToken: () => ({ name: 'Mock User', email: 'mock@example.com' }),
        login: () => console.log('Mock Login called'),
        logout: () => console.log('Mock Logout called'),
        closeWindow: () => console.log('Mock CloseWindow called'),
      };
    }

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
  // Check for mock flag in URL (for local development)
  const searchParams = new URLSearchParams(window.location.search);
  const isMock = searchParams.get('liff_mock') === 'true';

  // Check User Agent for LINE or LIFF
  const isLineUA = /Line|LIFF/i.test(navigator.userAgent);

  return liff.isInClient() || isMock || isLineUA;
};
