import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useHaptics } from '@/hooks/use-haptics';

/**
 * Button Size Enum
 */
export enum ButtonSize {
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
}

/**
 * Button Variant Enum
 */
export enum ButtonVariant {
  PRIMARY = 'primary',
  OUTLINE = 'outline',
  GHOST = 'ghost',
  GLASS = 'glass',
}

/**
 * Premium Button Component
 *
 * Features:
 * - All sizes (sm/md/lg) with token-based dimensions
 * - All variants (primary/outline/ghost/glass)
 * - All states (default/hover/pressed/focus/disabled/loading)
 * - Minimum 48dp touch target
 * - Haptic feedback
 * - Accessibility support
 */
export interface AppButtonProps extends TouchableOpacityProps {
  text: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: React.ReactNode;
  maxLines?: number;
}

export function AppButton({
  text,
  onPress,
  size = ButtonSize.MD,
  variant = ButtonVariant.PRIMARY,
  disabled = false,
  loading = false,
  icon,
  maxLines,
  style,
  ...props
}: AppButtonProps) {
  const haptics = useHaptics();

  const paddingHorizontal = size === ButtonSize.SM ? 12 : size === ButtonSize.MD ? 16 : 20;
  const paddingVertical = size === ButtonSize.MD ? 12 : size === ButtonSize.LG ? 16 : 8;
  const minHeight = 48; // Touch target minimum
  const borderRadius = size === ButtonSize.SM ? 8 : size === ButtonSize.MD ? 12 : 16;
  const fontSize = 14; // sp

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case ButtonVariant.PRIMARY:
        return {
          container: {
            backgroundColor: '#636A79', // primary.500
          },
          text: {
            color: '#FCFCFD', // text.onPrimary
          },
        };
      case ButtonVariant.OUTLINE:
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: '#4A4B50', // border.default
          },
          text: {
            color: '#F5F6F7', // text.primary
          },
        };
      case ButtonVariant.GHOST:
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: {
            color: '#F5F6F7', // text.primary
          },
        };
      case ButtonVariant.GLASS:
        return {
          container: {
            backgroundColor: '#363740D9', // glass.card
          },
          text: {
            color: '#FCFCFD', // text.onGlass
          },
        };
      default:
        return {
          container: {},
          text: {},
        };
    }
  };

  const variantStyles = getVariantStyles();
  const isDisabled = disabled || loading;

  const handlePress = (e: any) => {
    if (!isDisabled && onPress) {
      haptics.impact('light');
      onPress(e);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          paddingHorizontal,
          paddingVertical,
          minHeight,
          borderRadius,
          opacity: isDisabled ? 0.5 : 1,
        },
        variantStyles.container,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityState={{ disabled: isDisabled }}
      {...props}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={variantStyles.text.color} />
        ) : (
          <>
            {icon && <View style={styles.icon}>{icon}</View>}
            <Text
              numberOfLines={maxLines || (size === ButtonSize.SM ? 1 : 2)}
              ellipsizeMode="tail"
              style={[
                styles.text,
                {
                  fontSize,
                  fontWeight: '600',
                  letterSpacing: 0.5,
                },
                variantStyles.text,
              ]}
            >
              {text}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    textAlign: 'center',
  },
});
