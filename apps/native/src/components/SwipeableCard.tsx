import React from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { isTruthy, isDefined } from '@/core/guards';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
}

type AnimatedGHContext = {
  startX: number;
  startY: number;
};

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    AnimatedGHContext
  >({
    onStart: (_, context) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;
      rotate.value = interpolate(
        translateX.value,
        [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        [-15, 0, 15],
        Extrapolate.CLAMP
      );
    },
    onEnd: (event) => {
      const absX = Math.abs(translateX.value);
      const absY = Math.abs(translateY.value);

      if (absX > SWIPE_THRESHOLD && absX > absY) {
        // Swipe left or right
        const direction = translateX.value > 0 ? 1 : -1;
        translateX.value = withTiming(direction * SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
          if (direction > 0 && onSwipeRight) {
            runOnJS(onSwipeRight)();
          } else if (direction < 0 && onSwipeLeft) {
            runOnJS(onSwipeLeft)();
          }
        });
        translateY.value = withTiming(event.velocityY * 0.1, { duration: 300 });
      } else if (translateY.value < -SWIPE_THRESHOLD && onSwipeUp) {
        // Swipe up
        translateY.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
          if (isTruthy(onSwipeUp)) {
            runOnJS(onSwipeUp)();
          }
        });
      } else {
        // Return to center
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
        rotate.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${String(rotate.value ?? '')}deg` },
    ],
  }));

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    ),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    ),
  }));

  const superlikeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    ),
  }));

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Animated.View style={[styles.overlay, styles.likeOverlay, likeOpacity]}>
          <View style={styles.badge}>
            <Animated.Text style={styles.badgeText}>LIKE</Animated.Text>
          </View>
        </Animated.View>
        <Animated.View style={[styles.overlay, styles.nopeOverlay, nopeOpacity]}>
          <View style={[styles.badge, styles.nopeBadge]}>
            <Animated.Text style={styles.badgeText}>NOPE</Animated.Text>
          </View>
        </Animated.View>
        <Animated.View style={[styles.overlay, styles.superlikeOverlay, superlikeOpacity]}>
          <View style={[styles.badge, styles.superlikeBadge]}>
            <Animated.Text style={styles.badgeText}>SUPER</Animated.Text>
          </View>
        </Animated.View>
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    top: 50,
    zIndex: 10,
  },
  likeOverlay: {
    right: 30,
  },
  nopeOverlay: {
    left: 30,
  },
  superlikeOverlay: {
    alignSelf: 'center',
    left: 0,
    right: 0,
  },
  badge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  nopeBadge: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  superlikeBadge: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  badgeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
  },
});
