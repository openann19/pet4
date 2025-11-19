import { useEffect } from 'react';
import { useSharedValue, withRepeat, withSequence, withTiming, type AnimatedStyle } from '@petspark/motion';


export function useEmojiAnimation() {
  const emojiRotation = useSharedValue<number>(0);

  useEffect(() => {
    emojiRotation.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 1000 }),
        withTiming(-10, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
  }, [emojiRotation]);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${emojiRotation.value}deg` }],
  })) as AnimatedStyle;

  return { emojiStyle };
}

