import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { 
  ChevronLeftIcon, 
  CalendarDaysIcon, 
  ClockIcon, 
  UserCircleIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { bookingStatusTextMap, getBookingStatusChipClass } from '../../utils/bookingUtils';
import { isLiffBrowser } from '../../lib/liff';
import type { BookingStatus } from '../../types/booking'; // Add type import

const MemberOrderDetailPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isLiff = isLiffBrowser();

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;
      try {
        const docRef = doc(db, 'bookings', bookingId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBooking({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  // Fetch Designer Details
  const [designer, setDesigner] = useState<any>(null);

  useEffect(() => {
    const fetchDesigner = async () => {
        if (!booking?.designerId) {
            setDesigner(null);
            return;
        }
        try {
            const designerRef = doc(db, 'designers', booking.designerId);
            const designerSnap = await getDoc(designerRef);
            if (designerSnap.exists()) {
                setDesigner(designerSnap.data());
            }
        } catch (err) {
            console.error(err);
        }
    };
    fetchDesigner();
  }, [booking?.designerId]);

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-500">找不到訂單資訊</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-primary font-bold">
          回首頁
        </button>
      </div>
    );
  }

  const status = booking.status as BookingStatus;
  const statusChipClass = getBookingStatusChipClass(status);
  const statusText = bookingStatusTextMap[status] || status;

  return (
    <div className={`min-h-screen bg-[#FAF9F6] pb-24 ${isLiff ? 'pt-[env(safe-area-inset-top)]' : ''}`}>
      {/* Header */}
      <div className={`bg-white px-4 py-3 shadow-sm sticky z-30 ${isLiff ? 'top-0 pt-2' : 'top-16'}`}>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(-1)}
            className={`p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors ${isLiff ? 'hidden' : ''}`}
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">預約詳情</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Status Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#EFECE5] flex justify-between items-center">
            <div>
                <p className="text-xs text-gray-500 mb-1">訂單編號</p>
                <p className="font-mono font-bold text-gray-700">#{booking.id.slice(-6).toUpperCase()}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-bold rounded-full ${statusChipClass}`}>
                {statusText}
            </span>
        </div>

        {/* Main Info */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#EFECE5] space-y-4">
            {/* Service & Price */}
            <div className="flex justify-between items-start border-b border-gray-50 pb-4">
                <div>
                    <h2 className="font-bold text-lg text-gray-900 mb-1">
                        {booking.serviceNames?.join(' + ')}
                    </h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {booking.items?.flatMap((item: any) => 
                            Object.values(item.options || {}).flat().map((o:any, idx) => (
                                <span key={`${item.id}-${idx}`} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                                    {o.name}
                                </span>
                            ))
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xl font-bold text-[#9F9586]">${booking.amount}</p>
                </div>
            </div>

            {/* Time */}
            <div className="flex items-start gap-3">
                <CalendarDaysIcon className="w-5 h-5 text-[#9F9586] mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-gray-900">
                        {booking.dateTime && format(booking.dateTime.toDate(), 'yyyy年M月d日 (EEEE)', { locale: zhTW })}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{booking.dateTime && format(booking.dateTime.toDate(), 'HH:mm')}</span>
                        <span className="text-gray-300">|</span>
                        <span>約 {booking.duration} 分鐘</span>
                    </div>
                </div>
            </div>

            {/* Designer */}
            <div className="flex items-center gap-3">
                {designer?.avatarUrl ? (
                    <img 
                        src={designer.avatarUrl} 
                        alt={designer.name} 
                        className="w-8 h-8 rounded-full object-cover border border-gray-100"
                    />
                ) : (
                    <UserCircleIcon className="w-8 h-8 text-[#9F9586]" />
                )}
                <span className="text-sm font-bold text-gray-700">
                    設計師：{designer ? designer.name : (booking.designer || '不指定')}
                </span>
            </div>

            
        </div>

        {/* Notes */}
        {(booking.notes) && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#EFECE5]">
                <div className="flex items-center gap-2 mb-3">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                    <h3 className="font-bold text-sm text-gray-700">備註留言</h3>
                </div>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl whitespace-pre-wrap leading-relaxed">
                    {booking.notes}
                </div>
            </div>
        )}

        {/* Actions */}
        <div className="pt-4 space-y-3">
            {booking.status === 'pending_payment' && (
                <button
                    onClick={() => navigate(`/booking/pay/${booking.id}`)}
                    className="w-full py-3.5 bg-[#9F9586] text-white rounded-xl font-bold shadow-lg shadow-orange-900/10 hover:bg-[#8a8174] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <CurrencyDollarIcon className="w-5 h-5" />
                    前往付款
                </button>
            )}

            {booking.status === 'completed' && (
                <button
                    onClick={() => navigate(`/orders/${booking.id}/feedback`)}
                    className="w-full py-3.5 bg-white text-[#9F9586] border border-[#9F9586] rounded-xl font-bold hover:bg-orange-50 active:scale-[0.98] transition-all"
                >
                    {booking.customerFeedback ? '查看評價' : '給予評價'}
                </button>
            )}
            
             {/* Action Buttons */}
             {(!['completed', 'cancelled'].includes(booking.status)) && (() => {
                 // Reschedule restriction logic
                 const now = new Date();
                 const bookingDate = booking.dateTime?.toDate(); // Firestore timestamp
                 const diffInHours = bookingDate ? (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60) : 0;
                 const isWithinRestrictionPeriod = diffInHours < 72;
                 const canReschedule = (!booking.rescheduleCount || booking.rescheduleCount < 1) && !isWithinRestrictionPeriod;

                 return (
                    <div className="flex gap-3">
                         {/* Reschedule Button */}
                         {canReschedule ? (
                            <button
                                onClick={() => navigate(`/member/reschedule/${booking.id}`)}
                                className="flex-1 py-3.5 bg-white text-[#9F9586] border border-[#9F9586] rounded-xl font-bold hover:bg-orange-50 active:scale-[0.98] transition-all"
                            >
                                更改日期
                            </button>
                         ) : (
                             // Optional: Show why? (Within 3 days or limit reached)
                             isWithinRestrictionPeriod ? (
                                <div className="flex-1 py-3.5 bg-gray-100 text-gray-400 border border-gray-200 rounded-xl font-bold text-center text-sm flex items-center justify-center">
                                    3天內無法改期
                                </div>
                             ) : null
                         )}

                         {/* Cancel Button - Always available until completed? */}
                         {/* Assuming cancellation follows different rules or is always allowed pending policy */}
                         {/* For now keeping it simple as separate button */}
                         <button
                            onClick={() => {
                                if (window.confirm('確定要取消此預約嗎？')) {
                                    // Use hook's cancel or Firestore update directly
                                    // Since we don't have useBookings instance here easily without fetching all,
                                    // simpler to just use updateDoc directly as imported in this file.
                                    const cancelRef = doc(db, 'bookings', booking.id);
                                    updateDoc(cancelRef, { status: 'cancelled' })
                                        .then(() => {
                                            setBooking((prev: any) => ({ ...prev, status: 'cancelled' }));
                                            // Optional: Show toast
                                        })
                                        .catch((err: any) => console.error(err));
                                }
                            }}
                            className="flex-1 py-3.5 text-red-500 bg-red-50 rounded-xl font-bold hover:bg-red-100 active:scale-[0.98] transition-all"
                         >
                            取消預約
                         </button>
                    </div>
                 );
             })()}
        </div>
      </div>
    </div>
  );
};

export default MemberOrderDetailPage;
