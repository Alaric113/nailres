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
  ChevronDownIcon, // New
  TrashIcon,
  CheckIcon // New
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react'; // New Imports

import 'react-day-picker/style.css';

type Tab = 'daily' | 'general';

const HoursSettingsPage = () => {
  const { userProfile, currentUser } = useAuthStore();
  const isTrulyAdminUser = userProfile?.role === 'admin';
  const isManagerUser = userProfile?.role === 'manager';
  const isDesignerUser = userProfile?.role === 'designer';
  const canAdminAllDesigners = isTrulyAdminUser || isManagerUser; // Can see/edit all designers

  const [designers, setDesigners] = useState<Designer[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<Tab>('daily');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // Removed [message, setMessage] state

  // Daily Settings State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([{ start: '10:00', end: '19:00' }]);
  const [isClosed, setIsClosed] = useState(false);
  const [closedDays, setClosedDays] = useState<Date[]>([]);
  const [customSettingDays, setCustomSettingDays] = useState<Date[]>([]);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);

  // General Settings State
  const [bookingDeadline, setBookingDeadline] = useState<Date | undefined>();
  const { showToast } = useToast(); // Initialize useToast

  // 1. Initialize & Fetch Designers (Sync with Users)
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        let finalDesignersList: Designer[] = [];

        if (canAdminAllDesigners) {
          // Admin/Manager: Fetch Users with 'manager' or 'designer' roles
          const usersSnap = await getDocs(collection(db, 'users'));
          const eligibleUsers = usersSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as EnrichedUser))
            .filter(u => ['manager', 'designer'].includes(u.role)); // Only manager/designer can have profiles

          // Fetch Existing Designer Profiles
          const designersSnap = await getDocs(collection(db, 'designers'));
          let currentDesigners = designersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Designer));

          // Sync: Create profiles for eligible users who don't have one
          const newDesigners: Designer[] = [];
          for (const user of eligibleUsers) {
            const existing = currentDesigners.find(d => d.linkedUserId === user.id);
            if (!existing) {
               const newId = user.id; // Use user.id as doc ID to prevent duplicates (idempotent)
               const newProfile: Designer = {
                  id: newId,
                  name: user.profile.displayName || '未命名',
                  title: user.role === 'manager' ? '管理設計師' : '設計師',
                  linkedUserId: user.id,
                  isActive: true,
                  displayOrder: 99,
                  avatarUrl: user.profile.avatarUrl || undefined
               };
               await setDoc(doc(db, 'designers', newId), newProfile);
               newDesigners.push(newProfile);
            }
          }
          
          finalDesignersList = [...currentDesigners, ...newDesigners].sort((a, b) => a.displayOrder - b.displayOrder);

        } else if (isDesignerUser && currentUser) {
          // Designer: Fetch Own Profile
          const q = query(collection(db, 'designers'), where('linkedUserId', '==', currentUser.uid));
          const snap = await getDocs(q);
          if (!snap.empty) {
            finalDesignersList = [{ id: snap.docs[0].id, ...snap.docs[0].data() } as Designer];
          } else {
             // If designer has no profile (edge case), create one
             const newId = currentUser.uid; // Use uid as doc ID to prevent duplicates
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
            if (isDesignerUser && currentUser) {
                const myDesigner = finalDesignersList.find(d => d.linkedUserId === currentUser.uid);
                if (myDesigner) setSelectedTargetId(myDesigner.id);
                else showToast('您的設計師檔案尚未建立，無法設定營業時間。', 'error'); // Fallback if profile not created by auto-sync
            } else if (!selectedTargetId || !finalDesignersList.find(d => d.id === selectedTargetId)) {
                setSelectedTargetId(finalDesignersList[0].id);
            }
        } else {
            setSelectedTargetId(null); // No designers available
        }
      } catch (e) {
        console.error("Error initializing:", e);
        showToast('初始化設定失敗。', 'error');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [canAdminAllDesigners, isDesignerUser, currentUser, userProfile, showToast]); // showToast is stable, so okay.

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
  }, [selectedTargetId, showToast]);

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
        showToast('讀取設定失敗！', 'error');
      } // finally { setIsLoading(false); } // Don't set loading to false here, only init does
    };
    fetchDaily();
  }, [selectedDate, selectedTargetId, showToast]);

  // --- Handlers ---

  const handleSaveDaily = async () => {
    if (!selectedTargetId) {
        showToast('請先選擇設計師。', 'warning');
        return;
    }
    if (!selectedDate || !isValid(selectedDate)) {
      showToast('請先選擇一個有效的日期。', 'warning');
      return;
    }
    setIsSaving(true);

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
      setIsCalendarExpanded(true); // Auto expand date picker to choose next date
      // Optional: setSelectedDate(undefined); // If user wants to FORCE re-select. 
      // But keeping it selected allows them to quick-check what they just did. 
      // User said "re-select date", expanding is the key action.
    } catch (e) {
      console.error(e);
      showToast('儲存失敗', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGeneral = async () => {
    if (!selectedTargetId) {
        showToast('請先選擇設計師。', 'warning');
        return;
    }
    setIsSaving(true);

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

  const addTimeSlot = () => {
    setTimeSlots(prev => [...prev, { start: '10:00', end: '19:00' }]);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(prev => prev.filter((_, i) => i !== index));
  };


  // selectedDesigner removed as it is no longer used
  // selectedDesignerName removed as it is no longer used in the simplified header

  if (loading) return <LoadingSpinner />;

  // Display error message if no designer profiles are found for the current user
  if (designers.length === 0 && (isDesignerUser || canAdminAllDesigners)) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-secondary-light p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
                <UserCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">無法載入設計師資料</h2>
                <p className="text-gray-500 mb-6">請確認您的帳號權限或聯繫管理員。</p>
                {isTrulyAdminUser && (
                  <p className="text-sm text-gray-600">管理員帳號不設定營業時間，請為管理設計師或設計師建立檔案。</p>
                )}
            </div>
        </div>
    );
  }
  
  // Conditionally hide selector for plain admin
  const showDesignerSelector = canAdminAllDesigners; // Only admin/manager can select different designers

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col lg:flex-row">
      
      {/* Sidebar (Desktop) / Header (Mobile) */}
      <aside className="lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex-shrink-0 z-10 flex flex-col h-auto lg:h-screen sticky top-0 lg:static">
        <div className="p-4 lg:p-6 border-b border-gray-100 flex items-center justify-between lg:block gap-3">
            {/* Left Side: Icon + Dropdown/Title */}
            <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                <ClockIcon className="w-6 h-6 text-[#9F9586] flex-shrink-0" />
                
                {/* Mobile: Show Dropdown if allowed, else Title */}
                <div className="lg:hidden flex-1 min-w-0 relative">
                    {showDesignerSelector && designers.length > 0 ? (
                        <Listbox value={selectedTargetId} onChange={setSelectedTargetId}>
                            <div className="relative">
                                <ListboxButton className="w-full flex items-center gap-2 text-xl font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0">
                                    <span className="truncate">{designers.find(d => d.id === selectedTargetId)?.name || '選擇設計師'}</span>
                                    <ChevronDownIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                                </ListboxButton>
                                <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-[200px] overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    {designers.map((designer) => (
                                        <ListboxOption
                                            key={designer.id}
                                            value={designer.id}
                                            className={({ active, selected }) =>
                                                `relative cursor-default select-none py-3 pl-10 pr-4 ${
                                                active ? 'bg-[#FAF9F6] text-[#9F9586]' : 'text-gray-900'
                                                } ${selected ? 'font-bold' : 'font-normal'}`
                                            }
                                        >
                                            {({ selected }) => (
                                                <>
                                                    <span className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>
                                                        {designer.name}
                                                    </span>
                                                    {selected ? (
                                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9F9586]">
                                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                        </span>
                                                    ) : null}
                                                </>
                                            )}
                                        </ListboxOption>
                                    ))}
                                </ListboxOptions>
                            </div>
                        </Listbox>
                    ) : (
                        <span className="text-xl font-serif font-bold text-gray-900">營業時間</span>
                    )}
                </div>

                {/* Desktop: Title */}
                <h1 className="hidden lg:flex text-xl font-serif font-bold text-gray-900 items-center gap-2 mt-2 lg:mt-0">
                    <span className="lg:inline">營業時間</span>
                </h1>
            </div>

            {/* Right Side: Tabs (Mobile Only) */}
            <div className="lg:hidden flex-shrink-0">
                <div className="bg-gray-100/80 p-1 rounded-lg flex">
                    <button
                        onClick={() => setActiveTab('daily')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'daily' ? 'bg-white text-[#9F9586] shadow-sm' : 'text-gray-500'}`}
                    >
                        排班
                    </button>
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'general' ? 'bg-white text-[#9F9586] shadow-sm' : 'text-gray-500'}`}
                    >
                        設定
                    </button>
                </div>
            </div>

            {!showDesignerSelector && isDesignerUser && designers.length > 0 && ( // Designer user badge
                 <div className="lg:hidden ml-auto px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium whitespace-nowrap">
                    {designers[0].name}
                </div>
            )}
            {!showDesignerSelector && isTrulyAdminUser && ( // Admin User badge
                <div className="lg:hidden ml-auto px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium whitespace-nowrap">
                    管理員
                </div>
            )}
        </div>
        
        {/* Designer List (Desktop) */}
        {showDesignerSelector && designers.length > 0 && (
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
        )}
        {/* If not showDesignerSelector, but is DesignerUser, still show their info */}
        {!showDesignerSelector && isDesignerUser && designers.length > 0 && (
            <div className="hidden lg:flex flex-col gap-2 p-4 flex-1">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 text-purple-800 border border-purple-200">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                        {designers[0].avatarUrl ? (
                            <img src={designers[0].avatarUrl} alt={designers[0].name} className="w-full h-full object-cover" />
                        ) : designers[0].name[0]}
                    </div>
                    <div className="min-w-0">
                        <div className="font-bold truncate">{designers[0].name}</div>
                        <div className="text-xs truncate text-purple-600">{designers[0].title || '設計師'}</div>
                    </div>
                </div>
            </div>
        )}
        {/* If truly admin, show a message */}
        {!showDesignerSelector && isTrulyAdminUser && (
            <div className="hidden lg:flex flex-col gap-2 p-4 flex-1 items-center justify-center text-center text-gray-500">
                <UserCircleIcon className="w-10 h-10" />
                <p className="text-sm font-medium">純管理帳號不設定個人營業時間</p>
            </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto h-auto lg:h-screen">
        <div className="max-w-4xl mx-auto pb-20 lg:pb-0">
            {/* Header Area - Simplified: Only Tabs (Desktop only now) */}
            <div className="mb-6 hidden lg:flex justify-end">
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

            {/* Daily Settings View */}
            {activeTab === 'daily' && (
                <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                    {/* Collapsible Calendar Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
                        {/* Calendar Header - Always Visible & Clickable */}
                        <button 
                            onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                            className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isCalendarExpanded ? 'bg-[#9F9586] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    <CalendarDaysIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">選擇日期</h3>
                                    <p className="text-sm text-gray-500">
                                        {selectedDate ? format(selectedDate, 'yyyy年MM月dd日 (EEEE)', { locale: zhTW }) : '尚未選擇'}
                                    </p>
                                </div>
                            </div>
                            <ChevronRightIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isCalendarExpanded ? 'rotate-90' : ''}`} />
                        </button>

                        {/* Calendar Body - Collapsible */}
                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isCalendarExpanded ? 'max-h-[500px] opacity-100 border-t border-gray-100' : 'max-h-0 opacity-0'}`}>
                            <div className="p-2 sm:p-6 flex justify-center bg-[#FDFBF7]">
                                <style>{`
                                    .rdp {
                                        --rdp-cell-size: 40px; /* Mobile size */
                                        --rdp-accent-color: #9F9586;
                                        --rdp-background-color: #FDFBF7;
                                        margin: 0;
                                    }
                                    @media (min-width: 640px) {
                                        .rdp {
                                            --rdp-cell-size: 45px; /* Desktop size */
                                        }
                                    }
                                    .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
                                        background-color: #F5F5F4;
                                        font-weight: bold;
                                    }
                                    .rdp-day_selected { 
                                        font-weight: bold; 
                                    }
                                `}</style>
                                <DayPicker
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => {
                                        setSelectedDate(date);
                                        if (date) {
                                            // Auto collapse after short delay
                                            setTimeout(() => setIsCalendarExpanded(false), 200);
                                        }
                                    }}
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
                    </div>

                    {/* Settings Editor - Unfolds when Calendar Collapses */}
                    <div className={`transition-all duration-500 ease-out ${!isCalendarExpanded && selectedDate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none hidden'}`}>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                    <Cog6ToothIcon className="w-5 h-5 text-[#9F9586]" />
                                    設定當日營業時間
                                </h3>
                                <button 
                                    onClick={() => setIsCalendarExpanded(true)}
                                    className="text-sm text-[#9F9586] hover:text-[#8a7f70] font-medium"
                                >
                                    重新選擇日期
                                </button>
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
                                                        onClick={() => removeTimeSlot(index)}
                                                        className="text-red-400 hover:text-red-600 p-2 sm:mb-1 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        
                                        <button 
                                            onClick={addTimeSlot}
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
                    
                    <div className="p-4 sm:p-8 space-y-8">
                        <div>
                            <label className="block font-bold text-gray-900 mb-2">最晚可預約日期 (Booking Deadline)</label>
                            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                                設定顧客可以預約的「最後一天」。<br/>
                                例如：若設定為 12月31日，顧客就無法預約明年1月1日以後的時段。
                                <br/>(通常用於控制開放預約的區間)
                            </p>
                            
                            <div className="w-full flex justify-center bg-[#FAF9F6] p-2 sm:p-6 rounded-2xl border border-gray-200">
                                <style>{`
                                    .rdp { --rdp-accent-color: #9F9586; margin: 0; --rdp-cell-size: 40px; }
                                    @media (min-width: 640px) {
                                        .rdp { --rdp-cell-size: 45px; }
                                    }
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