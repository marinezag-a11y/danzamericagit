import { useRef, MouseEvent, useState } from 'react';

export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const onMouseDown = (e: MouseEvent<T>) => {
    if (!ref.current) return;
    setIsDragging(true);
    setStartY(e.pageY - ref.current.offsetTop);
    setScrollTop(ref.current.scrollTop);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseMove = (e: MouseEvent<T>) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    const y = e.pageY - ref.current.offsetTop;
    const walk = (y - startY) * 1.5; // Scroll speed
    ref.current.scrollTop = scrollTop - walk;
  };

  return {
    ref,
    onMouseDown,
    onMouseLeave,
    onMouseUp,
    onMouseMove,
    style: { cursor: isDragging ? 'grabbing' : 'grab' }
  };
}
