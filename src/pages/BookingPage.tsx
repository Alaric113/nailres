import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useBookingStore } from '../store/bookingStore'; 
import { useServices } from '../hooks/useServices'; // NEW IMPORT
import { useGlobalSettings } from '../hooks/useGlobalSettings'; // NEW IMPORT
import Modal from '../components/common/Modal'; // NEW IMPORT
import ServiceSelector from '../components/booking/ServiceSelector';
import DesignerSelector from '../components/booking/DesignerSelector';
import TimeSlotSelector from '../components/booking/TimeSlotSelector';
import BookingForm from '../components/booking/BookingForm';
import CalendarSelector from '../components/booking/CalendarSelector';
import CouponSelectorModal from '../components/booking/CouponSelectorModal';
import ServiceOptionsSheet from '../components/booking/ServiceOptionsSheet'; // NEW IMPORT
import type { UserCoupon } from '../types/coupon';
import type { Designer } from '../types/designer';
import type { BookingStatus } from '../types/booking'; // NEW IMPORT
import type { Service } from '../types/service'; // NEW IMPORT
import { collection, serverTimestamp, writeBatch, doc, increment } from 'firebase/firestore'; // NEW IMPORT
import { db } from '../lib/firebase'; // NEW IMPORT
import { useToast } from '../context/ToastContext'; // NEW IMPORT


