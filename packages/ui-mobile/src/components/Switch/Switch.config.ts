import { StyleSheet } from 'react-native'
import type { ComponentVariant, ComponentSize } from '../../types/component.types'
import type { SwitchSizeConfig } from './Switch.types'
import { tokens } from '../../tokens'

// Size configurations for the switch
export const switchSizeConfig: SwitchSizeConfig = {
  small: {
    track: {
      width: 36,
      height: 20,
      borderRadius: 10,
    },
    thumb: {
      size: 16,
      borderRadius: 8,
      translateDistance: 14,
    },
    animation: {
      duration: 200,
      springConfig: {
        stiffness: 400,
        damping: 30,
      },
    },
  },
  medium: {
    track: {
      width: 44,
      height: 24,
      borderRadius: 12,
    },
    thumb: {
      size: 20,
      borderRadius: 10,
      translateDistance: 18,
    },
    animation: {
      duration: 250,
      springConfig: {
        stiffness: 350,
        damping: 25,
      },
    },
  },
  large: {
    track: {
      width: 52,
      height: 28,
      borderRadius: 14,
    },
    thumb: {
      size: 24,
      borderRadius: 12,
      translateDistance: 22,
    },
    animation: {
      duration: 300,
      springConfig: {
        stiffness: 300,
        damping: 20,
      },
    },
  },
}

export const createSwitchStyles = (
  variant: ComponentVariant = 'default',
  size: ComponentSize = 'medium',
  disabled: boolean = false,
  checked: boolean = false
) => {
  const config = switchSizeConfig[size]

  const variantColors = {
    default: {
      trackActive: tokens.colors.accent.primary,
      trackInactive: tokens.colors.border.primary,
      thumb: tokens.colors.background.primary,
    },
    filled: {
      trackActive: tokens.colors.accent.primary,
      trackInactive: tokens.colors.background.secondary,
      thumb: tokens.colors.background.primary,
    },
    outlined: {
      trackActive: tokens.colors.accent.primary,
      trackInactive: 'transparent',
      thumb: tokens.colors.background.primary,
    },
    ghost: {
      trackActive: tokens.colors.accent.surface,
      trackInactive: tokens.colors.background.secondary,
      thumb: checked ? tokens.colors.accent.primary : tokens.colors.text.secondary,
    },
  }

  const colors = variantColors[variant]

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: tokens.spacing.md,
    },

    switchContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    track: {
      width: config.track.width,
      height: config.track.height,
      borderRadius: config.track.borderRadius,
      backgroundColor: checked ? colors.trackActive : colors.trackInactive,
      borderWidth: variant === 'outlined' ? 1.5 : 0,
      borderColor: checked ? colors.trackActive : tokens.colors.border.primary,
      position: 'relative',
      opacity: disabled ? 0.5 : 1,
      shadowColor: tokens.colors.shadow.primary,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },

    trackPressed: {
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 2,
    },

    thumb: {
      width: config.thumb.size,
      height: config.thumb.size,
      borderRadius: config.thumb.borderRadius,
      backgroundColor: colors.thumb,
      position: 'absolute',
      top: (config.track.height - config.thumb.size) / 2,
      left: checked ? config.thumb.translateDistance : 2,
      shadowColor: tokens.colors.shadow.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },

    thumbPressed: {
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },

    labelContainer: {
      flex: 1,
      paddingTop: tokens.spacing.xs / 2,
    },

    label: {
      fontSize: tokens.typography.body.medium.fontSize,
      lineHeight: tokens.typography.body.medium.lineHeight,
      fontWeight: tokens.typography.weights.medium,
      color: tokens.colors.text.primary,
    },

    labelDisabled: {
      color: tokens.colors.text.secondary,
      opacity: 0.6,
    },

    description: {
      fontSize: tokens.typography.caption.fontSize,
      lineHeight: tokens.typography.caption.lineHeight,
      color: tokens.colors.text.secondary,
      marginTop: tokens.spacing.xs / 2,
    },

    descriptionDisabled: {
      opacity: 0.5,
    },

    // Focus and accessibility styles
    focused: {
      shadowColor: tokens.colors.accent.primary,
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },

    // Animation helpers
    animated: {
      // Base styles for animated components
    },
  })
}
