import { useEffect } from 'react';

/**
 * Hook for managing keyboard shortcuts (Escape key)
 */
export function useChatKeyboard(
  showStickers: boolean,
  showTemplates: boolean,
  showReactions: string | null,
  setShowStickers: (show: boolean) => void,
  setShowTemplates: (show: boolean) => void,
  setShowReactions: (reaction: string | null) => void
) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        if (showStickers) {
          setShowStickers(false);
          e.preventDefault();
        } else if (showTemplates) {
          setShowTemplates(false);
          e.preventDefault();
        } else if (showReactions) {
          setShowReactions(null);
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [showStickers, showTemplates, showReactions, setShowStickers, setShowTemplates, setShowReactions]);
}

