import { useState, useEffect } from 'react';
import { messaging, db } from '../lib/firebase';
import { getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';

// VAPID Key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const useNotification = () => {
    const [permission, setPermission] = useState<NotificationPermission>(Notification.permission);
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const { currentUser, userProfile } = useAuthStore();

    const saveTokenToFirestore = async (token: string) => {
        if (!currentUser) return;
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            // Use arrayUnion to support multiple devices per user if needed
            // Or just set a single field 'fcmToken' if 1-to-1 mapping is preferred.
            // For simplicity and common use case: overwrite or add to array.
            // Let's use a simple field for now, or an array 'fcmTokens'.
            await updateDoc(userRef, {
                fcmToken: token, // Single device focus for now, or last active device
                // fcmTokens: arrayUnion(token) // scalable approach
            });
            console.log('FCM Token saved to Firestore');
        } catch (error) {
            console.error('Error saving FCM token to Firestore:', error);
        }
    };

    const requestPermission = async () => {
        if (!VAPID_KEY) {
            console.warn('VAPID Key not found. Push notifications will not work.');
            return;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result === 'granted') {
                const token = await getToken(messaging, {
                    vapidKey: VAPID_KEY
                });
                if (token) {
                    setFcmToken(token);
                    console.log('FCM Token:', token);
                    await saveTokenToFirestore(token);
                } else {
                    console.log('No registration token available.');
                }
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    };

    // Automatically check/request permission for staff roles
    useEffect(() => {
        if (currentUser && userProfile) {
            const isStaff = ['admin', 'manager', 'designer'].includes(userProfile.role);
            if (isStaff) {
                // If permission is already 'default' (not asked yet), we can ask.
                // Or if 'granted', we ensure we have the token.
                if (Notification.permission === 'default' || Notification.permission === 'granted') {
                    requestPermission();
                }
            }
        }
    }, [currentUser, userProfile]);

    useEffect(() => {
        const unsubscribe = onMessage(messaging, (payload: MessagePayload) => {
            console.log('Foreground Message received:', payload);
            if (payload.notification) {
                // You can trigger a toast here
                console.log(`New Notification: ${payload.notification.title}`);
            }
        });
        return () => unsubscribe();
    }, []);

    return { permission, requestPermission, fcmToken };
};
