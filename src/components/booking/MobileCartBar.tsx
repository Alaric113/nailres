import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { motion, AnimatePresence } from 'framer-motion';
import { TrashIcon } from '@heroicons/react/24/outline';

interface MobileCartBarProps {
  onNext: () => void;
}

const MobileCartBar: React.FC<MobileCartBarProps> = ({ onNext }) => {
  const { cart, getCartTotal, removeFromCart } = useBookingStore();
  const [isExpanded, setIsExpanded] = useState(false);

  // Always render, but change state if empty
  const isEmpty = cart.length === 0;

  return (
    <>
      <div className="fixed bottom-[84px] left-0 right-0 p-4 pb-0 z-[2000] pointer-events-none">
         <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`
                bg-[#2C2825] text-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col
                ${isEmpty ? 'opacity-90 scale-95 origin-bottom' : ''} 
            `}
         >
            {/* Expanded List */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden bg-[#3a3633]"
                    >
                        <div className="p-4 max-h-[50vh] overflow-y-auto space-y-4">
                             <div className="flex justify-between items-center pb-2 border-b border-white/10">
                                 <h3 className="font-bold">目前訂單</h3>
                                 <button onClick={() => setIsExpanded(false)} className="text-xs text-gray-400">收起</button>
                             </div>
                             {cart.map(item => (
                                 <div key={item.itemId} className="flex justify-between items-start text-sm">
                                     <div className="flex-1">
                                         <div className="font-medium text-white">{item.service.name}</div>
                                         <div className="text-xs text-gray-400">
                                             {Object.values(item.selectedOptions).flat().map(o => o.name).join(', ')}
                                         </div>
                                     </div>
                                     <div className="flex items-center gap-3">
                                         <span className="font-serif">NT${item.totalPrice}</span>
                                         <button onClick={() => removeFromCart(item.itemId)} className="text-gray-400 hover:text-red-400">
                                             <TrashIcon className="w-4 h-4" />
                                         </button>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bar Content */}
            <div 
                onClick={() => !isEmpty && setIsExpanded(!isExpanded)}
                className="p-4 flex justify-between items-center cursor-pointer active:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm border border-primary/50">
                      {cart.length}
                   </div>
                   <div className="flex flex-col">
                      <span className="text-xs text-gray-400">預計金額</span>
                      <span className="font-bold font-serif text-lg">NT$ {getCartTotal()}</span>
                   </div>
                </div>
                
                <button 
                   onClick={(e) => {
                       e.stopPropagation();
                       if (!isEmpty) onNext();
                   }}
                   disabled={isEmpty}
                   className={`
                       px-6 py-2 font-bold rounded-lg transition-colors
                       ${isEmpty 
                           ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                           : 'bg-white text-[#2C2825] hover:bg-gray-100'
                       }
                   `}
                >
                   {isEmpty ? '請選擇服務' : '下一步'}
                </button>
            </div>
         </motion.div>
      </div>
    </>
  );
};

export default MobileCartBar;