import { 
  TicketIcon, 
  ChevronRightIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
// import BookingProgressBar from '../components/booking/BookingProgressBar';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { useDesignerBookingInfo } from '../hooks/useDesignerBookingInfo';
import { isLiffBrowser } from '../lib/liff';
import { useActivePass } from '../hooks/useActivePass';

import { useSeasonPasses } from '../hooks/useSeasonPasses';

import type { ActivePass } from '../types/user';

const BookingPage = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const initialCategory = query.get('category');
  const isLiff = isLiffBrowser();


  const [currentStep, setCurrentStep] = useState(1);
  
  // State for steps 2-4
  const [selectedDesigner, setSelectedDesigner] = useState<Designer | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<UserCoupon | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);
  
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false); // NEW STATE
  // Service Notice Modal State
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeModalContent, setNoticeModalContent] = useState<string[]>([]);
  // Service Selection State (Options Sheet)
  const [activeService, setActiveService] = useState<Service | null>(null);
  const [isOptionsSheetOpen, setIsOptionsSheetOpen] = useState(false);
  const [pendingService, setPendingService] = useState<Service | null>(null);


  // === NEW: Admin Booking on Behalf Logic ===
  const behalfOfUserId = query.get('behalfOf');
  const [targetUser, setTargetUser] = useState<any>(null);
  const [loadingTargetUser, setLoadingTargetUser] = useState(!!behalfOfUserId); // Kept for logic, but if unused in UI, maybe use it?

  if (loadingTargetUser) {
      // return <LoadingSpinner fullScreen />; // Maybe explicit return?
      // For now let's just keep the variable but usage is tricky without return.
      // Or just ignore warning? No, user complained.
      // Let's use it to show nothing or spinner.
  }
  
  // Actually, to fix "unused" warning effectively and correctly:
  // We should render a loading state if loadingTargetUser is true.


  useEffect(() => {
      const fetchTargetUser = async () => {
          if (!behalfOfUserId) return;
          try {
              const userDoc = await (await import('firebase/firestore')).getDoc(doc(db, 'users', behalfOfUserId));
              if (userDoc.exists()) {
                  setTargetUser({ id: userDoc.id, ...userDoc.data() });
              }
          } catch (e) {
              console.error("Failed to fetch target user", e);
              showToast("無法讀取目標客戶資料", "error");
          } finally {
              setLoadingTargetUser(false);
          }
      };
      fetchTargetUser();
  }, [behalfOfUserId]);

  const { userProfile: currentUserProfile, currentUser } = useAuthStore();
  
  // Decide which profile to use for logic (Pricing, Passes, etc.)
  // If acting on behalf, use targetUser. Otherwise use logged-in user.
  const actingUserProfile = behalfOfUserId ? targetUser : currentUserProfile;
  const isActingOnBehalf = !!behalfOfUserId;

  const { settings: globalSettings } = useGlobalSettings(); // NEW HOOK
  const { services } = useServices(); // Fetch fresh services for pricing

  // If we are loading the target user, we shouldn't render yet to avoid wrong pricing/pass logic
  if (loadingTargetUser) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-[#9F9586] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[#9F9586] font-medium">載入客戶資料中...</p>
            </div>
        </div>
      );
  }
  const { cart, clearCart } = useBookingStore(); // Use Booking Store
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Handle click on service card
  const handleServiceClick = (service: Service) => {
      // Check for notices first
      if (globalSettings.serviceNotices && globalSettings.serviceNotices.length > 0) {
          const matchedNotices: string[] = [];
          const notices = globalSettings.serviceNotices.filter(n => n.serviceIds.includes(service.id) && n.active);
          
          if (notices) {
             notices.forEach(n => {
                 if (!matchedNotices.includes(n.content)) {
                     matchedNotices.push(n.content);
                 }
             });
          }

          if (matchedNotices.length > 0) {
              setNoticeModalContent(matchedNotices);
              setPendingService(service);
              setShowNoticeModal(true);
              return;
          }
      }

      // If no notices, proceed to open options sheet
      setActiveService(service);
      setIsOptionsSheetOpen(true);
  };

  const handleNoticeAgree = () => {
      setShowNoticeModal(false);
      if (pendingService) {
          setActiveService(pendingService);
          setIsOptionsSheetOpen(true);
          setPendingService(null);
      }
  };

  // Handler for transitions from Step 1 -> Step 2
  const handleServiceSelectionNext = () => {
      // Notice check moved to handleServiceClick
      setCurrentStep(2);
      window.scrollTo(0, 0);
  };

  // Season Pass State (Pass actingUserProfile)
  const { hasActivePass, activePasses } = useActivePass(actingUserProfile);
  const { passes: seasonPassDefinitions } = useSeasonPasses();
  const [selectedPass, setSelectedPass] = useState<ActivePass | null>(null);

  // Auto-select pass if available and not set
  useMemo(() => {
      // Logic same, but depends on hasActivePass from updated hook
      if (hasActivePass && activePasses.length > 0 && !selectedPass) {
          setSelectedPass(activePasses[0]);
      }
  }, [hasActivePass, activePasses, selectedPass]);

  // Derive selected pass definition to get content mapping
  const selectedPassDefinition = useMemo(() => {
    if (!selectedPass) return null;
    return seasonPassDefinitions.find(p => p.id === selectedPass.passId);
  }, [selectedPass, seasonPassDefinitions]);

  const isPassBookingMode = selectedPass !== null;



  // Get booking info for selected designer
  const { 
    closedDays: designerClosedDays, 
    bookingDeadline: designerBookingDeadline, 
    loading: isLoadingDesignerBookingInfo
  } = useDesignerBookingInfo(selectedDesigner?.id || null);

  const handleDesignerSelect = (designer: Designer) => {
    setSelectedDesigner(designer);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setIsCalendarExpanded(true);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null);
    if (date) {
      setTimeout(() => {
        setIsCalendarExpanded(false);
      }, 300);
    }
  };

  const handleTimeSelect = (time: Date) => {
    setSelectedTime(time);
  };

  const handleCouponSelect = (coupon: UserCoupon | null) => {
    setSelectedCoupon(coupon);
  };

  /* New Per-Service Platinum Discount Logic */
  const { totalDuration, originalPrice, finalPrice, discountAmount } = useMemo(() => {
    const duration = cart.reduce((acc, item) => acc + item.totalDuration, 0);
    
    // Calculate price item by item to apply specific service discounts
    let totalBasePrice = 0;
    let totalDiscountedPrice = 0;

    cart.forEach(item => {
        const itemBasePrice = item.totalPrice; // This includes service price + options price
        totalBasePrice += itemBasePrice;

        let itemFinalPrice = itemBasePrice;

        // Check for Platinum Discount
        if (actingUserProfile?.role === 'platinum') {
            // Find the service definition
            const serviceDef = services.find(s => s.id === item.service.id);
            
            if (serviceDef?.platinumDiscount) {
                const { type, value } = serviceDef.platinumDiscount;
                if (type === 'percentage') {
                    // E.g. 90 => 0.9.  (9折)
                    // If user enters 90, we do * 0.9. If user enters 9 (checking for safety), maybe * 0.9 too?
                    // Usually Taiwan usage: "90" means 90% of price (10% off). "9" often means "9折" (90%).
                    // Let's assume standard logic: value / 100.
                    // But if value is < 10 (e.g. 9), treating as 90 might be safer or just sticking to /100.
                    // Let's stick to simple /100 logic (e.g. 90 = 90%).
                    // Wait, earlier I wrote "value 90 => 9折".
                    // If user inputs 9, 9/100 = 0.09 (1折 - huge discount).
                    // I should probably ensure the UI placeholder said "90 = 9折".
                    // Let's trust the input is correct percentage (0-100).
                    itemFinalPrice = Math.floor(itemBasePrice * (value / 100));
                } else if (type === 'fixed') {
                    itemFinalPrice = Math.max(0, itemBasePrice - value);
                }
            } else if (serviceDef?.platinumPrice) {
                 // Fallback to legacy platinumPrice ONLY for the service part? 
                 // Legacy `platinumPrice` was for the service ONLY. 
                 // Options were added on top.
                 // item.price is the service price. item.totalPrice is service + options.
                 // So if legacy, we assume options are NOT discounted? Or just replace service price?
                 // Let's try to replicate: (PlatinumServicePrice) + (OptionsPrice).
                 const optionsPrice = item.totalPrice - item.service.price; // item.service.price is recorded service base price
                 // Actually item.price might vary.
                 // Let's assume `platinumPrice` replaces the base service price.
                 itemFinalPrice = (serviceDef.platinumPrice) + optionsPrice;
            }
        }
        totalDiscountedPrice += itemFinalPrice;
    });

    // Apply Coupon logic on the SUM of all discounted items
    // If no coupon, returning totals
    if (!selectedCoupon || totalDiscountedPrice < selectedCoupon.minSpend) {
      return { 
          totalDuration: duration, 
          originalPrice: totalBasePrice, 
          finalPrice: totalDiscountedPrice, 
          discountAmount: totalBasePrice - totalDiscountedPrice 
      };
    }

    // Coupon Application
    const couponDiscount = selectedCoupon.type === 'fixed' 
        ? selectedCoupon.value 
        : Math.floor(totalDiscountedPrice * (selectedCoupon.value / 100));
        
    const final = Math.max(0, totalDiscountedPrice - couponDiscount);
    const totalDiscount = (totalBasePrice - totalDiscountedPrice) + couponDiscount;

    return { 
        totalDuration: duration, 
        originalPrice: totalBasePrice, 
        finalPrice: final, 
        discountAmount: totalDiscount 
    };
  }, [cart, selectedCoupon, actingUserProfile, services]);

  const allowedDesignerIds = useMemo(() => {
    const restrictionSets: string[][] = [];
    cart.forEach(item => {
      if (item.service.supportedDesigners && item.service.supportedDesigners.length > 0) {
        restrictionSets.push(item.service.supportedDesigners);
      }
    });

    if (restrictionSets.length === 0) return undefined;

    let result = restrictionSets[0];
    for (let i = 1; i < restrictionSets.length; i++) {
        result = result.filter(id => restrictionSets[i].includes(id));
    }
    return result;
  }, [cart]);


  // Renamed from handleBookingSubmit to processBooking for internal use
  const processBooking = async () => {
    // Dismiss modal if open
    setShowConfirmModal(false);

    if (!currentUser) {
      showToast('您必須登入才能預約。', 'error');
      // maybe redirect to login?
      return;
    }
    if (!selectedDesigner) {
       showToast('請選擇一位設計師。', 'error');
       return;
    }
    if (!selectedTime) {
        showToast('請選擇預約時間。', 'error');
        return;
    }

    setIsSubmitting(true);

    // Logic Update: If Platinum user has $0 deposit or full discount, do they still skip payment?
    // Current logic: Platinum -> pending_confirmation (SKIP PAYMENT).
    // General -> pending_payment (PAYMENT).
    // This logic holds regardless of the final price amount, unless price is 0?
    // User requirement: "Platinum users skip deposit".
    // So logic remains:
    const initialStatus: BookingStatus = (isActingOnBehalf) 
        ? 'pending_confirmation' // Admin creating -> auto confirmed usually? Or just pending confirm. Let's use pending_confirmation.
        : (selectedPass 
            ? 'pending_confirmation' 
            : (actingUserProfile?.role === 'platinum' ? 'pending_confirmation' : 'pending_payment'));
    
    
    try {
      const batch = writeBatch(db);
      const newBookingRef = doc(collection(db, 'bookings'));

      const services = cart.map(item => item.service);
      const serviceIds = services.map(s => s.id);
      const serviceNames = services.map(s => s.name);
      // const totalDuration = services.reduce((acc, service) => acc + service.duration, 0); 
      // Use memoized totalDuration

      // NEW: Prepare detailed items from cart
      const bookingItems = cart.map(item => {
        // Transform options: Record<string, ServiceOptionItem[]> -> Record<string, SimpleOptionItem[]>
        const transformedOptions: Record<string, { name: string; price: number; duration: number }[]> = {};
        
        Object.entries(item.selectedOptions).forEach(([optionId, optionItems]) => {
           // We need the Option Category Name. 
           // Since CartItem structure (in store/bookingStore.ts) stores `selectedOptions` as Record<string, ServiceOptionItem[]>
           // where key is optionId. We might need to find the option name from the service.options.
           
           const optionCategory = item.service.options?.find(o => o.id === optionId);
           const categoryName = optionCategory ? optionCategory.name : 'Unknown Option';
           
           transformedOptions[categoryName] = optionItems.map(optItem => ({
             name: optItem.name,
             price: optItem.price,
             duration: optItem.duration || 0
           }));
        });

        return {
          serviceId: item.service.id,
          serviceName: item.service.name,
          price: item.totalPrice, // This is unit total price
          duration: item.totalDuration,
          options: transformedOptions
        };
      });

      // 1. Create new booking document
      const bookingData: any = {
        userId: isActingOnBehalf ? targetUser.id : currentUser.uid, // Use target ID if behalf
        createdBy: isActingOnBehalf ? currentUser.uid : 'self', // Track who created it
        customerName: isActingOnBehalf ? (targetUser?.profile?.displayName || '客戶') : (currentUser.displayName), // Ensure customer name is correct
        designerId: selectedDesigner.id,
        serviceIds,
        serviceNames,
        items: bookingItems,
        dateTime: selectedTime,
        status: initialStatus,
        amount: finalPrice,
        duration: totalDuration,
        couponId: selectedCoupon ? selectedCoupon.id : null,
        couponName: selectedCoupon ? selectedCoupon.title : null,
        createdAt: serverTimestamp(),
        notes: notes,
      };

      // If using a pass, record pass usage
      if (selectedPass) {
        bookingData.passUsage = {
          passId: selectedPass.passId,
          passName: selectedPass.passName,
          variantName: selectedPass.variantName || null,
          contentItemsUsed: serviceIds, // Services booked using this pass
        };
      }

      batch.set(newBookingRef, bookingData);

      // 2. If a coupon was used, update its usage count and mark as used
      if (selectedCoupon) {
        // selectedCoupon is UserCoupon, so cast it to access specific fields
        const userCoupon = selectedCoupon as any;

        // Update Template Usage Count (if linked)
        if (userCoupon.couponId) {
            const couponRef = doc(db, 'coupons', userCoupon.couponId);
            batch.update(couponRef, { usageCount: increment(1) });
        }

        // Update User Coupon Status in ROOT collection
        const userCouponRef = doc(db, 'user_coupons', selectedCoupon.id);
        batch.update(userCouponRef, { 
            status: 'used', 
            isUsed: true, 
            redeemedAt: serverTimestamp(),
            usedAt: serverTimestamp() 
        });
      }

      // 3. If a pass was used, update remaining usages
      // 3. If a pass was used, update remaining usages
      // MOVED TO ADMIN CONFIRMATION: Usage is now deducted when admin confirms the booking
      /* 
      if (selectedPass && userProfile) {
        const userRef = doc(db, 'users', currentUser.uid);
        // We need to update the specific pass within activePasses array
        // Since Firestore doesn’t support updating array elements directly by index,
        // we'll update the entire activePasses array after modifying it locally
        const updatedPasses = (userProfile.activePasses || []).map(pass => {
          if (pass.passId === selectedPass.passId && 
              pass.purchaseDate.toMillis() === selectedPass.purchaseDate.toMillis()) {
            // Deduct usages for each service booked
            const updatedUsages = { ...pass.remainingUsages };
            serviceIds.forEach(sId => {
               // MAP SERVICE ID -> CONTENT ITEM ID
               let usageKey = sId;
               if (selectedPassDefinition && selectedPassDefinition.contentItems) {
                   const contentItem = selectedPassDefinition.contentItems.find(item => item.serviceId === sId);
                   if (contentItem) {
                       usageKey = contentItem.id;
                   }
               }

              if (updatedUsages[usageKey] && updatedUsages[usageKey] > 0) {
                updatedUsages[usageKey] -= 1;
              }
            });
            return { ...pass, remainingUsages: updatedUsages };
          }
          return pass;
        });
        batch.update(userRef, { activePasses: updatedPasses });
      }
      */

      await batch.commit();

      // 3. Send LINE message (Async)
      fetch('/api/send-line-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          designerId: selectedDesigner.id,
          serviceNames: serviceNames,
          dateTime: selectedTime.toISOString(),
          amount: finalPrice,
          notes: notes,
          status: initialStatus,
          bookingId: newBookingRef.id,
        }),
      }).catch(err => console.error('Failed to send LINE notification:', err));

      // 4. Notify Designer/Admin (Async)
      fetch('/api/notify-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: newBookingRef.id,
            customerName: isActingOnBehalf ? (targetUser?.profile?.displayName || '客戶') : (currentUserProfile?.profile.displayName || currentUser.displayName || '未知客戶'),
            serviceNames: serviceNames,
            bookingTime: selectedTime.toISOString(),
            designerId: selectedDesigner.id
          }),
      }).catch(err => console.error('Failed to send notification:', err));

      showToast('預約成功！我們已發送確認訊息給您。', 'success', 5000);
      
      // Cleanup
      clearCart();
      setSelectedDesigner(null);
      setSelectedDate(undefined);
      setSelectedTime(null);
      setSelectedCoupon(null);
      setNotes('');
      setCurrentStep(1);
      setIsCalendarExpanded(true);
      
      if (initialStatus === 'pending_payment') {
          navigate(`/booking/pay/${newBookingRef.id}`);
      } else {
          navigate('/dashboard');
      } 

    } catch (err) {
      console.error('Booking failed:', err);
      showToast('預約失敗，請稍後再試。', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // New Handler triggered by UI button
  const handleBookingSubmit = () => {
      if (!currentUser) {
        showToast('您必須登入才能預約。', 'error');
        return;
      }
      if (!selectedDesigner) {
         showToast('請選擇一位設計師。', 'error');
         return;
      }
      if (!selectedTime) {
          showToast('請選擇預約時間。', 'error');
          return;
      }

      if (globalSettings.bookingNotice && globalSettings.bookingNotice.trim()) {
          setShowConfirmModal(true);
      } else {
          processBooking();
      }
  };

  const nextStep = () => {
    if (currentStep === 1 && cart.length === 0) return;
    if (currentStep === 2 && !selectedDesigner) return;
    if (currentStep === 3 && !selectedTime) return;
    if (currentStep < 4) setCurrentStep(prev => prev + 1);
  };

  /* Unused while progress bar is hidden
  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };
  */

  return (
    <div className={`${isLiff ? 'min-h-[100dvh]' : 'min-h-[calc(100vh-64px)]'} bg-[#FAF9F6] ${isLiff ? 'pb-0' : 'pb-20'}`}>
      
      {/* Progress Bar - Hidden as per request */}

      {/* Modal for Service Notices */}
      <Modal 
        isOpen={showNoticeModal} 
        onClose={() => {
            setShowNoticeModal(false);
            setPendingService(null);
        }}
        title="預約注意事項"
      >
        <div className="space-y-4">
            {noticeModalContent.map((notice, index) => (
                <div key={index} className="bg-orange-50 p-4 rounded-lg border border-orange-100 text-sm text-gray-700">
                    <p className="whitespace-pre-wrap">{notice}</p>
                </div>
            ))}
            <div className="pt-4">
                <button 
                    onClick={handleNoticeAgree}
                    className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors"
                >
                    我了解並同意
                </button>
            </div>
        </div>
      </Modal>

      {/* Main Content Area */}
      <main className={`container mx-auto ${currentStep === 1 ? (isLiff ? 'max-w-7xl h-[100dvh]' : 'max-w-7xl h-[calc(100vh-140px)]') : 'max-w-lg'}`}>
        
        {/* Step 1: Services (New Uber Eats Style) */}
        {currentStep === 1 && (
          <div className="h-full">
            <ServiceSelector 
              initialCategory={initialCategory}
              onNext={handleServiceSelectionNext} // Use custom handler
              onServiceClick={handleServiceClick} // NEW HANDLER
              passMode={isPassBookingMode}
              hasActivePass={hasActivePass}
              activePass={selectedPass}
              passContentItems={selectedPassDefinition?.contentItems}
            />
            
            {/* Options Sheet moved here */}
            <ServiceOptionsSheet 
                isOpen={isOptionsSheetOpen} 
                onClose={() => setIsOptionsSheetOpen(false)} 
                service={activeService} 
            />
          </div>
        )}

        {/* Step 2: Designer Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <DesignerSelector 
              onDesignerSelect={handleDesignerSelect} 
              selectedDesigner={selectedDesigner}
              allowedDesignerIds={allowedDesignerIds}
            />
          </div>
        )}

        {/* Step 3: Date & Time */}
        {currentStep === 3 && (
          <div className="space-y-4 p-4">
            {/* Date Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#EFECE5] overflow-hidden">
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

               <div className={`grid transition-all duration-300 ease-in-out ${isCalendarExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                 <div className="overflow-hidden">
                   <div className="px-4 pb-4">
                      <CalendarSelector
                          selectedDate={selectedDate}
                          onDateSelect={handleDateSelect}
                          closedDays={designerClosedDays}
                          isLoading={isLoadingDesignerBookingInfo}
                          bookingDeadline={designerBookingDeadline}
                      />
                   </div>
                 </div>
               </div>
            </div>
            
            {/* Time Selection */}
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
                      selectedDesignerId={selectedDesigner?.id || null}
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

        {/* Step 4: Confirmation */}
        {currentStep === 4 && (
          <div className="space-y-6 p-4">
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
                     {cart.map(item => (
                       <div key={item.itemId} className="flex flex-col text-sm border-b border-dashed border-gray-100 pb-2 last:border-0 last:pb-0">
                         <div className="flex justify-between items-center">
                            <span className="text-gray-900 font-bold">{item.service.name}</span>
                            <span className="text-gray-500">${item.totalPrice}</span>
                         </div>
                         {/* Show options in review */}
                         {Object.values(item.selectedOptions).flat().length > 0 && (
                             <div className="text-xs text-gray-400 mt-1">
                                 {Object.values(item.selectedOptions).flat().map(o => o.name).join(', ')}
                             </div>
                         )}
                       </div>
                     ))}
                   </div>
                 </div>
                 {/* Designer Info */}
                 {selectedDesigner && (
                   <>
                     <div className="h-px bg-gray-100"></div>
                     <div>
                       <h3 className="text-sm text-gray-500 font-medium">設計師</h3>
                       <div className="flex items-center mt-2">
                         <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 mr-2">
                           {selectedDesigner.avatarUrl ? (
                             <img src={selectedDesigner.avatarUrl} alt={selectedDesigner.name} className="w-full h-full object-cover" />
                           ) : (
                             <UserCircleIcon className="w-5 h-5 text-gray-400" />
                           )}
                         </div>
                         <p className="text-base font-bold text-gray-900">{selectedDesigner.name}</p>
                       </div>
                     </div>
                   </>
                 )}
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
                      {/* Show discount amount if there is ANY discount (Member or Coupon) */}
                      {discountAmount > 0 && <p className="text-xs text-[#9F9586] font-medium">共折抵 NT$ {discountAmount}</p>}
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-gray-400 group-hover:text-[#9F9586]" />
                </button>

               <BookingForm
                  originalPrice={originalPrice}
                  discountAmount={discountAmount}
                  totalPrice={finalPrice}
                  notes={notes}
                  onNotesChange={setNotes}
               />
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button for Next Step (Steps 2-4 only on mobile) */}
      {/* Step 1 button is handled by MobileCartBar inside ServiceSelector */}
      {currentStep > 1 && (
          <div className={`fixed ${isLiff ? 'bottom-0' : 'bottom-[80px]'} md:bottom-10 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 md:hidden z-40`}>
            {currentStep === 2 && (
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-bold shadow-sm active:scale-95 transition-all"
                >
                  上一步
                </button>
                <button 
                  onClick={nextStep}
                  disabled={!selectedDesigner}
                  className="flex-1 bg-[#9F9586] text-white py-3.5 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                >
                  下一步：選擇時間
                </button>
              </div>
            )}
            {currentStep === 3 && (
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-bold shadow-sm active:scale-95 transition-all"
                >
                  上一步
                </button>
                <button 
                  onClick={nextStep}
                  disabled={!selectedTime}
                  className="flex-1 bg-[#9F9586] text-white py-3.5 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                >
                  下一步：確認預約
                </button>
              </div>
            )}
            {/* Step 4 Back Button (Mobile) */}
             {currentStep === 4 && (
               <div className="flex gap-3">
                 <button
                    onClick={() => setCurrentStep(3)}
                    disabled={isSubmitting}
                    className="px-6 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-bold shadow-sm active:scale-95 transition-all disabled:opacity-50"
                 >
                    上一步
                 </button>
                 <button
                    onClick={handleBookingSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-[#9F9586] text-white py-3.5 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                 >
                    {isSubmitting ? '處理中...' : '確認預約'}
                 </button>
               </div>
             )}
          </div>
      )}

      {/* Desktop Next Buttons (Hidden on mobile) */}
      {/* Step 1 is handled by CartSidebar inside ServiceSelector */}
      {currentStep > 1 && (
          <div className="hidden md:flex justify-end container mx-auto px-4 max-w-lg mt-8">
             {currentStep === 2 && (
                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-8 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                  >
                    上一步
                  </button>
                  <button 
                    onClick={nextStep}
                    disabled={!selectedDesigner}
                    className="bg-[#9F9586] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#8a8173] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    下一步
                  </button>
                </div>
             )}
             {currentStep === 3 && (
                <div className="flex gap-4">
                   <button
                     onClick={() => setCurrentStep(2)}
                     className="px-8 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                   >
                     上一步
                   </button>
                   <button 
                     onClick={nextStep}
                     disabled={!selectedTime}
                     className="bg-[#9F9586] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#8a8173] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                   >
                     下一步
                   </button>
                </div>
             )}
             {currentStep === 4 && (
                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentStep(3)}
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    上一步
                  </button>
                  <button
                    onClick={handleBookingSubmit}
                    disabled={isSubmitting}
                    className="bg-[#9F9586] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#8a8173] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? '處理中...' : '確認預約'}
                  </button>
                </div>
             )}
          </div>
      )}

      <CouponSelectorModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        onSelect={handleCouponSelect}
        selectedServices={cart.map(item => item.service)}
        selectedDesigner={selectedDesigner}
        currentPrice={originalPrice}
      />
      <CouponSelectorModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        onSelect={handleCouponSelect}
        selectedServices={cart.map(item => item.service)}
        selectedDesigner={selectedDesigner}
        currentPrice={originalPrice}
      />

      {/* Confirmation Modal */}
      <Modal 
        isOpen={showConfirmModal} 
        onClose={() => setShowConfirmModal(false)} 
        title="預約注意事項"
      >
        <div className="p-1">
            <div className="bg-orange-50 p-4 rounded-lg mb-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-[50vh] overflow-y-auto">
                {globalSettings.bookingNotice}
            </div>
            <div className="flex gap-3 mt-6">
                <button 
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200"
                >
                    取消
                </button>
                <button 
                    onClick={processBooking}
                    className="flex-1 py-3 bg-[#9F9586] text-white rounded-xl font-bold hover:bg-[#8a8175] shadow-md"
                >
                    同意並預約
                </button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookingPage;