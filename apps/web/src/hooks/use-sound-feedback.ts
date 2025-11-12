/**
 * Unified Sound Feedback Hook (Web)
 *
 * Provides sound feedback for UI interactions with:
 * - ABSOLUTE_MAX_UI_MODE integration
 * - Haptic feedback synchronization
 * - Reduced motion awareness
 * - Volume-aware playback
 *
 * Location: apps/web/src/hooks/use-sound-feedback.ts
 */

import { useCallback, useEffect } from 'react';
import { useUIConfig } from '@/hooks/use-ui-config';
import { useReducedMotion } from '@/effects/chat/core/reduced-motion';
import { getSoundFeedbackService, playSound, type SoundType } from '@/effects/core/sound-feedback';

export interface UseSoundFeedbackOptions {
  enabled?: boolean;
  hapticEnabled?: boolean;
}

export interface UseSoundFeedbackReturn {
  play: (soundType: SoundType, options?: { haptic?: boolean }) => Promise<void>;
  playSend: () => Promise<void>;
  playReceive: () => Promise<void>;
  playTap: () => Promise<void>;
  playSuccess: () => Promise<void>;
  playError: () => Promise<void>;
  playMatch: () => Promise<void>;
  playReaction: () => Promise<void>;
  playReply: () => Promise<void>;
  playDelete: () => Promise<void>;
  playSwipe: () => Promise<void>;
  playLongPress: () => Promise<void>;
}

/**
 * Hook for sound feedback with ABSOLUTE_MAX_UI_MODE integration
 *
 * @example
 * ```tsx
 * const { playSend, playReceive } = useSoundFeedback();
 *
 * const handleSend = async () => {
 *   await playSend();
 *   // ... send logic
 * };
 * ```
 */
export function useSoundFeedback(options: UseSoundFeedbackOptions = {}): UseSoundFeedbackReturn {
  const { feedback } = useUIConfig();
  const reducedMotion = useReducedMotion();
  const { enabled: optionsEnabled = true, hapticEnabled: optionsHapticEnabled = true } = options;

  // Update sound service settings when config changes
  useEffect(() => {
    const service = getSoundFeedbackService();
    service.setEnabled(optionsEnabled && feedback.sound);
    service.setHapticEnabled(optionsHapticEnabled && feedback.haptics);
    service.setRespectReducedMotion(true);
    service.updateReducedMotion();
  }, [optionsEnabled, optionsHapticEnabled, feedback.sound, feedback.haptics, reducedMotion]);

  const play = useCallback(
    async (soundType: SoundType, playOptions?: { haptic?: boolean }): Promise<void> => {
      if (!optionsEnabled || !feedback.sound) {
        return;
      }

      await playSound(soundType, {
        haptic: playOptions?.haptic ?? (optionsHapticEnabled && feedback.haptics),
      });
    },
    [optionsEnabled, optionsHapticEnabled, feedback.sound, feedback.haptics]
  );

  const playSend = useCallback(async (): Promise<void> => {
    await play('send');
  }, [play]);

  const playReceive = useCallback(async (): Promise<void> => {
    await play('receive');
  }, [play]);

  const playTap = useCallback(async (): Promise<void> => {
    await play('tap');
  }, [play]);

  const playSuccess = useCallback(async (): Promise<void> => {
    await play('success');
  }, [play]);

  const playError = useCallback(async (): Promise<void> => {
    await play('error');
  }, [play]);

  const playMatch = useCallback(async (): Promise<void> => {
    await play('match');
  }, [play]);

  const playReaction = useCallback(async (): Promise<void> => {
    await play('reaction');
  }, [play]);

  const playReply = useCallback(async (): Promise<void> => {
    await play('reply');
  }, [play]);

  const playDelete = useCallback(async (): Promise<void> => {
    await play('delete');
  }, [play]);

  const playSwipe = useCallback(async (): Promise<void> => {
    await play('swipe');
  }, [play]);

  const playLongPress = useCallback(async (): Promise<void> => {
    await play('longPress');
  }, [play]);

  return {
    play,
    playSend,
    playReceive,
    playTap,
    playSuccess,
    playError,
    playMatch,
    playReaction,
    playReply,
    playDelete,
    playSwipe,
    playLongPress,
  };
}
