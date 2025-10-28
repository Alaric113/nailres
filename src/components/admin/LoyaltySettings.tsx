import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import LoadingSpinner from '../common/LoadingSpinner';

interface LoyaltySettingsData {
  pointsPerAmount: number;
  rules: string;
}

const LoyaltySettings = () => {
  const [settings, setSettings] = useState<LoyaltySettingsData>({
    pointsPerAmount: 100,
    rules: '消費完成後，系統將自動根據消費金額發放點數。',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      const settingsRef = doc(db, 'globals', 'settings');
      try {
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists() && docSnap.data().loyaltySettings) {
          setSettings(docSnap.data().loyaltySettings);
        }
      } catch (error) {
        console.error("Error fetching loyalty settings:", error);
        setMessage({ type: 'error', text: '讀取設定失敗。' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    const settingsRef = doc(db, 'globals', 'settings');
    try {
      await setDoc(settingsRef, { loyaltySettings: settings }, { merge: true });
      setMessage({ type: 'success', text: '集點卡設定已成功儲存！' });
    } catch (error) {
      console.error("Error saving loyalty settings:", error);
      setMessage({ type: 'error', text: '儲存失敗，請稍後再試。' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {message && (
        <div className={`p-3 mb-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      <div className="space-y-6">
        <div>
          <label htmlFor="pointsPerAmount" className="block text-sm font-medium text-gray-700">集點規則</label>
          <div className="mt-1 flex items-center gap-2 text-gray-600">
            <span>每消費滿</span>
            <input type="number" id="pointsPerAmount" value={settings.pointsPerAmount} onChange={(e) => setSettings(s => ({ ...s, pointsPerAmount: Number(e.target.value) }))} className="w-24 input-style text-center" />
            <span>元，贈送 1 點。</span>
          </div>
        </div>
        <div>
          <label htmlFor="rules" className="block text-sm font-medium text-gray-700">集點相關規定</label>
          <textarea id="rules" value={settings.rules} onChange={(e) => setSettings(s => ({ ...s, rules: e.target.value }))} className="mt-1 w-full input-style" rows={4}></textarea>
        </div>
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={isSaving} className="btn-primary">
            {isSaving ? '儲存中...' : '儲存設定'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoyaltySettings;
