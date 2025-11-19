import { useEffect } from 'react';
import {
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  MotionView,
  type AnimatedStyle,
  type Transition,
} from '@petspark/motion';
import { isTruthy } from '@petspark/shared';
import { useAnimatePresence } from '@/effects/reanimated';

import { Heart, Sparkle } from '@phosphor-icons/react';

interface MatchCelebrationProps {
  show: boolean;
  petName1: string;
  petName2: string;
  onComplete: () => void;
}

interface ParticleProps {
  index: number;
  total: number;
}

function Particle({ index, total }: ParticleProps) {
  const angle = (index / total) * Math.PI * 2;
  const distance = 180 + Math.random() * 120;
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;

  const particleOpacity = useSharedValue<number>(1);
  const particleScale = useSharedValue<number>(0);
  const particleRotate = useSharedValue<number>(0);
  const particleX = useSharedValue<number>(0);
  const particleY = useSharedValue<number>(0);

  useEffect(() => {
    particleX.value = withDelay(index * 20, withTiming(x, { duration: 2000 })) as { target: typeof x; transition: Transition };
    particleY.value = withDelay(index * 20, withTiming(y, { duration: 2000 })) as { target: typeof y; transition: Transition };
    particleScale.value = withDelay(
      index * 20,
      withSequence(withTiming(1.5, { duration: 666 }), withTiming(0, { duration: 1334 }))
    ) as { target: number; transition: Transition };
    particleOpacity.value = withDelay(
      index * 20,
      withSequence(withTiming(1, { duration: 666 }), withTiming(0, { duration: 1334 }))
    ) as { target: number; transition: Transition };
    particleRotate.value = withDelay(index * 20, withTiming(360, { duration: 2000 })) as { target: 360; transition: Transition };
  }, [index, x, y]);

  const particleStyle = useAnimatedStyle(() => {
    const transforms: Record<string, number | string>[] = [];
    transforms.push({ translateX: particleX.value });
    transforms.push({ translateY: particleY.value });
    transforms.push({ scale: particleScale.value });
    transforms.push({ rotate: `${particleRotate.value}deg` });
    return {
      transform: transforms,
      opacity: particleOpacity.value,
    };
  }) as AnimatedStyle;

  return (
    <MotionView className="absolute" style={particleStyle}>
      {index % 2 === 0 ? (
        <Heart size={24} weight="fill" className="text-primary drop-shadow-2xl" />
      ) : (
        <Sparkle size={20} weight="fill" className="text-accent drop-shadow-2xl" />
      )}
    </MotionView>
  );
}

