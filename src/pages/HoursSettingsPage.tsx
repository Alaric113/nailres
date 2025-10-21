import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { format, isValid } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BusinessHours } from '../types/businessHours';
import { useBusinessHoursSummary } from '../hooks/useBusinessHoursSummary';

import 'react-day-picker/dist/style.css';

const HoursSettingsPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [openingTime, setOpeningTime] = useState('10:00');
  const [closingTime, setClosingTime] = useState('19:00');
  const [isClosed, setIsClosed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { closedDays } = useBusinessHoursSummary();

  // Fetch settings when a new date is selected
  useEffect(() => {
    if (!selectedDate || !isValid(selectedDate)) {
      return;
    }

    const fetchSettings = async () => {
      setIsLoading(true);
      setMessage(null);
      const docId = format(selectedDate, 'yyyy-MM-dd');
      const docRef = doc(db, 'businessHours', docId);

      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as BusinessHours;
          setOpeningTime(data.openingTime);
          setClosingTime(data.closingTime);
          setIsClosed(data.isClosed);
        } else {
          // Reset to default if no setting exists for the day
          setOpeningTime('10:00');
          setClosingTime('19:00');
          setIsClosed(false);
        }
      } catch (error) {
        console.error("Error fetching business hours:", error);
        setMessage({ type: 'error', text: '讀取設定失敗！' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [selectedDate]);

  const handleSave = async () => {
    if (!selectedDate || !isValid(selectedDate)) {
      setMessage({ type: 'error', text: '請先選擇一個有效的日期。' });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    const docId = format(selectedDate, 'yyyy-MM-dd');
    const docRef = doc(db, 'businessHours', docId);

    const newSettings: BusinessHours = {
      openingTime,
      closingTime,
      isClosed,
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(docRef, newSettings);
      setMessage({ type: 'success', text: '設定已成功儲存！' });
    } catch (error) {
      console.error("Error saving business hours:", error);
      setMessage({ type: 'error', text: '儲存失敗，請稍後再試。' });
    } finally {
      setIsSaving(false);
    }
  };

  const modifiers = {
    closed: closedDays,
  };

  const modifierStyles = {
    closed: {
      color: '#ef4444', // red-500
      backgroundColor: '#fee2e2', // red-100
    },
  };


  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            營業時間設定
          </h1>
          <Link to="/admin" className="text-sm font-medium text-indigo-600 hover:underline">
            &larr; 返回管理員儀表板
          </Link>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 flex justify-center">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={zhTW}
            className="bg-white p-4 rounded-lg shadow-md"
            modifiers={modifiers}
            modifiersStyles={modifierStyles}
            disabled={{ before: new Date() }}
          />
        </div>
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-bold mb-4">
            設定日期：{selectedDate ? format(selectedDate, 'yyyy年MM月dd日') : '請選擇日期'}
          </h2>
          {isLoading ? (
            <p>正在載入設定...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="is-closed"
                  type="checkbox"
                  checked={isClosed}
                  onChange={(e) => setIsClosed(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="is-closed" className="ml-2 block text-sm font-medium text-gray-900">
                  設為公休日
                </label>
              </div>
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${isClosed ? 'opacity-50' : ''}`}>
                <div>
                  <label htmlFor="opening-time" className="block text-sm font-medium text-gray-700">開店時間</label>
                  <input
                    type="time"
                    id="opening-time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    disabled={isClosed}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label htmlFor="closing-time" className="block text-sm font-medium text-gray-700">關店時間</label>
                  <input
                    type="time"
                    id="closing-time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    disabled={isClosed}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2 font-semibold text-white bg-pink-500 rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-gray-400 transition-colors"
                >
                  {isSaving ? '儲存中...' : '儲存設定'}
                </button>
                {message && (
                  <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {message.text}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HoursSettingsPage;