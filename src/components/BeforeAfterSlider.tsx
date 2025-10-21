import React, { useState, useRef, useCallback } from 'react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ beforeImage, afterImage }) => {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const afterImageRef = useRef<HTMLImageElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const setPosition = useCallback((clientX: number) => {
    if (!containerRef.current || !afterImageRef.current || !handleRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;

    afterImageRef.current.style.clipPath = `inset(0 0 0 ${percent}%)`;
    handleRef.current.style.left = `${percent}%`;
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setPosition(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setPosition(e.touches[0].clientX);
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPosition(e.clientX);
  }, [isDragging, setPosition]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    setPosition(e.touches[0].clientX);
  }, [isDragging, setPosition]);

  React.useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto aspect-[16/10] rounded-lg overflow-hidden border border-gray-200 select-none cursor-ew-resize"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <img src={beforeImage} alt="Before" className="absolute inset-0 w-full h-full object-cover" draggable="false" />
      <img ref={afterImageRef} src={afterImage} alt="After" className="absolute inset-0 w-full h-full object-cover" style={{ clipPath: 'inset(0 0 0 50%)' }} draggable="false" />
      <div ref={handleRef} className="absolute top-0 h-full w-1 bg-white/80 shadow-md cursor-ew-resize" style={{ left: '50%', transform: 'translateX(-50%)' }}>
        <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-8 h-8 rounded-full bg-white/80 shadow-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterSlider;