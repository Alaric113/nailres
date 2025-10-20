import { useBookings } from '../hooks/useBookings';
import LoadingSpinner from '../components/common/LoadingSpinner';

const BookingHistoryPage = () => {
  const { bookings, isLoading, error } = useBookings();

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
          bookings.map((booking) => (
            <div key={booking.id} className="p-4 bg-white rounded-lg shadow-md">
              <div className="flex flex-col justify-between sm:flex-row">
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
                <div className="mt-2 text-right sm:mt-0">
                  <p className="text-lg font-bold text-gray-800">${booking.amount}</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">You have no bookings yet.</p>
        )}
      </div>
    </div>
  );
};

export default BookingHistoryPage;