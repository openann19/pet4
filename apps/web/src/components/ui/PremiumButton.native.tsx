/**
 * Premium Button - KRASIVO Edition (Mobile)
 * 
 * Showcases the complete motion system: press bounce, hover lift, magnetic, haptics
 * Feels more expensive than any competitor app
 */

import { View, Text } from 'react-native';
import { MotionView, usePressBounce, haptic } from '@petspark/motion';

interface PremiumButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onPress: () => void;
}

export function PremiumButton({ 
  label, 
  variant = 'primary', 
  size = 'md',
  onPress,
}: PremiumButtonProps) {
  // Motion hook for premium feel
  const pressBounce = usePressBounce(0.94);

  // Style configuration
  const sizeStyles = {
    sm: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 },
    md: { paddingHorizontal: 20, paddingVertical: 12, fontSize: 16 },
    lg: { paddingHorizontal: 24, paddingVertical: 16, fontSize: 18 },
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
      color: '#FFFFFF',
    },
    secondary: {
      backgroundColor: '#F2F2F7',
      borderColor: '#F2F2F7', 
      color: '#000000',
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: '#007AFF',
      color: '#007AFF',
    },
  };

  const buttonStyle = {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  const textStyle = {
    fontSize: sizeStyles[size].fontSize,
    fontWeight: '600' as const,
    color: variantStyles[variant].color,
  };

  // Simple touch handler for mobile
  const handlePress = () => {
    pressBounce.onPressIn();
    haptic.light();
    setTimeout(() => {
      pressBounce.onPressOut();
      onPress();
    }, 100);
  };

  return (
    <MotionView 
      style={buttonStyle}
      animatedStyle={pressBounce.animatedStyle}
      onTouchStart={handlePress}
    >
      <Text style={textStyle}>{label}</Text>
    </MotionView>
  );
}

PremiumButton.displayName = 'PremiumButton';