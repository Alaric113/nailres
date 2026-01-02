import React, { useMemo } from 'react';
import { useDesigners } from '../../hooks/useDesigners';
import LoadingSpinner from '../common/LoadingSpinner';

interface ServiceDesignerSelectorProps {
  selectedDesignerIds: string[];
  onChange: (ids: string[]) => void;
}

const ServiceDesignerSelector: React.FC<ServiceDesignerSelectorProps> = ({
  selectedDesignerIds,
  onChange,
}) => {
  const { designers, loading, error } = useDesigners();

  // Filter only active designers for selection, but keep already selected ones even if inactive to avoid data loss
  const sortedDesigners = useMemo(() => {
    return [...designers].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [designers]);

  const handleToggle = (designerId: string) => {
    if (selectedDesignerIds.includes(designerId)) {
      onChange(selectedDesignerIds.filter((id) => id !== designerId));
    } else {
      onChange([...selectedDesignerIds, designerId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedDesignerIds.length === designers.length) {
      onChange([]);
    } else {
      onChange(designers.map((d) => d.id));
    }
  };

  if (loading) return <LoadingSpinner size="sm" />;
  if (error) return <p className="text-red-500">無法載入設計師列表</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-medium text-gray-700">指定設計師</h3>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-sm text-primary hover:text-primary-dark underline"
        >
          {selectedDesignerIds.length === designers.length ? '全取消' : '全選'}
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        請勾選可執行此服務的設計師。若未勾選任何設計師，則預設為 <strong>所有設計師</strong> 皆可執行。
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sortedDesigners.map((designer) => {
          const isSelected = selectedDesignerIds.includes(designer.id);
          return (
            <div
              key={designer.id}
              onClick={() => handleToggle(designer.id)}
              className={`
                flex items-center p-3 rounded-lg border cursor-pointer transition-all
                ${isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                }
              `}
            >
              <div className={`
                w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors
                ${isSelected ? 'bg-primary border-primary' : 'bg-white border-gray-300'}
              `}>
                {isSelected && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              <div className="flex items-center">
                {designer.avatarUrl ? (
                  <img src={designer.avatarUrl} alt={designer.name} className="w-8 h-8 rounded-full object-cover mr-3 bg-gray-200" loading="lazy" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center text-xs text-gray-500">
                    {designer.name[0]}
                  </div>
                )}
                <div>
                  <p className={`text-sm font-medium ${isSelected ? 'text-primary-dark' : 'text-gray-700'}`}>
                    {designer.name}
                  </p>
                  <p className="text-xs text-gray-400">{designer.title || '設計師'}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceDesignerSelector;
