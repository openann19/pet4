'use client';

import { useEffect, useCallback } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { springConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { X } from 'lucide-react';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

export interface PremiumDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function PremiumDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = 'right',
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}: PremiumDrawerProps): React.JSX.Element {
  const translateX = useSharedValue(side === 'right' ? 100 : side === 'left' ? -100 : 0);
  const translateY = useSharedValue(side === 'top' ? -100 : side === 'bottom' ? 100 : 0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (open) {
      if (side === 'right' || side === 'left') {
        translateX.value = withSpring(0, springConfigs.smooth);
      } else {
        translateY.value = withSpring(0, springConfigs.smooth);
      }
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      if (side === 'right') {
        translateX.value = withSpring(100, springConfigs.smooth);
      } else if (side === 'left') {
        translateX.value = withSpring(-100, springConfigs.smooth);
      } else if (side === 'top') {
        translateY.value = withSpring(-100, springConfigs.smooth);
      } else {
        translateY.value = withSpring(100, springConfigs.smooth);
      }
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [open, side, translateX, translateY, opacity]);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  })) as AnimatedStyle;

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && closeOnOverlayClick) {
        haptics.impact('light');
      }
      onOpenChange?.(newOpen);
    },
    [onOpenChange, closeOnOverlayClick]
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side={side} className={cn(SIZE_CLASSES[size], className)}>
        <AnimatedView style={contentStyle} className="contents">
          {(title || description) && (
            <SheetHeader>
              {title && <SheetTitle>{title}</SheetTitle>}
              {description && <SheetDescription>{description}</SheetDescription>}
            </SheetHeader>
          )}

          <div className="flex-1 overflow-y-auto py-4">{children}</div>

          {footer && <SheetFooter>{footer}</SheetFooter>}

          {showCloseButton && (
            <button
              onClick={() => handleOpenChange(false)}
              className="absolute top-4 right-4 rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Close drawer"
            >
              <X size={16} />
            </button>
          )}
        </AnimatedView>
      </SheetContent>
    </Sheet>
  );
}
