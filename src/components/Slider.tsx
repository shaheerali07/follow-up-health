'use client';

import { useState, useRef, useCallback } from 'react';

interface SliderProps {
  values: number[];
  value: number;
  onChange: (value: number) => void;
  label: string;
  formatValue?: (value: number) => string;
}

export default function Slider({
  values,
  value,
  onChange,
  label,
  formatValue = (v) => v.toString(),
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const currentIndex = values.indexOf(value);
  const percentage = (currentIndex / (values.length - 1)) * 100;

  const getIndexFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      const index = Math.round(percent * (values.length - 1));
      return index;
    },
    [values.length]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const index = getIndexFromPosition(e.clientX);
    onChange(values[index]);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const index = getIndexFromPosition(e.clientX);
      onChange(values[index]);
    },
    [isDragging, getIndexFromPosition, onChange, values]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove event listeners
  useState(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const index = getIndexFromPosition(touch.clientX);
    onChange(values[index]);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const index = getIndexFromPosition(touch.clientX);
    onChange(values[index]);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-navy">{label}</label>
        <span className="text-lg font-semibold text-teal">{formatValue(value)}</span>
      </div>
      <div
        ref={trackRef}
        className="relative h-2 bg-gray-200 rounded-full cursor-pointer select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Filled track */}
        <div
          className="absolute h-full bg-teal rounded-full transition-all duration-75"
          style={{ width: `${percentage}%` }}
        />

        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-teal rounded-full shadow-md transition-all duration-75 hover:scale-110"
          style={{ left: `calc(${percentage}% - 10px)` }}
        />

        {/* Tick marks */}
        <div className="absolute top-4 left-0 right-0 flex justify-between px-0">
          {values.map((v, i) => (
            <div
              key={i}
              className={`text-xs ${
                i === currentIndex ? 'text-teal font-medium' : 'text-gray-400'
              }`}
              style={{
                position: 'absolute',
                left: `${(i / (values.length - 1)) * 100}%`,
                transform: 'translateX(-50%)',
              }}
            >
              {formatValue(v)}
            </div>
          ))}
        </div>
      </div>
      <div className="h-4" /> {/* Spacer for tick marks */}
    </div>
  );
}
