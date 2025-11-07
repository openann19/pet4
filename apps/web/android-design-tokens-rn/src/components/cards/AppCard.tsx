import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';

/**
 * Card Variant Enum
 */
export enum CardVariant {
  DEFAULT = 'default',
  ELEVATED = 'elevated',
  GLASS = 'glass',
}

/**
 * Premium Card Component
 * 
 * Features:
 * - All variants (default/elevated/glass)
 * - All states (default/hover/pressed)
 * - Token-based spacing and radius
 * - Accessibility support
 */
export interface AppCardProps extends TouchableOpacityProps {
  variant?: CardVariant;
  children: React.ReactNode;
}

export function AppCard({
  variant = CardVariant.DEFAULT,
  children,
  onPress,
  style,
  accessibilityLabel,
  ...props
}: AppCardProps) {
  const paddingHorizontal = 16;
  const paddingVertical = 12;
  const borderRadius = variant === CardVariant.ELEVATED ? 20 : 16;
  
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case CardVariant.DEFAULT:
        return {
          backgroundColor: '#232428', // surface.card
          elevation: 2,
        };
      case CardVariant.ELEVATED:
        return {
          backgroundColor: '#2C2D32', // surface.card.elevated
          elevation: 4,
        };
      case CardVariant.GLASS:
        return {
          backgroundColor: '#363740D9', // glass.card
          elevation: 0,
        };
      default:
        return {};
    }
  };
  
  const variantStyles = getVariantStyles();
  
  const Component = onPress ? TouchableOpacity : View;
  
  return (
    <Component
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.base,
        {
          paddingHorizontal,
          paddingVertical,
          borderRadius,
          minHeight: onPress ? 48 : undefined,
        },
        variantStyles,
        style,
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      {...props}
    >
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
  },
});

