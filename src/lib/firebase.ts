import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For security, these should be in environment variables
const firebaseConfig = {
  apiKey: "AIzaSyBkXmCbmC8n002VDj2gvHkGBQlwU0FRak0",
  authDomain: "nail-62ea4.firebaseapp.com",
  projectId: "nail-62ea4",
  storageBucket: "nail-62ea4.firebasestorage.app",
  messagingSenderId: "908642274549",
  appId: "1:908642274549:web:92069b37f19539a27cc9bc",
  measurementId: "G-C055ZDC47T"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();