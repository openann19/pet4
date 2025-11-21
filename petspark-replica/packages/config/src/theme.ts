/**
 * Theme configuration for PETSPARK
 */

// Common string literals - defined before use
const DEFAULT_VALUES = '#000000';
const WHITE_COLOR = '#ffffff';
const TRANSPARENT = 'transparent';
const NEUTRAL_50 = 'neutral.50';
const NEUTRAL_100 = 'neutral.100';
const NEUTRAL_200 = 'neutral.200';
const NEUTRAL_300 = 'neutral.300';
const NEUTRAL_400 = 'neutral.400';
const NEUTRAL_500 = 'neutral.500';
const NEUTRAL_600 = 'neutral.600';
const NEUTRAL_700 = 'neutral.700';
const NEUTRAL_800 = 'neutral.800';
const NEUTRAL_900 = 'neutral.900';
const PRIMARY_50 = 'primary.50';
const PRIMARY_100 = 'primary.100';
const PRIMARY_500 = 'primary.500';
const PRIMARY_600 = 'primary.600';
const PRIMARY_700 = 'primary.700';
const PRIMARY_800 = 'primary.800';
const SECONDARY_100 = 'secondary.100';
const SECONDARY_800 = 'secondary.800';
const ACCENT_100 = 'accent.100';
const ACCENT_500 = 'accent.500';
const ACCENT_800 = 'accent.800';
const ERROR = 'error';
const WARNING = 'warning';

