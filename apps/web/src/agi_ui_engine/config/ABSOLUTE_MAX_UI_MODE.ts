/**
 * ABSOLUTE_MAX_UI_MODE - AGI-Level UI Mode Configuration
 * 
 * Ultra-premium animation, theme, and smoothness profile for all visual components.
 * Includes GPU performance, blur layering, haptics, and emotional color logic.
 */

export type HapticStrength = 'light' | 'medium' | 'strong'

export type TapFeedback = 'spring' | 'scale' | 'none'

export type ThemeVariant = 'glass' | 'neon' | 'dark' | 'vibrant'

export interface SpringPhysics {
  damping: number
  stiffness: number
  mass: number
}

export interface VisualConfig {
  enableBlur: boolean
  enableGlow: boolean
  enableShadows: boolean
  enableShimmer: boolean
  enable3DTilt: boolean
  backdropSaturation: number
  maxElevation: number
  borderRadius: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  highContrastText: boolean
}

export interface AnimationConfig {
  enableReanimated: boolean
  smoothEntry: boolean
  tapFeedback: TapFeedback
  motionBlur: boolean
  springPhysics: SpringPhysics
  showParticles: boolean
  showTrails: boolean
  motionFPS: number
}

export interface PerformanceConfig {
  runOnUIThread: boolean
  skipReactRender: boolean
  useSkiaWhereAvailable: boolean
  flatListOptimized: boolean
  layoutAwareAnimations: boolean
}

export interface FeedbackConfig {
  haptics: boolean
  hapticStrength: HapticStrength
  sound: boolean
  showTooltips: boolean
}

export interface ThemeConfig {
  adaptiveMood: boolean
  gradientIntensity: number
  themeVariants: ThemeVariant[]
  avatarGlow: boolean
  dynamicBackground: boolean
}

export interface DebugConfig {
  logFrameDrops: boolean
  traceSharedValues: boolean
}

export interface AbsoluteMaxUIModeConfig {
  visual: VisualConfig
  animation: AnimationConfig
  performance: PerformanceConfig
  feedback: FeedbackConfig
  theme: ThemeConfig
  debug: DebugConfig
}

export const ABSOLUTE_MAX_UI_MODE: AbsoluteMaxUIModeConfig = {
  visual: {
    enableBlur: true,
    enableGlow: true,
    enableShadows: true,
    enableShimmer: true,
    enable3DTilt: true,
    backdropSaturation: 1.5,
    maxElevation: 24,
    borderRadius: '2xl',
    highContrastText: true
  },
  animation: {
    enableReanimated: true,
    smoothEntry: true,
    tapFeedback: 'spring',
    motionBlur: true,
    springPhysics: {
      damping: 15,
      stiffness: 250,
      mass: 0.9
    },
    showParticles: true,
    showTrails: true,
    motionFPS: 60
  },
  performance: {
    runOnUIThread: true,
    skipReactRender: true,
    useSkiaWhereAvailable: true,
    flatListOptimized: true,
    layoutAwareAnimations: true
  },
  feedback: {
    haptics: true,
    hapticStrength: 'strong',
    sound: true,
    showTooltips: true
  },
  theme: {
    adaptiveMood: true,
    gradientIntensity: 1.4,
    themeVariants: ['glass', 'neon', 'dark', 'vibrant'],
    avatarGlow: true,
    dynamicBackground: true
  },
  debug: {
    logFrameDrops: false,
    traceSharedValues: false
  }
} as const

