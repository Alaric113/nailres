import { useState, useMemo, useEffect, useRef } from 'react';
import { useCoupons } from '../../hooks/useCoupons';
import { useAllUsers } from '../../hooks/useAllUsers';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../types/user';

type TargetType = 'all' | 'role' | 'specific' | 'new';

const CouponDistribution = () => {
  const { coupons, isLoading: isLoadingCoupons } = useCoupons();
  const { users, loading: isLoadingUsers } = useAllUsers();
  const { currentUser } = useAuthStore();

  const [selectedCoupon, setSelectedCoupon] = useState<string>('');
  const [targetTypes, setTargetTypes] = useState<Set<TargetType>>(new Set(['all']));
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userSearchRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activeCoupons = useMemo(() => coupons.filter(c => c.isActive), [coupons]);
  const userRoles: UserRole[] = ['user', 'platinum', 'admin'];

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value as UserRole);
    setSelectedRoles(selectedOptions);
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
        if (type === 'all') return new Set(['all']); // 'all' is exclusive
        newTypes.add(type);
        newTypes.delete('all'); // Remove 'all' if other specific types are selected
      } else {
        newTypes.delete(type);
      }
      return newTypes.size === 0 ? new Set(['all']) : newTypes; // Default to 'all' if empty
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!selectedCoupon) {
      setMessage({ type: 'error', text: '請選擇要發送的優惠券。' });
      return;
    }
    
    setIsSubmitting(true);
    setMessage(null);
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch('/api/distribute-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          couponId: selectedCoupon,
          targets: Array.from(targetTypes).map(type => ({
            type,
            ids: type === 'role' ? selectedRoles : type === 'specific' ? selectedUsers : [],
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '發送失敗');
      }

      setMessage({ type: 'success', text: `成功發送優惠券給 ${result.distributedCount} 位使用者！` });
    } catch (err: any) {
      setMessage({ type: 'error', text: `發送失敗: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingCoupons || isLoadingUsers) {
    return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">發送優惠券</h2>
      {message && (
        <div className={`p-3 mb-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="coupon" className="block text-sm font-medium text-gray-700">選擇優惠券</label>
          <select id="coupon" value={selectedCoupon} onChange={e => setSelectedCoupon(e.target.value)} className="mt-1 w-full input-style">
            <option value="" disabled>請選擇...</option>
            {activeCoupons.map(coupon => (
              <option key={coupon.id} value={coupon.id}>{coupon.title} ({coupon.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">發送對象</label>
          <div className="mt-2 space-y-2">
            <div className="flex items-center"><input type="checkbox" id="target-all" checked={targetTypes.has('all')} onChange={(e) => handleTargetTypeChange('all', e.target.checked)} className="h-4 w-4 checkbox-style" /><label htmlFor="target-all" className="ml-2">全體會員 (勾選此項將覆蓋其他選項)</label></div>
            <div className="flex items-center"><input type="checkbox" id="target-new" checked={targetTypes.has('new')} onChange={(e) => handleTargetTypeChange('new', e.target.checked)} className="h-4 w-4 checkbox-style" /><label htmlFor="target-new" className="ml-2">新註冊會員 (過去7天內)</label></div>
            <div className="flex items-center"><input type="checkbox" id="target-role" checked={targetTypes.has('role')} onChange={(e) => handleTargetTypeChange('role', e.target.checked)} className="h-4 w-4 checkbox-style" /><label htmlFor="target-role" className="ml-2">依會員等級</label></div>
            <div className="flex items-center"><input type="checkbox" id="target-specific" checked={targetTypes.has('specific')} onChange={(e) => handleTargetTypeChange('specific', e.target.checked)} className="h-4 w-4 checkbox-style" /><label htmlFor="target-specific" className="ml-2">指定會員</label></div>
          </div>
        </div>

        {targetTypes.has('role') && (
          <div>
            <label htmlFor="roles" className="block text-sm font-medium text-gray-700">選擇會員等級</label>
            <select id="roles" multiple value={selectedRoles} onChange={handleRoleChange} className="mt-1 w-full input-style h-24">
              {userRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        )}

        {targetTypes.has('specific') && (
          <div ref={userSearchRef}>
            <label htmlFor="users" className="block text-sm font-medium text-gray-700">選擇會員</label>
            <div className="mt-1 relative">
              <input
                type="text"
                placeholder="搜尋會員名稱或 Email..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                onFocus={() => setIsUserDropdownOpen(true)}
                className="w-full input-style"
              />
              {isUserDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredUsers.map(user => (
                    <div key={user.id} onClick={() => handleUserSelect(user.id)} className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between">
                      <span>{user.profile.displayName || user.email}</span>
                      {selectedUsers.includes(user.id) && <span className="text-pink-500">✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedUsers.map(userId => {
                const user = users.find(u => u.id === userId);
                return user ? <span key={userId} className="px-2 py-1 bg-pink-100 text-pink-700 text-xs font-medium rounded-full">{user.profile.displayName || user.email}</span> : null;
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? '發送中...' : '確認發送'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CouponDistribution;
