import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface GlobalSettings {
  bookingDeadline: Date | null;
}

export const useGlobalSettings = () => {
  const [settings, setSettings] = useState<GlobalSettings>({ bookingDeadline: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const globalSettingsRef = doc(db, 'globals', 'settings');
        const docSnap = await getDoc(globalSettingsRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings({
            bookingDeadline: data.bookingDeadline ? data.bookingDeadline.toDate() : null,
          });
        }
      } catch (err) {
        console.error("Error fetching global settings:", err);
        setError("讀取全域設定失敗");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGlobalSettings();
  }, []);

  return { settings, isLoading, error };
};