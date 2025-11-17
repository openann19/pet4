'use client';;
import { useEffect, useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  animate,
  MotionView,
} from '@petspark/motion';
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
import { useUIConfig } from "@/hooks/use-ui-config";
import { isTruthy } from '@petspark/shared';

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
    const _uiConfig = useUIConfig();
    const translateX = useSharedValue(side === 'right' ? 100 : side === 'left' ? -100 : 0);
  const translateY = useSharedValue(side === 'top' ? -100 : side === 'bottom' ? 100 : 0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isTruthy(open)) {
      if (side === 'right' || side === 'left') {
        const xTransition = withSpring(0, springConfigs.smooth);
        animate(translateX, xTransition.target, xTransition.transition);
      } else {
        const yTransition = withSpring(0, springConfigs.smooth);
        animate(translateY, yTransition.target, yTransition.transition);
      }
      const opacityTransition = withTiming(1, { duration: 200 });
      animate(opacity, opacityTransition.target, opacityTransition.transition);
    } else {
      if (side === 'right') {
        const xTransition = withSpring(100, springConfigs.smooth);
        animate(translateX, xTransition.target, xTransition.transition);
      } else if (side === 'left') {
        const xTransition = withSpring(-100, springConfigs.smooth);
        animate(translateX, xTransition.target, xTransition.transition);
      } else if (side === 'top') {
        const yTransition = withSpring(-100, springConfigs.smooth);
        animate(translateY, yTransition.target, yTransition.transition);
      } else {
        const yTransition = withSpring(100, springConfigs.smooth);
        animate(translateY, yTransition.target, yTransition.transition);
      }
      const opacityTransition = withTiming(0, { duration: 150 });
      animate(opacity, opacityTransition.target, opacityTransition.transition);
    }
  }, [open, side, translateX, translateY, opacity]);

  const contentStyle = useAnimatedStyle((): Record<string, unknown> => ({
    transform: [{ translateX: translateX.get() }, { translateY: translateY.get() }],
    opacity: opacity.get(),
  }));

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
        <MotionView style={contentStyle} className="contents">
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
              onClick={() => { handleOpenChange(false); }}
              className="absolute top-4 right-4 rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Close drawer"
            >
              <X size={16} />
            </button>
          )}
        </MotionView>
      </SheetContent>
    </Sheet>
  );
}
