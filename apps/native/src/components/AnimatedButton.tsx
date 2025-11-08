import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { ViewStyle, TextStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SpringConfig } from '../animations/springConfigs';

interface AnimatedButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  children,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  disabled = false,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, SpringConfig.snappy);
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SpringConfig.bouncy);
    opacity.value = withTiming(1, { duration: 100 });
  };

  return (
    <AnimatedTouchable
      style={[
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'outline' && styles.outline,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.9}
    >
      {children ? (
        children
      ) : (
        <Text style={[styles.text, variant === 'outline' && styles.outlineText, textStyle]}>
          {title}
        </Text>
      )}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#6366f1',
  },
  secondary: {
    backgroundColor: '#8b5cf6',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  disabled: {
    backgroundColor: '#9ca3af',
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineText: {
    color: '#6366f1',
  },
});
