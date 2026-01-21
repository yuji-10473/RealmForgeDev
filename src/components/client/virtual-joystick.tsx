"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
  onEnd: () => void;
  size?: number;
  stickSize?: number;
  baseColor?: string;
  stickColor?: string;
}

export function VirtualJoystick({
  onMove,
  onEnd,
  size = 120,
  stickSize = 60,
  baseColor = 'rgba(128, 128, 128, 0.5)',
  stickColor = 'rgba(255, 255, 255, 0.7)',
}: VirtualJoystickProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [stickPosition, setStickPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const center = { x: size / 2, y: size / 2 };
  const stickRadius = size / 2;

  const updateStickPosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = clientX - rect.left - center.x;
    let y = clientY - rect.top - center.y;

    const distance = Math.sqrt(x * x + y * y);

    if (distance > stickRadius) {
      x = (x / distance) * stickRadius;
      y = (y / distance) * stickRadius;
    }
    
    setStickPosition({ x, y });

    const vector = {
        x: x / stickRadius,
        y: y / stickRadius
    };
    onMove(vector);
  }, [center.x, center.y, onMove, stickRadius]);

  const handleInteractionStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    updateStickPosition(clientX, clientY);
  }, [updateStickPosition]);

  const handleInteractionMove = useCallback((clientX: number, clientY: number) => {
    updateStickPosition(clientX, clientY);
  }, [updateStickPosition]);

  const handleInteractionEnd = useCallback(() => {
    setIsDragging(false);
    setStickPosition({ x: 0, y: 0 });
    onEnd();
  }, [onEnd]);
  
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleInteractionMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleInteractionMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', handleInteractionEnd);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', handleInteractionEnd);
      window.addEventListener('touchcancel', handleInteractionEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', handleInteractionEnd);
      window.removeEventListener('touchcancel', handleInteractionEnd);
    };
  }, [isDragging, handleInteractionMove, handleInteractionEnd]);
  
  // Start interaction handlers
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleInteractionStart(e.clientX, e.clientY)
  };
  
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleInteractionStart(touch.clientX, touch.clientY);
  };

  return (
    <div
      ref={containerRef}
      className="absolute bottom-10 left-10 z-50 select-none"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      <div
        className="w-full h-full rounded-full"
        style={{ backgroundColor: baseColor }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: `${stickSize}px`,
          height: `${stickSize}px`,
          backgroundColor: stickColor,
          top: `calc(50% - ${stickSize / 2}px)`,
          left: `calc(50% - ${stickSize / 2}px)`,
          transform: `translate(${stickPosition.x}px, ${stickPosition.y}px)`,
          pointerEvents: 'none',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
      />
    </div>
  );
}