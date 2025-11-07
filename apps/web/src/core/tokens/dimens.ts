/**
 * Design Token Dimensions - Single Source of Truth
 * Generated from android-design-tokens/tokens/spacing.json and radius.json
 * 
 * All dimensions use px for web, but convert to dp for React Native
 */

export const Dimens = {
  // Base spacing unit
  spacingBase: 4,
  
  // Spacing scale (4/8 grid)
  spacing: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    '4xl': 32,
    '5xl': 40,
    '6xl': 48,
    '7xl': 56,
    '8xl': 64,
    '9xl': 80,
    '10xl': 96,
  },
  
  // Component spacing
  component: {
    touchTargetMin: 48,
    button: {
      paddingHorizontal: {
        sm: 12,
        md: 16,
        lg: 20,
      },
      paddingVertical: {
        sm: 8,
        md: 12,
        lg: 16,
      },
    },
    card: {
      paddingInner: {
        horizontal: 16,
        vertical: 12,
      },
      paddingOuter: {
        horizontal: 20,
        vertical: 16,
      },
    },
    section: {
      spacingVertical: 24,
      spacingHorizontal: 20,
    },
    pageGutter: 20,
    sheet: {
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    listItem: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    icon: {
      spacingSM: 8,
      spacingMD: 12,
      spacingLG: 16,
    },
    textField: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
  },
  
  // Layout spacing
  layout: {
    gridGutter: 16,
    gridMargin: 20,
    baselineAlignment: 4,
    verticalRhythm: {
      section: 24,
      card: 16,
      element: 12,
    },
  },
  
  // Border radius scale
  radius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
    
    // Component radius
    button: {
      sm: 8,
      md: 12,
      lg: 16,
    },
    card: {
      default: 16,
      elevated: 20,
    },
    chip: {
      sm: 8,
      md: 12,
      lg: 16,
    },
    textField: {
      default: 12,
      outlined: 12,
    },
    sheet: {
      top: 20,
      bottom: 20,
      dialog: 24,
    },
    badge: 8,
    avatar: {
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
      full: 9999,
    },
    image: {
      card: 16,
      thumbnail: 8,
      full: 0,
    },
    tab: {
      indicator: 2,
      container: 12,
    },
  },
  
  // Elevation (shadow)
  elevation: {
    none: 0,
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
    '2xl': 6,
    '3xl': 8,
    '4xl': 12,
    '5xl': 16,
    '6xl': 24,
    
    component: {
      card: {
        default: 2,
        elevated: 4,
        hover: 3,
      },
      button: {
        default: 1,
        pressed: 0,
        hover: 2,
      },
      sheet: {
        modal: 8,
        bottom: 6,
      },
      dialog: 12,
      floatingActionButton: 6,
      appBar: 4,
    },
  },
  
  // Glow spread
  glowSpread: 8,
} as const;

/**
 * Convert px to React Native dimensions
 * In React Native, use these values directly as numbers
 */
export const toRN = (px: number): number => px;

