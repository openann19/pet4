import { useEffect } from 'react';
import { PawPrint, Heart } from '@phosphor-icons/react';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  animate,
} from '@petspark/motion';

export default function LoadingState() {
  // Main container scale animation
  const mainScale = useSharedValue(1);

  // Outer glow ring animations
  const outerScale = useSharedValue(1);
  const outerOpacity = useSharedValue(0.4);
  const outerRotate = useSharedValue(0);

  // Middle glow ring animations
  const middleScale = useSharedValue(1);
  const middleOpacity = useSharedValue(0.3);
  const middleRotate = useSharedValue(360);

  // Center icon rotation
  const centerRotate = useSharedValue(0);
  const iconRotate = useSharedValue(0);

  // Floating hearts animations
  const heart1Y = useSharedValue(-20);
  const heart1Opacity = useSharedValue(0);
  const heart1Scale = useSharedValue(0.5);

  const heart2Y = useSharedValue(-20);
  const heart2Opacity = useSharedValue(0);
  const heart2Scale = useSharedValue(0.5);

  const heart3Y = useSharedValue(-20);
  const heart3Opacity = useSharedValue(0);
  const heart3Scale = useSharedValue(0.5);

  // Text container animations
  const textOpacity = useSharedValue(0);
  const textY = useSharedValue(10);

  // Dots animations
  const dot1Scale = useSharedValue(1);
  const dot1Opacity = useSharedValue(0.4);
  const dot2Scale = useSharedValue(1);
  const dot2Opacity = useSharedValue(0.4);
  const dot3Scale = useSharedValue(1);
  const dot3Opacity = useSharedValue(0.4);
  const dot4Scale = useSharedValue(1);
  const dot4Opacity = useSharedValue(0.4);

  const dotsOpacity = useSharedValue(0);

  useEffect(() => {
    // Main container scale
    const mainSequence = withSequence(
      withTiming(1.05, { duration: 1250 }),
      withTiming(1, { duration: 1250 })
    );
    const mainRepeat = withRepeat(mainSequence, -1, false);
    animate(mainScale, mainRepeat.target, mainRepeat.transition);

    // Outer glow ring
    const outerScaleSequence = withSequence(
      withTiming(1.8, { duration: 1500 }),
      withTiming(1, { duration: 1500 })
    );
    const outerScaleRepeat = withRepeat(outerScaleSequence, -1, false);
    animate(outerScale, outerScaleRepeat.target, outerScaleRepeat.transition);
    
    const outerOpacitySequence = withSequence(
      withTiming(0, { duration: 1500 }),
      withTiming(0.4, { duration: 1500 })
    );
    const outerOpacityRepeat = withRepeat(outerOpacitySequence, -1, false);
    animate(outerOpacity, outerOpacityRepeat.target, outerOpacityRepeat.transition);
    
    const outerRotateRepeat = withRepeat(withTiming(360, { duration: 3000 }), -1, false);
    animate(outerRotate, outerRotateRepeat.target, outerRotateRepeat.transition);

    // Middle glow ring
    const middleScaleSequence = withSequence(
      withTiming(1.4, { duration: 1250 }),
      withTiming(1, { duration: 1250 })
    );
    const middleScaleRepeat = withRepeat(middleScaleSequence, -1, false);
    animate(middleScale, middleScaleRepeat.target, middleScaleRepeat.transition);
    
    const middleOpacitySequence = withSequence(
      withTiming(0, { duration: 1250 }),
      withTiming(0.3, { duration: 1250 })
    );
    const middleOpacityRepeat = withRepeat(middleOpacitySequence, -1, false);
    animate(middleOpacity, middleOpacityRepeat.target, middleOpacityRepeat.transition);
    
    const middleRotateRepeat = withRepeat(withTiming(0, { duration: 2500 }), -1, false);
    animate(middleRotate, middleRotateRepeat.target, middleRotateRepeat.transition);

    // Center icon rotation
    const centerRotateRepeat = withRepeat(withTiming(360, { duration: 4000 }), -1, false);
    animate(centerRotate, centerRotateRepeat.target, centerRotateRepeat.transition);
    const iconRotateRepeat = withRepeat(withTiming(-360, { duration: 4000 }), -1, false);
    animate(iconRotate, iconRotateRepeat.target, iconRotateRepeat.transition);

    // Floating hearts
    const heart1YSequence = withSequence(
      withTiming(-40, { duration: 1000 }),
      withTiming(-20, { duration: 1000 })
    );
    const heart1YRepeat = withRepeat(heart1YSequence, -1, false);
    animate(heart1Y, heart1YRepeat.target, heart1YRepeat.transition);
    
    const heart1OpacitySequence = withSequence(
      withTiming(1, { duration: 1000 }),
      withTiming(0, { duration: 1000 })
    );
    const heart1OpacityRepeat = withRepeat(heart1OpacitySequence, -1, false);
    animate(heart1Opacity, heart1OpacityRepeat.target, heart1OpacityRepeat.transition);
    
    const heart1ScaleSequence = withSequence(
      withTiming(1, { duration: 1000 }),
      withTiming(0.5, { duration: 1000 })
    );
    const heart1ScaleRepeat = withRepeat(heart1ScaleSequence, -1, false);
    animate(heart1Scale, heart1ScaleRepeat.target, heart1ScaleRepeat.transition);

    setTimeout(() => {
      const heart2YSequence = withSequence(
        withTiming(-40, { duration: 1000 }),
        withTiming(-20, { duration: 1000 })
      );
      const heart2YRepeat = withRepeat(heart2YSequence, -1, false);
      animate(heart2Y, heart2YRepeat.target, heart2YRepeat.transition);
      
      const heart2OpacitySequence = withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      );
      const heart2OpacityRepeat = withRepeat(heart2OpacitySequence, -1, false);
      animate(heart2Opacity, heart2OpacityRepeat.target, heart2OpacityRepeat.transition);
      
      const heart2ScaleSequence = withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      );
      const heart2ScaleRepeat = withRepeat(heart2ScaleSequence, -1, false);
      animate(heart2Scale, heart2ScaleRepeat.target, heart2ScaleRepeat.transition);
    }, 400);

    setTimeout(() => {
      const heart3YSequence = withSequence(
        withTiming(-40, { duration: 1000 }),
        withTiming(-20, { duration: 1000 })
      );
      const heart3YRepeat = withRepeat(heart3YSequence, -1, false);
      animate(heart3Y, heart3YRepeat.target, heart3YRepeat.transition);
      
      const heart3OpacitySequence = withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      );
      const heart3OpacityRepeat = withRepeat(heart3OpacitySequence, -1, false);
      animate(heart3Opacity, heart3OpacityRepeat.target, heart3OpacityRepeat.transition);
      
      const heart3ScaleSequence = withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      );
      const heart3ScaleRepeat = withRepeat(heart3ScaleSequence, -1, false);
      animate(heart3Scale, heart3ScaleRepeat.target, heart3ScaleRepeat.transition);
    }, 800);

    // Text container
    setTimeout(() => {
      const textOpacityTransition = withTiming(1, { duration: 500 });
      animate(textOpacity, textOpacityTransition.target, textOpacityTransition.transition);
      const textYTransition = withTiming(0, { duration: 500 });
      animate(textY, textYTransition.target, textYTransition.transition);
    }, 300);

    // Dots container
    setTimeout(() => {
      const dotsOpacityTransition = withTiming(1, { duration: 500 });
      animate(dotsOpacity, dotsOpacityTransition.target, dotsOpacityTransition.transition);
    }, 500);

    // Individual dots
    const dot1ScaleSequence = withSequence(
      withTiming(1.3, { duration: 600 }),
      withTiming(1, { duration: 600 })
    );
    const dot1ScaleRepeat = withRepeat(dot1ScaleSequence, -1, false);
    animate(dot1Scale, dot1ScaleRepeat.target, dot1ScaleRepeat.transition);
    
    const dot1OpacitySequence = withSequence(
      withTiming(1, { duration: 600 }),
      withTiming(0.4, { duration: 600 })
    );
    const dot1OpacityRepeat = withRepeat(dot1OpacitySequence, -1, false);
    animate(dot1Opacity, dot1OpacityRepeat.target, dot1OpacityRepeat.transition);

    setTimeout(() => {
      const dot2ScaleSequence = withSequence(
        withTiming(1.3, { duration: 600 }),
        withTiming(1, { duration: 600 })
      );
      const dot2ScaleRepeat = withRepeat(dot2ScaleSequence, -1, false);
      animate(dot2Scale, dot2ScaleRepeat.target, dot2ScaleRepeat.transition);
      
      const dot2OpacitySequence = withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.4, { duration: 600 })
      );
      const dot2OpacityRepeat = withRepeat(dot2OpacitySequence, -1, false);
      animate(dot2Opacity, dot2OpacityRepeat.target, dot2OpacityRepeat.transition);
    }, 180);

    setTimeout(() => {
      const dot3ScaleSequence = withSequence(
        withTiming(1.3, { duration: 600 }),
        withTiming(1, { duration: 600 })
      );
      const dot3ScaleRepeat = withRepeat(dot3ScaleSequence, -1, false);
      animate(dot3Scale, dot3ScaleRepeat.target, dot3ScaleRepeat.transition);
      
      const dot3OpacitySequence = withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.4, { duration: 600 })
      );
      const dot3OpacityRepeat = withRepeat(dot3OpacitySequence, -1, false);
      animate(dot3Opacity, dot3OpacityRepeat.target, dot3OpacityRepeat.transition);
    }, 360);

    setTimeout(() => {
      const dot4ScaleSequence = withSequence(
        withTiming(1.3, { duration: 600 }),
        withTiming(1, { duration: 600 })
      );
      const dot4ScaleRepeat = withRepeat(dot4ScaleSequence, -1, false);
      animate(dot4Scale, dot4ScaleRepeat.target, dot4ScaleRepeat.transition);
      
      const dot4OpacitySequence = withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.4, { duration: 600 })
      );
      const dot4OpacityRepeat = withRepeat(dot4OpacitySequence, -1, false);
      animate(dot4Opacity, dot4OpacityRepeat.target, dot4OpacityRepeat.transition);
    }, 540);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - animations are managed by reanimated

  // Animated styles
  const mainStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mainScale.get() }],
  }));

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerScale.get() }, { rotate: `${outerRotate.get()}deg` }],
    opacity: outerOpacity.get(),
  }));

  const middleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: middleScale.get() }, { rotate: `${middleRotate.get()}deg` }],
    opacity: middleOpacity.get(),
  }));

  const centerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${centerRotate.get()}deg` }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotate.get()}deg` }],
  }));

  const heart1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: heart1Y.get() }, { scale: heart1Scale.get() }],
    opacity: heart1Opacity.get(),
  }));

  const heart2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: heart2Y.get() }, { scale: heart2Scale.get() }],
    opacity: heart2Opacity.get(),
  }));

  const heart3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: heart3Y.get() }, { scale: heart3Scale.get() }],
    opacity: heart3Opacity.get(),
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.get(),
    transform: [{ translateY: textY.get() }],
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.get(),
  }));

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot1Scale.get() }],
    opacity: dot1Opacity.get(),
  }));

  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot2Scale.get() }],
    opacity: dot2Opacity.get(),
  }));

  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot3Scale.get() }],
    opacity: dot3Opacity.get(),
  }));

  const dot4Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot4Scale.get() }],
    opacity: dot4Opacity.get(),
  }));

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4">
      <AnimatedView style={mainStyle} className="relative w-28 h-28">
        {/* Outer glow ring */}
        <AnimatedView
          style={outerStyle}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30"
        />

        {/* Middle glow ring */}
        <AnimatedView
          style={middleStyle}
          className="absolute inset-2 rounded-full bg-gradient-to-tr from-accent/30 to-primary/30"
        />

        {/* Center icon container */}
        <AnimatedView
          style={centerStyle}
          className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm flex items-center justify-center border border-primary/20"
        >
          <AnimatedView style={iconStyle}>
            <PawPrint size={40} weight="fill" className="text-primary drop-shadow-lg" />
          </AnimatedView>
        </AnimatedView>

        {/* Floating hearts */}
        <AnimatedView style={[heart1Style, { left: '30%', top: '50%' }]} className="absolute">
          <Heart size={16} weight="fill" className="text-accent" />
        </AnimatedView>
        <AnimatedView style={[heart2Style, { left: '50%', top: '50%' }]} className="absolute">
          <Heart size={16} weight="fill" className="text-accent" />
        </AnimatedView>
        <AnimatedView style={[heart3Style, { left: '70%', top: '50%' }]} className="absolute">
          <Heart size={16} weight="fill" className="text-accent" />
        </AnimatedView>
      </AnimatedView>

      <AnimatedView
        style={textStyle}
        className="flex flex-col items-center gap-3 max-w-sm text-center"
      >
        <div className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
          Loading your experience...
        </div>
        <p className="text-sm text-muted-foreground">Preparing amazing connections</p>
      </AnimatedView>

      <AnimatedView style={dotsStyle} className="flex gap-2.5">
        <AnimatedView
          style={dot1Style}
          className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-accent"
        />
        <AnimatedView
          style={dot2Style}
          className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-accent"
        />
        <AnimatedView
          style={dot3Style}
          className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-accent"
        />
        <AnimatedView
          style={dot4Style}
          className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-accent"
        />
      </AnimatedView>
    </div>
  );
}
