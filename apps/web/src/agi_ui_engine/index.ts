/**
 * 🚀 AGI UI ENGINE – FULL EFFECTS LIST
 *
 * This is the ultimate UI enhancement layer for all chat, input, and interface visuals.
 * All effects are Reanimated v3, Skia, and Framer Motion compatible.
 * Ready for Web + Mobile, GPU-accelerated, emotion-focused, smooth, and performant.
 */

// Config
export * from './config/ABSOLUTE_MAX_UI_MODE';
export type {
  AbsoluteMaxUIModeConfig,
  VisualConfig,
  AnimationConfig,
  PerformanceConfig,
  FeedbackConfig,
  ThemeConfig,
  DebugConfig,
  SpringPhysics,
  HapticStrength,
  TapFeedback,
  ThemeVariant,
} from './config/ABSOLUTE_MAX_UI_MODE';

// 💬 Message Effects
export * from './effects/useAIReplyAura';
export type { UseAIReplyAuraReturn } from './effects/useAIReplyAura';

export * from './effects/useTypingTrail';
export type { UseTypingTrailReturn } from './effects/useTypingTrail';

export * from './effects/useBubbleGlow';
export type { UseBubbleGlowOptions, UseBubbleGlowReturn } from './effects/useBubbleGlow';

export * from './effects/useDeleteBurst';
export type { UseDeleteBurstOptions, UseDeleteBurstReturn } from './effects/useDeleteBurst';

export * from './effects/useReactionParticleTrail';
export type {
  UseReactionParticleTrailOptions,
  UseReactionParticleTrailReturn,
} from './effects/useReactionParticleTrail';

export * from './effects/useMessageShimmer';
export type {
  UseMessageShimmerOptions,
  UseMessageShimmerReturn,
} from './effects/useMessageShimmer';

export * from './effects/useMoodColorTheme';
export type {
  UseMoodColorThemeOptions,
  UseMoodColorThemeReturn,
} from './effects/useMoodColorTheme';

// 🎨 Visual Layers
export * from './effects/useGlassBackground';
export type {
  UseGlassBackgroundOptions,
  UseGlassBackgroundReturn,
} from './effects/useGlassBackground';

export * from './effects/use3DTiltEffect';
export type { Use3DTiltEffectOptions, Use3DTiltEffectReturn } from './effects/use3DTiltEffect';

export * from './effects/useDynamicBackgroundMesh';
export type {
  UseDynamicBackgroundMeshOptions,
  UseDynamicBackgroundMeshReturn,
} from './effects/useDynamicBackgroundMesh';

// 🔊 Feedback Systems
export { useHapticFeedback } from '@/components/chat/bubble-wrapper-god-tier/effects/useHapticFeedback';
export type {
  UseHapticFeedbackOptions,
  UseHapticFeedbackReturn,
  HapticAction,
} from '@/components/chat/bubble-wrapper-god-tier/effects/useHapticFeedback';

export * from './effects/useSoundFeedback';
export type { UseSoundFeedbackOptions, UseSoundFeedbackReturn } from './effects/useSoundFeedback';

// 🧠 Emotion-Based Logic
export * from './effects/useSentimentMoodEngine';
export type {
  UseSentimentMoodEngineOptions,
  UseSentimentMoodEngineReturn,
  MoodResult,
} from './effects/useSentimentMoodEngine';

export * from './effects/useAdaptiveBubbleShape';
export type {
  UseAdaptiveBubbleShapeOptions,
  UseAdaptiveBubbleShapeReturn,
} from './effects/useAdaptiveBubbleShape';

// 🌀 Particle FX (Global)
export * from './effects/useParticleBurstOnSend';
export type {
  UseParticleBurstOnSendOptions,
  UseParticleBurstOnSendReturn,
} from './effects/useParticleBurstOnSend';

export * from './effects/useParticleBurstOnDelete';
export type {
  UseParticleBurstOnDeleteOptions,
  UseParticleBurstOnDeleteReturn,
} from './effects/useParticleBurstOnDelete';

export * from './effects/useEmojiTrail';
export type { UseEmojiTrailOptions, UseEmojiTrailReturn } from './effects/useEmojiTrail';

// Legacy exports (for backward compatibility)
export * from './effects/useParticleFX';
export type { UseParticleFXOptions, UseParticleFXReturn, Particle } from './effects/useParticleFX';

export * from './effects/useMoodTheme';
export type { UseMoodThemeOptions, UseMoodThemeReturn } from './effects/useMoodTheme';
