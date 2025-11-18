import { useSharedValue, withTiming } from '@petspark/motion';
import type { SharedValue } from '@petspark/motion';
import {
  useChatHeaderAnimations,
  useTypingIndicatorAnimations,
} from './useChatAnimations';
import type { CSSProperties } from 'react';

/**
 * Hook for managing chat header button hover animations
 */
export function useChatHeaderButtonAnimations(typingUsersCount: number) {
  const { headerStyle } = useChatHeaderAnimations();
  const { typingContainerStyle: _typingContainerStyle, typingTextStyle: _typingTextStyle, typingDotsStyle } =
    useTypingIndicatorAnimations(typingUsersCount);

  const videoButtonScale = useSharedValue<number>(1);
  const videoButtonTranslateY = useSharedValue<number>(0);
  const voiceButtonScale = useSharedValue<number>(1);
  const voiceButtonTranslateY = useSharedValue<number>(0);

  const videoButtonHover = {
    scale: videoButtonScale,
    translateY: videoButtonTranslateY,
    handleEnter: () => {
      videoButtonScale.value = withTiming(1.1, { duration: 150 });
      videoButtonTranslateY.value = withTiming(-2, { duration: 150 });
    },
    handleLeave: () => {
      videoButtonScale.value = withTiming(1, { duration: 150 });
      videoButtonTranslateY.value = withTiming(0, { duration: 150 });
    },
  };

  const voiceButtonHover = {
    scale: voiceButtonScale,
    translateY: voiceButtonTranslateY,
    handleEnter: () => {
      voiceButtonScale.value = withTiming(1.1, { duration: 150 });
      voiceButtonTranslateY.value = withTiming(-2, { duration: 150 });
    },
    handleLeave: () => {
      voiceButtonScale.value = withTiming(1, { duration: 150 });
      voiceButtonTranslateY.value = withTiming(0, { duration: 150 });
    },
  };

  // Convert animated styles to CSSProperties for ChatHeader
  const headerStyleCSS: CSSProperties = {};
  const typingContainerStyleCSS: CSSProperties = {};
  const typingTextStyleCSS: CSSProperties = {};
  const typingDotsStyleCSS: CSSProperties = {};

  return {
    headerStyle: headerStyleCSS,
    typingContainerStyle: typingContainerStyleCSS,
    typingTextStyle: typingTextStyleCSS,
    typingDotsStyle: typingDotsStyleCSS,
    videoButtonHover,
    voiceButtonHover,
  };
}

