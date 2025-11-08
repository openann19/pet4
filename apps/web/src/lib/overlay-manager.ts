import { useEffect, useCallback, useRef } from 'react';

export interface OverlayConfig {
  onDismiss: () => void;
  dismissOnOutsideClick?: boolean;
  dismissOnEscape?: boolean;
  trapFocus?: boolean;
  lockScroll?: boolean;
  returnFocusOnClose?: boolean;
}

export function useOverlayManager(config: OverlayConfig) {
  const {
    onDismiss,
    dismissOnOutsideClick = true,
    dismissOnEscape = true,
    trapFocus = true,
    lockScroll = true,
    returnFocusOnClose = true,
  } = config;

  const triggerElementRef = useRef<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    triggerElementRef.current = document.activeElement as HTMLElement;
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (dismissOnEscape && e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onDismiss();
      }
    },
    [dismissOnEscape, onDismiss]
  );

  const handleFocusTrap = useCallback(
    (e: KeyboardEvent) => {
      if (!trapFocus || !overlayRef.current) return;
      if (e.key !== 'Tab') return;

      const focusableElements = overlayRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    },
    [trapFocus]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleFocusTrap);

    if (lockScroll) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleFocusTrap);

      if (lockScroll) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }

      if (returnFocusOnClose && triggerElementRef.current) {
        triggerElementRef.current.focus();
      }
    };
  }, [handleKeyDown, handleFocusTrap, lockScroll, returnFocusOnClose]);

  const handleOutsideClick = useCallback(
    (e: React.MouseEvent) => {
      if (!dismissOnOutsideClick) return;
      if (e.target === e.currentTarget) {
        onDismiss();
      }
    },
    [dismissOnOutsideClick, onDismiss]
  );

  const handleBackButton = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [handleBackButton]);

  return {
    overlayRef,
    handleOutsideClick,
    'aria-modal': true,
    role: 'dialog',
  };
}

export function useBottomSheet(config: OverlayConfig & { swipeThreshold?: number }) {
  const { swipeThreshold = 100, onDismiss } = config;
  const overlayManager = useOverlayManager(config);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches[0]) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches[0]) {
        currentY.current = e.touches[0].clientY;
        const diff = currentY.current - startY.current;

        if (diff > 0 && overlayManager.overlayRef.current) {
          overlayManager.overlayRef.current.style.transform = `translateY(${diff}px)`;
        }
      }
    },
    [overlayManager.overlayRef]
  );

  const handleTouchEnd = useCallback(() => {
    const diff = currentY.current - startY.current;

    if (diff > swipeThreshold) {
      onDismiss();
    } else if (overlayManager.overlayRef.current) {
      overlayManager.overlayRef.current.style.transform = '';
    }
  }, [swipeThreshold, onDismiss, overlayManager.overlayRef]);

  return {
    ...overlayManager,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
