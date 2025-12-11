import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, isValid } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp, collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BusinessHours, TimeSlot } from '../types/businessHours';
import { useAuthStore } from '../store/authStore';
import type { Designer } from '../types/designer';
import type { EnrichedUser } from '../types/user';
import { 
  UserCircleIcon, 
  CalendarDaysIcon, 
  Cog6ToothIcon, 
  ClockIcon,
  ChevronRightIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext'; // NEW IMPORT

import 'react-day-picker/style.css';

type Tab = 'daily' | 'general';

const HoursSettingsPage = () => {
  const { userProfile, currentUser } = useAuthStore();
  const isAdminOrManager = ['admin', 'manager'].includes(userProfile?.role || '');
  const isDesigner = userProfile?.role === 'designer';

  const [designers, setDesigners] = useState<Designer[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<Tab>('daily');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Daily Settings State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([{ start: '10:00', end: '19:00' }]);
  const [isClosed, setIsClosed] = useState(false);
  const [closedDays, setClosedDays] = useState<Date[]>([]);
  const [customSettingDays, setCustomSettingDays] = useState<Date[]>([]);

  // General Settings State
  const [bookingDeadline, setBookingDeadline] = useState<Date | undefined>();
  const { showToast } = useToast();

  // 1. Initialize & Fetch Designers (Sync with Users)
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        let finalDesignersList: Designer[] = [];

        if (isAdminOrManager) {
          // 1. Fetch Users (Client-side filter for safety)
          const usersSnap = await getDocs(collection(db, 'users'));
          const eligibleUsers = usersSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as EnrichedUser))
            .filter(u => ['manager', 'designer'].includes(u.role));

          // 2. Fetch Existing Designers
          const designersSnap = await getDocs(collection(db, 'designers'));
          let currentDesigners = designersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Designer));

          // 3. Sync: Create profiles for users who don't have one
          const newDesigners: Designer[] = [];
          for (const user of eligibleUsers) {
            const existing = currentDesigners.find(d => d.linkedUserId === user.id);
            if (!existing) {
               // Use user.id as doc ID to prevent duplicates (idempotent)
               const newId = user.id;
               const newProfile: Designer = {
                  id: newId,
                  name: user.profile.displayName || '未命名',
                  title: user.role === 'manager' ? '管理設計師' : '設計師',
                  linkedUserId: user.id,
                  isActive: true,
                  displayOrder: 99,
                  avatarUrl: user.profile.avatarUrl || undefined
               };
               // Auto-create in Firestore
               await setDoc(doc(db, 'designers', newId), newProfile);
               newDesigners.push(newProfile);
            }
          }
          
          finalDesignersList = [...currentDesigners, ...newDesigners].sort((a, b) => a.displayOrder - b.displayOrder);

        } else if (isDesigner && currentUser) {
          // Designer: Fetch Own Profile
          const q = query(collection(db, 'designers'), where('linkedUserId', '==', currentUser.uid));
          const snap = await getDocs(q);
          if (!snap.empty) {
            finalDesignersList = [{ id: snap.docs[0].id, ...snap.docs[0].data() } as Designer];
          } else {
             // If designer has no profile (edge case), create one
             // Use uid as doc ID to prevent duplicates
             const newId = currentUser.uid;
             const newProfile: Designer = {
                id: newId,
                name: userProfile?.profile.displayName || '我',
                title: '設計師',
                linkedUserId: currentUser.uid,
                isActive: true,
                displayOrder: 99,
                avatarUrl: userProfile?.profile.avatarUrl || undefined
             };
             await setDoc(doc(db, 'designers', newId), newProfile);
             finalDesignersList = [newProfile];
          }
        }

        setDesigners(finalDesignersList);
        
        // Restore selection or default
        if (finalDesignersList.length > 0) {
            // Keep selected if exists in new list, else select first
            if (!selectedTargetId || !finalDesignersList.find(d => d.id === selectedTargetId)) {
                setSelectedTargetId(finalDesignersList[0].id);
            }
        }
      } catch (e) {
        console.error("Error initializing:", e);
        showToast('初始化設定失敗。', 'error');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [isAdminOrManager, isDesigner, currentUser, userProfile]); // userProfile needed for fallback name

  // 2. Fetch General Settings (Deadline) for Selected Designer
  useEffect(() => {
    if (!selectedTargetId) return;
    
    const fetchGeneralSettings = async () => {
      try {
        const docRef = doc(db, 'designers', selectedTargetId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Designer;
          if (data.bookingDeadline) {
            setBookingDeadline(data.bookingDeadline.toDate());
          } else {
            setBookingDeadline(undefined);
          }
        }
      } catch (e) {
        console.error("Error fetching general settings:", e);
        showToast('讀取基本設定失敗。', 'error');
      }
    };
    fetchGeneralSettings();
  }, [selectedTargetId]);

  // 3. Listen to Calendar Modifiers (Closed Days)
  useEffect(() => {
    if (!selectedTargetId) return;

    const collectionRef = collection(db, `designers/${selectedTargetId}/businessHours`);
    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const closed: Date[] = [];
      const custom: Date[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as BusinessHours;
        const date = new Date(doc.id + 'T00:00:00');
        custom.push(date);
        if (data.isClosed) {
          closed.push(date);
        }
      });
      setClosedDays(closed);
      setCustomSettingDays(custom);
    });

    return () => unsubscribe();
  }, [selectedTargetId]);

  // 4. Fetch Daily Settings
  useEffect(() => {
    if (!selectedDate || !isValid(selectedDate) || !selectedTargetId) return;

    const fetchDaily = async () => {
      const docId = format(selectedDate, 'yyyy-MM-dd');
      const docRef = doc(db, `designers/${selectedTargetId}/businessHours`, docId);

      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as BusinessHours;
          setIsClosed(data.isClosed);
          setTimeSlots(data.timeSlots && data.timeSlots.length > 0 ? data.timeSlots : [{ start: '10:00', end: '19:00' }]);
        } else {
          // Default logic: Reset to standard hours
          setTimeSlots([{ start: '10:00', end: '19:00' }]);
          setIsClosed(false);
        }
      } catch (e) {
        console.error("Error fetching daily settings:", e);
      }
    };
    fetchDaily();
  }, [selectedDate, selectedTargetId]);

  // --- Handlers ---

  const handleSaveDaily = async () => {
    if (!selectedTargetId || !selectedDate || !isValid(selectedDate)) {
      showToast('請先選擇一個有效的日期。', 'warning');
      return;
    }
    setIsSaving(true);
    setMessage(null);

    const docId = format(selectedDate, 'yyyy-MM-dd');
    const docRef = doc(db, `designers/${selectedTargetId}/businessHours`, docId);
    
    const newSettings: BusinessHours = {
      timeSlots: isClosed ? [] : timeSlots,
      isClosed: isClosed,
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(docRef, newSettings);
      showToast('每日設定已儲存', 'success');
    } catch (e) {
      console.error(e);
      showToast('儲存失敗', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGeneral = async () => {
    if (!selectedTargetId) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const docRef = doc(db, 'designers', selectedTargetId);
      await setDoc(docRef, { 
        bookingDeadline: bookingDeadline ? Timestamp.fromDate(bookingDeadline) : null 
      }, { merge: true });
      showToast('基本設定已儲存', 'success');
    } catch (e) {
      console.error(e);
      showToast('儲存失敗', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTimeSlotChange = (index: number, field: 'start' | 'end', value: string) => {
    const newSlots = [...timeSlots];
    newSlots[index][field] = value;
    setTimeSlots(newSlots);
  };

  // --- Render Helpers ---
  const selectedDesignerName = designers.find(d => d.id === selectedTargetId)?.name || '未選擇';

  if (loading) return <LoadingSpinner />;

  if (designers.length === 0) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-secondary-light p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
                <UserCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">無法載入設計師資料</h2>
                <p className="text-gray-500 mb-6">請確認您的帳號權限或聯繫管理員。</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col lg:flex-row">
      
      {/* Sidebar (Desktop) / Header (Mobile) */}
      <aside className="lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex-shrink-0 z-10 flex flex-col h-auto lg:h-screen sticky top-0 lg:static">
        <div className="p-4 lg:p-6 border-b border-gray-100 flex items-center justify-between lg:block">
            <h1 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
                <ClockIcon className="w-6 h-6 text-[#9F9586]" />
                營業時間
            </h1>
            {/* Mobile Designer Dropdown - Only if multiple */}
            {designers.length > 1 && (
                <div className="lg:hidden">
                    <select 
                        value={selectedTargetId || ''} 
                        onChange={(e) => setSelectedTargetId(e.target.value)}
                        className="text-sm border-none bg-gray-50 rounded-lg py-1 px-2 focus:ring-0 font-bold text-gray-700"
                    >
                        {designers.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
        
        {/* Designer List (Desktop) */}
        <div className="hidden lg:flex flex-col gap-2 p-4 overflow-y-auto flex-1">
            {designers.map(d => (
                <button
                    key={d.id}
                    onClick={() => setSelectedTargetId(d.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all w-full text-left
                        ${selectedTargetId === d.id 
                            ? 'bg-[#9F9586] text-white shadow-md transform scale-[1.02]' 
                            : 'hover:bg-gray-50 text-gray-600'
                        }
                    `}
                >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${selectedTargetId === d.id ? 'border-white/30 bg-white/10' : 'border-gray-200 bg-gray-100 text-gray-400'}`}>
                        {d.avatarUrl ? (
                            <img src={d.avatarUrl} alt={d.name} className="w-full h-full rounded-full object-cover" />
                        ) : d.name[0]}
                    </div>
                    <div className="min-w-0">
                        <div className="font-bold truncate">{d.name}</div>
                        <div className={`text-xs truncate ${selectedTargetId === d.id ? 'text-white/80' : 'text-gray-400'}`}>{d.title || '設計師'}</div>
                    </div>
                    {selectedTargetId === d.id && <ChevronRightIcon className="w-4 h-4 ml-auto" />}
                </button>
            ))}
        </div>
        
        {/* Mobile Horizontal Scroll (If Sidebar hidden) - Alternative to Dropdown if preferred, but Dropdown is cleaner for space. keeping dropdown. */}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto h-auto lg:h-screen">
        <div className="max-w-4xl mx-auto pb-20 lg:pb-0">
            {/* Header Area */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {selectedDesignerName}
                        <span className="text-xs font-normal px-2 py-1 bg-gray-100 rounded-full text-gray-500">
                            {activeTab === 'daily' ? '每日排班' : '基本設定'}
                        </span>
                    </h2>
                </div>
                
                {/* Tabs */}
                <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
                    <button
                        onClick={() => setActiveTab('daily')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'daily' ? 'bg-[#9F9586] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="w-4 h-4" />
                            每日排班
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'general' ? 'bg-[#9F9586] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Cog6ToothIcon className="w-4 h-4" />
                            基本設定
                        </div>
                    </button>
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    <span className="text-lg">{message.type === 'success' ? '✓' : '!'}</span>
                    {message.text}
                </div>
            )}

            {/* Daily Settings View */}
            {activeTab === 'daily' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Calendar */}
                    <div className="md:col-span-5 lg:col-span-4">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 sticky top-4">
                            <style>{`
                                .rdp {
                                    --rdp-cell-size: 40px;
                                    --rdp-accent-color: #9F9586;
                                    --rdp-background-color: #FDFBF7;
                                    margin: 0;
                                }
                                .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
                                    background-color: #F5F5F4;
                                }
                                .rdp-day_selected { 
                                    font-weight: bold; 
                                }
                            `}</style>
                            <DayPicker
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                locale={zhTW}
                                modifiers={{
                                    closed: closedDays,
                                    custom: customSettingDays,
                                }}
                                modifiersStyles={{
                                    closed: { color: '#ef4444', backgroundColor: '#fee2e2' },
                                    custom: { fontWeight: 'bold', border: '2px solid #E7E5E4' },
                                }}
                                disabled={{ before: new Date() }}
                            />
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="md:col-span-7 lg:col-span-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="font-bold text-gray-900 text-lg">
                                    {selectedDate ? format(selectedDate, 'yyyy年MM月dd日') : '請選擇日期'}
                                </h3>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                {/* Toggle Closed */}
                                <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${isClosed ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <span className={`font-bold ${isClosed ? 'text-red-700' : 'text-gray-700'}`}>
                                        {isClosed ? '本日公休 / 不開放預約' : '本日正常營業'}
                                    </span>
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isClosed ? 'bg-red-500' : 'bg-gray-300'}`}>
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${isClosed ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="hidden" 
                                        checked={isClosed} 
                                        onChange={(e) => setIsClosed(e.target.checked)} 
                                    />
                                </label>

                                {/* Time Slots */}
                                {!isClosed && (
                                    <div className="space-y-4">
                                        {timeSlots.map((slot, index) => (
                                            <div key={index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end bg-gray-50 p-4 rounded-xl border border-gray-100 animate-fade-in-up">
                                                <div className="w-full sm:w-1/2">
                                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">開始時間</label>
                                                    <input 
                                                        type="time" 
                                                        value={slot.start} 
                                                        onChange={(e) => handleTimeSlotChange(index, 'start', e.target.value)}
                                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#9F9586] outline-none"
                                                    />
                                                </div>
                                                <div className="w-full sm:w-1/2">
                                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">結束時間</label>
                                                    <input 
                                                        type="time" 
                                                        value={slot.end} 
                                                        onChange={(e) => handleTimeSlotChange(index, 'end', e.target.value)}
                                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#9F9586] outline-none"
                                                    />
                                                </div>
                                                {timeSlots.length > 1 && (
                                                    <button 
                                                        onClick={() => {
                                                            const newSlots = timeSlots.filter((_, i) => i !== index);
                                                            setTimeSlots(newSlots);
                                                        }}
                                                        className="text-red-400 hover:text-red-600 p-2 sm:mb-1 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        
                                        <button 
                                            onClick={() => setTimeSlots([...timeSlots, { start: '10:00', end: '19:00' }])}
                                            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-[#9F9586] hover:text-[#9F9586] transition-colors"
                                        >
                                            + 新增時段
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                                <button 
                                    onClick={handleSaveDaily}
                                    disabled={isSaving}
                                    className="px-8 py-3 bg-[#9F9586] text-white font-bold rounded-xl shadow-md hover:bg-[#8a8175] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? '儲存中...' : '儲存設定'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* General Settings View */}
            {activeTab === 'general' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden max-w-2xl mx-auto animate-fade-in">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-900 text-lg">基本預約規則</h3>
                    </div>
                    
                    <div className="p-8 space-y-8">
                        <div>
                            <label className="block font-bold text-gray-900 mb-2">最晚可預約日期 (Booking Deadline)</label>
                            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                                設定顧客可以預約的「最後一天」。<br/>
                                例如：若設定為 12月31日，顧客就無法預約明年1月1日以後的時段。
                                <br/>(通常用於控制開放預約的區間)
                            </p>
                            
                            <div className="flex justify-center bg-[#FAF9F6] p-6 rounded-2xl border border-gray-200">
                                <style>{`
                                    .rdp { --rdp-accent-color: #9F9586; margin: 0; }
                                `}</style>
                                <DayPicker 
                                    mode="single" 
                                    selected={bookingDeadline} 
                                    onSelect={setBookingDeadline} 
                                    locale={zhTW} 
                                    disabled={{ before: new Date() }} 
                                />
                            </div>
                            {bookingDeadline && (
                                <div className="mt-4 text-center text-sm font-medium text-[#9F9586] bg-[#9F9586]/10 py-2 rounded-lg">
                                    目前設定：{format(bookingDeadline, 'yyyy年MM月dd日')}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                        <button 
                            onClick={handleSaveGeneral}
                            disabled={isSaving}
                            className="px-8 py-3 bg-[#9F9586] text-white font-bold rounded-xl shadow-md hover:bg-[#8a8175] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSaving ? '儲存中...' : '儲存基本設定'}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default HoursSettingsPage;
