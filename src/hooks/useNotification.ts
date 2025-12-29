import { useState, useEffect } from 'react';
import { messaging, db } from '../lib/firebase';
import { getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';

// VAPID Key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const useNotification = () => {
    // Check if Notification API is supported
    const isSupported = 'Notification' in window;

    // Safely initialize state
    const [permission, setPermission] = useState<NotificationPermission>(
        isSupported ? Notification.permission : 'denied'
    );
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const { currentUser, userProfile } = useAuthStore();

    const saveTokenToFirestore = async (token: string) => {
        if (!currentUser) return;

        // Prevent infinite loop: Don't update if token is already saved
        if ((userProfile as any)?.fcmToken === token) {
            return;
        }

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                fcmToken: token,
            });
            console.log('FCM Token saved to Firestore');
        } catch (error) {
            console.error('Error saving FCM token to Firestore:', error);
        }
    };

    const requestPermission = async () => {
        if (!isSupported) {
            console.log('This browser does not support notifications.');
            return;
        }

        if (!VAPID_KEY) {
            console.warn('VAPID Key not found. Push notifications will not work.');
            return;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result === 'granted') {
                if (!messaging) {
                    console.warn('Messaging not initialized.');
                    return;
                }
                const token = await getToken(messaging, {
                    vapidKey: VAPID_KEY
                });
                if (token) {
                    setFcmToken(token);
                    // console.log('FCM Token:', token); // Reduce noise
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
        if (!isSupported || !messaging) return;

        if (currentUser && userProfile) {
            const isStaff = ['admin', 'manager', 'designer'].includes(userProfile.role);
            if (isStaff) {
                if (Notification.permission === 'default' || Notification.permission === 'granted') {
                    requestPermission();
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?.uid, userProfile?.role, isSupported]);

    useEffect(() => {
        if (!messaging) return; // Add guard

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
