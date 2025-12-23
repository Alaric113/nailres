import React from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { TrashIcon } from '@heroicons/react/24/outline';

interface CartSidebarProps {
  onNext: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ onNext }) => {
  const { cart, removeFromCart, getCartTotal } = useBookingStore();

  if (cart.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 border-l border-gray-100 bg-white">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
        </div>
        <p className="text-lg font-medium">您的訂單是空的</p>
        <p className="text-sm">選擇服務開始預約</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-100 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-serif font-bold text-text-main">您的訂單</h2>
        <p className="text-sm text-gray-500 mt-1">Total {cart.length} items</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cart.map((item) => (
          <div key={item.itemId} className="flex gap-3 p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors group">
             {item.service.imageUrl && (
                 <img src={item.service.imageUrl} alt={item.service.name} className="w-16 h-16 object-cover rounded-lg shrink-0" />
             )}
             <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-start">
                     <h4 className="font-bold text-text-main line-clamp-1">{item.service.name}</h4>
                     <span className="font-serif font-bold text-sm">NT${item.totalPrice}</span>
                 </div>
                 {/* Display options */}
                 <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                     {Object.values(item.selectedOptions).flat().map(opt => (
                         <div key={opt.id} className="flex justify-between w-full">
                             <span>+ {opt.name}</span>
                             {opt.price > 0 && <span>${opt.price}</span>}
                         </div>
                     ))}
                 </div>
                 <div className="flex justify-between items-center mt-2">
                     <span className="text-xs text-gray-400">{item.totalDuration} min</span>
                     <button 
                        onClick={() => removeFromCart(item.itemId)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                     >
                         <TrashIcon className="w-4 h-4" />
                     </button>
                 </div>
             </div>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-gray-100 bg-gray-50/30">
        <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">總計</span>
            <span className="text-xl font-bold font-serif text-text-main">NT$ {getCartTotal()}</span>
        </div>
        <button 
          onClick={onNext}
          className="w-full bg-[#2C2825] text-white py-3 rounded-xl font-bold hover:bg-black transition-colors shadow-lg shadow-gray-200"
        >
            下一步，選擇設計師
        </button>
      </div>
    </div>
  );
};

export default CartSidebar; // Add export default
