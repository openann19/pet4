'use client';

import { useCallback } from 'react';
import { useUIConfig } from '@/hooks/useUIConfig';

export interface UseSoundFeedbackOptions {
  enabled?: boolean;
}

export interface UseSoundFeedbackReturn {
  play: (sound: 'send' | 'delete' | 'react' | 'tap' | 'error' | 'success') => void;
}

const SOUND_URLS: Record<string, string> = {
  send: '/sounds/send.mp3',
  delete: '/sounds/delete.mp3',
  react: '/sounds/react.mp3',
  tap: '/sounds/tap.mp3',
  error: '/sounds/error.mp3',
  success: '/sounds/success.mp3',
};

/**
 * Sound feedback system
 *
 * Plays sound effects for various actions
 *
 * @example
 * ```tsx
 * const { play } = useSoundFeedback()
 * const handleSend = () => {
 *   play('send')
 * }
 * ```
 */
export function useSoundFeedback(options: UseSoundFeedbackOptions = {}): UseSoundFeedbackReturn {
  const { enabled = true } = options;
  const { feedback } = useUIConfig();

  const play = useCallback(
    (sound: 'send' | 'delete' | 'react' | 'tap' | 'error' | 'success'): void => {
      if (!enabled || !feedback.sound) {
        return;
      }

      try {
        const audio = new Audio(SOUND_URLS[sound]);
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Silently fail if audio cannot play
        });
      } catch {
        // Silently fail if Audio API is not available
      }
    },
    [enabled, feedback.sound]
  );

  return {
    play,
  };
}
