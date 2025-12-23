// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyBkXmCbmC8n002VDj2gvHkGBQlwU0FRak0",
  authDomain: "nail-62ea4.firebaseapp.com",
  projectId: "nail-62ea4",
  storageBucket: "nail-62ea4.firebasestorage.app",
  messagingSenderId: "908642274549",
  appId: "1:908642274549:web:81b87b8c53dc3aa77cc9bc",
  measurementId: "G-JSFD5G6H2F"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// Background message handler
// We do NOT use onBackgroundMessage to showNotification here because the payload includes 'notification' key,
// which triggers the browser's default notification automatically.
// Adding it here would cause duplicate notifications.

