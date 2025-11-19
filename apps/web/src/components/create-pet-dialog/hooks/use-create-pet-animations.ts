import { useAnimatedStyle } from '@petspark/motion';
import { useHoverLift } from '@/effects/reanimated/use-hover-lift';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';
import { useAnimatePresence } from '@/effects/reanimated';

import type { Step } from '../create-pet-types';
import { useStepAnimations } from './use-step-animations';
import { useEmojiAnimation } from './use-emoji-animation';

export function useCreatePetAnimations(currentStep: Step, photo: string) {
  const { emojiStyle } = useEmojiAnimation();
  const { stepStyle, progressStyle } = useStepAnimations(currentStep);

  const petTypeButtonHover = useHoverLift();
  const petTypeButtonTap = useBounceOnTap();

  const photoPresence = useAnimatePresence({ isVisible: !!photo });
  const completeStepPresence = useAnimatePresence({ isVisible: currentStep !== 'complete' });

  const petTypeIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 }],
  })) as AnimatedStyle;

  return {
    emojiStyle,
    petTypeIndicatorStyle,
    stepStyle,
    progressStyle,
    petTypeButtonHover,
    petTypeButtonTap,
    photoPresence,
    completeStepPresence,
  };
}

