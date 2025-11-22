import { useEffect, useCallback, type RefObject } from 'react';

interface UseDiscoverKeyboardOptions {
  onPass: () => void;
  onSuperlike: () => void;
  onLike: () => void;
  onOpenDetails?: () => void;
  enabled?: boolean;
  containerRef?: RefObject<HTMLElement>;
}

export function useDiscoverKeyboard({
  onPass,
  onSuperlike,
  onLike,
  onOpenDetails,
  enabled = true,
  containerRef,
}: UseDiscoverKeyboardOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Check if focus is within an input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Check if container ref is provided and focus is not within it
      if (containerRef?.current && !containerRef.current.contains(target)) {
        return;
      }

      if (e.repeat) return;

      const key = e.key.toLowerCase();

      // Arrow keys or letter keys
      if (key === 'arrowleft' || key === 'x') {
        e.preventDefault();
        onPass();
      } else if (key === 'arrowup' || key === 's') {
        e.preventDefault();
        onSuperlike();
      } else if (key === 'arrowright' || key === 'l') {
        e.preventDefault();
        onLike();
      } else if (key === 'enter' && onOpenDetails) {
        e.preventDefault();
        onOpenDetails();
      }
    },
    [enabled, onPass, onSuperlike, onLike, onOpenDetails, containerRef]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

