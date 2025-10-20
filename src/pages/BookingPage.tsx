import BookingForm from '../components/booking/BookingForm';

const BookingPage = () => {
  return (
    <div className="max-w-4xl p-8 mx-auto">
      <h1 className="text-3xl font-bold text-gray-800">New Booking</h1>
      <p className="mt-2 text-gray-600">Select your service and desired time slot.</p>
      <div className="mt-8">
        <BookingForm />
      </div>
    </div>
  );
};

export default BookingPage;