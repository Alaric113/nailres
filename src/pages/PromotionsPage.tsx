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

// Main Promotions Page Component
const PromotionsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('coupons');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const { coupons, isLoading, error } = useCoupons(); // Moved here

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
    <div className="min-h-screen bg-secondary-light text-text-main">
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="border-b border-secondary-dark/30 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button onClick={() => setActiveTab('coupons')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'coupons' ? 'border-primary text-primary font-bold' : 'border-transparent text-text-light hover:text-text-main hover:border-secondary-dark'}`}>
              優惠券管理
            </button>

            <button onClick={() => setActiveTab('distribution')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'distribution' ? 'border-primary text-primary font-bold' : 'border-transparent text-text-light hover:text-text-main hover:border-secondary-dark'}`}>
              優惠券發送
            </button>
            <button onClick={() => setActiveTab('loyalty')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'loyalty' ? 'border-primary text-primary font-bold' : 'border-transparent text-text-light hover:text-text-main hover:border-secondary-dark'}`}>
              集點卡設定
            </button>
            <button onClick={() => setActiveTab('redemption')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'redemption' ? 'border-primary text-primary font-bold' : 'border-transparent text-text-light hover:text-text-main hover:border-secondary-dark'}`}>
              兌換設定
            </button>
          </nav>
        </div>

        {activeTab === 'coupons' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-dark/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-serif font-bold text-text-main">優惠券列表</h2>
              <button 
                onClick={() => { setEditingCoupon(null); setIsModalOpen(true); }} 
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
              >
                + 新增優惠券
              </button>
            </div>
            
            {coupons.length === 0 ? (
                <p className="text-center text-gray-500 py-8">尚未建立任何優惠券。</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coupons.map(coupon => (
                        <CouponCard key={coupon.id} coupon={coupon} onEdit={handleEditCoupon} />
                    ))}
                </div>
            )}
          </div>
        )}
        {activeTab === 'distribution' && <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-dark/50">
          <CouponDistribution />
        </div>}
        {activeTab === 'loyalty' && <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-dark/50">
          <LoyaltySettings />
        </div>}
        {activeTab === 'redemption' && <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-dark/50">
          <RedemptionSettings />
        </div>}
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCoupon ? '編輯優惠券' : '新增優惠券'}>
        <CouponForm 
          coupon={editingCoupon} 
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            setIsModalOpen(false);
            // Optionally show a success message
          }}
        />
      </Modal>
    </div>
  );
};

export default PromotionsPage;