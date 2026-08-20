import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDays, 
  Clock, 
  User, 
  Pencil, 
  UserX, 
  AlertTriangle, 
  Ticket, 
  Crown, 
  MessageSquareQuote, 
  Check, 
  X, 
  CreditCard, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
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
  const isUpdating = updatingId === booking.id;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending_confirmation':
        return {
          label: '待確認',
          bg: 'bg-amber-50',
          text: 'text-amber-800',
          border: 'border-amber-200',
          dot: 'bg-amber-500'
        };
      case 'pending_payment':
        return {
          label: '待付款',
          bg: 'bg-blue-50',
          text: 'text-blue-800',
          border: 'border-blue-200',
          dot: 'bg-blue-500'
        };
      case 'confirmed':
        return {
          label: '已確認',
          bg: 'bg-emerald-50',
          text: 'text-emerald-800',
          border: 'border-emerald-200',
          dot: 'bg-emerald-500'
        };
      case 'completed':
        return {
          label: '已完成',
          bg: 'bg-[#9F9586]/10',
          text: 'text-[#8A8173]',
          border: 'border-[#9F9586]/30',
          dot: 'bg-[#9F9586]'
        };
      case 'cancelled':
        return {
          label: '已取消',
          bg: 'bg-gray-100',
          text: 'text-gray-500',
          border: 'border-gray-200',
          dot: 'bg-gray-400'
        };
      default:
        return {
          label: status,
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          border: 'border-gray-200',
          dot: 'bg-gray-400'
        };
    }
  };

  const statusConfig = getStatusConfig(booking.status);

  const handleNoShow = async () => {
    if (!window.confirm(`確定將用戶「${booking.userName}」標記為放鳥？\n\n此操作將：\n1. 取消此預約訂單\n2. 將該用戶降級為一般會員並列入黑名單\n3. 限制未來會員升級權限`)) {
      return;
    }

    try {
      await markUserAsNoShow(booking.id, booking.userId);
      showToast('已標記為放鳥並取消訂單', 'success');
      onUpdateStatus(booking, 'cancelled');
    } catch (error) {
      console.error('No show handling error:', error);
      showToast('操作失敗，請稍後再試', 'error');
    }
  };

  return (
    <div className={`w-full min-w-0 max-w-full overflow-hidden bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border transition-all duration-300 shadow-soft hover:shadow-medium flex flex-col justify-between space-y-3.5 ${
      booking.isConflicting ? 'border-amber-300 ring-2 ring-amber-200' : 'border-[#EFECE5]'
    }`}>
      
      {/* 1. Header Bar: Order ID, Status, Conflict Warning */}
      <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] sm:text-xs font-mono font-bold bg-[#FAF9F6] border border-[#EFECE5] px-2 py-0.5 rounded-lg sm:rounded-xl text-gray-700 shrink-0">
            #{booking.id.slice(-6).toUpperCase()}
          </span>
          <span className="text-[10px] sm:text-[11px] text-text-light truncate">
            {format(booking.createdAt, 'MM/dd HH:mm')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {booking.isConflicting && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              衝突
            </span>
          )}

          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* 2. Customer & Appointment Details */}
      <div className="flex items-start gap-3 pt-0.5 min-w-0">
        {/* Customer Avatar */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#9F9586] to-[#EFECE5] p-0.5 shrink-0 shadow-sm">
          <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-[#9F9586] font-bold text-sm">
            {booking.userName?.[0] || '客'}
          </div>
        </div>

        {/* Customer Name & Booking Time */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <button
              onClick={() => booking.userId && navigate(`/admin/customers/${booking.userId}`)}
              className="font-bold text-gray-900 text-sm sm:text-base hover:text-[#9F9586] transition-colors truncate flex items-center gap-1 cursor-pointer text-left min-w-0 flex-1"
              title="查看顧客檔案"
            >
              <span className="truncate">{booking.userName}</span>
              {booking.userId && <ExternalLink className="w-3.5 h-3.5 text-text-light shrink-0" />}
            </button>
            
            <span className="text-base sm:text-lg font-serif font-bold text-[#9F9586] shrink-0">
              ${booking.amount.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-light min-w-0">
            <div className="flex items-center gap-1 text-gray-800 font-medium truncate">
              <CalendarDays className="w-3.5 h-3.5 text-[#9F9586] shrink-0" />
              <span>{format(booking.dateTime, 'yyyy/MM/dd (eee) HH:mm', { locale: zhTW })}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{booking.serviceDuration || booking.duration || 60} 分鐘</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Services & Options Breakdown */}
      <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-[#EFECE5] space-y-2 text-xs min-w-0">
        {booking.items && booking.items.length > 0 ? (
          <div className="space-y-1.5 min-w-0">
            {booking.items.map((item: any, idx: number) => (
              <div key={idx} className="border-b last:border-0 border-[#EFECE5]/80 pb-1.5 last:pb-0 min-w-0">
                <div className="flex justify-between items-center font-bold text-gray-800 gap-2 min-w-0">
                  <span className="truncate min-w-0">{item.serviceName}</span>
                  {item.price > 0 && (
                    <span className="text-text-light font-normal text-[11px] shrink-0">${item.price}</span>
                  )}
                </div>

                {item.options && Object.entries(item.options).length > 0 && (
                  <div className="mt-1 space-y-0.5 pl-1 min-w-0">
                    {Object.entries(item.options).map(([catName, optItems]: [string, any]) => (
                      <div key={catName} className="flex flex-wrap items-center gap-1 text-[10px] text-text-light">
                        <span className="text-gray-400">{catName}:</span>
                        {optItems.map((opt: any, i: number) => (
                          <span key={i} className="bg-white border border-[#EFECE5] px-1.5 py-0.5 rounded-md font-medium text-gray-700 shadow-2xs">
                            {opt.name} {opt.price > 0 ? `(+$${opt.price})` : ''}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="font-medium text-gray-800 truncate">
            {booking.serviceNames?.join('、') || '美甲美睫預約服務'}
          </div>
        )}

        {/* Tags & Badges: Coupon, Pass, Followup */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {booking.passUsage && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
              <Crown className="w-3 h-3 text-amber-600 shrink-0" />
              季卡折抵
            </span>
          )}

          {booking.couponName && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold truncate max-w-[160px]">
              <Ticket className="w-3 h-3 text-rose-500 shrink-0" />
              <span className="truncate">{booking.couponName}</span>
            </span>
          )}

          {booking.isFollowUp && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
              <Sparkles className="w-3 h-3 text-purple-500 shrink-0" />
              售後保固
            </span>
          )}

          {booking.rescheduleCount && booking.rescheduleCount > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-medium">
              已改期 {booking.rescheduleCount} 次
            </span>
          ) : null}
        </div>

        {/* Customer Notes */}
        {booking.notes && (
          <div className="pt-1 text-[11px] text-text-light flex items-start gap-1.5 bg-white p-2 rounded-xl border border-[#EFECE5] min-w-0">
            <MessageSquareQuote className="w-3.5 h-3.5 text-[#9F9586] shrink-0 mt-0.5" />
            <span className="leading-relaxed break-words min-w-0 flex-1">備註: {booking.notes}</span>
          </div>
        )}
      </div>

      {/* 4. Bottom Action Bar */}
      <div className="pt-2 border-t border-[#EFECE5] flex flex-wrap items-center justify-between gap-2 min-w-0">
        {/* Left Side Actions (No-Show, Edit) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {booking.status === 'confirmed' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleNoShow();
              }}
              disabled={isUpdating}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="標記為放鳥"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>放鳥</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/orders/${booking.id}/edit`);
            }}
            disabled={isUpdating}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-[#EFECE5] flex items-center gap-1 shadow-subtle transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Pencil className="w-3.5 h-3.5 text-[#9F9586]" />
            <span>編輯</span>
          </button>
        </div>

        {/* Right Side Status Change CTA */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isUpdating ? (
            <span className="text-xs font-bold text-text-light px-2 py-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#9F9586] animate-ping" />
              處理中...
            </span>
          ) : (
            <>
              {booking.status === 'pending_confirmation' && (
                <>
                  <button 
                    onClick={() => onUpdateStatus(booking, 'cancelled')} 
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>拒絕</span>
                  </button>
                  <button 
                    onClick={() => onUpdateStatus(booking, 'confirmed')} 
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#9F9586] hover:bg-[#8A8173] shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>確認預約</span>
                  </button>
                </>
              )}

              {booking.status === 'pending_payment' && (
                <button 
                  onClick={() => onUpdateStatus(booking, 'confirmed')} 
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>確認已收款</span>
                </button>
              )}

              {booking.status === 'confirmed' && (
                <button 
                  onClick={() => onUpdateStatus(booking, 'completed')} 
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>完成服務</span>
                </button>
              )}

              {booking.status === 'completed' && booking.customerFeedback && (
                <span className="px-2 py-1 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 flex items-center gap-1">
                  ⭐ {booking.customerFeedback.rating || 5}星
                </span>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default BookingOrderCard;
