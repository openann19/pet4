import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from '@petspark/motion';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useHoverLift } from '@/effects/reanimated/use-hover-lift';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';

/**
 * Hook for managing chat window header animations
 */
export function useChatHeaderAnimations() {
  const headerY = useSharedValue<number>(-20);
  const headerOpacity = useSharedValue<number>(0);

  useEffect(() => {
    headerY.value = withSpring(0, { damping: 20, stiffness: 300 });
    headerOpacity.value = withSpring(1, { damping: 20, stiffness: 300 });
  }, [headerY, headerOpacity]);

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerY.value }],
    opacity: headerOpacity.value,
  })) as AnimatedStyle;

  return { headerStyle };
}

/**
 * Hook for managing typing indicator animations
 */
export function useTypingIndicatorAnimations(typingUsersCount: number) {
  const typingOpacity = useSharedValue<number>(0);
  const typingTextOpacity = useSharedValue<number>(0.3);
  const typingDotsScale = useSharedValue<number>(1);

  useEffect(() => {
    if (typingUsersCount > 0) {
      typingOpacity.value = withSpring(1, { damping: 20, stiffness: 300 });
      typingTextOpacity.value = withRepeat(
        withSequence(withTiming(1, { duration: 750 }), withTiming(0.3, { duration: 750 })),
        -1,
        true
      );
      typingDotsScale.value = withRepeat(
        withSequence(withTiming(1.2, { duration: 300 }), withTiming(1, { duration: 300 })),
        -1,
        true
      );
    } else {
      typingOpacity.value = withSpring(0, { damping: 20, stiffness: 300 });
    }
  }, [typingUsersCount, typingOpacity, typingTextOpacity, typingDotsScale]);

  const typingContainerStyle = useAnimatedStyle(() => ({
    opacity: typingOpacity.value,
  })) as AnimatedStyle;

  const typingTextStyle = useAnimatedStyle(() => ({
    opacity: typingTextOpacity.value,
  })) as AnimatedStyle;

  const typingDotsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: typingDotsScale.value }],
  })) as AnimatedStyle;

  return { typingContainerStyle, typingTextStyle, typingDotsStyle };
}

/**
 * Hook for managing templates panel animations
 */
export function useTemplatesPanelAnimations(showTemplates: boolean) {
  const templatesOpacity = useSharedValue<number>(0);
  const templatesHeight = useSharedValue<number>(0);

  useEffect(() => {
    if (showTemplates) {
      templatesOpacity.value = withSpring(1, { damping: 20, stiffness: 300 });
      templatesHeight.value = withSpring(1, { damping: 20, stiffness: 300 });
    } else {
      templatesOpacity.value = withSpring(0, { damping: 20, stiffness: 300 });
      templatesHeight.value = withSpring(0, { damping: 20, stiffness: 300 });
    }
  }, [showTemplates, templatesOpacity, templatesHeight]);

  const templatesStyle = useAnimatedStyle(() => ({
    opacity: templatesOpacity.value,
    height: templatesHeight.value * 300,
  })) as AnimatedStyle;

  return { templatesStyle };
}

/**
 * Hook for managing button hover and tap animations
 */
