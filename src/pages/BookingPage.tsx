import { useState } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import ServiceSelector from '../components/booking/ServiceSelector';
import TimeSlotSelector from '../components/booking/TimeSlotSelector';
import BookingForm from '../components/booking/BookingForm';
import type { Service } from '../types/service';
import CalendarSelector from '../components/booking/CalendarSelector';
import { useBusinessHoursSummary } from '../hooks/useBusinessHoursSummary';

const BookingPage = () => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [activeStep, setActiveStep] = useState<'service' | 'date' | 'time' | 'confirm'>('service');
  
  const { closedDays, loading: isLoadingClosedDays } = useBusinessHoursSummary();
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedTime(null); // Reset time when service changes
    setActiveStep('date');
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset time when date changes
    setActiveStep('time');
  };

  const handleTimeSelect = (time: Date) => {
    setSelectedTime(time);
    setActiveStep('confirm');
  };

  const handleBookingSuccess = () => {
    // Reset selections after a successful booking
    setSelectedService(null);
    setSelectedDate(new Date());
    setSelectedTime(null);
    setActiveStep('service');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center max-w-4xl">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            預約服務
          </h1>
          <Link to="/dashboard" className="text-sm font-medium text-indigo-600 hover:underline">
            &larr; 返回儀表板
          </Link>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
        <div className="text-center mb-12">
          <p className="text-lg text-gray-600 mt-2">請依序選擇您想要的服務、日期與時段</p>
        </div>

        <div className="space-y-8">
          {/* --- Step 1: Service Selection --- */}
          <div className={`p-6 bg-white rounded-lg shadow-md transition-all ${selectedService && activeStep !== 'service' ? 'cursor-pointer hover:bg-gray-50' : ''}`} onClick={() => selectedService && activeStep !== 'service' && setActiveStep('service')}>
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">1. 選擇服務項目</h2>
            </div>
            {selectedService && activeStep !== 'service' && (
              <div className="mt-4 p-4 bg-pink-50 rounded-md">
                <p><strong>已選服務:</strong> {selectedService.name} (${selectedService.price})</p>
              </div>
            )}
            {activeStep === 'service' && (
              <div className="mt-4">
                <ServiceSelector onServiceSelect={handleServiceSelect} selectedServiceId={selectedService?.id} />
              </div>
            )}
          </div>

          {/* --- Step 2: Date Selection --- */}
          <div className={`p-6 bg-white rounded-lg shadow-md transition-all ${!selectedService ? 'opacity-50 cursor-not-allowed' : ''} ${selectedDate && activeStep !== 'date' ? 'cursor-pointer hover:bg-gray-50' : ''}`} onClick={() => selectedDate && activeStep !== 'date' && setActiveStep('date')}>
            <div className="flex justify-between items-center">
              <h2 className={`text-2xl font-bold ${activeStep === 'date' ? 'text-gray-800' : 'text-gray-400'}`}>2. 選擇預約日期</h2>
              {selectedDate && activeStep !== 'date' && (
                <p className="text-gray-600 font-semibold">{format(selectedDate, 'yyyy-MM-dd')}</p>
              )}
            </div>
            {selectedDate && activeStep !== 'date' && (
              <div className="mt-4 p-4 bg-pink-50 rounded-md">
                <p><strong>已選日期:</strong> {format(selectedDate, 'yyyy-MM-dd')}</p>
              </div>
            )}
              {activeStep === 'date' && selectedService && (
                <div className="mt-4">
                  <CalendarSelector 
                    selectedDate={selectedDate} 
                    onDateSelect={handleDateSelect} 
                    closedDays={closedDays}
                    isLoading={isLoadingClosedDays} />
                </div>
              )}
          </div>

          {/* --- Step 3: Time Selection --- */}
          <div className={`p-6 bg-white rounded-lg shadow-md transition-all ${!selectedDate ? 'opacity-50 cursor-not-allowed' : ''} ${selectedTime && activeStep !== 'time' ? 'cursor-pointer hover:bg-gray-50' : ''}`} onClick={() => selectedTime && activeStep !== 'time' && setActiveStep('time')}>
            <div className="flex justify-between items-center">
              <h2 className={`text-2xl font-bold ${activeStep === 'time' ? 'text-gray-800' : 'text-gray-400'}`}>3. 選擇預約時段</h2>
              {selectedTime && activeStep !== 'time' && (
                <p className="text-gray-600 font-semibold">{format(selectedTime, 'HH:mm')}</p>
              )}
            </div>
            {activeStep === 'time' && selectedDate && (
              <div className="mt-4">
                <TimeSlotSelector
                  selectedDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                  serviceDuration={selectedService?.duration || null}
                  onTimeSelect={handleTimeSelect}
                  selectedTime={selectedTime}
                />
              </div>
            )}
          </div>

          {/* --- Step 4: Confirmation --- */}
          <div className={`p-6 bg-white rounded-lg shadow-md transition-all ${!selectedTime ? 'opacity-50' : ''}`}>
            <h2 className={`text-2xl font-bold mb-4 ${activeStep === 'confirm' ? 'text-gray-800' : 'text-gray-400'}`}>4. 確認預約資訊</h2>
            {activeStep === 'confirm' && selectedService && selectedTime && (
              <BookingForm
                service={selectedService}
                dateTime={selectedTime}
                onBookingSuccess={handleBookingSuccess}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingPage;