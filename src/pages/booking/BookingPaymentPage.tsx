import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useGlobalSettings } from '../../hooks/useGlobalSettings';
import { useToast } from '../../context/ToastContext';
import { ChevronLeftIcon, ClipboardDocumentIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import liff from '@line/liff';
import { isLiffBrowser } from '../../lib/liff';

const BookingPaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { settings, isLoading: loadingSettings } = useGlobalSettings();
  const { showToast } = useToast();

  const [booking, setBooking] = useState<any>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;
      try {
        const docRef = doc(db, 'bookings', bookingId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBooking({ id: docSnap.id, ...docSnap.data() });
        } else {
          showToast('找不到訂單', 'error');
          navigate('/dashboard');
        }
      } catch (err) {
        console.error(err);
        showToast('讀取訂單失敗', 'error');
      } finally {
        setLoadingBooking(false);
      }
    };
    fetchBooking();
  }, [bookingId, navigate, showToast]);

  const bankInfo = settings.bankInfo || {
      bankCode: '822',
      bankName: '中國信託',
      accountNumber: '123-456-789012',
      accountName: '美甲沙龍有限公司'
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(bankInfo.accountNumber);
    showToast('已複製銀行帳號', 'success');
  };

  const handleConfirm = async () => {
    if (!bookingId) return;
    if (!note.trim()) {
        showToast('請輸入匯款帳號末五碼', 'error');
        return;
    }
    
    setIsSubmitting(true);
    try {
        const currentUser = (await import('../../lib/firebase')).auth.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        const token = await currentUser.getIdToken();

        const response = await fetch('/api/submit-payment', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                bookingId,
                note
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Payment submission failed');
        }

        // Send LIFF message if in LIFF
        if (isLiffBrowser()) {
            try {
                if (liff.isInClient()) {
                    await liff.sendMessages([{
                        type: 'text',
                        text: `我已匯款! ${note}`
                    }]);
                    console.log('Sent LIFF message for payment report');
                }
            } catch (liffError) {
                console.error('Failed to send LIFF message:', liffError);
            }
        }

        // Send LINE Notification to Admins
        fetch('/api/send-line-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'payment_report',
                bookingId,
                note,
                customerName: booking.customerName || '客戶',
                serviceName: booking.serviceNames?.join(', ') || '一般預約',
                amount: booking.totalAmount || 1000
            })
        }).catch(err => console.error('Failed to send LINE notification:', err));
        
        setIsSuccess(true);
        showToast('付款資訊已送出', 'success');

    } catch (err: any) {
        console.error(err);
        showToast(err.message || '更新失敗，請稍後再試', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loadingBooking || loadingSettings) return <LoadingSpinner fullScreen />;
  
  if (isSuccess) {
      return (
        <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">匯款資訊已送出</h2>
          <p className="text-gray-600 mb-8">
            感謝您的預約！<br/>
            管理員確認款項後，您的預約將會正式成立。
          </p>
          <button 
            onClick={() => navigate(`/orders/${bookingId}`)}
            className="px-6 py-2 bg-[#9F9586] text-white rounded-lg hover:bg-[#8a8174]"
          >
            查看我的預約
          </button>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-gray-600">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 ml-2">支付預約訂金</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        
        {/* Booking Summary */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#EFECE5]">
             <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">預約資訊</h2>
             <div className="space-y-2 text-sm text-gray-700">
                 <div className="flex justify-between">
                     <span className="text-gray-500">日期</span>
                     <span className="font-bold">
                        {booking?.dateTime && format(booking.dateTime.toDate(), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                     </span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-gray-500">服務</span>
                    <span className="font-bold text-right max-w-[60%]">
                        {booking?.serviceNames?.join(', ')}
                    </span>
                 </div>
                 <div className="border-t border-gray-100 my-2 pt-2 flex justify-between items-center">
                    <span className="text-gray-900 font-bold">預約訂金</span>
                    <span className="text-xl font-bold text-[#9F9586]">$1,000</span>
                 </div>
             </div>
             <p className="text-xs text-orange-500 mt-2 bg-orange-50 p-2 rounded">
                *此為預約保留金，將於消費當日折抵總金額。
             </p>
        </div>

        {/* Transfer Info */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#EFECE5]">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">匯款資訊</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span>銀行代碼</span>
              <span className="font-mono font-bold text-gray-800">{bankInfo.bankCode} ({bankInfo.bankName})</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span>銀行帳號</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg text-gray-800">{bankInfo.accountNumber}</span>
                <button
                  onClick={handleCopyAccount}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-purple-600 transition-colors"
                  title="複製帳號"
                >
                  <ClipboardDocumentIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            {bankInfo.note && (
                <div className="bg-purple-50 text-purple-700 p-3 rounded-lg text-xs leading-relaxed">
                    {bankInfo.note}
                </div>
            )}
          </div>
          
          <div className="mt-5">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              匯款帳號末五碼 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="請輸入您的帳號後五碼"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#9F9586] focus:border-transparent outline-none transition-all text-base placeholder:text-sm"
            />
          </div>
        </div>

        <button
            onClick={handleConfirm}
            disabled={isSubmitting || !note.trim()}
            className="w-full py-3.5 bg-[#9F9586] text-white rounded-xl font-bold shadow-lg shadow-orange-900/10 hover:bg-[#8a8174] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-4"
        >
            {isSubmitting ? '處理中...' : '確認已匯款'}
        </button>

      </div>
    </div>
  );
};

export default BookingPaymentPage;