export default function MatchCelebration({
  show,
  petName1,
  petName2,
  onComplete,
}: MatchCelebrationProps) {
  const presence = useAnimatePresence({
    isVisible: show,
    enterTransition: 'scale',
    exitTransition: 'fade',
  });

  // Main container animations
  const containerOpacity = useSharedValue<number>(0);
  const backdropOpacity = useSharedValue<number>(0);

  // Modal animations
  const modalScale = useSharedValue<number>(0);
  const modalRotate = useSharedValue<number>(-180);
  const gradientOpacity = useSharedValue<number>(0.5);

  // Heart icon animations
  const heartScale = useSharedValue<number>(1);
  const heartRotate = useSharedValue<number>(0);

  // Text animations
  const titleOpacity = useSharedValue<number>(0);
  const titleY = useSharedValue<number>(20);
  const subtitleOpacity = useSharedValue<number>(0);
  const subtitleY = useSharedValue<number>(20);
  const footerOpacity = useSharedValue<number>(0);

  // Sparkle rotations
  const sparkle1Rotate = useSharedValue<number>(0);
  const sparkle2Rotate = useSharedValue<number>(0);

  useEffect(() => {
    if (isTruthy(show)) {
      // Start animations
      containerOpacity.value = withSpring(1, { damping: 20, stiffness: 300 }) as { target: 1; transition: Transition };
      backdropOpacity.value = withSpring(1, { damping: 20, stiffness: 300 }) as { target: 1; transition: Transition };
      modalScale.value = withSpring(1, { damping: 20, stiffness: 200 }) as { target: 1; transition: Transition };
      modalRotate.value = withSpring(0, { damping: 20, stiffness: 200 }) as { target: 0; transition: Transition };

      // Gradient pulse
      gradientOpacity.value = withRepeat(
        withSequence(withTiming(0.8, { duration: 1000 }), withTiming(0.5, { duration: 1000 })),
        -1,
        true
      ) as { target: number; transition: Transition };

      // Heart pulse and rotate
      heartScale.value = withRepeat(
        withSequence(withTiming(1.3, { duration: 300 }), withTiming(1, { duration: 300 })),
        -1,
        true
      ) as { target: number; transition: Transition };
      heartRotate.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 200 }),
          withTiming(-5, { duration: 200 }),
          withTiming(0, { duration: 200 })
        ),
        -1,
        true
      ) as { target: number; transition: Transition };

      // Text animations with delays
      titleOpacity.value = withDelay(300, withSpring(1, { damping: 20, stiffness: 300 })) as { target: 1; transition: Transition };
      titleY.value = withDelay(300, withSpring(0, { damping: 20, stiffness: 300 })) as { target: 0; transition: Transition };
      subtitleOpacity.value = withDelay(400, withSpring(1, { damping: 20, stiffness: 300 })) as { target: 1; transition: Transition };
      subtitleY.value = withDelay(400, withSpring(0, { damping: 20, stiffness: 300 })) as { target: 0; transition: Transition };
      footerOpacity.value = withDelay(500, withSpring(1, { damping: 20, stiffness: 300 })) as { target: 1; transition: Transition };

      // Sparkle rotations
      sparkle1Rotate.value = withRepeat(withTiming(360, { duration: 3000 }), -1, false) as { target: number; transition: Transition };
      sparkle2Rotate.value = withRepeat(withTiming(-180, { duration: 3000 }), -1, false) as { target: number; transition: Transition };

      const timer = setTimeout(() => {
        onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      // Reset animations
      containerOpacity.value = 0 as number;
      backdropOpacity.value = 0 as number;
      modalScale.value = 0 as number;
      modalRotate.value = 180 as number;
    }
    return undefined;
  }, [show, onComplete]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  })) as AnimatedStyle;

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  })) as AnimatedStyle;

  const modalStyle = useAnimatedStyle(() => {
    const transforms: Record<string, number | string>[] = [];
    transforms.push({ scale: modalScale.value });
    transforms.push({ rotate: `${modalRotate.value}deg` });
    return { transform: transforms };
  }) as AnimatedStyle;

  const gradientStyle = useAnimatedStyle(() => ({
    opacity: gradientOpacity.value,
  })) as AnimatedStyle;

  const heartStyle = useAnimatedStyle(() => {
    const transforms: Record<string, number | string>[] = [];
    transforms.push({ scale: heartScale.value });
    transforms.push({ rotate: `${heartRotate.value}deg` });
    return { transform: transforms };
  }) as AnimatedStyle;

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  })) as AnimatedStyle;

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleY.value }],
  })) as AnimatedStyle;

  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  })) as AnimatedStyle;

  const sparkle1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkle1Rotate.value}deg` }],
  })) as AnimatedStyle;

  const sparkle2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkle2Rotate.value}deg` }],
  })) as AnimatedStyle;

  const particles = Array.from({ length: 20 }, (_, i) => i);

  return (
    <>
      {presence.shouldRender && show && (
        <MotionView
          style={containerStyle}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          <MotionView
            className="absolute inset-0 glass-strong backdrop-blur-2xl"
            style={backdropStyle}
          />

          {particles.map((i) => (
            <Particle key={i} index={i} total={particles.length} />
          ))}

          <MotionView
            className="relative z-10 rounded-3xl glass-strong premium-shadow border-2 border-white/40 p-10 max-w-md mx-4 backdrop-blur-2xl overflow-hidden"
            style={modalStyle}
          >
            <MotionView
              className="absolute inset-0 bg-linear-to-br from-primary/30 via-accent/30 to-secondary/30"
              style={gradientStyle}
            />

            <MotionView style={heartStyle} className="text-center mb-6 relative z-10">
              <div className="inline-block p-4 rounded-full glass-strong border-2 border-white/50 shadow-2xl">
                <Heart size={72} weight="fill" className="text-white drop-shadow-2xl" />
              </div>
            </MotionView>

            <MotionView
              style={titleStyle}
              className="text-4xl font-bold text-white text-center mb-3 drop-shadow-2xl relative z-10"
            >
              It's a Match! 🎉
            </MotionView>

            <MotionView
              style={subtitleStyle}
              className="text-white/95 text-center text-xl font-medium drop-shadow-lg relative z-10"
            >
              {petName1} and {petName2} are now connected!
            </MotionView>

            <MotionView
              className="mt-8 flex items-center justify-center gap-5 relative z-10"
              style={footerStyle}
            >
              <MotionView style={sparkle1Style}>
                <Sparkle size={32} weight="fill" className="text-white drop-shadow-2xl" />
              </MotionView>
              <div className="text-white font-bold text-lg drop-shadow-lg">Perfect Companions!</div>
              <MotionView style={sparkle2Style}>
                <Sparkle size={32} weight="fill" className="text-white drop-shadow-2xl" />
              </MotionView>
            </MotionView>
          </MotionView>
        </MotionView>
      )}
    </>
  );
}
