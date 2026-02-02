import { useState, useMemo, useEffect, useRef } from 'react';
import { useCoupons } from '../../hooks/useCoupons';
import { useGiftCards } from '../../hooks/useGiftCards';
import { useAllUsers } from '../../hooks/useAllUsers';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../context/ToastContext';
import type { UserRole } from '../../types/user';
import { TicketIcon, CreditCardIcon, PaperAirplaneIcon, UsersIcon, UserGroupIcon, UserPlusIcon, UserIcon } from '@heroicons/react/24/outline';

  type TargetType = 'all' | 'role' | 'specific' | 'new' | 'pass';
  type SendType = 'coupon' | 'giftcard';

  const CouponDistribution = () => {
    const { coupons, isLoading: isLoadingCoupons } = useCoupons();
    const { giftCards, isLoading: isLoadingGiftCards } = useGiftCards();
    const { users, loading: isLoadingUsers } = useAllUsers();
    const { currentUser } = useAuthStore();
    const { showToast } = useToast();

    const [sendType, setSendType] = useState<SendType>('coupon');
    const [selectedCoupon, setSelectedCoupon] = useState<string>('');
    const [selectedGiftCard, setSelectedGiftCard] = useState<string>('');
    const [targetTypes, setTargetTypes] = useState<Set<TargetType>>(new Set(['all']));
    const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [selectedPasses, setSelectedPasses] = useState<string[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const userSearchRef = useRef<HTMLDivElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const activeCoupons = useMemo(() => coupons.filter(c => c.isActive), [coupons]);
    const activeGiftCards = useMemo(() => giftCards.filter(g => g.isActive), [giftCards]);
    const userRoles: UserRole[] = ['user', 'platinum', 'admin'];

    // Extract unique active passes from users
    const availablePasses = useMemo(() => {
        const passes = new Set<string>();
        users.forEach(user => {
            user.activePasses?.forEach(pass => {
                if (pass.passName) {
                    passes.add(pass.passName);
                }
            });
        });
        return Array.from(passes).sort();
    }, [users]);

    const handleRoleChange = (role: UserRole) => {
      setSelectedRoles(prev => {
        if (prev.includes(role)) {
          return prev.filter(r => r !== role);
        }
        return [...prev, role];
      });
    };

    const handlePassChange = (passName: string) => {
        setSelectedPasses(prev => {
            if (prev.includes(passName)) {
                return prev.filter(p => p !== passName);
            }
            return [...prev, passName];
        });
    };

    const handleUserSelect = (userId: string) => {
      setSelectedUsers(prev => {
        if (prev.includes(userId)) {
          return prev.filter(id => id !== userId);
        } else {
          return [...prev, userId];
        }
      });
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (userSearchRef.current && !userSearchRef.current.contains(event.target as Node)) {
          setIsUserDropdownOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredUsers = useMemo(() => {
      if (!userSearch) return users;
      return users.filter(user => (user.profile.displayName || '').toLowerCase().includes(userSearch.toLowerCase()) || user.email.toLowerCase().includes(userSearch.toLowerCase()));
    }, [users, userSearch]);

    const handleTargetTypeChange = (type: TargetType, checked: boolean) => {
      setTargetTypes(prev => {
        const newTypes = new Set(prev);
        if (checked) {
          if (type === 'all') return new Set(['all']);
          newTypes.add(type);
          newTypes.delete('all');
        } else {
          newTypes.delete(type);
        }
        return newTypes.size === 0 ? new Set(['all']) : newTypes;
      });
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
  
      const selectedItem = sendType === 'coupon' ? selectedCoupon : selectedGiftCard;
      if (!selectedItem) {
        showToast(`請選擇要發送的${sendType === 'coupon' ? '優惠券' : '商品卡'}。`, 'error');
        return;
      }
  
      setIsSubmitting(true);
      try {
        const token = await currentUser?.getIdToken();
        const endpoint = sendType === 'coupon' ? '/api/distribute-coupon' : '/api/distribute-giftcard';
        
        // Prepare target payload
        // We filter 'pass' targets on the frontend and send them as 'specific' IDs to the backend
        // to avoid complex backend queries and schema dependency.
        const targetsPayload = [];
        
        // Handle standard types
        if (targetTypes.has('all')) targetsPayload.push({ type: 'all', ids: [] });
        if (targetTypes.has('new')) targetsPayload.push({ type: 'new', ids: [] });
        if (targetTypes.has('role')) targetsPayload.push({ type: 'role', ids: selectedRoles });

        // Handle 'specific' and 'pass' (merged into 'specific')
        const specificUserIds = new Set<string>();
        
        if (targetTypes.has('specific')) {
            selectedUsers.forEach(id => specificUserIds.add(id));
        }

        if (targetTypes.has('pass')) {
            const usersWithPass = users.filter(user => 
                user.activePasses?.some(pass => selectedPasses.includes(pass.passName))
            );
            
            usersWithPass.forEach(user => specificUserIds.add(user.id));

        }

        if (specificUserIds.size > 0) {
            targetsPayload.push({ type: 'specific', ids: Array.from(specificUserIds) });
        }

        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            [sendType === 'coupon' ? 'couponId' : 'giftCardId']: selectedItem,
            targets: targetsPayload
          }),
        });
  
        const result = await response.json();
        console.log(result);
        if (!response.ok) {
          throw new Error(result.message || '發送失敗');
        }
  
        showToast(`成功發送${sendType === 'coupon' ? '優惠券' : '商品卡'}給 ${result.distributedCount} 位使用者！`, 'success');
      } catch (err: any) {
        showToast(`發送失敗: ${err.message}`, 'error');
      } finally {
        setIsSubmitting(false);
      }
    };
  
    if (isLoadingCoupons || isLoadingUsers || isLoadingGiftCards) {
      return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
    }
  
      const roleLabels: Record<UserRole, string> = {
        user: '一般會員',
        platinum: '白金會員',
        admin: '管理員',
        manager: '管理設計師',
        designer: '設計師',
        deleted: '已刪除',
      };  
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#9F9586]/10 flex items-center justify-center">
            <PaperAirplaneIcon className="w-5 h-5 text-[#9F9586]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">發送獎勵</h2>
            <p className="text-sm text-gray-500">發送優惠券或商品卡給指定會員</p>
          </div>
        </div>
  
        {/* Send Type Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => setSendType('coupon')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${sendType === 'coupon'
              ? 'bg-white text-[#9F9586] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <TicketIcon className="w-5 h-5" />
            發送優惠券
          </button>
          <button
            type="button"
            onClick={() => setSendType('giftcard')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${sendType === 'giftcard'
              ? 'bg-white text-[#9F9586] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <CreditCardIcon className="w-5 h-5" />
            發送商品卡
          </button>
        </div>
  
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Selection */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {sendType === 'coupon' ? '選擇優惠券' : '選擇商品卡'}
            </label>
            {sendType === 'coupon' ? (
              <select
                value={selectedCoupon}
                onChange={e => setSelectedCoupon(e.target.value)}
                className="w-full rounded-lg border-gray-200 focus:ring-[#9F9586] focus:border-[#9F9586] bg-white"
              >
                <option value="">請選擇...</option>
                {activeCoupons.map(coupon => (
                  <option key={coupon.id} value={coupon.id}>{coupon.title} ({coupon.code})</option>
                ))}
              </select>
            ) : (
              <select
                value={selectedGiftCard}
                onChange={e => setSelectedGiftCard(e.target.value)}
                className="w-full rounded-lg border-gray-200 focus:ring-[#9F9586] focus:border-[#9F9586] bg-white"
              >
                <option value="">請選擇...</option>
                {activeGiftCards.map(gc => (
                  <option key={gc.id} value={gc.id}>{gc.name}</option>
                ))}
              </select>
            )}
            {sendType === 'coupon' && activeCoupons.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">尚未建立任何啟用中的優惠券。</p>
            )}
            {sendType === 'giftcard' && activeGiftCards.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">尚未建立任何啟用中的商品卡。</p>
            )}
          </div>
  
          {/* Target Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700">發送對象</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { type: 'all' as TargetType, label: '全體會員', icon: UsersIcon, desc: '發送給所有人' },
                { type: 'new' as TargetType, label: '新會員', icon: UserPlusIcon, desc: '過去7天註冊' },
                { type: 'role' as TargetType, label: '依等級', icon: UserGroupIcon, desc: '選擇會員等級' },
                { type: 'pass' as TargetType, label: '依季卡', icon: TicketIcon, desc: '持有特定季卡' },
                { type: 'specific' as TargetType, label: '指定會員', icon: UserIcon, desc: '搜尋選擇' },
              ].map(({ type, label, icon: Icon, desc }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTargetTypeChange(type, !targetTypes.has(type))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${targetTypes.has(type)
                    ? 'border-[#9F9586] bg-[#9F9586]/5'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${targetTypes.has(type) ? 'text-[#9F9586]' : 'text-gray-400'}`} />
                  <div className={`text-sm font-bold ${targetTypes.has(type) ? 'text-[#9F9586]' : 'text-gray-700'}`}>{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
                </button>
              ))}
            </div>
          </div>
  
          {/* Role Selection */}
          {targetTypes.has('role') && (
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              <label className="block text-sm font-bold text-gray-700 mb-3">選擇會員等級</label>
              <div className="flex flex-wrap gap-2">
                {userRoles.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleChange(role)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedRoles.includes(role)
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                      }`}
                  >
                    {roleLabels[role]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pass Selection */}
          {targetTypes.has('pass') && (
            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
              <label className="block text-sm font-bold text-gray-700 mb-3">選擇持有的 Active Pass (季票)</label>
              {availablePasses.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availablePasses.map(passName => (
                      <button
                        key={passName}
                        type="button"
                        onClick={() => handlePassChange(passName)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedPasses.includes(passName)
                          ? 'bg-amber-500 text-white'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-300'
                          }`}
                      >
                        {passName}
                      </button>
                    ))}
                  </div>
              ) : (
                  <div className="text-sm text-gray-500">目前沒有使用者持有 Active Pass</div>
              )}
              
            </div>
          )}

        {/* User Selection */}
        {targetTypes.has('specific') && (
          <div ref={userSearchRef} className="bg-purple-50/50 rounded-xl p-4 border border-purple-100">
            <label className="block text-sm font-bold text-gray-700 mb-2">搜尋並選擇會員</label>
            <div className="relative">
              <input
                type="text"
                placeholder="輸入會員名稱或 Email..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                onFocus={() => setIsUserDropdownOpen(true)}
                className="w-full rounded-lg border-gray-200 focus:ring-[#9F9586] focus:border-[#9F9586] bg-white"
              />
              {isUserDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-400">找不到會員</div>
                  ) : (
                    filteredUsers.map(user => (
                      <div
                        key={user.id}
                        onClick={() => handleUserSelect(user.id)}
                        className="px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{user.profile.displayName || '未設定名稱'}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                        {selectedUsers.includes(user.id) && (
                          <span className="w-5 h-5 rounded-full bg-[#9F9586] text-white flex items-center justify-center text-xs">✓</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {selectedUsers.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedUsers.map(userId => {
                  const user = users.find(u => u.id === userId);
                  return user ? (
                    <span
                      key={userId}
                      onClick={() => handleUserSelect(userId)}
                      className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full cursor-pointer hover:bg-purple-200 transition-colors"
                    >
                      {user.profile.displayName || user.email} ✕
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-[#9F9586] text-white rounded-xl font-bold hover:bg-[#8A8173] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
            {isSubmitting ? '發送中...' : '確認發送'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CouponDistribution;

