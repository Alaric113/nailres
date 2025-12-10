import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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
import { 
  TicketIcon, 
  ChevronRightIcon,
  CalendarDaysIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import BookingProgressBar from '../components/booking/BookingProgressBar';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';

const BookingPage = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const initialCategory = query.get('category');

  const [currentStep, setCurrentStep] = useState(1);
  
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true); // Control calendar visibility
  
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
    setSelectedTime(null);
    if (date) {
      // Auto-collapse calendar and expand time slots after selection
      setTimeout(() => {
        setIsCalendarExpanded(false);
      }, 300);
    }
  };

  const handleTimeSelect = (time: Date) => {
    setSelectedTime(time);
  };

  const handleCouponSelect = (coupon: Coupon | null) => {
    setSelectedCoupon(coupon);
  };

  const handleBookingSuccess = () => {
    setSelectedServices([]);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setSelectedCoupon(null);
    setCurrentStep(1);
    setIsCalendarExpanded(true);
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

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(prev => prev + 1);
  };

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#FAF9F6] pb-20 pt-4"> 
      
      {/* Progress Bar with Back Navigation built-in */}
      <div className="mb-8">
        <BookingProgressBar currentStep={currentStep} onStepClick={handleStepClick} />
      </div>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 max-w-lg">
        
        {/* Step 1: Services */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <ServiceSelector 
              onServiceToggle={handleServiceToggle} 
              selectedServiceIds={selectedServices.map(s => s.id)}
              initialCategory={initialCategory}
            />
          </div>
        )}

        {/* Step 2: Date & Time - Collapsible UX */}
        {currentStep === 2 && (
          <div className="space-y-4">
            
            {/* 1. Date Selection Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#EFECE5] overflow-hidden">
               {/* Header / Summary */}
               <div 
                 onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                 className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${!isCalendarExpanded ? 'hover:bg-gray-50' : ''}`}
               >
                 <div className="flex items-center gap-2">
                   <CalendarDaysIcon className="w-5 h-5 text-[#9F9586]" />
                   <h3 className="font-serif font-bold text-gray-900">選擇日期</h3>
                 </div>
                 
                 {!isCalendarExpanded && selectedDate && (
                    <div className="flex items-center gap-2">
                      <span className="text-[#9F9586] font-medium">
                        {format(selectedDate, 'yyyy-MM-dd')}
                      </span>
                      <PencilSquareIcon className="w-4 h-4 text-gray-400" />
                    </div>
                 )}
               </div>

               {/* Calendar Content (Collapsible) */}
               <div className={`grid transition-all duration-300 ease-in-out ${isCalendarExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                 <div className="overflow-hidden">
                   <div className="px-4 pb-4">
                      <CalendarSelector
                          selectedDate={selectedDate}
                          onDateSelect={handleDateSelect}
                          closedDays={closedDays}
                          isLoading={isLoadingClosedDays || isLoadingGlobalSettings}
                          bookingDeadline={globalSettings.bookingDeadline}
                      />
                   </div>
                 </div>
               </div>
            </div>
            
            {/* 2. Time Selection Section (Appears after date selection) */}
            <AnimatePresence>
              {!isCalendarExpanded && selectedDate && (
                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 20 }}
                   transition={{ duration: 0.4, delay: 0.1 }}
                   className="bg-white rounded-2xl p-4 shadow-sm border border-[#EFECE5]"
                 >
                   <h3 className="font-serif font-bold text-gray-900 mb-4 px-1">
                     {format(selectedDate, 'M月d日 (EEEE)', { locale: zhTW })} 的時段
                   </h3>
                   <TimeSlotSelector
                      selectedDate={format(selectedDate, 'yyyy-MM-dd')}
                      serviceDuration={totalDuration}
                      onTimeSelect={handleTimeSelect}
                      selectedTime={selectedTime}
                   />
                 </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EFECE5]">
               <div className="space-y-4 mb-6">
                 <div>
                   <h3 className="text-sm text-gray-500 font-medium">預約時間</h3>
                   <p className="text-lg font-bold text-gray-900 mt-1">
                     {selectedDate && format(selectedDate, 'yyyy年M月d日 (EEEE)', { locale: zhTW })}
                   </p>
                   <p className="text-lg font-bold text-[#9F9586]">
                     {selectedTime && format(selectedTime, 'HH:mm')}
                   </p>
                 </div>
                 <div className="h-px bg-gray-100"></div>
                 <div>
                   <h3 className="text-sm text-gray-500 font-medium">已選服務</h3>
                   <div className="mt-2 space-y-2">
                     {selectedServices.map(s => (
                       <div key={s.id} className="flex justify-between items-center text-sm">
                         <span className="text-gray-900">{s.name}</span>
                         <span className="text-gray-500">${s.price}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>

               {/* Coupon Selector */}
               <button 
                  onClick={() => setIsCouponModalOpen(true)}
                  className="w-full flex justify-between items-center p-4 bg-[#FAF9F6] border border-dashed border-[#9F9586]/30 rounded-xl mb-6 hover:bg-[#F5F3EF] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-full shadow-sm text-[#9F9586]">
                      <TicketIcon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 text-sm">
                        {selectedCoupon ? selectedCoupon.title : '使用優惠券'}
                      </p>
                      {selectedCoupon && <p className="text-xs text-[#9F9586] font-medium">已折抵 NT$ {discountAmount}</p>}
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-gray-400 group-hover:text-[#9F9586]" />
                </button>

               <BookingForm
                  services={selectedServices}
                  dateTime={selectedTime!} // Safe assertion as step 3 requires time
                  totalPrice={finalPrice}
                  coupon={selectedCoupon}
                  onBookingSuccess={handleBookingSuccess}
               />
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button for Next Step */}
      <div className="fixed bottom-[80px] md:bottom-10 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 md:hidden z-40">
        {currentStep === 1 && (
          <button 
            onClick={nextStep}
            disabled={selectedServices.length === 0}
            className="w-full bg-[#9F9586] text-white py-3.5 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            下一步：選擇時間
          </button>
        )}
        {currentStep === 2 && (
          <button 
            onClick={nextStep}
            disabled={!selectedTime}
            className="w-full bg-[#9F9586] text-white py-3.5 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            下一步：確認預約
          </button>
        )}
      </div>

      {/* Desktop Next Buttons (Hidden on mobile) */}
      <div className="hidden md:flex justify-end container mx-auto px-4 max-w-lg mt-8">
         {currentStep === 1 && (
            <button 
              onClick={nextStep}
              disabled={selectedServices.length === 0}
              className="bg-[#9F9586] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#8a8173] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              下一步
            </button>
         )}
         {currentStep === 2 && (
            <button 
              onClick={nextStep}
              disabled={!selectedTime}
              className="bg-[#9F9586] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#8a8173] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              下一步
            </button>
         )}
      </div>

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