import { initializeApp, getApp, getApps } from 'firebase/app';
import { GoogleAuthProvider, OAuthProvider, initializeAuth, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = initializeAuth(app, {
  // This is the key change. We are explicitly setting the persistence to
  // browserLocalPersistence to avoid issues with partitioned storage in
  // modern browsers (like Safari ITP or in-app browsers) which can cause
  // signInWithRedirect to fail.
  persistence: browserLocalPersistence,
});
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// OIDC Provider for LINE Login
// The provider ID 'oidc.line' must match the one configured in the Firebase console.
export const lineProvider = new OAuthProvider('oidc.line');