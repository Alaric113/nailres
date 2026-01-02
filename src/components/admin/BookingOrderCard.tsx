import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDaysIcon, PencilSquareIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import type { EnrichedBooking } from '../../hooks/useAllBookings';
import type { BookingStatus } from '../../types/booking';
import { useToast } from '../../context/ToastContext';
import { markUserAsNoShow } from '../../utils/userActions';

interface BookingOrderCardProps {
    booking: EnrichedBooking;
    updatingId: string | null;
    onUpdateStatus: (booking: EnrichedBooking, status: BookingStatus) => void;
}

const BookingOrderCard: React.FC<BookingOrderCardProps> = ({ booking, updatingId, onUpdateStatus }) => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const getStatusLabel = (status: string) => {
        switch(status) {
            case 'pending_confirmation': return '待確認';
            case 'pending_payment': return '待付款';
            case 'confirmed': return '已確認';
            case 'completed': return '已完成';
            case 'cancelled': return '已取消';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'pending_confirmation': return 'bg-orange-50 text-orange-700 border border-orange-100';
            case 'pending_payment': return 'bg-yellow-50 text-yellow-700 border border-yellow-100';
            case 'confirmed': return 'bg-green-50 text-green-700 border border-green-100';
            case 'completed': return 'bg-blue-50 text-blue-700 border border-blue-100';
            case 'cancelled': return 'bg-gray-50 text-gray-500 border border-gray-200';
            default: return 'bg-gray-50 text-gray-700';
        }
    };

    const handleNoShow = async () => {
        if (!window.confirm('確定將此用戶標記為「放鳥」？\n\n此操作將：\n1. 取消此訂單\n2. 將用戶降級為一般會員\n3. 限制用戶未來升級權限')) {
            return;
        }

        try {
            await markUserAsNoShow(booking.id, booking.userId);
            showToast('已標記為放鳥並取消訂單', 'success');
            // Notify parent to update UI (this might trigger a redundant update call but ensures consistency)
            onUpdateStatus(booking, 'cancelled');
        } catch (error) {
            console.error('No show handling error:', error);
            showToast('操作失敗', 'error');
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm active:scale-[0.99] transition-transform duration-200">
            {/* Top Row: ID & Status */}
            <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded">
                    #{booking.id.slice(0,6)}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                </span>
            </div>

            {/* Middle Row: Content */}
            <div className="flex gap-3 mb-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#9F9586]/10 flex-shrink-0 flex items-center justify-center text-[#9F9586] font-bold text-sm">
                    {booking.userName?.[0] || '客'}
                </div>
                
                {/* Details */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-bold text-gray-900 text-sm truncate pr-2">{booking.userName}</h4>
                        <span className="text-sm font-bold text-[#9F9586] whitespace-nowrap">${booking.amount}</span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                        <CalendarDaysIcon className="w-3 h-3" />
                        {format(booking.dateTime, 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                    </p>
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg space-y-1">
                        {booking.items && booking.items.length > 0 ? (
                            booking.items.map((item: any, idx: number) => (
                                <div key={idx} className="border-b last:border-0 border-gray-200 pb-1 last:pb-0">
                                    <div className="font-medium text-gray-800">{item.serviceName}</div>
                                    {item.options && Object.entries(item.options).length > 0 && (
                                        <div className="pl-2 mt-0.5 space-y-0.5">
                                            {Object.entries(item.options).map(([catName, optItems]: [string, any]) => (
                                                <div key={catName} className="flex flex-wrap gap-1 text-[10px] text-gray-500">
                                                    <span className="text-gray-400">{catName}:</span>
                                                    {optItems.map((opt: any, i: number) => (
                                                        <span key={i} className="bg-white border border-gray-100 px-1 rounded">
                                                            {opt.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            /* Legacy or simple rendering */
                            <span>{booking.serviceNames.join(', ')}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row: Actions */}
            <div className="pt-2 border-t border-gray-50 flex items-center justify-between gap-2">
                {/* Left Side: No Show Button */}
                <div>
                     {booking.status === 'confirmed' && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleNoShow();
                            }}
                            className="px-2 py-1.5 rounded-lg text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-200 hover:text-gray-700 flex items-center gap-1 transition-colors"
                            title="標記為放鳥 (降級並取消)"
                        >
                            <UserMinusIcon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">放鳥</span>
                            <span className="sm:hidden">放鳥</span>
                        </button>
                    )}
                </div>

                {/* Right Side: Standard Actions */}
                <div className="flex items-center gap-2">
                    {/* Edit Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/orders/${booking.id}/edit`);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 flex items-center gap-1"
                    >
                        <PencilSquareIcon className="w-3.5 h-3.5" />
                        編輯
                    </button>

                    {updatingId === booking.id ? (
                        <span className="text-xs text-gray-400 py-1.5 px-2">處理中...</span>
                    ) : (
                        <>
                            {booking.status === 'pending_confirmation' && (
                                <>
                                    <button onClick={() => onUpdateStatus(booking, 'cancelled')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-50">拒絕</button>
                                    <button onClick={() => onUpdateStatus(booking, 'confirmed')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#9F9586]">確認</button>
                                </>
                            )}
                            {booking.status === 'pending_payment' && (
                                <button onClick={() => onUpdateStatus(booking, 'confirmed')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600">確認收款</button>
                            )}
                            {booking.status === 'confirmed' && (
                                <button onClick={() => onUpdateStatus(booking, 'completed')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-green-600">完成</button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingOrderCard;
