import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SeasonPassPromo {
  enabled: boolean;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  imageUrl?: string;
}

export interface SeasonPassFlexSettings {
  enabled: boolean;
  headerText: string;
  headerColor: string;
  bodyTextTemplate: string;
  footerText: string;
}

export interface GlobalSettings {
  bookingDeadline: Date | null;
  bookingNotice?: string;
  bankInfo?: {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    note?: string;
  };
  seasonPassPromo?: SeasonPassPromo;
  seasonPassFlexMessage?: SeasonPassFlexSettings;
}

const defaultPromo: SeasonPassPromo = {
  enabled: false,
  title: '',
  description: '',
  ctaText: '了解更多',
  ctaLink: '/member/pass',
};

const defaultFlexSettings: SeasonPassFlexSettings = {
  enabled: true,
  headerText: '季卡訂單成立',
  headerColor: '#9F9586',
  bodyTextTemplate: '親愛的 {{customerName}} 您好，\n感謝您購買 {{passName}} - {{variantName}}。\n\n您的訂單金額為 ${{price}}。\n請匯款至以下帳號：\n{{bankInfo}}\n\n匯款後請告知末五碼，謝謝！',
  footerText: '如有疑問請聯繫客服',
};

export const useGlobalSettings = () => {
  const [settings, setSettings] = useState<GlobalSettings>({
    bookingDeadline: null,
    bookingNotice: '',
    bankInfo: { bankCode: '', bankName: '', accountNumber: '', accountName: '', note: '' },
    seasonPassPromo: defaultPromo,
    seasonPassFlexMessage: defaultFlexSettings
  });
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
            bookingNotice: data.bookingNotice || '',
            bankInfo: data.bankInfo || { bankCode: '', bankName: '', accountNumber: '', accountName: '', note: '' },
            seasonPassPromo: data.seasonPassPromo || defaultPromo,
            seasonPassFlexMessage: data.seasonPassFlexMessage || defaultFlexSettings,
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

  const updateGlobalSettings = async (newSettings: Partial<GlobalSettings>) => {
    try {
      const globalSettingsRef = doc(db, 'globals', 'settings');
      // Filter out undefined values
      const updateData: any = { ...newSettings };
      if (newSettings.bookingDeadline === undefined) delete updateData.bookingDeadline;

      await updateDoc(globalSettingsRef, updateData);

      setSettings(prev => ({ ...prev, ...newSettings }));
      return true;
    } catch (err) {
      console.error("Error updating global settings:", err);
      return false;
    }
  };

  return { settings, isLoading, error, updateGlobalSettings };
};
