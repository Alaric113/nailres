import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBkXmCbmC8n002VDj2gvHkGBQlwU0FRak0",
  authDomain: "nail-62ea4.firebaseapp.com",
  projectId: "nail-62ea4",
  storageBucket: "nail-62ea4.firebasestorage.app",
  messagingSenderId: "908642274549",
  appId: "1:908642274549:web:81b87b8c53dc3aa77cc9bc",
  measurementId: "G-JSFD5G6H2F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);