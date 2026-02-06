import { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { useCoupons } from '../../hooks/useCoupons';
import { MagnifyingGlassIcon, TicketIcon } from '@heroicons/react/24/outline';
import type { Coupon } from '../../types/coupon';
import LoadingSpinner from '../common/LoadingSpinner';

interface IssueCouponModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (coupon: Coupon) => Promise<void>;
}

const IssueCouponModal = ({ isOpen, onClose, onConfirm }: IssueCouponModalProps) => {
    const { coupons, isLoading } = useCoupons();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredCoupons = useMemo(() => {
        return coupons.filter(c =>
            c.isActive &&
            (c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.code.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [coupons, searchTerm]);

    const handleSubmit = async () => {
        if (!selectedCoupon) return;
        setIsSubmitting(true);
        try {
            await onConfirm(selectedCoupon);
            handleClose();
        } catch (error) {
            console.error(error);
            alert('發送失敗');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedCoupon(null);
        setSearchTerm('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="發送優惠券">
            <div className="space-y-4 h-[60vh] flex flex-col">
                {/* Search */}
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="搜尋優惠券名稱或代碼..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex justify-center py-8"><LoadingSpinner /></div>
                    ) : filteredCoupons.length > 0 ? (
                        filteredCoupons.map(coupon => (
                            <div
                                key={coupon.id}
                                onClick={() => setSelectedCoupon(coupon)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedCoupon?.id === coupon.id
                                        ? 'bg-primary/5 border-primary ring-1 ring-primary'
                                        : 'bg-white border-gray-100 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedCoupon?.id === coupon.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            <TicketIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${selectedCoupon?.id === coupon.id ? 'text-primary' : 'text-gray-900'}`}>{coupon.title}</h4>
                                            <p className="text-xs text-gray-500 font-mono mt-0.5">{coupon.code}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-gray-900">
                                            {coupon.type === 'fixed' ? `$${coupon.value}` : `${coupon.value}%`}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {coupon.scopeType === 'all' ? '全站通用' : '指定項目'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-400">
                            找不到符合的優惠券
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-auto">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                        disabled={isSubmitting}
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedCoupon || isSubmitting}
                        className="px-6 py-2 bg-primary text-white rounded-lg font-bold shadow-sm hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? '發送中...' : '確認發送'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default IssueCouponModal;