export const THEME_CONFIG = {
  // Color palette
  colors: {
    // Primary colors
    primary: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    
    // Secondary colors (blue)
    secondary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    
    // Accent colors (green)
    accent: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    
    // Neutral colors
    neutral: {
      0: '#ffffff',
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },
    
    // Semantic colors
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Social media colors
    social: {
      facebook: '#1877f2',
      twitter: '#1da1f2',
      instagram: '#e4405f',
      youtube: '#ff0000',
      tiktok: DEFAULT_VALUES,
      linkedin: '#0077b5',
    },
    
    // Pet type colors
    petTypes: {
      dog: '#f59e0b',
      cat: '#8b5cf6',
      bird: '#10b981',
      rabbit: '#ec4899',
      hamster: '#f97316',
      fish: '#06b6d4',
      reptile: '#84cc16',
      other: '#6b7280',
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      serif: ['Georgia', 'serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
    },
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
  },
  
  // Spacing
  spacing: {
    0: '0px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },
  
  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  
  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
  },
  
  // Z-index
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Animation durations
  animation: {
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms',
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },
  
  // Component-specific themes
  components: {
    // Button theme
    button: {
      primary: {
        backgroundColor: PRIMARY_500,
        color: WHITE_COLOR,
        borderColor: PRIMARY_500,
        hover: {
          backgroundColor: PRIMARY_600,
          borderColor: PRIMARY_600,
        },
        active: {
          backgroundColor: PRIMARY_700,
          borderColor: PRIMARY_700,
        },
        disabled: {
          backgroundColor: NEUTRAL_300,
          color: NEUTRAL_500,
          borderColor: NEUTRAL_300,
        },
      },
      secondary: {
        backgroundColor: TRANSPARENT,
        color: PRIMARY_500,
        borderColor: PRIMARY_500,
        hover: {
          backgroundColor: PRIMARY_50,
        },
        active: {
          backgroundColor: PRIMARY_100,
        },
        disabled: {
          backgroundColor: TRANSPARENT,
          color: NEUTRAL_400,
          borderColor: NEUTRAL_300,
        },
      },
      ghost: {
        backgroundColor: TRANSPARENT,
        color: NEUTRAL_700,
        borderColor: TRANSPARENT,
        hover: {
          backgroundColor: NEUTRAL_100,
        },
        active: {
          backgroundColor: NEUTRAL_200,
        },
        disabled: {
          backgroundColor: TRANSPARENT,
          color: NEUTRAL_400,
        },
      },
    },
    
    // Card theme
    card: {
      backgroundColor: WHITE_COLOR,
      borderColor: NEUTRAL_200,
      borderRadius: 'lg',
      shadow: 'md',
      hover: {
        shadow: 'lg',
        borderColor: NEUTRAL_300,
      },
    },
    
    // Input theme
    input: {
      backgroundColor: WHITE_COLOR,
      borderColor: NEUTRAL_300,
      color: NEUTRAL_900,
      placeholder: NEUTRAL_500,
      focus: {
        borderColor: PRIMARY_500,
        ring: PRIMARY_500,
      },
      error: {
        borderColor: 'error',
        ring: 'error',
      },
      disabled: {
        backgroundColor: NEUTRAL_100,
        color: NEUTRAL_500,
        borderColor: NEUTRAL_200,
      },
    },
    
    // Modal theme
    modal: {
      backgroundColor: WHITE_COLOR,
      borderRadius: 'xl',
      shadow: '2xl',
      overlay: {
        backgroundColor: NEUTRAL_900,
        opacity: 0.5,
      },
    },
    
    // Navigation theme
    navigation: {
      backgroundColor: WHITE_COLOR,
      borderColor: NEUTRAL_200,
      active: {
        backgroundColor: PRIMARY_50,
        color: PRIMARY_600,
      },
      hover: {
        backgroundColor: NEUTRAL_50,
      },
    },
    
    // Badge theme
    badge: {
      primary: {
        backgroundColor: PRIMARY_100,
        color: PRIMARY_800,
      },
      secondary: {
        backgroundColor: SECONDARY_100,
        color: SECONDARY_800,
      },
      success: {
        backgroundColor: ACCENT_100,
        color: ACCENT_800,
      },
      error: {
        backgroundColor: ERROR,
        color: WHITE_COLOR,
      },
      warning: {
        backgroundColor: WARNING,
        color: WHITE_COLOR,
      },
    },
    
    // Avatar theme
    avatar: {
      backgroundColor: NEUTRAL_200,
      color: NEUTRAL_600,
      borderColor: NEUTRAL_300,
      online: {
        backgroundColor: ACCENT_500,
        borderColor: WHITE_COLOR,
      },
      offline: {
        backgroundColor: NEUTRAL_400,
        borderColor: WHITE_COLOR,
      },
    },
    
    // Message theme
    message: {
      sent: {
        backgroundColor: PRIMARY_500,
        color: WHITE_COLOR,
      },
      received: {
        backgroundColor: NEUTRAL_100,
        color: NEUTRAL_900,
      },
      typing: {
        backgroundColor: NEUTRAL_200,
        color: NEUTRAL_600,
      },
    },
  },
  
  // Dark theme overrides
  dark: {
    colors: {
      neutral: {
        0: '#0a0a0a',
        50: '#171717',
        100: '#262626',
        200: '#404040',
        300: '#525252',
        400: '#737373',
        500: '#a3a3a3',
        600: '#d4d4d4',
        700: '#e5e5e5',
        800: '#f5f5f5',
        900: '#fafafa',
        950: '#ffffff',
      },
    },
    components: {
      card: {
        backgroundColor: NEUTRAL_900,
        borderColor: NEUTRAL_700,
      },
      input: {
        backgroundColor: NEUTRAL_800,
        borderColor: NEUTRAL_600,
        color: NEUTRAL_100,
        placeholder: NEUTRAL_400,
      },
      modal: {
        backgroundColor: NEUTRAL_900,
      },
      navigation: {
        backgroundColor: NEUTRAL_900,
        borderColor: NEUTRAL_700,
      },
      message: {
        received: {
          backgroundColor: NEUTRAL_800,
          color: NEUTRAL_100,
        },
      },
    },
  },
} as const;

// Helper functions
export function getColor(colorName: string, shade?: string | number): string {
  const colorPath = colorName.split('.');
  let color: Record<string, unknown> = THEME_CONFIG.colors;
  
  for (const path of colorPath) {
    const nextColor = color[path];
    if (typeof nextColor === 'object' && nextColor !== null) {
      color = nextColor as Record<string, unknown>;
    } else if (typeof nextColor === 'string') {
      color = { [path]: nextColor } as Record<string, unknown>;
      break;
    } else {
      return DEFAULT_VALUES;
    }
  }
  
  if (shade && typeof color === 'object' && shade in color) {
    const result = color[shade];
    return typeof result === 'string' ? result : DEFAULT_VALUES;
  }
  
  return typeof color === 'string' ? color : DEFAULT_VALUES;
}

export function getFontSize(size: keyof typeof THEME_CONFIG.typography.fontSize): readonly [string, Record<string, string>] {
  return THEME_CONFIG.typography.fontSize[size];
}

export function getSpacing(size: keyof typeof THEME_CONFIG.spacing): string {
  return THEME_CONFIG.spacing[size];
}

export function getBorderRadius(size: keyof typeof THEME_CONFIG.borderRadius): string {
  return THEME_CONFIG.borderRadius[size];
}

export function getShadow(size: keyof typeof THEME_CONFIG.boxShadow): string {
  return THEME_CONFIG.boxShadow[size];
}

export function getZIndex(index: keyof typeof THEME_CONFIG.zIndex): number | string {
  return THEME_CONFIG.zIndex[index];
}

export function getBreakpoint(breakpoint: keyof typeof THEME_CONFIG.breakpoints): string {
  return THEME_CONFIG.breakpoints[breakpoint];
}

export function getDuration(duration: keyof typeof THEME_CONFIG.animation.duration): string {
  return THEME_CONFIG.animation.duration[duration];
}

export function getEasing(easing: keyof typeof THEME_CONFIG.animation.easing): string {
  return THEME_CONFIG.animation.easing[easing];
}

export function getComponentTheme(component: keyof typeof THEME_CONFIG.components, variant?: string): Record<string, unknown> {
  const theme = THEME_CONFIG.components[component];
  return variant && variant in theme ? (theme as Record<string, Record<string, unknown>>)[variant] : theme;
}

export function isDarkTheme(theme: 'light' | 'dark'): boolean {
  return theme === 'dark';
}

export function getThemeColors(theme: 'light' | 'dark') {
  return theme === 'dark' ? THEME_CONFIG.dark.colors : THEME_CONFIG.colors;
}
