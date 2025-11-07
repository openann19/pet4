/**
 * Design Token Typography - Single Source of Truth
 * Generated from android-design-tokens/tokens/typography.json
 * 
 * Fluid typography scale with clamp(min, preferred, max) per tier.
 * All sizes use sp (scale-independent pixels) for proper system font scaling.
 */

export const Typography = {
  // Font families
  fontFamilies: {
    primary: {
      name: 'Inter',
      fallbacks: ['Noto Sans', 'Roboto', 'sans-serif'],
      supports: ['Latin', 'Cyrillic'],
    },
    mono: {
      name: 'JetBrains Mono',
      fallbacks: ['Roboto Mono', 'monospace'],
    },
  },
  
  // Typography scale
  scale: {
    display: {
      fontSize: 32, // clamp(32sp, 5vw, 48sp)
      lineHeight: 1.2,
      letterSpacing: -0.5,
      fontWeight: 700,
      maxLines: 2,
    },
    h1: {
      fontSize: 28, // clamp(28sp, 4vw, 40sp)
      lineHeight: 1.25,
      letterSpacing: -0.25,
      fontWeight: 700,
      maxLines: 2,
    },
    h2: {
      fontSize: 24, // clamp(24sp, 3.5vw, 32sp)
      lineHeight: 1.3,
      letterSpacing: 0,
      fontWeight: 600,
      maxLines: 3,
    },
    h3: {
      fontSize: 20, // clamp(20sp, 3vw, 24sp)
      lineHeight: 1.35,
      letterSpacing: 0,
      fontWeight: 600,
      maxLines: 3,
    },
    h4: {
      fontSize: 18, // clamp(18sp, 2.5vw, 20sp)
      lineHeight: 1.4,
      letterSpacing: 0,
      fontWeight: 600,
      maxLines: 4,
    },
    body: {
      fontSize: 16, // clamp(16sp, 2vw, 18sp)
      lineHeight: 1.5,
      letterSpacing: 0,
      fontWeight: 400,
      maxLines: null,
    },
    bodySmall: {
      fontSize: 14, // clamp(14sp, 1.75vw, 16sp)
      lineHeight: 1.5,
      letterSpacing: 0,
      fontWeight: 400,
      maxLines: null,
    },
    caption: {
      fontSize: 12, // clamp(12sp, 1.5vw, 14sp)
      lineHeight: 1.4,
      letterSpacing: 0.25,
      fontWeight: 400,
      maxLines: 2,
    },
    label: {
      fontSize: 14, // clamp(14sp, 1.75vw, 16sp)
      lineHeight: 1.4,
      letterSpacing: 0.1,
      fontWeight: 500,
      maxLines: 1,
    },
    button: {
      fontSize: 14, // clamp(14sp, 1.75vw, 16sp)
      lineHeight: 1.2,
      letterSpacing: 0.5,
      fontWeight: 600,
      maxLines: 1,
    },
  },
  
  // Truncation policy
  truncation: {
    headings: {
      maxLines: 2,
      overflow: 'ellipsis' as const,
    },
    subtitles: {
      maxLines: 3,
      overflow: 'ellipsis' as const,
    },
    body: {
      maxLines: null,
      overflow: 'visible' as const,
    },
    captions: {
      maxLines: 2,
      overflow: 'ellipsis' as const,
    },
  },
  
  // Localization settings
  localization: {
    bulgarian: {
      hyphenation: true,
      wordBreak: 'normal' as const,
      lineBreak: 'strict' as const,
      expansionFactor: 1.4,
    },
    english: {
      hyphenation: false,
      wordBreak: 'normal' as const,
      lineBreak: 'normal' as const,
      expansionFactor: 1.0,
    },
  },
} as const;

