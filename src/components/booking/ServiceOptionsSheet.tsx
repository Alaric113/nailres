import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Service, ServiceOption, ServiceOptionItem } from '../../types/service';
import { useBookingStore } from '../../store/bookingStore';

import { isLiffBrowser } from '../../lib/liff';

interface ServiceOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
}

const ServiceOptionsSheet: React.FC<ServiceOptionsSheetProps> = ({ isOpen, onClose, service }) => {
  const addToCart = useBookingStore(state => state.addToCart);
  
  // State to track selected options: optionId -> array of selected Item objects
  const [selections, setSelections] = useState<Record<string, ServiceOptionItem[]>>({});
  const isLiff = isLiffBrowser();



  // Reset selections when service changes or modal opens
  React.useEffect(() => {
      if (isOpen) {
          setSelections({});
      }
  }, [isOpen, service?.id]);

  if (!service) return null;

  // Use dummy options if none exist (for development/demo purposes)
  // In production, `service.options` will come from the DB
  const displayOptions: ServiceOption[] = service.options || [];
  const handleUpdateSelection = (option: ServiceOption, item: ServiceOptionItem, delta: number) => {
    setSelections(prev => {
      const currentSelected = prev[option.id] || [];
      const existingItemIndex = currentSelected.findIndex(i => i.id === item.id);
      const existingItem = currentSelected[existingItemIndex];
      
      const currentQuantity = existingItem?.quantity || 0; // If not found, 0
      
      // Calculate new quantity
      let newQuantity = 0;
      if (item.allowQuantity) {
          newQuantity = currentQuantity + delta;
          const maxQty = item.maxQuantity || 10;
          if (newQuantity > maxQty) return prev; // Exceed max, do nothing
      } else {
          // For non-quantity items (toggle/radio), if it exists and we click it -> toggle off (if multi) or keep (if radio)?
          // If Multi: toggle off if exists.
          // If Single: clicking selected usually keeps it selected, clicking other replaces.
          // Let's assume delta always 1 for non-quantity clicks from UI.
          if (option.multiSelect) {
             newQuantity = existingItem ? 0 : 1;
          } else {
             // Single select: always set to 1 (replace behavior)
             newQuantity = 1; 
          }
      }

      // Logic construction
      if (newQuantity <= 0) {
          // Remove item
          return { ...prev, [option.id]: currentSelected.filter(i => i.id !== item.id) };
      }

      const newItem = { ...item, quantity: newQuantity };

      // If Single Select, strictly replace all selections with this new item
      if (!option.multiSelect) {
          return { ...prev, [option.id]: [newItem] };
      }

      // If Multi Select, update or add
      if (existingItem) {
           const newSelected = [...currentSelected];
           newSelected[existingItemIndex] = newItem;
           return { ...prev, [option.id]: newSelected };
      } else {
           return { ...prev, [option.id]: [...currentSelected, newItem] }; 
      }
    });
  };

  const calculateTotal = () => {
    let total = service.price;
    Object.values(selections).flat().forEach(item => {
      total += item.price * (item.quantity || 1);
    });
    return total;
  };

  const calculateDuration = () => {
      let duration = service.duration;
       Object.values(selections).flat().forEach(item => {
        duration += (item.duration || 0) * (item.quantity || 1);
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
             <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0 bg-white z-20">
                <div className="text-lg font-bold text-text-main line-clamp-1 flex-1 text-center px-8">
                    {service.name}
                </div>
                <button 
                    onClick={onClose} 
                    className="absolute right-4 top-4 p-2 bg-gray-100 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>
             </div>

             {/* Content - Scrollable */}
             <div className="flex-1 overflow-y-auto p-4 space-y-6">
                 {/* ID: Service Image moved here for scrolling behavior */}
                 {service.imageUrl && (
                     <div className="w-full h-56 rounded-xl overflow-hidden shadow-sm mb-4">
                        <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                     </div>
                 )}

                 {/* Service Info */}
                 <div className="space-y-2">
                     <p className="text-gray-500 text-sm">
                        此服務預計 {calculateDuration()} 分鐘
                     </p>
                     
                     {service.description && (
                       <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 leading-relaxed border border-gray-100/50">
                         {service.description}
                       </div>
                     )}
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
                                 <div className="flex items-center gap-2">
                                     {option.multiSelect && <span className="text-xs text-gray-400">可複選</span>}
                                 </div>
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                 {option.items.map(item => {
                                     const selectedItem = selections[option.id]?.find(i => i.id === item.id);
                                     const isSelected = !!selectedItem;
                                     const quantity = selectedItem?.quantity || 0;

                                     return (
                                         <div 
                                            key={item.id}
                                            onClick={() => !item.allowQuantity && handleUpdateSelection(option, item, 1)}
                                            className={`
                                                flex justify-between items-center p-3 rounded-lg border transition-all select-none
                                                ${!item.allowQuantity && 'cursor-pointer'}
                                                ${isSelected 
                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }
                                            `}
                                         >
                                             <div className="flex items-center gap-3">
                                                 {!item.allowQuantity && (
                                                     <div className={`
                                                         w-5 h-5 rounded-full border flex items-center justify-center shrink-0
                                                         ${isSelected ? 'border-primary bg-primary' : 'border-gray-300'}
                                                     `}>
                                                         {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                                     </div>
                                                 )}
                                                 <span className={isSelected ? 'font-medium text-text-main' : 'text-gray-600'}>
                                                     {item.name}
                                                 </span>
                                             </div>
                                             
                                             <div className="flex items-center gap-3">
                                                 <div className="text-sm font-medium whitespace-nowrap">
                                                     {item.price > 0 ? `+ $${item.price}` : '+0'}
                                                 </div>

                                                 {/* Stepper for Quantity */}
                                                 {item.allowQuantity && (
                                                     <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm ml-2" onClick={e => e.stopPropagation()}>
                                                         <button 
                                                             className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded-l-lg hover:text-primary active:bg-gray-100 disabled:opacity-30"
                                                             onClick={() => handleUpdateSelection(option, item, -1)}
                                                             disabled={quantity === 0}
                                                         >
                                                             -
                                                         </button>
                                                         <div className="w-8 text-center font-medium text-sm border-x border-gray-100">
                                                             {quantity}
                                                         </div>
                                                         <button 
                                                             className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded-r-lg hover:text-primary active:bg-gray-100 disabled:opacity-30"
                                                             onClick={() => handleUpdateSelection(option, item, 1)}
                                                             disabled={quantity >= (item.maxQuantity || 10)}
                                                         >
                                                             +
                                                         </button>
                                                     </div>
                                                 )}
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
             <div className={`p-4 ${isLiff ? 'pb-4' : 'pb-24'} md:pb-4 border-t border-gray-100 bg-white md:bg-gray-50 shrink-0 relative z-10`}>
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
