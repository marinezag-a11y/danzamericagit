import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { User } from 'lucide-react';

interface WheelPickerProps {
  items: { id: string, name: string, photo_url?: string | null }[];
  onSelect: (id: string) => void;
  initialSelectedId?: string;
}

export function WheelPicker({ items, onSelect, initialSelectedId }: WheelPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Find initial index
  useEffect(() => {
    if (initialSelectedId) {
      const idx = items.findIndex(item => item.id === initialSelectedId);
      if (idx !== -1) {
        setSelectedIndex(idx);
        // We'll handle the scroll position after the component mounts
      }
    }
  }, [initialSelectedId, items]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const itemHeight = 60; // Approximate height of each item
    const scrollTop = container.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    
    if (index !== selectedIndex && index >= 0 && index < items.length) {
      setSelectedIndex(index);
      onSelect(items[index].id);
    }
  };

  return (
    <div className="relative h-[300px] w-full max-w-sm mx-auto overflow-hidden bg-brand-grey/50 rounded-3xl border border-brand-dark/5">
      {/* Highlighters */}
      <div className="absolute top-1/2 left-0 w-full h-[60px] -translate-y-1/2 pointer-events-none z-10">
        <div className="absolute inset-0 border-y border-brand-orange/20 bg-brand-orange/5" />
      </div>

      {/* Shadow Overlays */}
      <div className="absolute top-0 left-0 w-full h-[120px] bg-gradient-to-b from-brand-grey to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 w-full h-[120px] bg-gradient-to-t from-brand-grey to-transparent pointer-events-none z-10" />

      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scroll-smooth no-scrollbar snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Spacer at the top */}
        <div className="h-[120px]" />
        
        {items.map((item, index) => {
          const isSelected = selectedIndex === index;
          return (
            <div 
              key={item.id}
              className={`h-[60px] flex items-center justify-center gap-4 px-8 snap-center transition-all duration-300 ${isSelected ? 'scale-110' : 'scale-90 opacity-30 blur-[1px]'}`}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border border-brand-dark/10 bg-white flex-shrink-0">
                {item.photo_url ? (
                  <img src={item.photo_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-brand-dark/5">
                    <User className="w-4 h-4 text-brand-dark/20" />
                  </div>
                )}
              </div>
              <span className={`text-lg font-serif italic whitespace-nowrap overflow-hidden text-ellipsis ${isSelected ? 'text-brand-dark font-bold' : 'text-brand-dark/50'}`}>
                {item.name}
              </span>
            </div>
          );
        })}

        {/* Spacer at the bottom */}
        <div className="h-[120px]" />
      </div>
    </div>
  );
}
