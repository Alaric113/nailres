import React, { useState, useEffect } from 'react';
import type { ActivePass } from '../../types/user';
import type { SeasonPass } from '../../types/seasonPass';
import { XMarkIcon, CalendarDaysIcon, CheckIcon, TicketIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface EditPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  pass: ActivePass | null;
  allPasses: SeasonPass[];
  onSave: (passId: string, updates: Partial<ActivePass>) => Promise<void>;
}

const EditPassModal: React.FC<EditPassModalProps> = ({
  isOpen,
  onClose,
  pass,
  allPasses,
  onSave
}) => {
  const [expiryDate, setExpiryDate] = useState('');
  const [usages, setUsages] = useState<{ [itemId: string]: number }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && pass) {
      setExpiryDate(format(pass.expiryDate.toDate(), 'yyyy-MM-dd'));
      setUsages({ ...pass.remainingUsages });
    }
  }, [isOpen, pass]);

  if (!isOpen || !pass) return null;

  // Find original pass definition to get item names
  const originalPass = allPasses.find(p => p.id === pass.passId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pass) return;

    setIsSaving(true);
    try {
      const newExpiry = new Date(expiryDate);
      newExpiry.setHours(23, 59, 59, 999);
      
      const { Timestamp } = await import('firebase/firestore');
      
      await onSave(pass.passId, { 
        expiryDate: Timestamp.fromDate(newExpiry),
        remainingUsages: usages
      });
      onClose();
    } catch (error) {
      console.error('Failed to update pass:', error);
      alert('更新失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUsageChange = (itemId: string, val: string) => {
      const num = parseInt(val);
      if (!isNaN(num) && num >= 0) {
          setUsages(prev => ({ ...prev, [itemId]: num }));
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
          <h3 className="font-bold text-gray-800">編輯季卡內容</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 flex-1">
            <form id="edit-pass-form" onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">方案名稱</label>
                    <div className="text-sm font-medium text-gray-900">{pass.passName} ({pass.variantName})</div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">到期日期</label>
                    <div className="relative">
                        <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="date" 
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-3">剩餘次數調整</label>
                    <div className="space-y-3">
                        {Object.entries(usages).map(([itemId, qty]) => {
                            const itemDef = originalPass?.contentItems.find(i => i.id === itemId);
                            const name = itemDef?.name || '未知項目';
                            const category = itemDef?.category || '未知';

                            return (
                                <div key={itemId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                                        <TicketIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-700 truncate">{name}</p>
                                            <span className="text-[10px] text-gray-500 bg-white px-1.5 rounded border border-gray-200">{category}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-xs text-gray-400">剩餘</span>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={qty}
                                            onChange={(e) => handleUsageChange(itemId, e.target.value)}
                                            className="w-16 py-1 px-2 text-center text-sm border border-gray-300 rounded focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </form>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 flex-shrink-0">
            <button 
                type="button" 
                onClick={onClose}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
                取消
            </button>
            <button 
                type="submit"
                form="edit-pass-form"
                disabled={isSaving} 
                className="px-3 py-2 text-sm bg-primary text-white rounded-lg flex items-center gap-1 disabled:opacity-50"
            >
                <CheckIcon className="w-4 h-4" /> {isSaving ? '儲存中...' : '儲存變更'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default EditPassModal;
