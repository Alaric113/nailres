import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllUsers } from '../../hooks/useAllUsers';
import type { EnrichedUser } from '../../types/user';
import UserAvatar from '../common/UserAvatar';
import { 
  Search, 
  X, 
  UserCheck, 
  UserPlus, 
  Sparkles, 
  Ticket, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { users, loading } = useAllUsers();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter Users
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users.slice(0, 20); // Top 20 recent users by default

    return users.filter(user => {
      const name = user.profile?.displayName?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      const notes = user.notes?.toLowerCase() || '';
      return name.includes(term) || email.includes(term) || notes.includes(term);
    }).slice(0, 30);
  }, [users, searchTerm]);

  const handleSelectUser = (user: EnrichedUser) => {
    onClose();
    navigate(`/booking?behalfOf=${user.id}`);
  };

  const handleWalkInGuest = () => {
    onClose();
    navigate('/booking');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EFECE5] overflow-hidden flex flex-col max-h-[85vh] z-10"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#EFECE5] bg-[#FAF9F6] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#9F9586] text-white flex items-center justify-center shadow-sm">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-gray-900 leading-tight">
                  代客預約 — 選擇客戶
                </h3>
                <p className="text-[11px] text-gray-500">
                  將自動帶入該客戶之專屬會員權益、折扣與季卡
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-200/60 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Box */}
          <div className="p-3 sm:p-4 border-b border-gray-100 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜尋客戶姓名、Email、備註..."
                autoFocus
                className="w-full pl-9 pr-8 py-2.5 bg-[#FAF9F6] border border-[#EFECE5] rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9F9586]/30 focus:border-[#9F9586]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Option: Walk-in Guest */}
          <div className="px-3 sm:px-4 pt-2.5">
            <button
              onClick={handleWalkInGuest}
              className="w-full p-2.5 rounded-xl border border-dashed border-[#9F9586] hover:bg-[#9F9586]/5 transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#9F9586]/15 text-[#8A8173] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs sm:text-sm text-gray-900">現場新客 / 散客（無帳號直接預約）</span>
                  <p className="text-[10px] text-gray-500">以一般預約流程直接排單</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#9F9586] group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Customer List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 divide-y divide-gray-50">
            {loading ? (
              <div className="py-12 text-center text-xs text-gray-400">
                載入客戶名冊中...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 space-y-1">
                <p>查無符合「{searchTerm}」的客戶</p>
                <p className="text-[11px] text-gray-400">建議點選上方「現場新客」直接預約</p>
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isPlatinum = user.role === 'platinum';
                const hasPass = (user.activePasses?.length || 0) > 0;
                const isLocked = user.isPlatinumBlacklisted;

                return (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="pt-2 first:pt-0 p-2 rounded-xl hover:bg-[#FAF9F6] transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <UserAvatar
                          src={user.profile?.avatarUrl}
                          name={user.profile?.displayName}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#EFECE5]"
                        />
                        {isPlatinum && (
                          <span className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-amber-500 rounded-full text-white shadow-xs">
                            <Sparkles className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-[#9F9586] transition-colors truncate">
                            {user.profile?.displayName || '未具名顧客'}
                          </span>
                          
                          {/* Role / Tier Badges */}
                          {isPlatinum && (
                            <span className="px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[9px] font-bold">
                              白金會員
                            </span>
                          )}
                          {isLocked && (
                            <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[9px] font-bold flex items-center gap-0.5">
                              <ShieldAlert className="w-2.5 h-2.5" />
                              終身一般
                            </span>
                          )}
                          {hasPass && (
                            <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold flex items-center gap-0.5">
                              <Ticket className="w-2.5 h-2.5" />
                              季卡用戶
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          {user.email || 'LINE 綁定用戶'} {user.loyaltyPoints ? `・ 點數: ${user.loyaltyPoints} 點` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#9F9586] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <span>選擇預約</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400">
              選擇會員後，系統將自動套用其專屬會員價、已持有點數及可用優惠券
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CustomerSelectionModal;
