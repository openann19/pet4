/**
 * Design Tokens - Mobile UI Design System
 *
 * Centralized design tokens for consistent styling across mobile components.
 */

export const tokens = {
  // Color system
  colors: {
    // Brand colors
    accent: {
      primary: '#007AFF',
      surface: 'rgba(0, 122, 255, 0.1)',
      contrast: '#FFFFFF',
    },

    // Primary color scale (for consistency with components)
    primary: {
      50: '#E6F3FF',
      100: '#CCE7FF',
      200: '#99CFFF',
      300: '#66B7FF',
      400: '#339FFF',
      500: '#007AFF',
      600: '#0056CC',
      700: '#003D99',
      800: '#002866',
      900: '#001333',
    },

    // Error color scale
    error: {
      50: '#FFEBEA',
      100: '#FFD6D5',
      200: '#FFADAB',
      300: '#FF8481',
      400: '#FF5B57',
      500: '#FF3B30',
      600: '#CC1F26',
      700: '#99171D',
      800: '#660F13',
      900: '#33070A',
    },

    // Background colors
    background: {
      primary: '#FFFFFF',
      secondary: '#F2F2F7',
      pressed: 'rgba(0, 0, 0, 0.05)',
      disabled: '#F8F8F8',
      input: '#FFFFFF',
      surface: '#FFFFFF',
    },

    // Text colors
    text: {
      primary: '#1C1C1E',
      secondary: '#8E8E93',
      tertiary: '#C7C7CC',
      placeholder: '#C7C7CC',
      disabled: '#D1D1D6',
    },

    // Border colors
    border: {
      primary: '#E5E5EA',
      secondary: '#F2F2F7',
      input: '#E5E5EA',
      disabled: '#F2F2F7',
      light: '#F0F0F0',
    },

    // Semantic colors
    semantic: {
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
      info: '#007AFF',
    },

    // Success color scale
    success: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#10B981',
      600: '#059669',
      700: '#047857',
      800: '#065F46',
      900: '#064E3B',
    },

    // Warning color scale
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },

    // Info color scale
    info: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },

    // Shadow colors
    shadow: {
      primary: '#000000',
    },

    // Overlay colors
    overlay: {
      dark: 'rgba(0, 0, 0, 0.5)',
      light: 'rgba(255, 255, 255, 0.9)',
    },

    // Basic colors (for legacy compatibility)
    white: '#FFFFFF',
    black: '#000000',

    // Neutral color scale
    neutral: {
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
  },

  // Opacity values
  opacity: {
    disabled: 0.6,
  },

  // Spacing scale
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
  },

  // Typography scale
  typography: {
    // Font weights
    weights: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },

    // Font size scale (for consistency with components)
    size: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
    },

    // Font weights (alias for consistency)
    weight: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },

    // Line heights
    lineHeight: {
      normal: 1.5,
      tight: 1.25,
      loose: 1.75,
      relaxed: 1.625,
    },

    // Font sizes and line heights
    caption: {
      fontSize: 12,
      lineHeight: 16,
    },

    body: {
      small: {
        fontSize: 14,
        lineHeight: 20,
      },
      medium: {
        fontSize: 16,
        lineHeight: 24,
      },
      large: {
        fontSize: 18,
        lineHeight: 28,
      },
    },

    heading: {
      small: {
        fontSize: 18,
        lineHeight: 24,
      },
      medium: {
        fontSize: 20,
        lineHeight: 28,
      },
      large: {
        fontSize: 24,
        lineHeight: 32,
      },
    },
  },

  // Border radius scale
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    full: 9999,
  },

  // Touch target sizes
  sizing: {
    touch: {
      small: 36,
      medium: 44,
      large: 56,
    },
  },

  // Animation timing
  animation: {
    duration: {
      fast: 200,
      medium: 300,
      slow: 500,
    },

    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },
} as const

// Type exports
export type ColorToken = typeof tokens.colors
export type SpacingToken = typeof tokens.spacing
export type TypographyToken = typeof tokens.typography
export type BorderRadiusToken = typeof tokens.borderRadius
