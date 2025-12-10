import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, isValid } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BusinessHours, TimeSlot } from '../types/businessHours';
import { useBusinessHoursSummary } from '../hooks/useBusinessHoursSummary';
import { useGlobalSettings } from '../hooks/useGlobalSettings';


import 'react-day-picker/style.css';

type Tab = 'daily' | 'global';

const HoursSettingsPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([{ start: '10:00', end: '19:00' }]);
  const [isClosed, setIsClosed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { settings: globalSettings, isLoading: isLoadingGlobalSettings } = useGlobalSettings();
  const [localBookingDeadline, setLocalBookingDeadline] = useState<Date | undefined>();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { closedDays, customSettingDays } = useBusinessHoursSummary() as { closedDays: Date[], customSettingDays: Date[] };
  const [activeTab, setActiveTab] = useState<Tab>('daily');

  useEffect(() => {
    if (globalSettings.bookingDeadline) {
      setLocalBookingDeadline(globalSettings.bookingDeadline);
    }
  }, [globalSettings.bookingDeadline]);

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
    if (!localBookingDeadline) {
      setMessage({ type: 'error', text: '請選擇一個有效的最終預約日。' });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      const globalSettingsRef = doc(db, 'globals', 'settings');      
      await setDoc(globalSettingsRef, { bookingDeadline: Timestamp.fromDate(localBookingDeadline) }, { merge: true });
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
      border: '2px solid #B7AD9E', // primary-light
    },
  };


  return (
    <div className="min-h-screen bg-secondary-light text-text-main">
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {message && (
          <div className={`p-4 mb-6 rounded-lg border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {message.text}
          </div>
        )}
        <div className="border-b border-secondary-dark/30 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button onClick={() => setActiveTab('daily')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'daily' ? 'border-primary text-primary font-bold' : 'border-transparent text-text-light hover:text-text-main hover:border-secondary-dark'}`}>
              每日設定
            </button>
            <button onClick={() => setActiveTab('global')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'global' ? 'border-primary text-primary font-bold' : 'border-transparent text-text-light hover:text-text-main hover:border-secondary-dark'}`}>
              全域設定
            </button>
          </nav>
        </div>

        {activeTab === 'daily' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 flex justify-center">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-secondary-dark/50">
                <style>{`
                  .rdp {
                    --rdp-cell-size: 40px;
                    --rdp-accent-color: #9F9586;
                    --rdp-background-color: #FDFBF7;
                    margin: 0;
                  }
                  .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
                    background-color: #EFECE5;
                    color: #5C5548;
                  }
                  .rdp-day_selected {
                    font-weight: bold;
                  }
                  .rdp-caption_label {
                    font-family: "Noto Serif Display", serif;
                    color: #5C5548;
                    font-size: 1.1rem;
                  }
                `}</style>
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={zhTW}
                  modifiers={modifiers}
                  modifiersStyles={modifierStyles}
                  disabled={{ before: new Date() }}
                />
              </div>
            </div>
            <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-secondary-dark/50">
              <h2 className="text-lg font-serif font-bold text-text-main mb-6 border-b border-secondary-light pb-2">
                設定日期：{selectedDate ? format(selectedDate, 'yyyy年MM月dd日') : '請選擇日期'}
              </h2>
              {isLoading ? (
                <div className="flex justify-center py-10 text-text-light">正在載入設定...</div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center p-4 bg-secondary-light/30 rounded-lg">
                    <input id="is-closed" type="checkbox" checked={isClosed} onChange={(e) => setIsClosed(e.target.checked)} className="h-5 w-5 text-primary border-secondary-dark/50 rounded focus:ring-primary" />
                    <label htmlFor="is-closed" className="ml-3 block text-sm font-medium text-text-main">設為公休日 (不開放預約)</label>
                  </div>
                  
                  {!isClosed && timeSlots.map((slot, index) => (
                    <div key={index} className="p-5 border border-secondary-dark/30 rounded-xl space-y-4 bg-white hover:border-primary/50 transition-colors">
                      <div className="flex justify-between items-center">
                        <p className="font-serif font-medium text-primary">時段 {index + 1}</p>
                        {timeSlots.length > 1 && (<button type="button" onClick={() => removeTimeSlot(index)} className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors">移除</button>)}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor={`start-time-${index}`} className="block text-xs font-medium text-text-light mb-1">開始時間</label>
                          <input type="time" id={`start-time-${index}`} value={slot.start} onChange={(e) => handleTimeSlotChange(index, 'start', e.target.value)} disabled={isClosed} className="block w-full px-3 py-2 bg-secondary-light/20 border border-secondary-dark/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-shadow" />
                        </div>
                        <div>
                          <label htmlFor={`end-time-${index}`} className="block text-xs font-medium text-text-light mb-1">結束時間</label>
                          <input type="time" id={`end-time-${index}`} value={slot.end} onChange={(e) => handleTimeSlotChange(index, 'end', e.target.value)} disabled={isClosed} className="block w-full px-3 py-2 bg-secondary-light/20 border border-secondary-dark/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-shadow" />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {!isClosed && (
                    <button type="button" onClick={addTimeSlot} className="w-full mt-4 px-4 py-3 border border-dashed border-primary/40 text-sm font-medium rounded-xl text-primary bg-white hover:bg-secondary-light/50 transition-colors flex justify-center items-center gap-2">
                      <span>+ 新增營業時段</span>
                    </button>
                  )}
                  
                  <div className="flex items-center justify-end pt-6 border-t border-secondary-light">
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-300 transition-all shadow-sm hover:shadow-md">
                      {isSaving ? '儲存中...' : '儲存當日設定'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'global' && (
          <div>
            <h2 className="text-lg font-serif font-bold text-text-main mb-6 border-b border-secondary-light pb-2">全域預約設定</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-main mb-2">最晚可預約日期</label>                
                {isLoadingGlobalSettings ? <p className="text-text-light">載入中...</p> : (
                  <div className="bg-secondary-light/20 p-4 rounded-xl inline-block border border-secondary-dark/30 w-full flex justify-center">
                     <style>{`
                      .rdp {
                        --rdp-accent-color: #9F9586;
                        --rdp-background-color: #FDFBF7;
                      }
                    `}</style>
                    <DayPicker mode="single" selected={localBookingDeadline} onSelect={setLocalBookingDeadline} locale={zhTW} disabled={{ before: new Date() }} footer={<p className="text-xs text-text-light mt-4 text-center">顧客只能預約此日期（含）之前的時段。</p>} />
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={handleSaveGlobalSettings} disabled={isSaving || isLoadingGlobalSettings} className="px-6 py-2.5 font-medium text-white bg-accent rounded-lg hover:bg-accent-hover disabled:bg-gray-300 transition-all shadow-sm hover:shadow-md">
                  {isSaving ? '儲存中...' : '儲存全域設定'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HoursSettingsPage;