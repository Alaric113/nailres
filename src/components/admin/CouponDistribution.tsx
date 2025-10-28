import { useState, useMemo } from 'react';
import { useCoupons } from '../../hooks/useCoupons';
import { useAllUsers } from '../../hooks/useAllUsers';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../types/user';

type TargetType = 'all' | 'role' | 'specific';

const CouponDistribution = () => {
  const { coupons, isLoading: isLoadingCoupons } = useCoupons();
  const { users, loading: isLoadingUsers } = useAllUsers();
  const { currentUser } = useAuthStore();

  const [selectedCoupon, setSelectedCoupon] = useState<string>('');
  const [targetType, setTargetType] = useState<TargetType>('all');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activeCoupons = useMemo(() => coupons.filter(c => c.isActive), [coupons]);
  const userRoles: UserRole[] = ['user', 'platinum', 'admin'];

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value as UserRole);
    setSelectedRoles(selectedOptions);
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedUsers(selectedOptions);
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
          targetType,
          targetIds: targetType === 'role' ? selectedRoles : selectedUsers,
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
            <div className="flex items-center"><input type="radio" id="target-all" name="target" value="all" checked={targetType === 'all'} onChange={() => setTargetType('all')} className="h-4 w-4 radio-style" /><label htmlFor="target-all" className="ml-2">全體會員</label></div>
            <div className="flex items-center"><input type="radio" id="target-role" name="target" value="role" checked={targetType === 'role'} onChange={() => setTargetType('role')} className="h-4 w-4 radio-style" /><label htmlFor="target-role" className="ml-2">依會員等級</label></div>
            <div className="flex items-center"><input type="radio" id="target-specific" name="target" value="specific" checked={targetType === 'specific'} onChange={() => setTargetType('specific')} className="h-4 w-4 radio-style" /><label htmlFor="target-specific" className="ml-2">指定會員</label></div>
          </div>
        </div>

        {targetType === 'role' && (
          <div>
            <label htmlFor="roles" className="block text-sm font-medium text-gray-700">選擇會員等級</label>
            <select id="roles" multiple value={selectedRoles} onChange={handleRoleChange} className="mt-1 w-full input-style h-24">
              {userRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        )}

        {targetType === 'specific' && (
          <div>
            <label htmlFor="users" className="block text-sm font-medium text-gray-700">選擇會員</label>
            <select id="users" multiple value={selectedUsers} onChange={handleUserChange} className="mt-1 w-full input-style h-48">
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.profile.displayName || user.email}</option>
              ))}
            </select>
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
