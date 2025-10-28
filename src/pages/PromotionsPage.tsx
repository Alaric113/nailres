import { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../components/common/Modal';
import CouponForm from '../components/admin/CouponForm';
import CouponList from '../components/admin/CouponList';
import LoyaltySettings from '../components/admin/LoyaltySettings';
import CouponDistribution from '../components/admin/CouponDistribution';
import type { Coupon } from '../types/coupon';

type Tab = 'coupons' | 'distribution' | 'loyalty';

const PromotionsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('coupons');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            優惠與集點管理
          </h1>
          <Link to="/admin" className="text-sm font-medium text-indigo-600 hover:underline">
            &larr; 返回管理員後台
          </Link>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button onClick={() => setActiveTab('coupons')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'coupons' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              優惠券管理
            </button>
            <button onClick={() => setActiveTab('distribution')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'distribution' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              優惠券發送
            </button>
            <button onClick={() => setActiveTab('loyalty')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'loyalty' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              集點卡設定
            </button>
          </nav>
        </div>

        {activeTab === 'coupons' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">優惠券列表</h2>
              <button onClick={() => { setEditingCoupon(null); setIsModalOpen(true); }} className="btn-primary">
                + 新增優惠券
              </button>
            </div>
            <CouponList onEdit={handleEditCoupon} />
          </div>
        )}
        {activeTab === 'distribution' && <div className="bg-white p-6 rounded-lg shadow-md">
          <CouponDistribution />
        </div>}
        {activeTab === 'loyalty' && <div className="bg-white p-6 rounded-lg shadow-md">
          <LoyaltySettings />
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