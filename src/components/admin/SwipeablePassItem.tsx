import React from 'react';
import { motion, useAnimation, type PanInfo } from 'framer-motion';
import { TrashIcon } from '@heroicons/react/24/outline';

interface SwipeablePassItemProps {
  itemId: string;
  name: string;
  quantity: number;
  category: string;
  onDelete: (itemId: string) => void;
  disabled?: boolean;
}

const SwipeablePassItem: React.FC<SwipeablePassItemProps> = ({
  itemId,
  name,
  quantity,
  category,
  onDelete,
  disabled = false
}) => {
  const controls = useAnimation();

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (disabled) return;
    
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -60 || velocity < -500) {
      controls.start({ x: -80 }); 
    } else {
      controls.start({ x: 0 });
    }
  };

  const handleDelete = () => {
    if (window.confirm(`確定要刪除 ${name} 嗎？`)) {
      onDelete(itemId);
      controls.start({ x: 0 }); // Reset position
    } else {
      controls.start({ x: 0 }); // Reset even if cancelled
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background (Delete Action) */}
      <div className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-red-500 rounded-r-lg">
        <button 
          onClick={handleDelete}
          className="w-full h-full flex flex-col items-center justify-center text-white"
        >
          <TrashIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">刪除</span>
        </button>
      </div>

      {/* Foreground (Item Content) */}
      <motion.div 
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative bg-white p-3 border border-gray-100 rounded-lg flex justify-between items-center shadow-sm z-10"
        style={{ x: 0 }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
            category === '服務' 
              ? 'bg-primary/10 text-primary border-primary/20' 
              : 'bg-indigo-50 text-indigo-600 border-indigo-100'
          }`}>
            {category}
          </span>
          <span className="text-sm font-medium text-gray-700 truncate">{name}</span>
        </div>
        <div className="flex-shrink-0">
            {quantity > 0 && (
                <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded">x{quantity}</span>
            )}
        </div>
      </motion.div>
    </div>
  );
};

export default SwipeablePassItem;
