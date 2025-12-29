import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookings } from '../../hooks/useBookings';
import { useDesignerBookingInfo } from '../../hooks/useDesignerBookingInfo';
import CalendarSelector from '../../components/booking/CalendarSelector';
import TimeSlotSelector from '../../components/booking/TimeSlotSelector';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ChevronLeftIcon, CalendarDaysIcon, ClockIcon, PencilSquareIcon } from '@heroicons/react/24/outline'; // Updated import
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../context/ToastContext';
import { isLiffBrowser } from '../../lib/liff';

const ReschedulePage = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { bookings, isLoading: isLoadingBookings } = useBookings();
    const { currentUser } = useAuthStore();
    const { showToast } = useToast();
    const isLiff = isLiffBrowser();

    // Local state for selection
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState<Date | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCalendarExpanded, setIsCalendarExpanded] = useState(true); // NEW STATE

    // Find the target booking
    const booking = bookings.find(b => b.id === bookingId);

    // Designer Info Hook
    const { 
        closedDays, 
        bookingDeadline, 
        loading: isLoadingDesigner 
    } = useDesignerBookingInfo(booking?.designerId || null);

    useEffect(() => {
        if (!isLoadingBookings && !booking) {
             showToast('找不到該筆預約或是無權限', 'error');
             navigate('/member/history');
        }
    }, [isLoadingBookings, booking, navigate, showToast]);

    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date);
        setSelectedTime(null);
        if (date) {
            setTimeout(() => {
                setIsCalendarExpanded(false);
            }, 300);
        }
    };

    const handleConfirm = async () => {
        if (!booking || !selectedTime || !currentUser) return;

        setIsSubmitting(true);
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch('/api/reschedule-booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    bookingId: booking.id,
                    newDateTime: selectedTime.toISOString()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Reschedule failed');
            }

            showToast('預約已成功改期！', 'success');
            navigate('/member/history');

        } catch (error: any) {
            console.error(error);
            showToast(error.message || '改期失敗，請稍後再試', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingBookings || !booking) {
        return <div className="min-h-screen flex justify-center items-center"><LoadingSpinner /></div>;
    }

    return (
        <div className="min-h-screen bg-[#FAF9F6] pb-24">
             {/* Header */}
            <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-30 flex items-center gap-2">
                <button 
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">更改預約時間</h1>
            </div>

            <div className="max-w-lg mx-auto p-4 space-y-6">
                {/* Current Booking Info */}
                <div className="bg-white rounded-2xl p-5 border border-[#EFECE5]">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">目前預約</h3>
                    <div className="flex items-center gap-3 mb-2">
                        <CalendarDaysIcon className="w-5 h-5 text-[#9F9586]" />
                        <span className="font-bold text-gray-900 text-lg">
                            {format(booking.dateTime, 'yyyy/MM/dd (EEE)', { locale: zhTW })}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                        <ClockIcon className="w-5 h-5" />
                        <span className="font-medium">
                            {format(booking.dateTime, 'HH:mm')} - {format(new Date(booking.dateTime.getTime() + booking.duration * 60000), 'HH:mm')}
                        </span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                        服務項目: <span className="text-gray-900 font-medium">{booking.serviceName}</span>
                    </div>
                </div>


                {/* New Date Selection */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#EFECE5] overflow-hidden">
                    <div 
                        onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                        className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${!isCalendarExpanded ? 'hover:bg-gray-50' : ''}`}
                    >
                        <div className="flex items-center gap-2">
                             <CalendarDaysIcon className="w-5 h-5 text-[#9F9586]" />
                             <h3 className="font-serif font-bold text-gray-900">選擇新日期</h3>
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
                                {isLoadingDesigner ? (
                                    <div className="py-8 flex justify-center"><LoadingSpinner /></div>
                                ) : (
                                    <CalendarSelector
                                        selectedDate={selectedDate}
                                        onDateSelect={handleDateSelect}
                                        closedDays={closedDays}
                                        isLoading={isLoadingDesigner || false}
                                        bookingDeadline={bookingDeadline}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* New Time Selection */}
                {!isCalendarExpanded && selectedDate && (
                    <div className="bg-white rounded-2xl p-5 border border-[#EFECE5] animate-fade-in shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500 mb-4">
                            選擇 {format(selectedDate, 'M月d日 (EEEE)', { locale: zhTW })} 的新時段
                        </h3>
                        <TimeSlotSelector
                            selectedDesignerId={booking.designerId || null}
                            selectedDate={format(selectedDate, 'yyyy-MM-dd')}
                            serviceDuration={booking.duration}
                            onTimeSelect={setSelectedTime}
                            selectedTime={selectedTime}
                        />
                    </div>
                )}

                {/* Confirm Button */}
                <div className={`fixed ${isLiff ? 'bottom-0' : 'bottom-16'} left-0 right-0 p-4 bg-white border-t border-gray-100 md:static md:bg-transparent md:border-0 md:p-0 `}>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedTime || isSubmitting}
                        className="w-full bg-[#9F9586] text-white py-3.5 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                    >
                        {isSubmitting ? '處理中...' : '確認更改'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReschedulePage;
