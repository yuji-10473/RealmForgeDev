"use client";

import { useState, useRef, useCallback, MouseEvent, TouchEvent } from 'react';

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
  
  const stickRadius = size / 2;

  const calculateVectorAndMove = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + stickRadius;
    const centerY = rect.top + stickRadius;

    let x = clientX - centerX;
    let y = clientY - centerY;
    
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

  }, [onMove, stickRadius]);


  const handleInteractionStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    calculateVectorAndMove(clientX, clientY);
  }, [calculateVectorAndMove]);

  const handleInteractionMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    calculateVectorAndMove(clientX, clientY);
  }, [isDragging, calculateVectorAndMove]);

  const handleInteractionEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setStickPosition({ x: 0, y: 0 });
    onEnd();
  }, [onEnd, isDragging]);
  
  // Mouse Handlers
  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    handleInteractionStart(e.clientX, e.clientY);
  };
  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    handleInteractionMove(e.clientX, e.clientY);
  };

  // Touch Handlers
  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    handleInteractionStart(touch.clientX, touch.clientY);
  };
  const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    handleInteractionMove(touch.clientX, touch.clientY);
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
      onMouseMove={onMouseMove}
      onMouseUp={handleInteractionEnd}
      onMouseLeave={handleInteractionEnd} // Stop if mouse leaves the area
      
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={handleInteractionEnd}
      onTouchCancel={handleInteractionEnd}
    >
      <div
        className="w-full h-full rounded-full"
        style={{ backgroundColor: baseColor, touchAction: 'none' }}
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