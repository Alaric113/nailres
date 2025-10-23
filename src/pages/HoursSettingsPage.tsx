import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { format, isValid } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BusinessHours, TimeSlot } from '../types/businessHours';
import { useBusinessHoursSummary } from '../hooks/useBusinessHoursSummary';

import 'react-day-picker/dist/style.css';

type Tab = 'daily' | 'global';

const HoursSettingsPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([{ start: '10:00', end: '19:00' }]);
  const [isClosed, setIsClosed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bookingDeadline, setBookingDeadline] = useState<Date | undefined>();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { closedDays, customSettingDays } = useBusinessHoursSummary() as { closedDays: Date[], customSettingDays: Date[] };
  const [activeTab, setActiveTab] = useState<Tab>('daily');

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
          setIsClosed(data.isClosed);
          setTimeSlots(data.timeSlots && data.timeSlots.length > 0 ? data.timeSlots : [{ start: '10:00', end: '19:00' }]);
        } else {
          // Reset to default if no setting exists for the day
          setTimeSlots([{ start: '10:00', end: '19:00' }]);
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

  // Fetch global settings
  useEffect(() => {
    const fetchGlobalSettings = async () => {
      const globalSettingsRef = doc(db, 'globals', 'settings');
      const docSnap = await getDoc(globalSettingsRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.bookingDeadline) {
          setBookingDeadline(data.bookingDeadline.toDate());
        }
      }
    };
    fetchGlobalSettings();
  }, []);

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
      timeSlots: isClosed ? [] : timeSlots,
      isClosed: isClosed,
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

  const handleSaveGlobalSettings = async () => {
    if (!bookingDeadline) {
      setMessage({ type: 'error', text: '請選擇一個有效的最終預約日。' });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      const globalSettingsRef = doc(db, 'globals', 'settings');
      await setDoc(globalSettingsRef, { bookingDeadline }, { merge: true });
      setMessage({ type: 'success', text: '全域設定已成功儲存！' });
    } catch (error) {
      setMessage({ type: 'error', text: '儲存全域設定失敗！' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTimeSlotChange = (index: number, field: 'start' | 'end', value: string) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[index][field] = value;
    setTimeSlots(newTimeSlots);
  };

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { start: '10:00', end: '19:00' }]);
  };

  const removeTimeSlot = (index: number) => {
    const newTimeSlots = timeSlots.filter((_, i) => i !== index);
    setTimeSlots(newTimeSlots);
  };

  const modifiers = {
    closed: closedDays,
    custom: customSettingDays,
  };

  const modifierStyles = {
    closed: {
      color: '#ef4444', // red-500
      backgroundColor: '#fee2e2', // red-100
    },
    custom: {
      fontWeight: 'bold',
      border: '2px solid #f9a8d4', // pink-300
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
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {message && (
          <div className={`p-4 mb-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button onClick={() => setActiveTab('daily')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'daily' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              每日設定
            </button>
            <button onClick={() => setActiveTab('global')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'global' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              全域設定
            </button>
          </nav>
        </div>

        {activeTab === 'daily' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                    <input id="is-closed" type="checkbox" checked={isClosed} onChange={(e) => setIsClosed(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                    <label htmlFor="is-closed" className="ml-2 block text-sm font-medium text-gray-900">設為公休日</label>
                  </div>
                  {!isClosed && timeSlots.map((slot, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-md space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-gray-700">時段 {index + 1}</p>
                        {timeSlots.length > 1 && (<button type="button" onClick={() => removeTimeSlot(index)} className="text-red-500 hover:text-red-700 text-sm font-medium">移除</button>)}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor={`start-time-${index}`} className="block text-sm font-medium text-gray-700">開始時間</label>
                          <input type="time" id={`start-time-${index}`} value={slot.start} onChange={(e) => handleTimeSlotChange(index, 'start', e.target.value)} disabled={isClosed} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50" />
                        </div>
                        <div>
                          <label htmlFor={`end-time-${index}`} className="block text-sm font-medium text-gray-700">結束時間</label>
                          <input type="time" id={`end-time-${index}`} value={slot.end} onChange={(e) => handleTimeSlotChange(index, 'end', e.target.value)} disabled={isClosed} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {!isClosed && (<button type="button" onClick={addTimeSlot} className="w-full mt-4 px-4 py-2 border border-dashed border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">+ 新增營業時段</button>)}
                  <div className="flex items-center justify-end pt-4">
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 font-semibold text-white bg-pink-500 rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-gray-400 transition-colors">{isSaving ? '儲存中...' : '儲存當日設定'}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'global' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-bold mb-4">全域預約設定</h2>
            <div className="max-w-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最晚可預約日期</label>
                <DayPicker mode="single" selected={bookingDeadline} onSelect={setBookingDeadline} locale={zhTW} disabled={{ before: new Date() }} footer={<p className="text-xs text-gray-500 mt-2">顧客只能預約此日期（含）之前的時段。</p>} />
              </div>
              <button onClick={handleSaveGlobalSettings} disabled={isSaving} className="px-4 py-2 font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 disabled:bg-gray-400">{isSaving ? '儲存中...' : '儲存全域設定'}</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HoursSettingsPage;