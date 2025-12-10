import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAllBookings, type EnrichedBooking } from '../hooks/useAllBookings';
import type { BookingStatus } from '../types/booking';
import LoadingSpinner from '../components/common/LoadingSpinner';




const OrderManagementPage = () => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const statusFilter = queryParams.get('status') as BookingStatus | null;

  const { bookings, loading, error } = useAllBookings(null); // Fetch all bookings

  const filteredBookings = useMemo(() => {
    if (!statusFilter) return [];
    return bookings
      .filter(b => b.status === statusFilter)
      .sort((a, b) => {
        // Show most recent completed bookings first
        if (statusFilter === 'completed') {
          return b.dateTime.getTime() - a.dateTime.getTime();
        }
        // Show oldest pending bookings first for other statuses
        return a.dateTime.getTime() - b.dateTime.getTime();
      });
  }, [bookings, statusFilter]);

  // 輔助函式：發放點數
  const grantLoyaltyPoints = async (batch: ReturnType<typeof writeBatch>, booking: EnrichedBooking) => {
    if (!booking.userId || booking.amount <= 0) return;

    const settingsRef = doc(db, 'globals', 'settings');
    const settingsSnap = await getDoc(settingsRef);
    const loyaltySettings = settingsSnap.data()?.loyaltySettings;

    if (loyaltySettings && loyaltySettings.pointsPerAmount > 0) {
      const pointsEarned = Math.floor(booking.amount / loyaltySettings.pointsPerAmount);

      if (pointsEarned > 0) {
        const userRef = doc(db, 'users', booking.userId);
        const userSnap = await getDoc(userRef);
        const currentPoints = userSnap.data()?.loyaltyPoints || 0;
        batch.update(userRef, { loyaltyPoints: currentPoints + pointsEarned });

        const logRef = doc(db, 'loyaltyPointLogs', `${booking.id}_${Date.now()}`);
        batch.set(logRef, {
          userId: booking.userId,
          pointsChange: pointsEarned,
          reason: `完成預約 #${booking.id.substring(0, 6)}`,
          createdAt: new Date(),
        });
      }
    }
  };

  // 輔助函式：發送 LINE 通知
  const sendLineNotification = (booking: EnrichedBooking, status: BookingStatus) => {
    fetch('/api/send-line-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: booking.id, // 傳遞 bookingId 可能更有用
        status: status,
      }),
    }).catch(err => console.error("Failed to send LINE notification:", err));
  };

  const handleUpdateStatus = async (booking: EnrichedBooking, newStatus: BookingStatus) => {
    setUpdatingId(booking.id);
    try {
      const batch = writeBatch(db);

      // 步驟 1: 更新訂單狀態
      const bookingRef = doc(db, 'bookings', booking.id);
      batch.update(bookingRef, { status: newStatus });

      // 步驟 2: 如果是「已完成」，則發放點數
      if (newStatus === 'completed' && booking.userId && booking.amount > 0) {
        await grantLoyaltyPoints(batch, booking);
      }

      // 步驟 3: 提交所有資料庫更新
      await batch.commit();

      // 步驟 4: 呼叫後端 API 發送 LINE 通知給使用者
      if (['confirmed', 'completed', 'cancelled'].includes(newStatus)) {
        // 注意：這裡的 fetch 是非同步的，但我們不需要等待它完成 (fire and forget)
        // 所以不需要加 await，這樣可以讓 UI 更快地解除鎖定狀態
        sendLineNotification(booking, newStatus);
      }

    } catch (error) {
      console.error("Failed to update booking status:", error);
      alert('更新訂單狀態失敗！');
    } finally {
      setUpdatingId(null);
    }
  };

  const renderButtons = (booking: EnrichedBooking) => {
    const isUpdating = updatingId === booking.id;
    switch (booking.status) {
      case 'pending_confirmation':
        return (
          <div className="flex gap-2">
            <button onClick={() => handleUpdateStatus(booking, 'confirmed')} disabled={isUpdating} className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors shadow-sm">{isUpdating ? '...' : '確認'}</button>
            <button onClick={() => handleUpdateStatus(booking, 'cancelled')} disabled={isUpdating} className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:bg-gray-300 transition-colors shadow-sm">{isUpdating ? '...' : '取消'}</button>
          </div>
        );
      case 'pending_payment':
        return <button onClick={() => handleUpdateStatus(booking, 'confirmed')} disabled={isUpdating} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-sm">{isUpdating ? '...' : '標記已付'}</button>;
      case 'confirmed':
        return <button onClick={() => handleUpdateStatus(booking, 'completed')} disabled={isUpdating} className="px-3 py-1.5 text-xs font-medium text-white bg-primary-dark rounded-lg hover:bg-primary disabled:bg-gray-300 transition-colors shadow-sm">{isUpdating ? '...' : '標記完成'}</button>;
      default:
        return null;
    }
  };

  

  if (loading) return <div className="flex justify-center items-center h-screen bg-secondary-light"><LoadingSpinner /></div>;
  if (error) return <div className="text-red-500 text-center mt-10">讀取訂單時發生錯誤: {error}</div>;

  return (
    <div className="min-h-screen bg-secondary-light text-text-main">
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl shadow-sm border border-secondary-dark overflow-hidden">
          <div className="max-h-[75vh] overflow-y-auto p-2">
            {filteredBookings.length > 0 ? filteredBookings.map(b => (
              <div key={b.id} className="p-4 border-b border-secondary-light last:border-b-0 hover:bg-secondary-light/20 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <p className="font-medium text-text-main mb-1">
                    {b.userName} <span className="text-text-light mx-1">|</span> {b.serviceNames.join(', ')} <span className="text-text-light mx-1">|</span> <span className="text-accent font-bold">${b.amount}</span>
                  </p>
                  <p className="text-xs text-text-light font-mono tracking-wide">
                    {format(b.dateTime, 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                  </p>
                </div>
                <div className="flex gap-2 self-end sm:self-center">{renderButtons(b)}</div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-text-light">
                <p className="text-lg font-serif">沒有符合條件的訂單</p>
                <p className="text-sm opacity-60">目前此類別下沒有任何資料</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderManagementPage;
