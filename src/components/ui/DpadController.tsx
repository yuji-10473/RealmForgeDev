'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface DpadControllerProps {
  onKeyAction: (key: string, type: 'press' | 'release') => void;
  onInteract: () => void;
  isNearInteractable: boolean;
}

const DpadButton = memo(({ direction, className, onKeyAction }: { direction: string; className?: string; onKeyAction: (key: string, type: 'press' | 'release') => void; }) => {
  const Icon = {
    ArrowUp: ChevronUp,
    ArrowDown: ChevronDown,
    ArrowLeft: ChevronLeft,
    ArrowRight: ChevronRight,
  }[direction] || (() => null);

  return (
    <Button
      variant="outline"
      className={cn("bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 w-full h-full p-0 flex items-center justify-center", className)}
      onTouchStart={() => onKeyAction(direction, 'press')}
      onTouchEnd={() => onKeyAction(direction, 'release')}
      onMouseDown={() => onKeyAction(direction, 'press')}
      onMouseUp={() => onKeyAction(direction, 'release')}
      onMouseLeave={() => onKeyAction(direction, 'release')}
    >
      <Icon className="w-8 h-8" />
    </Button>
  );
});
DpadButton.displayName = 'DpadButton';

export const DpadController = memo(({ onKeyAction, onInteract, isNearInteractable }: DpadControllerProps) => {
  return (
    // This div prevents events from passing through to the map
    <div className="absolute inset-0 z-40" data-is-controller="true">
      <div className="fixed bottom-8 left-8 grid grid-cols-3 grid-rows-3 gap-2 w-36 h-36">
        <DpadButton direction="ArrowUp" className="col-start-2" onKeyAction={onKeyAction} />
        <DpadButton direction="ArrowLeft" className="row-start-2" onKeyAction={onKeyAction} />
        <DpadButton direction="ArrowDown" className="row-start-2 col-start-2" onKeyAction={onKeyAction} />
        <DpadButton direction="ArrowRight" className="row-start-2 col-start-3" onKeyAction={onKeyAction} />
      </div>
      <div className="fixed bottom-8 right-8">
        <Button
          className={cn(
            "w-24 h-24 rounded-full text-2xl font-bold border-4 border-white/50 bg-black/30 backdrop-blur-sm text-white transition-all duration-300",
            isNearInteractable && "animate-pulse bg-accent/40 ring-4 ring-accent"
          )}
          onClick={onInteract}
        >
          A
        </Button>
      </div>
    </div>
  );
});
DpadController.displayName = 'DpadController';
