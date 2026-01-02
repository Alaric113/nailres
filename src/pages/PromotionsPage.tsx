import { useState } from 'react';
import Modal from '../components/common/Modal';
import CouponForm from '../components/admin/CouponForm';
import LoyaltySettings from '../components/admin/LoyaltySettings';
import CouponDistribution from '../components/admin/CouponDistribution';
import CouponCard from '../components/admin/CouponCard';
import RedemptionSettings from '../components/admin/RedemptionSettings';
import { useCoupons } from '../hooks/useCoupons';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { Coupon } from '../types/coupon';

type Tab = 'coupons' | 'distribution' | 'loyalty' | 'redemption';

const tabs: { key: Tab; label: string }[] = [
  { key: 'coupons', label: '優惠券' },
  { key: 'distribution', label: '發送' },
  { key: 'loyalty', label: '集點卡' },
  { key: 'redemption', label: '兌換' },
];

// Main Promotions Page Component
const PromotionsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('coupons');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const { coupons, isLoading, error } = useCoupons();

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <div className="p-4 text-center"><LoadingSpinner /></div>;
  }

  if (error) {
    return <p className="text-red-500 text-center p-4">{error}</p>;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-gray-800 pb-24 md:pb-8">

      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
        {/* Tab Navigation - Horizontal Scroll on Mobile */}
        <div className="mb-4 sm:mb-6">
          <nav
            className="flex overflow-x-auto gap-2 sm:gap-1 pb-2 -mx-1 px-1 hide-scrollbar"
            aria-label="Tabs"
          >
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
                  sm:rounded-none sm:px-3 sm:py-3 sm:border-b-2
                  ${activeTab === tab.key
                    ? 'bg-[#9F9586] text-white sm:bg-transparent sm:text-[#9F9586] sm:border-[#9F9586] font-bold'
                    : 'bg-gray-100 text-gray-600 sm:bg-transparent sm:border-transparent hover:bg-gray-200 sm:hover:bg-transparent sm:hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'coupons' && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            {/* Header: Stack on mobile */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">優惠券列表</h2>
              <button
                onClick={() => { setEditingCoupon(null); setIsModalOpen(true); }}
                className="w-full sm:w-auto px-4 py-2.5 text-sm font-bold text-white bg-[#9F9586] rounded-lg hover:bg-[#8a8174] transition-colors shadow-sm active:scale-[0.98]"
              >
                + 新增優惠券
              </button>
            </div>

            {coupons.length === 0 ? (
              <p className="text-center text-gray-400 py-8">尚未建立任何優惠券。</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {coupons.map(coupon => (
                  <CouponCard key={coupon.id} coupon={coupon} onEdit={handleEditCoupon} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'distribution' && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <CouponDistribution />
          </div>
        )}

        {activeTab === 'loyalty' && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <LoyaltySettings />
          </div>
        )}

        {activeTab === 'redemption' && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <RedemptionSettings />
          </div>
        )}
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCoupon ? '編輯優惠券' : '新增優惠券'}>
        <CouponForm
          coupon={editingCoupon}
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            setIsModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
};

export default PromotionsPage;