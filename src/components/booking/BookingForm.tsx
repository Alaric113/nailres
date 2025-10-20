import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import type { Service } from '../../types/service';
import { useNavigate } from 'react-router-dom';

interface BookingFormProps {
  service: Service;
  dateTime: Date;
  onBookingSuccess: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ service, dateTime, onBookingSuccess }) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('您必須登入才能預約。');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'bookings'), {
        userId: currentUser.uid,
        serviceId: service.id,
        dateTime: dateTime, // Directly pass the JavaScript Date object
        status: 'confirmed', // Or 'pending' if you need confirmation
        amount: service.price,
        paymentStatus: 'unpaid',
        createdAt: serverTimestamp(),
        notes: notes,
      });
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
    <div className="p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">預約詳情</h3>
            <p>服務項目: {service.name}</p>
            <p>價格: ${service.price}</p>
            <p>時間: {dateTime.toLocaleString('zh-TW')}</p>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              備註 (選填)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="有特殊需求嗎？例如：需要卸甲"
            ></textarea>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-3 font-semibold text-white bg-pink-500 rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-pink-300 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? '正在提交...' : '確認預約'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;