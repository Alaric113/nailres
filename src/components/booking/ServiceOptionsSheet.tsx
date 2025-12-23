import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Service, ServiceOption, ServiceOptionItem } from '../../types/service';
import { useBookingStore } from '../../store/bookingStore';

interface ServiceOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
}

const ServiceOptionsSheet: React.FC<ServiceOptionsSheetProps> = ({ isOpen, onClose, service }) => {
  const addToCart = useBookingStore(state => state.addToCart);
  
  // State to track selected options: optionId -> array of selected Item objects
  const [selections, setSelections] = useState<Record<string, ServiceOptionItem[]>>({});

  if (!service) return null;

  // Use dummy options if none exist (for development/demo purposes)
  // In production, `service.options` will come from the DB
  const displayOptions: ServiceOption[] = service.options || [];

  const handleOptionToggle = (option: ServiceOption, item: ServiceOptionItem) => {
    setSelections(prev => {
      const currentSelected = prev[option.id] || [];
      const isSelected = currentSelected.some(i => i.id === item.id);

      if (option.multiSelect) {
        if (isSelected) {
          return { ...prev, [option.id]: currentSelected.filter(i => i.id !== item.id) };
        } else {
          return { ...prev, [option.id]: [...currentSelected, item] };
        }
      } else {
        // Single select
        if (isSelected) {
           // Optional: allow deselecting even in single select if not required? 
           // Usually radio buttons don't deselect. Let's start with simple switching.
           return prev; // No change if clicking same
        }
        return { ...prev, [option.id]: [item] };
      }
    });
  };

  const calculateTotal = () => {
    let total = service.price;
    Object.values(selections).flat().forEach(item => {
      total += item.price;
    });
    return total;
  };

  const calculateDuration = () => {
      let duration = service.duration;
       Object.values(selections).flat().forEach(item => {
        duration += (item.duration || 0);
      });
      return duration;
  }

  const handleAddToCart = () => {
    // Validation: Check required options
    const missingRequired = displayOptions.filter(opt => opt.required && (!selections[opt.id] || selections[opt.id].length === 0));
    
    if (missingRequired.length > 0) {
      alert(`請選擇: ${missingRequired.map(o => o.name).join(', ')}`);
      return;
    }

    addToCart(service, selections);
    setSelections({}); // Reset
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[3000] backdrop-blur-sm"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 top-[10%] md:top-[20%] md:left-[20%] md:right-[20%] md:bottom-[10%] md:rounded-xl bg-white rounded-t-2xl z-[3001] flex flex-col shadow-2xl overflow-hidden"
          >
             {/* Header */}
             <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
                <button onClick={onClose} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                    <XMarkIcon className="w-6 h-6" />
                </button>
                <div className="font-bold text-lg text-text-main line-clamp-1">{service.name}</div>
                <div className="w-10"></div> {/* Spacer for centering */}
             </div>

             {/* Content - Scrollable */}
             <div className="flex-1 overflow-y-auto p-4 space-y-6">
                 {/* Service Info */}
                 <div className="space-y-2">
                     {service.imageUrl && (
                         <img src={service.imageUrl} alt={service.name} className="w-full h-48 object-cover rounded-xl" />
                     )}
                     <p className="text-gray-500 text-sm">
                        此服務預計 {calculateDuration()} 分鐘
                     </p>
                     <div className="text-2xl font-serif font-bold text-text-main">
                        NT$ {calculateTotal()}
                     </div>
                 </div>

                 <hr className="border-dashed border-gray-200" />

                 {/* Options */}
                 {displayOptions.length === 0 ? (
                     <p className="text-gray-400 italic text-center py-4">此項目無額外選項</p>
                 ) : (
                     displayOptions.map(option => (
                         <div key={option.id} className="space-y-3">
                             <div className="flex justify-between items-baseline">
                                 <h4 className="font-bold text-text-main text-lg">
                                     {option.name} 
                                     {option.required && <span className="text-red-500 text-sm ml-1">*必選</span>}
                                 </h4>
                                 {option.multiSelect && <span className="text-xs text-gray-400">可複選</span>}
                             </div>
                             
                             <div className="space-y-2">
                                 {option.items.map(item => {
                                     const isSelected = selections[option.id]?.some(i => i.id === item.id);
                                     return (
                                         <div 
                                            key={item.id}
                                            onClick={() => handleOptionToggle(option, item)}
                                            className={`
                                                flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-all
                                                ${isSelected 
                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }
                                            `}
                                         >
                                             <div className="flex items-center gap-3">
                                                 <div className={`
                                                     w-5 h-5 rounded-full border flex items-center justify-center
                                                     ${isSelected ? 'border-primary bg-primary' : 'border-gray-300'}
                                                 `}>
                                                     {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                                 </div>
                                                 <span className={isSelected ? 'font-medium text-text-main' : 'text-gray-600'}>
                                                     {item.name}
                                                 </span>
                                             </div>
                                             <div className="text-sm font-medium">
                                                 {item.price > 0 ? `+ $${item.price}` : '免費'}
                                             </div>
                                         </div>
                                     );
                                 })}
                             </div>
                         </div>
                     ))
                 )}
                 <div className="h-20" /> {/* Bottom Spacer */}
             </div>

             {/* Footer Action */}
             <div className="p-4 pb-24 md:pb-4 border-t border-gray-100 bg-white md:bg-gray-50 shrink-0 relative z-10">
                 <button 
                    onClick={handleAddToCart}
                    className="w-full bg-[#2C2825] text-white font-bold text-lg py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex justify-between px-6 items-center"
                 >
                    <span>加入訂單</span>
                    <span>NT$ {calculateTotal()}</span>
                 </button>
             </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ServiceOptionsSheet;
