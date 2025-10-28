import { useCoupons } from '../../hooks/useCoupons';
import LoadingSpinner from '../common/LoadingSpinner';
import type { Coupon } from '../../types/coupon';
import { format } from 'date-fns';

interface CouponListProps {
  onEdit: (coupon: Coupon) => void;
}

const CouponList = ({ onEdit }: CouponListProps) => {
  const { coupons, isLoading, error } = useCoupons();

  if (isLoading) {
    return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
  }

  if (error) {
    return <p className="text-red-500 text-center p-8">{error}</p>;
  }

  return (
    <div className="space-y-4">
      {coupons.length === 0 ? (
        <p className="text-center text-gray-500 py-8">尚未建立任何優惠券。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">標題 / 代碼</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">類型</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用狀況</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有效期限</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">編輯</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{coupon.title}</div>
                    <div className="text-sm text-gray-500">{coupon.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {coupon.type === 'fixed' ? `折抵 $${coupon.value}` : `${coupon.value}% 折扣`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {coupon.isActive ? '啟用中' : '已停用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {coupon.usageCount} / {coupon.usageLimit === -1 ? '無限制' : coupon.usageLimit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(coupon.validUntil.toDate(), 'yyyy-MM-dd')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => onEdit(coupon)} className="text-indigo-600 hover:text-indigo-900">編輯</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CouponList;