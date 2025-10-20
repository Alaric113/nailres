import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useBookings } from '../hooks/useBookings';
import LoadingSpinner from '../components/common/LoadingSpinner';

const BookingHistoryPage = () => {
  const { bookings, isLoading, error } = useBookings();
  const [isCancelling, setIsCancelling] = useState<string | null>(null);

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    setIsCancelling(bookingId);
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'cancelled',
      });
      // The useBookings hook will need to be updated to re-fetch data or we can update local state.
      // For now, the user will see the change on next refresh. Let's focus on the update logic first.
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setIsCancelling(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-4xl p-8 mx-auto">
      <h1 className="text-3xl font-bold text-gray-800">My Bookings</h1>
      <div className="mt-8 space-y-4">
        {bookings.length > 0 ? (
          bookings.map((booking) => {
            const isFutureBooking = booking.dateTime.getTime() > new Date().getTime();
            const canCancel = isFutureBooking && booking.status === 'confirmed';

            return (
              <div key={booking.id} className="p-4 bg-white rounded-lg shadow-md">
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {booking.service?.name || 'Unknown Service'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {booking.dateTime.toLocaleString([], {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 sm:items-center sm:flex-row">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800">${booking.amount}</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    {canCancel && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={isCancelling === booking.id}
                        className="px-3 py-1 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed"
                      >
                        {isCancelling === booking.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500">You have no bookings yet.</p>
        )}
      </div>
    </div>
  );
};

export default BookingHistoryPage;