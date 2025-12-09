import React, { useState } from 'react';
import { collection,  serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import type { Service } from '../../types/service';
import type { BookingStatus } from '../../types/booking';
import { useNavigate } from 'react-router-dom';
import type { Coupon } from '../../types/coupon';

interface BookingFormProps {
  services: Service[];
  dateTime: Date;
  totalPrice: number;
  coupon: Coupon | null;
  onBookingSuccess: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ services, dateTime, totalPrice, coupon, onBookingSuccess }:BookingFormProps) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useAuthStore((state) => state.currentUser);
  const userProfile = useAuthStore((state) => state.userProfile);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('您必須登入才能預約。');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const initialStatus: BookingStatus = userProfile?.role === 'platinum' ? 'pending_confirmation' : 'pending_payment';

    try {
      const batch = writeBatch(db);
      const newBookingRef = doc(collection(db, 'bookings'));

      const serviceIds = services.map(s => s.id);
      const serviceNames = services.map(s => s.name);
      const totalDuration = services.reduce((acc, service) => acc + service.duration, 0);

      // 1. Create new booking document
      batch.set(newBookingRef, {
        userId: currentUser.uid,
        serviceIds,
        serviceNames,
        dateTime: dateTime,
        status: initialStatus,
        amount: totalPrice,
        duration: totalDuration,
        couponId: coupon ? coupon.id : null,
        couponName: coupon ? coupon.title : null,
        createdAt: serverTimestamp(),
        notes: notes,
      });

      // 2. If a coupon was used, update its usage count and mark as used for the user
      if (coupon) {
        const couponRef = doc(db, 'coupons', coupon.id);
        batch.update(couponRef, { usageCount: coupon.usageCount + 1 });

        const userCouponRef = doc(db, 'users', currentUser.uid, 'userCoupons', coupon.id);
        batch.set(userCouponRef, { isUsed: true, usedAt: serverTimestamp() }, { merge: true });
      }

      await batch.commit();

      // 3. Call the Netlify function to send a LINE message
      fetch('/api/send-line-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          serviceNames: serviceNames,
          dateTime: dateTime.toISOString(),
          amount: totalPrice,
          notes: notes,
          status: initialStatus,
        }),
      }).catch(err => console.error('Failed to send LINE notification:', err));

      alert('預約成功！');
      onBookingSuccess();
      navigate('/dashboard'); // Or a confirmation page
    } catch (err) {
      console.error('Booking failed:', err);
      setError('預約失敗，請稍後再試。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-2">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              備註 (選填)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-[#9F9586] focus:ring-[#9F9586] text-sm transition-all"
              placeholder="有特殊需求嗎？例如：需要卸甲、指定美甲師..."
            ></textarea>
          </div>
          
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
          
          <div className="pt-2 pb-24 md:pb-0"> {/* Padding bottom for mobile nav spacing */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-medium">總計費用</span>
              <span className="text-2xl font-bold text-[#9F9586]">${totalPrice}</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-3.5 font-bold text-white bg-[#9F9586] rounded-xl hover:bg-[#8a8173] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9F9586] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >
              {isSubmitting ? '正在提交...' : '確認預約'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;