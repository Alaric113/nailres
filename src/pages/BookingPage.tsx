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
import { TicketIcon, ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const BookingPage = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const initialCategory = query.get('category');

  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
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
  };

  const handleTimeSelect = (time: Date) => {
    setSelectedTime(time);
  };

  const handleCouponSelect = (coupon: Coupon | null) => {
    setSelectedCoupon(coupon);
  };

  const handleBookingSuccess = () => {
    // Reset selections after a successful booking
    setSelectedServices([]);
    setSelectedDate(new Date());
    setSelectedTime(null);
    setSelectedCoupon(null); // activeStep 會自動重置
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
  }, [selectedServices, userProfile, selectedCoupon]);

  return (
    <div className="min-h-screen bg-secondary-light text-text-main">
      <header className="bg-white/80 backdrop-blur-md border-b border-secondary-dark sticky top-[64px] z-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center max-w-4xl">
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-text-main tracking-wide">
            預約服務
          </h1>
          <Link to="/dashboard" className="flex items-center text-sm font-medium text-text-light hover:text-primary transition-colors">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            返回
          </Link>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl pb-24">
        <div className="text-center mb-10">
          <p className="text-lg text-text-light font-light mt-2">請依序選擇您想要的服務、日期與時段</p>
          <div className="w-16 h-0.5 bg-primary/30 mx-auto mt-4"></div>
        </div>

        <div className="space-y-8">
          {/* --- Step 1: Service Selection --- */}
          <div className="bg-white rounded-2xl shadow-sm border border-secondary-dark/50 overflow-hidden transition-all hover:shadow-md">
            <div className="p-6 border-b border-secondary-light">
              <h2 className="text-xl font-serif font-bold text-text-main flex items-center">
                <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">1</span>
                選擇服務項目
              </h2>
            </div>
            
            <div className="p-6">
              {selectedServices.length > 0 && (
                <div className="mb-6 p-4 bg-secondary rounded-xl border border-secondary-dark">
                  <p className="text-text-main"><strong className="text-primary-dark">已選服務:</strong> {selectedServices.map(s => s.name).join('、')}</p>
                  <p className="text-text-main mt-1"><strong className="text-primary-dark">總計:</strong> {totalDuration} 分鐘 / NT$ {originalPrice}</p>
                </div>
              )}
              
              {/* 服務選擇器始終可見，但可能被禁用 */}
                <ServiceSelector 
                  onServiceToggle={handleServiceToggle} 
                  selectedServiceIds={selectedServices.map(s => s.id)}
                  initialCategory={initialCategory}
                />
            </div>
          </div>

          {/* --- Step 2: Date & Time Selection --- */}
          <div className={`bg-white rounded-2xl shadow-sm border border-secondary-dark/50 overflow-hidden transition-all duration-500 ${selectedServices.length === 0 ? 'opacity-50 grayscale pointer-events-none' : 'hover:shadow-md'}`}>
             <div className="p-6 border-b border-secondary-light">
              <h2 className="text-xl font-serif font-bold text-text-main flex items-center">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3 ${selectedServices.length > 0 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>2</span>
                選擇日期與時段
              </h2>
            </div>

            {selectedServices.length > 0 && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Calendar */}
                  <div className="bg-secondary-light/30 p-4 rounded-xl">
                    <h3 className="font-serif font-medium text-lg mb-4 text-center text-text-main">選擇日期</h3>
                    <CalendarSelector
                      selectedDate={selectedDate}
                      onDateSelect={handleDateSelect}
                      closedDays={closedDays}
                      isLoading={isLoadingClosedDays || isLoadingGlobalSettings}
                      bookingDeadline={globalSettings.bookingDeadline}
                    />
                  </div>
                  {/* Time Slots */}
                  <div className="bg-secondary-light/30 p-4 rounded-xl">
                    <h3 className="font-serif font-medium text-lg mb-4 text-center text-text-main">選擇時段</h3>
                    <TimeSlotSelector
                      selectedDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                      serviceDuration={totalDuration}
                      onTimeSelect={handleTimeSelect}
                      selectedTime={selectedTime}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* --- Step 4: Confirmation --- */}
          <div className={`bg-white rounded-2xl shadow-sm border border-secondary-dark/50 overflow-hidden transition-all duration-500 ${!selectedTime ? 'opacity-50 grayscale pointer-events-none' : 'hover:shadow-md'}`}>
            <div className="p-6 border-b border-secondary-light">
              <h2 className="text-xl font-serif font-bold text-text-main flex items-center">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3 ${selectedTime ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>3</span>
                確認預約資訊
              </h2>
            </div>
            
            {selectedTime && (
              <div className="p-6 space-y-6">
                {/* Coupon Selector Bar */}
                <button 
                  onClick={() => setIsCouponModalOpen(true)}
                  className="w-full flex justify-between items-center p-4 bg-white border border-dashed border-primary/50 rounded-xl text-left hover:bg-secondary-light transition-colors group"
                >
                  <div className="flex items-center">
                    <div className="bg-secondary p-2 rounded-full mr-3 group-hover:bg-white transition-colors">
                      <TicketIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-text-main">
                        {selectedCoupon ? selectedCoupon.title : '選擇優惠券 / 輸入折扣碼'}
                      </p>
                      {selectedCoupon && <p className="text-sm text-accent">已折抵 NT$ {discountAmount}</p>}
                    </div>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-text-light group-hover:translate-x-1 transition-transform" />
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