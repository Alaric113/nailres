import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useSeasonPasses } from '../../hooks/useSeasonPasses';
import type { ActivePass } from '../../types/user';
import { XMarkIcon, TicketIcon } from '@heroicons/react/24/outline';

interface PassActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: (pass: ActivePass) => Promise<void>;
  userName: string;
}

const PassActivationModal: React.FC<PassActivationModalProps> = ({
  isOpen,
  onClose,
  onActivate,
  userName,
}) => {
  const { passes, loading } = useSeasonPasses();
  const [selectedPassId, setSelectedPassId] = useState('');
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isActivating, setIsActivating] = useState(false);

  if (!isOpen) return null;

  const selectedPass = passes.find(p => p.id === selectedPassId);
  const activePasses = passes.filter(p => p.isActive);

  const handleActivate = async () => {
    if (!selectedPass) return;
    
    setIsActivating(true);
    try {
      const variant = selectedPass.variants[selectedVariantIndex];
      
      // Calculate expiry date based on duration (assuming duration is in months)
      const now = new Date();
      const durationMonths = parseInt(selectedPass.duration) || 3;
      const expiryDate = new Date(now);
      expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

      // Initialize remaining usages from content items
      const remainingUsages: { [key: string]: number } = {};
      selectedPass.contentItems.forEach(item => {
        remainingUsages[item.id] = item.quantity;
      });

      const newActivePass: ActivePass = {
        passId: selectedPass.id,
        passName: selectedPass.name,
        variantName: variant?.name,
        purchaseDate: Timestamp.now(),
        expiryDate: Timestamp.fromDate(expiryDate),
        remainingUsages,
      };

      await onActivate(newActivePass);
      onClose();
    } catch (error) {
      console.error('Activation failed:', error);
      alert('開通失敗');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <TicketIcon className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-bold text-gray-800">開通季卡</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-500">為以下用戶開通：</p>
          <p className="font-bold text-gray-800">{userName}</p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">載入中...</div>
        ) : (
          <>
            {/* Pass Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">選擇方案</label>
              <select
                value={selectedPassId}
                onChange={(e) => {
                  setSelectedPassId(e.target.value);
                  setSelectedVariantIndex(0);
                }}
                className="w-full rounded-lg border-gray-300 text-sm"
              >
                <option value="">-- 請選擇方案 --</option>
                {activePasses.map(pass => (
                  <option key={pass.id} value={pass.id}>{pass.name}</option>
                ))}
              </select>
            </div>

            {/* Variant Selection */}
            {selectedPass && selectedPass.variants.length > 1 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">選擇等級</label>
                <div className="flex flex-wrap gap-2">
                  {selectedPass.variants.map((v, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedVariantIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        idx === selectedVariantIndex
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                      }`}
                    >
                      {v.name} - ${v.price}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {selectedPass && (
              <div className="bg-amber-50 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-amber-800">方案內容：</p>
                <ul className="text-xs text-amber-700 mt-1 space-y-1">
                  {selectedPass.contentItems.map(item => (
                    <li key={item.id}>• {item.name} x{item.quantity}</li>
                  ))}
                </ul>
                <p className="text-xs text-amber-600 mt-2">
                  有效期：{selectedPass.duration}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleActivate}
                disabled={!selectedPassId || isActivating}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                {isActivating ? '開通中...' : '確認開通'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PassActivationModal;
