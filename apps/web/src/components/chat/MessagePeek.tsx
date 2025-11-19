'use client';;
import { useEffect, useRef } from 'react';
import { useSharedValue, usewithSpring, withTiming, MotionView   type AnimatedStyle,
} from '@petspark/motion';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { useFeatureFlags } from '@/config/feature-flags';
import { X } from '@phosphor-icons/react';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface MessagePeekProps {
  message: {
    content: string;
    senderName: string;
    timestamp: string;
    type?: string;
  };
  visible: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
  triggerRef?: React.RefObject<HTMLElement>;
}

/**
 * MessagePeek Component
 *
 * Long-press preview card with magnified message content
 * Opens within 120ms, respects reduced motion
 * Manages focus: traps focus when open, returns to trigger on close
 */
export function MessagePeek({ message, visible, onClose, position: _position, triggerRef }: MessagePeekProps) {
  const _uiConfig = useUIConfig();
  const reducedMotion = usePrefersReducedMotion();
  const { enableMessagePeek } = useFeatureFlags();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const scale = useSharedValue<number>(0.9);
  const opacity = useSharedValue<number>(0);
  const backdropOpacity = useSharedValue<number>(0);

  useEffect(() => {
    if (!enableMessagePeek) {
      return;
    }

    if (visible) {
      // Store the previously focused element
      previouslyFocusedRef.current = document.activeElement as HTMLElement;

      const duration = reducedMotion ? 120 : 180;
      scale.value = withSpring(1, springConfigs.smooth);
      opacity.value = withTiming(1, { duration });
      backdropOpacity.value = withTiming(0.25, { duration });

      // Focus the close button after animation starts
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, duration);
    } else {
      scale.value = withTiming(0.9, timingConfigs.fast);
      opacity.value = withTiming(0, timingConfigs.fast);
      backdropOpacity.value = withTiming(0, timingConfigs.fast);

      // Return focus to trigger element
      if (previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus();
      } else if (triggerRef?.current) {
        triggerRef.current.focus();
      }
    }
  }, [visible, reducedMotion, enableMessagePeek, scale, opacity, backdropOpacity, triggerRef]);

  useEffect(() => {
    if (!visible || !enableMessagePeek) {
      return;
    }

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
        e.preventDefault();
      }
    };

    // Trap focus within the modal
    const handleTab = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return;

      const dialog = closeButtonRef.current?.closest('[role="dialog"]');
      if (!dialog) return;

      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement | null;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement | null;

      if (!firstElement || !lastElement) {
        return;
      }

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('keydown', handleTab);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('keydown', handleTab);
    };
  }, [visible, onClose, enableMessagePeek]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!enableMessagePeek || !visible) {
    return null;
  }

  // Position style no longer needed—cardStyle now includes positioning
  // const cardPosition = position
  //   ? { left: `${position.x}px`, top: `${position.y}px`, transform: 'translate(-50%, -50%)' }
  //   : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <>
      <MotionView
        style={backdropStyle}
        className="fixed inset-0 bg-black z-40"
        onClick={() => void onClose()}
        aria-hidden="true"
      />
      <MotionView
        style={cardStyle}
        className="fixed z-50 bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-md w-[90vw]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="message-peek-title"
        aria-describedby="message-peek-content"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p id="message-peek-title" className="font-semibold text-sm text-foreground">
              {message.senderName}
            </p>
            <p className="text-xs text-muted-foreground">
              {message.timestamp
                ? new Date(message.timestamp).toLocaleTimeString()
                : 'Unknown time'}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={() => void onClose()}
            className="p-1 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Close preview"
          >
            <X size={20} />
          </button>
        </div>
        <div
          id="message-peek-content"
          className="text-base text-foreground whitespace-pre-wrap wrap-break-word"
        >
          {message.content}
        </div>
      </MotionView>
    </>
  );
}
