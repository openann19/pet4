import { useEffect } from 'react';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useAnimatePresence } from '@/effects/reanimated/use-animate-presence';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
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

  const particleOpacity = useSharedValue(1);
  const particleScale = useSharedValue(0);
  const particleRotate = useSharedValue(0);
  const particleX = useSharedValue(0);
  const particleY = useSharedValue(0);

  useEffect(() => {
    particleX.value = withDelay(index * 20, withTiming(x, { duration: 2000 }));
    particleY.value = withDelay(index * 20, withTiming(y, { duration: 2000 }));
    particleScale.value = withDelay(
      index * 20,
      withSequence(withTiming(1.5, { duration: 666 }), withTiming(0, { duration: 1334 }))
    );
    particleOpacity.value = withDelay(
      index * 20,
      withSequence(withTiming(1, { duration: 666 }), withTiming(0, { duration: 1334 }))
    );
    particleRotate.value = withDelay(index * 20, withTiming(360, { duration: 2000 }));
  }, [index, x, y]);

  const particleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: particleX.value },
      { translateY: particleY.value },
      { scale: particleScale.value },
      { rotate: `${particleRotate.value}deg` },
    ],
    opacity: particleOpacity.value,
  })) as AnimatedStyle;

  return (
    <AnimatedView className="absolute" style={particleStyle}>
      {index % 2 === 0 ? (
        <Heart size={24} weight="fill" className="text-primary drop-shadow-2xl" />
      ) : (
        <Sparkle size={20} weight="fill" className="text-accent drop-shadow-2xl" />
      )}
    </AnimatedView>
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
  const containerOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  // Modal animations
  const modalScale = useSharedValue(0);
  const modalRotate = useSharedValue(-180);
  const gradientOpacity = useSharedValue(0.5);

  // Heart icon animations
  const heartScale = useSharedValue(1);
  const heartRotate = useSharedValue(0);

  // Text animations
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const subtitleY = useSharedValue(20);
  const footerOpacity = useSharedValue(0);

  // Sparkle rotations
  const sparkle1Rotate = useSharedValue(0);
  const sparkle2Rotate = useSharedValue(0);

  useEffect(() => {
    if (show) {
      // Start animations
      containerOpacity.value = withSpring(1, { damping: 20, stiffness: 300 });
      backdropOpacity.value = withSpring(1, { damping: 20, stiffness: 300 });
      modalScale.value = withSpring(1, { damping: 20, stiffness: 200 });
      modalRotate.value = withSpring(0, { damping: 20, stiffness: 200 });

      // Gradient pulse
      gradientOpacity.value = withRepeat(
        withSequence(withTiming(0.8, { duration: 1000 }), withTiming(0.5, { duration: 1000 })),
        -1,
        true
      );

      // Heart pulse and rotate
      heartScale.value = withRepeat(
        withSequence(withTiming(1.3, { duration: 300 }), withTiming(1, { duration: 300 })),
        -1,
        true
      );
      heartRotate.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 200 }),
          withTiming(-5, { duration: 200 }),
          withTiming(0, { duration: 200 })
        ),
        -1,
        true
      );

      // Text animations with delays
      titleOpacity.value = withDelay(300, withSpring(1, { damping: 20, stiffness: 300 }));
      titleY.value = withDelay(300, withSpring(0, { damping: 20, stiffness: 300 }));
      subtitleOpacity.value = withDelay(400, withSpring(1, { damping: 20, stiffness: 300 }));
      subtitleY.value = withDelay(400, withSpring(0, { damping: 20, stiffness: 300 }));
      footerOpacity.value = withDelay(500, withSpring(1, { damping: 20, stiffness: 300 }));

      // Sparkle rotations
      sparkle1Rotate.value = withRepeat(withTiming(360, { duration: 3000 }), -1, false);
      sparkle2Rotate.value = withRepeat(withTiming(-360, { duration: 3000 }), -1, false);

      const timer = setTimeout(() => {
        onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      // Reset animations
      containerOpacity.value = 0;
      backdropOpacity.value = 0;
      modalScale.value = 0;
      modalRotate.value = 180;
    }
    return undefined;
  }, [show, onComplete]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  })) as AnimatedStyle;

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  })) as AnimatedStyle;

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }, { rotate: `${modalRotate.value}deg` }],
  })) as AnimatedStyle;

  const gradientStyle = useAnimatedStyle(() => ({
    opacity: gradientOpacity.value,
  })) as AnimatedStyle;

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }, { rotate: `${heartRotate.value}deg` }],
  })) as AnimatedStyle;

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
        <AnimatedView
          style={containerStyle}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          <AnimatedView
            className="absolute inset-0 glass-strong backdrop-blur-2xl"
            style={backdropStyle}
          />

          {particles.map((i) => (
            <Particle key={i} index={i} total={particles.length} />
          ))}

          <AnimatedView
            className="relative z-10 rounded-3xl glass-strong premium-shadow border-2 border-white/40 p-10 max-w-md mx-4 backdrop-blur-2xl overflow-hidden"
            style={modalStyle}
          >
            <AnimatedView
              className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/30 to-secondary/30"
              style={gradientStyle}
            />

            <AnimatedView style={heartStyle} className="text-center mb-6 relative z-10">
              <div className="inline-block p-4 rounded-full glass-strong border-2 border-white/50 shadow-2xl">
                <Heart size={72} weight="fill" className="text-white drop-shadow-2xl" />
              </div>
            </AnimatedView>

            <AnimatedView
              style={titleStyle}
              className="text-4xl font-bold text-white text-center mb-3 drop-shadow-2xl relative z-10"
            >
              It's a Match! 🎉
            </AnimatedView>

            <AnimatedView
              style={subtitleStyle}
              className="text-white/95 text-center text-xl font-medium drop-shadow-lg relative z-10"
            >
              {petName1} and {petName2} are now connected!
            </AnimatedView>

            <AnimatedView
              className="mt-8 flex items-center justify-center gap-5 relative z-10"
              style={footerStyle}
            >
              <AnimatedView style={sparkle1Style}>
                <Sparkle size={32} weight="fill" className="text-white drop-shadow-2xl" />
              </AnimatedView>
              <div className="text-white font-bold text-lg drop-shadow-lg">Perfect Companions!</div>
              <AnimatedView style={sparkle2Style}>
                <Sparkle size={32} weight="fill" className="text-white drop-shadow-2xl" />
              </AnimatedView>
            </AnimatedView>
          </AnimatedView>
        </AnimatedView>
      )}
    </>
  );
}
