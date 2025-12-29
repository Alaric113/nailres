import { useState } from 'react';
import { useSeasonPasses } from '../../hooks/useSeasonPasses';
import Modal from '../common/Modal';
import PlanForm from './PlanForm';
import LoadingSpinner from '../common/LoadingSpinner';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { SeasonPass } from '../../types/seasonPass';

const PlanManagement = () => {
    const { passes, loading, error, addPass, updatePass, deletePass } = useSeasonPasses();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SeasonPass | null>(null);

    const handleAdd = () => {
        setEditingPlan(null);
        setIsModalOpen(true);
    };

    const handleEdit = (plan: SeasonPass) => {
        setEditingPlan(plan);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('確定要刪除此方案嗎？刪除後無法復原。')) {
            try {
                await deletePass(id);
            } catch (err) {
                alert('刪除失敗');
            }
        }
    };

    const handleSave = async (data: Omit<SeasonPass, 'id'>) => {
        if (editingPlan) {
            await updatePass(editingPlan.id, data);
        } else {
            await addPass(data);
        }
        setIsModalOpen(false);
    };

    if (loading) return <div className="p-8 text-center"><LoadingSpinner /></div>;
    if (error) return <div className="text-red-500 text-center p-8">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">會員方案管理</h2>
                <button 
                    onClick={handleAdd}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-dark shadow-sm transition-colors"
                >
                    + 新增方案
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {passes.map(plan => (
                    <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative group hover:shadow-md transition-shadow">
                        {/* Status Badge */}
                        <div className={`absolute top-3 right-3 px-2 py-0.5 rounded text-xs font-bold ${plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {plan.isActive ? '已啟用' : '停用中'}
                        </div>

                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div 
                                    className="w-3 h-10 rounded-full" 
                                    style={{ backgroundColor: plan.color || '#9F9586' }}
                                />
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{plan.name}</h3>
                                    <p className="text-xs text-gray-500">效期: {plan.duration}</p>
                                </div>
                            </div>

                            {/* Variants Summary */}
                            <div className="mt-4 flex flex-wrap gap-2">
                                {plan.variants.map((v, i) => (
                                    <span key={i} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded border border-gray-100">
                                        {v.name}: ${v.price}
                                    </span>
                                ))}
                            </div>
                            
                            {/* Actions */}
                            <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end gap-2">
                                <button 
                                    onClick={() => handleEdit(plan)}
                                    className="p-1.5 text-gray-400 hover:text-primary transition-colors rounded hover:bg-gray-50"
                                >
                                    <PencilSquareIcon className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => handleDelete(plan.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded hover:bg-gray-50"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={editingPlan ? '編輯方案' : '新增方案'}
            >
                <PlanForm 
                    plan={editingPlan} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSave} 
                />
            </Modal>
        </div>
    );
};

export default PlanManagement;
