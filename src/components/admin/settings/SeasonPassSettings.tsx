import { useState } from 'react';
import { useSeasonPasses } from '../../../hooks/useSeasonPasses';

import PlanForm from '../PlanForm';
import LoadingSpinner from '../../common/LoadingSpinner';
import { 
    PencilSquareIcon, 
    TrashIcon, 
    PlusIcon,
    TicketIcon,
    TagIcon,
    ClockIcon,
    EyeIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';
import type { SeasonPass } from '../../../types/seasonPass';

const SeasonPassSettings = () => {
    const { passes, loading, error, addPass, updatePass, deletePass } = useSeasonPasses();
    const [view, setView] = useState<'list' | 'editor'>('list');
    const [editingPlan, setEditingPlan] = useState<SeasonPass | null>(null);

    const handleAdd = () => {
        setEditingPlan(null);
        setView('editor');
    };

    const handleEdit = (plan: SeasonPass) => {
        setEditingPlan(plan);
        setView('editor');
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
        setView('list');
    };

    const handleToggleActive = async (plan: SeasonPass) => {
        try {
            await updatePass(plan.id, { isActive: !plan.isActive });
        } catch (err) {
            alert('更新失敗');
        }
    };

    if (loading) return <div className="p-8 text-center"><LoadingSpinner /></div>;
    if (error) return <div className="text-red-500 text-center p-8">{error}</div>;

    // Editor View
    if (view === 'editor') {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[calc(100vh-200px)]">
                {/* Editor Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setView('list')}
                                className="text-gray-400 hover:text-gray-600 text-sm"
                            >
                                ← 返回
                            </button>
                            <div className="w-px h-4 bg-gray-200" />
                            <h2 className="text-lg font-bold text-gray-800">
                                {editingPlan ? `編輯: ${editingPlan.name}` : '新增會員方案'}
                            </h2>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <PlanForm 
                        plan={editingPlan} 
                        onClose={() => setView('list')} 
                        onSave={handleSave} 
                    />
                </div>
            </div>
        );
    }

    // Stats
    const activeCount = passes.filter(p => p.isActive).length;
    const totalVariants = passes.reduce((acc, p) => acc + p.variants.length, 0);

    // List View
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">會員方案管理</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        管理季卡、會員方案與優惠內容
                    </p>
                </div>
                <button 
                    onClick={handleAdd}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark shadow-sm transition-all active:scale-95"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>新增方案</span>
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={TicketIcon} label="總方案數" value={passes.length} color="primary" />
                <StatCard icon={EyeIcon} label="已啟用" value={activeCount} color="green" />
                <StatCard icon={TagIcon} label="價格等級" value={totalVariants} color="amber" />
                <StatCard icon={ClockIcon} label="停用中" value={passes.length - activeCount} color="gray" />
            </div>

            {/* Plans Grid */}
            {passes.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                    <TicketIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">尚無任何會員方案</p>
                    <button 
                        onClick={handleAdd}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
                    >
                        建立第一個方案
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {passes.map(plan => (
                        <PlanCard 
                            key={plan.id}
                            plan={plan}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onToggleActive={handleToggleActive}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// Stat Card Component
interface StatCardProps {
    icon: React.FC<{ className?: string }>;
    label: string;
    value: number;
    color: 'primary' | 'green' | 'amber' | 'gray';
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, color }) => {
    const colorMap = {
        primary: 'bg-primary/10 text-primary',
        green: 'bg-green-50 text-green-600',
        amber: 'bg-amber-50 text-amber-600',
        gray: 'bg-gray-50 text-gray-500'
    };

    return (
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colorMap[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                </div>
            </div>
        </div>
    );
};

// Plan Card Component
interface PlanCardProps {
    plan: SeasonPass;
    onEdit: (plan: SeasonPass) => void;
    onDelete: (id: string) => void;
    onToggleActive: (plan: SeasonPass) => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onEdit, onDelete, onToggleActive }) => {
    const serviceCount = plan.contentItems.filter(c => c.category === '服務').length;
    const benefitCount = plan.contentItems.filter(c => c.category === '權益').length;
    const totalItems = plan.contentItems.length;

    return (
        <div className={`bg-white rounded-xl border overflow-hidden transition-all hover:shadow-md ${
            plan.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'
        }`}>
            {/* Color Header */}
            <div 
                className="h-2"
                style={{ backgroundColor: plan.color || '#9F9586' }}
            />
            
            <div className="p-4">
                {/* Title Row */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{plan.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">效期: {plan.duration}</p>
                    </div>
                    <button
                        onClick={() => onToggleActive(plan)}
                        className={`p-1.5 rounded-lg transition-colors ${
                            plan.isActive 
                                ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                                : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                        title={plan.isActive ? '點擊停用' : '點擊啟用'}
                    >
                        {plan.isActive ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                    </button>
                </div>

                {/* Variants */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {plan.variants.slice(0, 3).map((v, i) => (
                        <span 
                            key={i} 
                            className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-md border border-gray-100"
                        >
                            {v.name} <span className="text-primary font-bold">${v.price}</span>
                        </span>
                    ))}
                    {plan.variants.length > 3 && (
                        <span className="text-xs text-gray-400 px-2 py-1">+{plan.variants.length - 3}</span>
                    )}
                </div>

                {/* Content Summary */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                        <TicketIcon className="w-3.5 h-3.5" /> {serviceCount} 服務
                    </span>
                    <span className="flex items-center gap-1">
                        <TagIcon className="w-3.5 h-3.5" /> {benefitCount} 權益
                    </span>
                    <span className="text-gray-400">共 {totalItems} 項</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        plan.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-500'
                    }`}>
                        {plan.isActive ? '已啟用' : '停用中'}
                    </span>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => onEdit(plan)}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            title="編輯"
                        >
                            <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => onDelete(plan.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="刪除"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeasonPassSettings;

