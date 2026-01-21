"use client";

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

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

  const handleInteractionStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    updateStickPosition(clientX, clientY);
  };

  const handleInteractionMove = (clientX: number, clientY: number) => {
    if (isDragging) {
      updateStickPosition(clientX, clientY);
    }
  };

  const handleInteractionEnd = () => {
    if (isDragging) {
        setIsDragging(false);
        setStickPosition({ x: 0, y: 0 });
        onEnd();
    }
  };

  const updateStickPosition = (clientX: number, clientY: number) => {
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
  };

  // Mouse Events
  const onMouseDown = (e: React.MouseEvent) => handleInteractionStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleInteractionMove(e.clientX, e.clientY);
  const onMouseUp = () => handleInteractionEnd();
  const onMouseLeave = () => handleInteractionEnd();


  // Touch Events
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleInteractionStart(touch.clientX, touch.clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleInteractionMove(touch.clientX, touch.clientY);
  };
  const onTouchEnd = () => handleInteractionEnd();

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
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        className="w-full h-full rounded-full"
        style={{ backgroundColor: baseColor }}
      />
      <div
        className="absolute rounded-full transition-transform"
        style={{
          width: `${stickSize}px`,
          height: `${stickSize}px`,
          backgroundColor: stickColor,
          top: `calc(50% - ${stickSize / 2}px)`,
          left: `calc(50% - ${stickSize / 2}px)`,
          transform: `translate(${stickPosition.x}px, ${stickPosition.y}px)`,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}
