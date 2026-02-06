import { useState } from 'react';
import Modal from '../common/Modal';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

interface PointAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number, reason: string) => Promise<void>;
    currentPoints: number;
}

const PointAdjustmentModal = ({ isOpen, onClose, onConfirm, currentPoints }: PointAdjustmentModalProps) => {
    const [mode, setMode] = useState<'add' | 'deduct'>('add');
    const [amount, setAmount] = useState<string>('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        const val = parseInt(amount);
        if (isNaN(val) || val <= 0) {
            alert('請輸入有效的點數數量');
            return;
        }
        if (!reason.trim()) {
            alert('請輸入調整原因');
            return;
        }

        const finalAmount = mode === 'add' ? val : -val;

        setIsSubmitting(true);
        try {
            await onConfirm(finalAmount, reason);
            handleClose();
        } catch (error) {
            console.error(error);
            alert('調整失敗');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setAmount('');
        setReason('');
        setMode('add');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="調整點數">
            <div className="space-y-6">
                {/* Current Points Display */}
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                    <span className="text-gray-500 text-sm">目前點數</span>
                    <div className="text-3xl font-bold text-gray-900 mt-1">{currentPoints}</div>
                </div>

                {/* Mode Selection */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setMode('add')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-lg border font-bold transition-all ${mode === 'add'
                                ? 'bg-green-50 border-green-200 text-green-700 ring-2 ring-green-500 ring-offset-1'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <PlusIcon className="w-5 h-5" />
                        新增
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('deduct')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-lg border font-bold transition-all ${mode === 'deduct'
                                ? 'bg-red-50 border-red-200 text-red-700 ring-2 ring-red-500 ring-offset-1'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <MinusIcon className="w-5 h-5" />
                        扣除
                    </button>
                </div>

                {/* Inputs */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">調整數量</label>
                        <input
                            type="number"
                            min="1"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-lg font-bold"
                            placeholder="輸入點數"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">調整原因 / 備註</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            placeholder="例如：手動補發、退款扣除..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                        disabled={isSubmitting}
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`px-6 py-2 text-white rounded-lg font-bold shadow-sm transition-colors ${mode === 'add'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-red-600 hover:bg-red-700'
                            } disabled:opacity-50`}
                    >
                        {isSubmitting ? '處理中...' : '確認調整'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PointAdjustmentModal;
