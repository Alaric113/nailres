
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { updateBookingStatus } from '../utils/bookingActions';
import type { BookingDocument, BookingStatus, BookingItem } from '../types/booking';
import type { UserDocument } from '../types/user';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import ImageUploader from '../components/admin/ImageUploader';
import { ChevronLeftIcon, CheckIcon, ChevronDownIcon, UserIcon, CalendarIcon, SparklesIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface ServiceDetail {
  id: string;
  name: string;
  category: string; // '美甲' | '美睫' | '霧眉' etc.
}
interface EnrichedBookingDetail extends BookingDocument {
  id: string;
  userName?: string;
  userPhotoUrl?: string | null;
  designerName?: string;
  designerPhotoUrl?: string | null;
  serviceDetails?: ServiceDetail[];
  items?: BookingItem[]; // Ensure items is part of the type
}

const OrderEditPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [booking, setBooking] = useState<EnrichedBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Status Management
  const [status, setStatus] = useState<BookingStatus | ''>('');

  // Time Edit Modal State
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  // Portfolio Management State: Map of service index to portfolio data
  // Using index as key because serviceIds might be duplicated or missing in early versions
  const [portfolioData, setPortfolioData] = useState<{
    [key: number]: {
      imageUrl: string;
      title: string;
      category: string;
      description: string;
      isSaved: boolean;
    }
  }>({});

  useEffect(() => {
    if (!orderId) return;

    const fetchBooking = async () => {
      try {
        const docRef = doc(db, 'bookings', orderId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as BookingDocument;
          let userName = '未知使用者';
          let userPhotoUrl = null;
          let designerName = '未指定';
          let designerPhotoUrl = null;

          // 1. Fetch User
          if (data.userId) {
            const userRef = doc(db, 'users', data.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data() as UserDocument;
              userName = userData.profile?.displayName || '未知使用者';
              userPhotoUrl = userData.profile?.avatarUrl || null;
            }
          }

          // 2. Fetch Designer
          if (data.designerId) {
             const designerRef = doc(db, 'designers', data.designerId);
             const designerSnap = await getDoc(designerRef);
             if (designerSnap.exists()) {
                 const designerData = designerSnap.data();
                 designerName = designerData?.name || '未知設計師';
                 designerPhotoUrl = designerData?.avatarUrl || null;
             }
          }

          // 3. Fetch Services (to get correct category)
          const servicePromises = data.serviceIds.map(async (sid, idx) => {
              const serviceRef = doc(db, 'services', sid);
              const serviceSnap = await getDoc(serviceRef);
              if (serviceSnap.exists()) {
                  const sData = serviceSnap.data();
                  return {
                      id: sid,
                      name: sData.title || data.serviceNames[idx], 
                      category: sData.category || '美甲' 
                  };
              } else {
                  return {
                      id: sid,
                      name: data.serviceNames[idx],
                      category: '美甲'
                  }; 
              }
          });
          
          const fetchedServices = await Promise.all(servicePromises);
          
          setBooking({ 
              id: docSnap.id, 
              ...data, 
              userName, 
              userPhotoUrl,
              designerName,
              designerPhotoUrl,
              serviceDetails: fetchedServices
          });
          setStatus(data.status);
          
          // Init Edit Time Fields
          const bookingDate = (data.dateTime as Timestamp).toDate();
          setEditDate(format(bookingDate, 'yyyy-MM-dd'));
          setEditTime(format(bookingDate, 'HH:mm'));

          // Initialize portfolio forms
          const initialData: any = {};
          fetchedServices.forEach((service, index) => {
            initialData[index] = {
              imageUrl: '',
              title: service.name, // Title = Service Name (No Date)
              category: service.category, // Category = Service Category
              description: '',
              isSaved: false
            };
          });
          setPortfolioData(initialData);

        } else {
          showToast('找不到此訂單', 'error');
          navigate('/admin/orders');
        }
      } catch (err) {
        console.error(err);
        showToast('載入失敗', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [orderId, navigate, showToast]);

  const sendLineNotification = (status: BookingStatus) => {
    if (!booking) return;
    fetch('/api/send-line-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: booking.id,
        type: 'booking_notification',
        userId: booking.userId,
        serviceNames: booking.serviceNames,
        dateTime: (booking.dateTime as Timestamp).toDate().toISOString(),
        amount: booking.amount,
        status: status
      }),
    }).catch(err => console.error("Failed to send LINE notification:", err));
  };

  const handleStatusUpdate = async () => {
    if (!booking || !status) return;
    setSaving(true);
    try {
      // Use centralized utility to handle status change + pass deduction/refund
      await updateBookingStatus(booking.id, status as BookingStatus);

      showToast('訂單狀態已更新', 'success');
      setBooking(prev => prev ? { ...prev, status: status as BookingStatus } : null);
      
      // Send Notification
      if (['confirmed', 'completed', 'cancelled'].includes(status)) {
         sendLineNotification(status as BookingStatus);
      }

    } catch (err) {
      console.error(err);
      showToast('狀態更新失敗', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePortfolioSave = async (index: number) => {
    const data = portfolioData[index];
    if (!data.imageUrl) {
      showToast('請先上傳照片', 'warning');
      return;
    }
    if (!booking) return;

    setSaving(true);
    try {
      await addDoc(collection(db, 'portfolioItems'), {
        title: data.title,
        description: data.description,
        category: data.category,
        imageUrls: [data.imageUrl], // Array format
        order: 0, // Default order
        isActive: true,
        createdAt: serverTimestamp(),
        
        // Linkage
        orderId: booking.id,
        serviceName: booking.serviceNames[index],
        serviceId: booking.serviceIds[index] || '',
        designerId: booking.designerId || '',
        designerName: booking.designerName || '',
        customerName: booking.userName || '',
        bookingDate: booking.dateTime,
      });

      setPortfolioData(prev => ({
        ...prev,
        [index]: { ...prev[index], isSaved: true }
      }));
      showToast(`已成功建立作品集：${data.title}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('建立作品集失敗', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTimeUpdate = async () => {
      if (!booking || !editDate || !editTime) return;
      setSaving(true);
      try {
          const newDateTimeString = `${editDate}T${editTime}:00`;
          const newDate = new Date(newDateTimeString);
          const newTimestamp = Timestamp.fromDate(newDate);

          const docRef = doc(db, 'bookings', booking.id);
          await updateDoc(docRef, { dateTime: newTimestamp });
          
          setBooking(prev => prev ? { ...prev, dateTime: newTimestamp } : null);
          showToast('預約時間已更新', 'success');
          setIsTimeModalOpen(false);
      } catch (err) {
          console.error(err);
          showToast('更新失敗', 'error');
      } finally {
          setSaving(false);
      }
  };

  const updatePortfolioField = (index: number, field: string, value: any) => {
    setPortfolioData(prev => ({
      ...prev,
      [index]: { ...prev[index], [field]: value }
    }));
  };

  // Collapsible Logic
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0])); // Start with first expanded
  
  const toggleItem = (index: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  if (loading) return <div className="min-h-screen bg-[#FAF9F6] pt-20 flex justify-center"><LoadingSpinner /></div>;
  if (!booking) return null;

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24 pt-4 md:pt-8">
      <div className="container mx-auto px-4 max-w-3xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/orders')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-serif font-bold text-gray-900">編輯訂單</h1>
          <span className="text-sm text-gray-500 font-mono">#{booking.id.slice(0, 6)}</span>
        </div>

        {/* Order Info Card */}
        {/* Order Info Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50">
          <div className="space-y-6">
            
            {/* Row 1: Client & Designer */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {booking.userPhotoUrl ? (
                    <img src={booking.userPhotoUrl} alt="Client" className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                  ) : (
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                      <UserIcon className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">客戶</label>
                  <p className="text-base font-bold text-gray-900">{booking.userName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                   {booking.designerPhotoUrl ? (
                     <img src={booking.designerPhotoUrl} alt="Designer" className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                   ) : (
                      <div className="p-2 bg-[#9F9586]/10 rounded-lg text-[#9F9586]">
                        <SparklesIcon className="w-5 h-5" />
                      </div>
                   )}
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">設計師</label>
                   <p className="text-base font-bold text-gray-900">{booking.designerName}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-50"></div>

            {/* Row 2: Date & Services */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                 <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                    <CalendarIcon className="w-5 h-5" />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">預約時間</label>
                    <div className="flex items-center gap-2">
                        <p className="text-base font-medium text-gray-900 font-mono">
                        {format((booking.dateTime as Timestamp).toDate(), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                        </p>
                        <button 
                            onClick={() => setIsTimeModalOpen(true)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-[#9F9586]"
                        >
                            <PencilSquareIcon className="w-4 h-4" />
                        </button>
                    </div>
                 </div>
              </div>

              <div>
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">服務項目</label>
                 <div className="flex flex-col gap-2 w-full">
                    {(booking.items && booking.items.length > 0) ? (
                        booking.items.map((item, i) => (
                            <div key={i} className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="text-sm font-bold text-gray-800">{item.serviceName}</div>
                                {item.options && Object.keys(item.options).length > 0 && (
                                     <div className="mt-1 flex flex-wrap gap-1">
                                        {Object.entries(item.options).map(([cat, opts]) => (
                                            opts.map((opt, optIdx) => (
                                                <span key={`${cat}-${optIdx}`} className="text-xs text-gray-500 bg-white border border-gray-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <span className="text-gray-400">{cat}:</span>
                                                    {opt.name}
                                                </span>
                                            ))
                                        ))}
                                     </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {booking.serviceDetails?.map((s, i) => (
                                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium border border-gray-200">
                                    {s.name}
                                </span>
                            ))}
                        </div>
                    )}
                 </div>
              </div>
            </div>

            {/* Row 3: Status Action */}
            <div className="bg-gray-50 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="w-full md:w-auto">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">訂單狀態</label>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      status === 'completed' ? 'bg-green-500' :
                      status === 'confirmed' ? 'bg-[#9F9586]' :
                      status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></span>
                    <span className="text-sm font-bold text-gray-700">
                      {status === 'pending_payment' && '待付款'}
                      {status === 'pending_confirmation' && '待確認'}
                      {status === 'confirmed' && '已確認'}
                      {status === 'completed' && '已完成'}
                      {status === 'cancelled' && '已取消'}
                    </span>
                  </div>
               </div>

               <div className="flex w-full md:w-auto gap-2">
                 <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BookingStatus)}
                    className="flex-1 md:w-48 p-2 text-sm border-gray-300 rounded-lg focus:ring-[#9F9586] focus:border-[#9F9586]"
                  >
                    <option value="pending_payment">待付款</option>
                    <option value="pending_confirmation">待確認</option>
                    <option value="confirmed">已確認</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                  </select>
                  <button 
                    onClick={handleStatusUpdate}
                    disabled={status === booking.status || saving}
                    className={`px-4 py-2 rounded-lg font-bold text-sm text-white transition-colors whitespace-nowrap ${
                      status === booking.status 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-[#9F9586] hover:bg-[#8a8175] shadow-sm'
                    }`}
                  >
                    更新狀態
                  </button>
               </div>
            </div>

          </div>
        </div>

        {/* Portfolio Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-6 bg-[#9F9586] rounded-full"></span>
              建立作品集
            </h2>
            <p className="text-sm text-gray-500 mt-1">針對此訂單的服務項目上傳成果照片，系統將自動連結。</p>
          </div>

          <div className="space-y-8">
            {booking.serviceNames.map((serviceName, index) => {
              const form = portfolioData[index];
              if (!form) return null;
              const isExpanded = expandedItems.has(index);

              return (
                <div key={index} className={`rounded-2xl border transition-all ${
                  isExpanded ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#FAF9F6] border-transparent hover:bg-gray-50'
                }`}>
                  {/* Collapsible Header */}
                  <button 
                    onClick={() => toggleItem(index)}
                    className="w-full flex items-center justify-between p-4 focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isExpanded ? 'bg-[#9F9586] text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="text-left">
                        <h3 className={`font-bold transition-colors ${isExpanded ? 'text-gray-900' : 'text-gray-600'}`}>
                          {serviceName}
                        </h3>
                        {form.isSaved && (
                          <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-0.5">
                            <CheckIcon className="w-3 h-3" /> 已建立作品集
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className={`p-1 rounded-full transition-transform duration-200 ${isExpanded ? 'bg-gray-100 rotate-180' : 'bg-transparent'}`}>
                       <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-5 pt-0 border-t border-gray-100 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        {/* Left: Image Upload */}
                        <div>
                            <ImageUploader
                                label="作品照片"
                                imageUrl={form.imageUrl}
                                onImageUrlChange={(url) => updatePortfolioField(index, 'imageUrl', url)}
                                storagePath="portfolio" 
                              />
                        </div>

                        {/* Right: Details Form */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">作品標題</label>
                            <input
                              type="text"
                              value={form.title}
                              readOnly
                              className="w-full p-2 border border-gray-200 bg-gray-100 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">分類</label>
                            <select
                              value={form.category}
                              disabled={true}
                              className="w-full p-2 border border-gray-200 bg-gray-100 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                            >
                              <option value="美甲">美甲 (Nail)</option>
                              <option value="美睫">美睫 (Eyelash)</option>
                              <option value="霧眉">霧眉 (Eyebrow)</option>
                              <option value={form.category}>{form.category}</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">描述 (選填)</label>
                            <textarea
                              value={form.description}
                              onChange={(e) => updatePortfolioField(index, 'description', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg text-sm h-20 resize-none"
                              placeholder="簡易描述作品特色..."
                              disabled={form.isSaved}
                            />
                          </div>

                          <button
                            onClick={() => handlePortfolioSave(index)}
                            disabled={saving || form.isSaved || !form.imageUrl}
                            className={`w-full py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all ${
                              form.isSaved
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : !form.imageUrl
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-white border-2 border-[#9F9586] text-[#9F9586] hover:bg-[#9F9586] hover:text-white'
                            }`}
                          >
                            {form.isSaved ? '已儲存至作品集' : '儲存至作品集'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Time Edit Modal */}
      {isTimeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl scale-100 animate-scale-in">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">修改預約時間</h3>
                    <button onClick={() => setIsTimeModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                        <XMarkIcon className="w-6 h-6 text-gray-400" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                        <input 
                            type="date" 
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-[#9F9586] focus:border-[#9F9586]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">時間</label>
                        <input 
                            type="time" 
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-[#9F9586] focus:border-[#9F9586]"
                        />
                    </div>
                    
                    <div className="pt-2 flex gap-3">
                        <button 
                            onClick={() => setIsTimeModalOpen(false)}
                            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
                        >
                            取消
                        </button>
                        <button 
                            onClick={handleTimeUpdate}
                            disabled={saving}
                            className="flex-1 py-2.5 rounded-lg bg-[#9F9586] text-white font-bold text-sm hover:bg-[#8a8175] transition-colors shadow-sm disabled:opacity-50"
                        >
                            {saving ? '更新中...' : '確認修改'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default OrderEditPage;
