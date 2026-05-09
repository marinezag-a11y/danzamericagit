import React, { useLayoutEffect, useRef, useState } from 'react';

interface FitTextProps {
  children: React.ReactNode;
  className?: string;
  maxFontSize?: number;
  minFontSize?: number;
}

export function FitText({ 
  children, 
  className = "", 
  maxFontSize = 32, 
  minFontSize = 12 
}: FitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    let currentSize = maxFontSize;
    text.style.fontSize = `${currentSize}px`;

    // Use clientWidth for more accurate container measurement
    const maxWidth = container.clientWidth;
    
    if (maxWidth > 0) {
      // Gradually decrease font size until it fits
      while (text.offsetWidth > maxWidth && currentSize > minFontSize) {
        currentSize -= 0.5; // Finer adjustment
        text.style.fontSize = `${currentSize}px`;
      }
    }

    setFontSize(currentSize);
  }, [children, maxFontSize, minFontSize]);

  return (
    <div ref={containerRef} className={`w-full overflow-hidden ${className}`}>
      <span 
        ref={textRef} 
        className="whitespace-nowrap inline-block"
        style={{ fontSize: `${fontSize}px`, transition: 'font-size 0.2s ease-out' }}
      >
        {children}
      </span>
    </div>
  );
}
