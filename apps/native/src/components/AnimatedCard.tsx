import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import type { ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SpringConfig } from '../animations/springConfigs';

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const AnimatedCard: React.FC<AnimatedCardProps> = ({ children, onPress, style }) => {
  const scale = useSharedValue(1);
  const elevation = useSharedValue(2);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: elevation.value * 0.05,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, SpringConfig.snappy);
    elevation.value = withTiming(8, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SpringConfig.bouncy);
    elevation.value = withTiming(2, { duration: 200 });
  };

  return (
    <AnimatedTouchable
      style={[styles.card, animatedStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.95}
      disabled={!onPress}
    >
      {children}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
});
