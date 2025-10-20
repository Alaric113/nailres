import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuthStore } from '../store/authStore';
import ServiceSelector from './ServiceSelector';
import TimeSlotPicker from './TimeSlotPicker';
import type { Service } from '../../types/service';
import type { BookingDocument } from '../types/booking';

const BookingForm = () => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedSlot(null); // Reset selected slot when service changes
  };

  const handleSlotSelect = (slot: Date) => {
    setSelectedSlot(slot);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedSlot || !user) {
      setError('Please select a service and a time slot.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newBooking: Omit<BookingDocument, 'createdAt'> = {
        userId: user.uid,
        serviceId: selectedService.id,
        dateTime: selectedSlot,
        status: 'confirmed', // Or 'pending' if admin approval is needed
        amount: selectedService.price,
        paymentStatus: 'unpaid',
      };

      const bookingsCollection = collection(db, 'bookings');
      await addDoc(bookingsCollection, {
        ...newBooking,
        createdAt: serverTimestamp(),
      });

      // On success, navigate to a confirmation or history page
      // For now, let's navigate back to the dashboard.
      alert('Booking successful!');
      navigate('/');
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Failed to create booking. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <ServiceSelector
            selectedServiceId={selectedService?.id || null}
            onServiceSelect={handleServiceSelect}
          />
          <TimeSlotPicker 
            selectedServiceDuration={selectedService?.duration || null}
            onSlotSelect={handleSlotSelect}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="pt-4">
            <button
              type="submit"
              disabled={!selectedService || !selectedSlot || isLoading}
              className="w-full px-4 py-3 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;