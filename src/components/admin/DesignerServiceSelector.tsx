import React, { useMemo } from 'react';
import type { Service } from '../../types/service';
import LoadingSpinner from '../common/LoadingSpinner';

interface DesignerServiceSelectorProps {
  designerId?: string; // Current designer ID, needed to check "Implicit All" status if we want advanced logic, but simple "isSelected" list is passed in.
  services: Service[];
  selectedServiceIds: string[];
  onChange: (ids: string[]) => void;
  isLoading?: boolean;
}

const DesignerServiceSelector: React.FC<DesignerServiceSelectorProps> = ({
  // designerId, 
  services,
  selectedServiceIds,
  onChange,
  isLoading
}) => {
  
  // Group services by category
  const groupedServices = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    services.forEach(service => {
        if (!groups[service.category]) groups[service.category] = [];
        groups[service.category].push(service);
    });
    return groups;
  }, [services]);

  const handleToggle = (serviceId: string) => {
    if (selectedServiceIds.includes(serviceId)) {
      onChange(selectedServiceIds.filter(id => id !== serviceId));
    } else {
      onChange([...selectedServiceIds, serviceId]);
    }
  };

  const handleSelectGroup = (_: string, currentCategoryServiceIds: string[]) => {
      // If all in group are selected -> Deselect all
      // If some or none -> Select all
      const allSelected = currentCategoryServiceIds.every(id => selectedServiceIds.includes(id));
      
      if (allSelected) {
          onChange(selectedServiceIds.filter(id => !currentCategoryServiceIds.includes(id)));
      } else {
          const uniqueIds = Array.from(new Set([...selectedServiceIds, ...currentCategoryServiceIds]));
          onChange(uniqueIds);
      }
  };

  if (isLoading) return <LoadingSpinner size="sm" />;
  if (services.length === 0) return <p className="text-gray-500">尚無服務項目。</p>;

  return (
    <div className="space-y-6">
       <div className="bg-yellow-50 p-3 rounded-lg text-xs text-yellow-800 border border-yellow-200">
          <p>勾選此設計師可執行的服務項目。</p>
          <p className="mt-1">注意：若服務項目原本設定為「不分設計師 (All)」，取消勾選將會把該服務轉為「指定設計師」模式，並僅保留其他設計師。</p>
       </div>

       {Object.entries(groupedServices).map(([category, categoryServices]) => {
           const categoryServiceIds = categoryServices.map(s => s.id);
           const isAllSelected = categoryServiceIds.every(id => selectedServiceIds.includes(id));
           // Removed unused isSomeSelected variable

           return (
               <div key={category} className="border rounded-lg overflow-hidden">
                   <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                       <h4 className="font-bold text-gray-700">{category}</h4>
                       <button 
                         type="button"
                         onClick={() => handleSelectGroup(category, categoryServiceIds)}
                         className="text-xs text-primary hover:underline"
                       >
                           {isAllSelected ? '取消全選' : '全選此類'}
                       </button>
                   </div>
                   <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {categoryServices.map(service => {
                           const isSelected = selectedServiceIds.includes(service.id);
                           const isImplicitlyAll = !service.supportedDesigners || service.supportedDesigners.length === 0;

                           return (
                               <div 
                                 key={service.id}
                                 onClick={() => handleToggle(service.id)}
                                 className={`
                                   flex items-center p-3 rounded border cursor-pointer select-none transition-all
                                   ${isSelected 
                                     ? 'bg-primary/5 border-primary ring-1 ring-primary' 
                                     : 'hover:bg-gray-50 border-gray-200'
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
                                   <div className="flex-1">
                                       <div className="text-sm font-medium text-gray-900">{service.name}</div>
                                       <div className="flex items-center gap-2 mt-0.5">
                                           <span className="text-xs text-gray-500">${service.price}</span>
                                           {isImplicitlyAll && (
                                               <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 rounded border">預設全員</span>
                                           )}
                                       </div>
                                   </div>
                               </div>
                           );
                       })}
                   </div>
               </div>
           );
       })}
    </div>
  );
};

export default DesignerServiceSelector;
