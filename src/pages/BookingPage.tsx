import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import ServiceSelector from '../components/booking/ServiceSelector';
import TimeSlotSelector from '../components/booking/TimeSlotSelector';
import BookingForm from '../components/booking/BookingForm';
import type { Service } from '../types/service';
import CalendarSelector from '../components/booking/CalendarSelector';
import { useBusinessHoursSummary } from '../hooks/useBusinessHoursSummary';
import { useGlobalSettings } from '../hooks/useGlobalSettings';
import CouponSelectorModal from '../components/booking/CouponSelectorModal';
import type { Coupon } from '../types/coupon';
import { TicketIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const BookingPage = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const initialCategory = query.get('category');

  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [activeStep, setActiveStep] = useState<'service' | 'date' | 'time' | 'confirm'>('service');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const { userProfile } = useAuthStore();
  
  const { closedDays, loading: isLoadingClosedDays } = useBusinessHoursSummary();
  const { settings: globalSettings, isLoading: isLoadingGlobalSettings } = useGlobalSettings();

  const handleServiceToggle = (service: Service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
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

  const handleCouponSelect = (coupon: Coupon | null) => {
    setSelectedCoupon(coupon);
  };

  const handleBookingSuccess = () => {
    // Reset selections after a successful booking
    setSelectedServices([]);
    setSelectedDate(new Date());
    setSelectedTime(null);
    setSelectedCoupon(null);
    setActiveStep('service');
  };

  const { totalDuration, originalPrice, finalPrice, discountAmount } = useMemo(() => {
    const isPlatinum = userProfile?.role === 'platinum';
    const duration = selectedServices.reduce((acc, service) => acc + service.duration, 0);
    const basePrice = selectedServices.reduce((acc, service) => {
      const price = isPlatinum && service.platinumPrice ? service.platinumPrice : service.price;
      return acc + price;
    }, 0);

    if (!selectedCoupon || basePrice < selectedCoupon.minSpend) {
      return { totalDuration: duration, originalPrice: basePrice, finalPrice: basePrice, discountAmount: 0 };
    }

    const discount = selectedCoupon.type === 'fixed' ? selectedCoupon.value : Math.floor(basePrice * (selectedCoupon.value / 100));
    const final = Math.max(0, basePrice - discount);

    return { totalDuration: duration, originalPrice: basePrice, finalPrice: final, discountAmount: discount };
  }, [selectedServices, userProfile]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center max-w-4xl">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            預約服務
          </h1>
          <Link to="/dashboard" className="text-sm font-medium text-indigo-600 hover:underline">
            &larr; 返回
          </Link>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
        <div className="text-center mb-12">
          <p className="text-lg text-gray-600 mt-2">請依序選擇您想要的服務、日期與時段</p>
        </div>

        <div className="space-y-8">
          {/* --- Step 1: Service Selection --- */}
          <div className={`p-6 bg-white rounded-lg shadow-md transition-all ${selectedServices.length > 0 && activeStep !== 'service' ? 'cursor-pointer hover:bg-gray-50' : ''}`} onClick={() => selectedServices.length > 0 && activeStep !== 'service' && setActiveStep('service')}>
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">1. 選擇服務項目</h2>
            </div>
            {selectedServices.length > 0 && activeStep !== 'service' && (
              <div className="mt-4 p-4 bg-pink-50 rounded-md">
                <p><strong>已選服務:</strong> {selectedServices.map(s => s.name).join('、')}</p>
                <p><strong>總計:</strong> {totalDuration} 分鐘 / ${originalPrice} 元</p>
              </div>
            )}
            {activeStep === 'service' && (
              <div className="mt-4">
                <ServiceSelector 
                  onServiceToggle={handleServiceToggle} 
                  selectedServiceIds={selectedServices.map(s => s.id)}
                  initialCategory={initialCategory}
                />
                {selectedServices.length > 0 && (
                  <div className="mt-6 p-4 bg-pink-50 rounded-lg text-center">
                    <p className="font-semibold">總計: {totalDuration} 分鐘 / ${originalPrice} 元</p>
                    <button 
                      onClick={() => setActiveStep('date')}
                      className="mt-4 px-6 py-2 bg-pink-500 text-white font-bold rounded-md shadow-md hover:bg-pink-600 transition-colors"
                    >
                      下一步
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* --- Step 2: Date Selection --- */}
          <div className={`p-6 bg-white rounded-lg shadow-md transition-all ${selectedServices.length === 0 ? 'opacity-50 cursor-not-allowed' : ''} ${selectedDate && activeStep !== 'date' ? 'cursor-pointer hover:bg-gray-50' : ''}`} onClick={() => selectedDate && activeStep !== 'date' && setActiveStep('date')}>
            <div className="flex justify-between items-center">
              <h2 className={`text-2xl font-bold ${activeStep === 'date' ? 'text-gray-800' : 'text-gray-400'}`}>2. 選擇預約日期</h2>
            </div>
            {selectedDate && activeStep !== 'date' && (
              <div className="mt-4 p-4 bg-pink-50 rounded-md">
                <p><strong>已選日期:</strong> {format(selectedDate, 'yyyy-MM-dd')}</p>
              </div>
            )}
              {activeStep === 'date' && selectedServices.length > 0 && (
                <div className="mt-4">
                  <CalendarSelector 
                    selectedDate={selectedDate} 
                    onDateSelect={handleDateSelect} 
                    closedDays={closedDays}
                    isLoading={isLoadingClosedDays || isLoadingGlobalSettings}
                    bookingDeadline={globalSettings.bookingDeadline}
                  />
                </div>
              )}
          </div>

          {/* --- Step 3: Time Selection --- */}
          <div className={`p-6 bg-white rounded-lg shadow-md transition-all ${!selectedDate ? 'opacity-50 cursor-not-allowed' : ''} ${selectedTime && activeStep !== 'time' ? 'cursor-pointer hover:bg-gray-50' : ''}`} onClick={() => selectedTime && activeStep !== 'time' && setActiveStep('time')}>
            <div className="flex justify-between items-center">
              <h2 className={`text-2xl font-bold ${activeStep === 'time' ? 'text-gray-800' : 'text-gray-400'}`}>3. 選擇預約時段</h2>
            </div>
            {activeStep === 'time' && selectedDate && (
              <div className="mt-4">
                <TimeSlotSelector
                  selectedDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                  serviceDuration={totalDuration}
                  onTimeSelect={handleTimeSelect}
                  selectedTime={selectedTime}
                />
              </div>
            )}
          </div>

          {/* --- Step 4: Confirmation --- */}
          <div className={`p-6 bg-white rounded-lg shadow-md transition-all ${!selectedTime ? 'opacity-50' : ''}`}>
            <h2 className={`text-2xl font-bold mb-4 ${activeStep === 'confirm' ? 'text-gray-800' : 'text-gray-400'}`}>4. 確認預約資訊</h2>
            {activeStep === 'confirm' && selectedServices.length > 0 && selectedTime && (
              <div className="space-y-6">
                {/* Coupon Selector Bar */}
                <button 
                  onClick={() => setIsCouponModalOpen(true)}
                  className="w-full flex justify-between items-center p-4 bg-white border-2 border-dashed rounded-lg text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <TicketIcon className="h-6 w-6 text-pink-500 mr-3" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {selectedCoupon ? selectedCoupon.title : '選擇優惠券'}
                      </p>
                      {selectedCoupon && <p className="text-sm text-green-600">已折抵 ${discountAmount}</p>}
                    </div>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                </button>

                <BookingForm
                  services={selectedServices}
                  dateTime={selectedTime}
                  totalPrice={finalPrice}
                  coupon={selectedCoupon}
                  onBookingSuccess={handleBookingSuccess}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      <CouponSelectorModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        onSelect={handleCouponSelect}
        selectedServices={selectedServices}
        currentPrice={originalPrice}
      />
    </div>
  );
};

export default BookingPage;