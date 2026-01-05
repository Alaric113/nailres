import { useRef } from 'react';
import { motion, useAnimation, type PanInfo } from 'framer-motion';
import { CreditCardIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import type { GiftCard } from '../../types/giftcard';

interface GiftCardItemProps {
    card: GiftCard;
    onEdit: (card: GiftCard) => void;
    onDelete?: (id: string) => void;
}

const GiftCardItem = ({ card, onEdit, onDelete }: GiftCardItemProps) => {
    const controls = useAnimation();
    const constraintsRef = useRef(null);

    const handleDragEnd = async (_: any, info: PanInfo) => {
        if (info.offset.x < -60) {
            // Reveal delete button
            controls.start({ x: -80 });
        } else {
            // Snap back
            controls.start({ x: 0 });
        }
    };

    const handleDeleteClick = () => {
        if (onDelete && window.confirm('確定要刪除此商品卡嗎？')) {
            onDelete(card.id);
            controls.start({ x: 0 });
        }
    };

    return (
        <div ref={constraintsRef} className="rounded-xl overflow-hidden relative bg-red-500 ">
            {/* Delete Background Button */}
            <button
                onClick={handleDeleteClick}
                className="absolute inset-y-0 right-0 w-20 flex flex-col items-center justify-center text-white z-0 hover:bg-red-600 transition-colors"
                aria-label="Delete"
            >
                <TrashIcon className="w-6 h-6" />
                <span className="text-xs font-bold mt-1">刪除</span>
            </button>

            {/* Swipeable Content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -80, right: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                animate={controls}
                className={`relative z-10 bg-white h-full ${!card.isActive && 'opacity-60 grayscale'}`}
                whileTap={{ cursor: "grabbing" }}
                style={{ cursor: "grab", x: 0 }}
            >
                {/* Image */}
                {card.imageUrl ? (
                    <div className="aspect-video w-full bg-gray-100">
                        <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="aspect-video w-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                        <CreditCardIcon className="w-12 h-12 text-purple-300" />
                    </div>
                )}

                {/* Content */}
                <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 truncate">{card.name}</h4>
                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">{card.description}</p>
                        </div>
                        {!card.isActive && (
                            <span className="text-[10px] text-red-500 font-bold border border-red-200 px-1 rounded shrink-0">已停用</span>
                        )}
                    </div>
                </div>

                {/* Edit Button (Always visible on top right, or keep hover behavior?) 
                    The user asked for consistency with coupons. CouponCard has a dedicated edit button.
                    Let's place it floating on top right of the image/card area for easy access.
                */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(card);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur text-gray-600 hover:text-[#9F9586] rounded-lg shadow-sm z-20"
                    title="編輯商品卡"
                >
                    <PencilSquareIcon className="w-5 h-5" />
                </button>
            </motion.div>
        </div>
    );
};

export default GiftCardItem;
