import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, browserPopupRedirectResolver, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // By setting authDomain to our Netlify site, we unify the origin for auth operations.
  // UPDATE: Switching to default Firebase domain to ensure reliability across Localhost and Production
  // without relying on Netlify redirects/proxies which might be delayed or misconfigured.
  authDomain: 'nail-62ea4.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = initializeAuth(app, {
  // This is the key change. We are explicitly setting the persistence to
  // browserLocalPersistence to avoid issues with partitioned storage in
  // modern browsers (like Safari ITP or in-app browsers) which can cause
  // signInWithRedirect to fail. We also provide the resolver for popups/redirects.
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});

const db = getFirestore(app);
const storage = getStorage(app); // <-- Initialize and export storage

let messaging: any = null; // Use any or specific type if imported
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (e) {
  console.warn('Firebase Messaging failed to initialize:', e);
}

const googleProvider = new GoogleAuthProvider();

export { db, auth, storage, messaging, googleProvider }; 