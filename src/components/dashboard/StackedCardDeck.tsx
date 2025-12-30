import { useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';

interface StackedCardDeckProps {
  children: React.ReactNode[];
}

const StackedCardDeck: React.FC<StackedCardDeckProps> = ({ children }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const dragY = useMotionValue(0);

  const cardCount = children.length;

  const onDragEnd = (_: any, info: any) => {
    const threshold = 50;
    if (info.offset.y < -threshold) {
      // Swipe Up -> Next
      setActiveIndex((prev) => (prev + 1) % cardCount);
    } else if (info.offset.y > threshold) {
      // Swipe Down -> Prev
      setActiveIndex((prev) => (prev - 1 + cardCount) % cardCount);
    }
  };

  // Helper to get cards in display order (reverse for stacking context)
  // We want Active on top (z-index), then Next behind it, etc.
  // Actually, for Apple Wallet style "peeking from top", the "Back" card is visually above (lower Y value) but behind (lower Z).
  // Actually, for Apple Wallet style "peeking from top", the "Back" card is visually above (lower Y value) but behind (lower Z).
  const visibleRange = Math.min(cardCount, 3);

  return (
    <div className="relative w-full h-[340px] flex justify-center items-start pt-12 -mb-12 perspective-1000">
      {/* Pagination Dots */}
      {cardCount > 1 && (
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
          {children.map((_, idx) => (
            <div 
              key={idx} 
              className={`w-1.5 rounded-full transition-all duration-300 shadow-sm ${
                idx === activeIndex ? 'bg-gray-800 h-6' : 'bg-gray-300 h-1.5'
              }`} 
            />
          ))}
        </div>
      )}

      <div className="relative w-full h-[220px] max-w-sm">
        
        {Array.from({ length: visibleRange }).reverse().map((_, i) => {
             const relativeIndex = (visibleRange - 1) - i;
             const cardIndex = (activeIndex + relativeIndex) % cardCount;
             const child = children[cardIndex];
             const isActive = relativeIndex === 0;

             return (
                 <motion.div
                    key={`${cardIndex}-${relativeIndex}`}
                    className="absolute w-full h-full origin-top" // origin-top makes scaling feel more natural for "stack"
                    initial={{
                        scale: 1 - relativeIndex * 0.1,
                        y: -relativeIndex * 60, // Move UP
                        opacity: 1 - relativeIndex * 0.1, // Less fade
                        zIndex: visibleRange - relativeIndex
                    }}
                    animate={{ 
                        scale: 1 - relativeIndex * 0.1,
                        y: isActive ? 0 : -relativeIndex * 30, 
                        opacity: 1 - relativeIndex * 0.1,
                        zIndex: visibleRange - relativeIndex
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20
                    }}
                    drag={isActive ? "y" : false}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.1}
                    onDragEnd={onDragEnd}
                    style={{ 
                        cursor: isActive ? 'grab' : 'default',
                        y: isActive ? dragY : undefined 
                    }}
                 >
                    {child}
                     {/* Overlay for depth */}
                     {!isActive && (
                        <div 
                            className="absolute inset-0 bg-white/20 rounded-2xl pointer-events-none transition-all" 
                        />
                     )}
                 </motion.div>
             );
        })}
      </div>
    </div>
  );
};

export default StackedCardDeck;