export function useButtonAnimations() {
  const messageBubbleHover = useHoverLift();
  const messageBubbleHoverStyle = useAnimatedStyle(() => {
    const transforms: Array<Record<string, number | string>> = [];
    const scaleVal = messageBubbleHover.scale.get();
    const translateYVal = messageBubbleHover.translateY.get();
    if (scaleVal !== 1) transforms.push({ scale: scaleVal });
    if (translateYVal !== 0) transforms.push({ translateY: translateYVal });
    return { transform: transforms.length > 0 ? transforms : undefined };
  }) as AnimatedStyle;

  const voiceButtonHover = useHoverLift();
  const voiceButtonHoverStyle = useAnimatedStyle(() => {
    const transforms: Array<Record<string, number | string>> = [];
    const scaleVal = voiceButtonHover.scale.get();
    const translateYVal = voiceButtonHover.translateY.get();
    if (scaleVal !== 1) transforms.push({ scale: scaleVal });
    if (translateYVal !== 0) transforms.push({ translateY: translateYVal });
    return { transform: transforms.length > 0 ? transforms : undefined };
  }) as AnimatedStyle;
  const voiceButtonTap = useBounceOnTap();
  const voiceButtonTapStyle = useAnimatedStyle(() => {
    const scaleVal = voiceButtonTap.scale.get();
    return scaleVal !== 1 ? { transform: [{ scale: scaleVal }] } : {};
  }) as AnimatedStyle;

  const reactionButtonHover = useHoverLift();
  const reactionButtonHoverStyle = useAnimatedStyle(() => {
    const transforms: Array<Record<string, number | string>> = [];
    const scaleVal = reactionButtonHover.scale.get();
    const translateYVal = reactionButtonHover.translateY.get();
    if (scaleVal !== 1) transforms.push({ scale: scaleVal });
    if (translateYVal !== 0) transforms.push({ translateY: translateYVal });
    return { transform: transforms.length > 0 ? transforms : undefined };
  }) as AnimatedStyle;
  const reactionButtonTap = useBounceOnTap();
  const reactionButtonTapStyle = useAnimatedStyle(() => {
    const scaleVal = reactionButtonTap.scale.get();
    return scaleVal !== 1 ? { transform: [{ scale: scaleVal }] } : {};
  }) as AnimatedStyle;

  const templateButtonHover = useHoverLift();
  const templateButtonHoverStyle = useAnimatedStyle(() => {
    const transforms: Array<Record<string, number | string>> = [];
    const scaleVal = templateButtonHover.scale.get();
    const translateYVal = templateButtonHover.translateY.get();
    if (scaleVal !== 1) transforms.push({ scale: scaleVal });
    if (translateYVal !== 0) transforms.push({ translateY: translateYVal });
    return { transform: transforms.length > 0 ? transforms : undefined };
  }) as AnimatedStyle;
  const templateButtonTap = useBounceOnTap();
  const templateButtonTapStyle = useAnimatedStyle(() => {
    const scaleVal = templateButtonTap.scale.get();
    return scaleVal !== 1 ? { transform: [{ scale: scaleVal }] } : {};
  }) as AnimatedStyle;

  const stickerButtonHover = useHoverLift();
  const stickerButtonHoverStyle = useAnimatedStyle(() => {
    const transforms: Array<Record<string, number | string>> = [];
    const scaleVal = stickerButtonHover.scale.get();
    const translateYVal = stickerButtonHover.translateY.get();
    if (scaleVal !== 1) transforms.push({ scale: scaleVal });
    if (translateYVal !== 0) transforms.push({ translateY: translateYVal });
    return { transform: transforms.length > 0 ? transforms : undefined };
  }) as AnimatedStyle;
  const stickerButtonTap = useBounceOnTap();
  const stickerButtonTapStyle = useAnimatedStyle(() => {
    const scaleVal = stickerButtonTap.scale.get();
    return scaleVal !== 1 ? { transform: [{ scale: scaleVal }] } : {};
  }) as AnimatedStyle;

  const emojiButtonHover = useHoverLift();
  const emojiButtonHoverStyle = useAnimatedStyle(() => {
    const transforms: Array<Record<string, number | string>> = [];
    const scaleVal = emojiButtonHover.scale.get();
    const translateYVal = emojiButtonHover.translateY.get();
    if (scaleVal !== 1) transforms.push({ scale: scaleVal });
    if (translateYVal !== 0) transforms.push({ translateY: translateYVal });
    return { transform: transforms.length > 0 ? transforms : undefined };
  }) as AnimatedStyle;
  const emojiButtonTap = useBounceOnTap();
  const emojiButtonTapStyle = useAnimatedStyle(() => {
    const scaleVal = emojiButtonTap.scale.get();
    return scaleVal !== 1 ? { transform: [{ scale: scaleVal }] } : {};
  }) as AnimatedStyle;

  const sendButtonHover = useHoverLift();
  const sendButtonHoverStyle = useAnimatedStyle(() => {
    const transforms: Array<Record<string, number | string>> = [];
    const scaleVal = sendButtonHover.scale.get();
    const translateYVal = sendButtonHover.translateY.get();
    if (scaleVal !== 1) transforms.push({ scale: scaleVal });
    if (translateYVal !== 0) transforms.push({ translateY: translateYVal });
    return { transform: transforms.length > 0 ? transforms : undefined };
  }) as AnimatedStyle;
  const sendButtonTap = useBounceOnTap();
  const sendButtonTapStyle = useAnimatedStyle(() => {
    const scaleVal = sendButtonTap.scale.get();
    return scaleVal !== 1 ? { transform: [{ scale: scaleVal }] } : {};
  }) as AnimatedStyle;

  const videoButtonHover = useHoverLift();

  return {
    messageBubbleHover,
    messageBubbleHoverStyle,
    voiceButtonHover,
    voiceButtonHoverStyle,
    voiceButtonTap,
    voiceButtonTapStyle,
    reactionButtonHover,
    reactionButtonHoverStyle,
    reactionButtonTap,
    reactionButtonTapStyle,
    templateButtonHover,
    templateButtonHoverStyle,
    templateButtonTap,
    templateButtonTapStyle,
    stickerButtonHover,
    stickerButtonHoverStyle,
    stickerButtonTap,
    stickerButtonTapStyle,
    emojiButtonHover,
    emojiButtonHoverStyle,
    emojiButtonTap,
    emojiButtonTapStyle,
    sendButtonHover,
    sendButtonHoverStyle,
    sendButtonTap,
    sendButtonTapStyle,
    videoButtonHover,
  };
}

