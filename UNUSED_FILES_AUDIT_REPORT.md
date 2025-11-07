# Unused Files Audit Report

**Generated:** 2025-11-06T21:08:36.996Z

## Summary

- **Orphaned Files:** 1197
- **Dead Code Exports:** 1125
- **Duplicate/Outdated Docs:** 48
- **Unused Dependencies:** 22

## Orphaned Files (1197)

Files that are never imported anywhere:

- `../../packages/motion/src/reduced-motion.ts` (apps/web) - No imports found
- `../../packages/motion/src/tokens.ts` (apps/web) - No imports found
- `../../packages/motion/src/usePerfBudget.ts` (apps/web) - No imports found
- `../../packages/shared/src/motion.ts` (apps/web) - No imports found
- `../../packages/shared/src/rng.ts` (apps/web) - No imports found
- `../../packages/chat-core/src/useOutbox.ts` (apps/web) - No imports found
- `../../packages/config/src/feature-flags.ts` (apps/web) - No imports found
- `design-system/ThemeProvider.tsx` (apps/web) - No imports found
- `design-system/themes.ts` (apps/web) - No imports found
- `scripts/e2e-walkthrough.ts` (apps/web) - No imports found
- `src/ErrorFallback.tsx` (apps/web) - No imports found
- `../../packages/motion/src/primitives/MotionScrollView.tsx` (apps/web) - No imports found
- `../../packages/motion/src/primitives/MotionText.tsx` (apps/web) - No imports found
- `../../packages/motion/src/primitives/MotionView.tsx` (apps/web) - No imports found
- `../../packages/motion/src/recipes/haptic.ts` (apps/web) - No imports found
- `../../packages/motion/src/recipes/useHoverLift.ts` (apps/web) - No imports found
- `../../packages/motion/src/recipes/useMagnetic.ts` (apps/web) - No imports found
- `../../packages/motion/src/recipes/useParallax.ts` (apps/web) - No imports found
- `../../packages/motion/src/recipes/usePressBounce.ts` (apps/web) - No imports found
- `../../packages/motion/src/recipes/useRipple.ts` (apps/web) - No imports found
- `../../packages/motion/src/recipes/useShimmer.ts` (apps/web) - No imports found
- `../../packages/motion/src/transitions/presence.tsx` (apps/web) - No imports found
- `../../packages/shared/src/device/quality.ts` (apps/web) - No imports found
- `../../packages/shared/src/geo/kalman.ts` (apps/web) - No imports found
- `../../packages/shared/src/storage/StorageAdapter.ts` (apps/web) - No imports found
- `../../packages/shared/src/types/admin.ts` (apps/web) - No imports found
- `../../packages/shared/src/types/pet-types.ts` (apps/web) - No imports found
- `../../packages/shared/src/types/stories-types.ts` (apps/web) - No imports found
- `../../packages/shared/src/utils/stories-utils.ts` (apps/web) - No imports found
- `../../packages/shared/src/utils/utils.ts` (apps/web) - No imports found
- `src/api/admin-api.ts` (apps/web) - No imports found
- `src/api/adoption-api-strict.ts` (apps/web) - No imports found
- `src/api/adoption-api.ts` (apps/web) - No imports found
- `src/api/analytics-api.ts` (apps/web) - No imports found
- `src/api/api-config-api.ts` (apps/web) - No imports found
- `src/api/auth-api.ts` (apps/web) - No imports found
- `src/api/chat-api.ts` (apps/web) - No imports found
- `src/api/community-api-client.ts` (apps/web) - No imports found
- `src/api/community-api.ts` (apps/web) - No imports found
- `src/api/feature-flags-api.ts` (apps/web) - No imports found
- `src/api/image-upload-api.ts` (apps/web) - No imports found
- `src/api/kyc-api.ts` (apps/web) - No imports found
- `src/api/live-streaming-api.ts` (apps/web) - No imports found
- `src/api/llm-api.ts` (apps/web) - No imports found
- `src/api/lost-found-api.ts` (apps/web) - No imports found
- `src/api/matching-api-strict.ts` (apps/web) - No imports found
- `src/api/matching-api.ts` (apps/web) - No imports found
- `src/api/notifications-api.ts` (apps/web) - No imports found
- `src/api/payments-api.ts` (apps/web) - No imports found
- `src/api/photo-moderation-api.ts` (apps/web) - No imports found

... and 1147 more

## Dead Code Exports (1125)

Unused exports detected by ts-prune:

- `playwright.config.ts:3`
  - default
- `vitest.config.ts:10`
  - default
- `home/ben/Public/PETSPARK/packages/chat-core/src/index.ts:2`
  - OutboxItem
- `home/ben/Public/PETSPARK/packages/config/src/index.ts:1`
  - loadFlags
- `home/ben/Public/PETSPARK/packages/config/src/index.ts:2`
  - Flags
- `design-system/ThemeProvider.tsx:14`
  - ThemeProvider
- `design-system/ThemeProvider.tsx:32`
  - useThemeSystem
- `design-system/themes.ts:27`
  - getThemeTokens
- `design-system/themes.ts:52`
  - designTokens
- `src/agi_ui_engine/index.ts:12`
  - AbsoluteMaxUIModeConfig
- `src/agi_ui_engine/index.ts:13`
  - VisualConfig
- `src/agi_ui_engine/index.ts:14`
  - AnimationConfig
- `src/agi_ui_engine/index.ts:15`
  - PerformanceConfig
- `src/agi_ui_engine/index.ts:16`
  - FeedbackConfig
- `src/agi_ui_engine/index.ts:17`
  - ThemeConfig
- `src/agi_ui_engine/index.ts:18`
  - DebugConfig
- `src/agi_ui_engine/index.ts:19`
  - SpringPhysics
- `src/agi_ui_engine/index.ts:20`
  - HapticStrength
- `src/agi_ui_engine/index.ts:21`
  - TapFeedback
- `src/agi_ui_engine/index.ts:22`
  - ThemeVariant
- `src/agi_ui_engine/index.ts:28`
  - UseAIReplyAuraReturn
- `src/agi_ui_engine/index.ts:33`
  - UseTypingTrailReturn
- `src/agi_ui_engine/index.ts:38`
  - UseBubbleGlowOptions
- `src/agi_ui_engine/index.ts:39`
  - UseBubbleGlowReturn
- `src/agi_ui_engine/index.ts:44`
  - UseDeleteBurstOptions
- `src/agi_ui_engine/index.ts:45`
  - UseDeleteBurstReturn
  - use3DTiltEffect
- `src/agi_ui_engine/index.ts:50`
  - UseReactionParticleTrailOptions
- `src/agi_ui_engine/index.ts:51`
  - UseReactionParticleTrailReturn
- `src/agi_ui_engine/index.ts:56`
  - UseMessageShimmerOptions
  - useMoodColorTheme
- `src/agi_ui_engine/index.ts:57`
  - UseMessageShimmerReturn

... and 923 more files

## Duplicate/Outdated Documentation (48)

- `apps/web/docs/MIGRATION_CHECKLIST.md` - Similar content and size (duplicate of `packages/shared/README.md`)
- `PRODUCTION_CONSOLE_ELIMINATION_COMPLETE.md` - Status/migration doc in non-docs directory or outdated date
- `PRODUCTION_READINESS_STATUS.md` - Status/migration doc in non-docs directory or outdated date
- `apps/PRODUCTION_FIXES_SUMMARY.md` - Status/migration doc in non-docs directory or outdated date
- `apps/mobile/EXPO_FIXES.md` - Status/migration doc in non-docs directory or outdated date
- `apps/mobile/IMPLEMENTATION_COMPLETE.md` - Status/migration doc in non-docs directory or outdated date
- `apps/mobile/MICRO_INTERACTIONS_IMPLEMENTATION.md` - Status/migration doc in non-docs directory or outdated date
- `apps/mobile/ULTRA_ENHANCED_IMPLEMENTATION.md` - Status/migration doc in non-docs directory or outdated date
- `apps/mobile/ULTRA_ENHANCED_IMPLEMENTATION_STATUS.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/AUDIT_SUMMARY.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/BUSINESS_CORE_IMPLEMENTATION.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/BUTTON_VISIBILITY_COMPLETE.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/BUTTON_VISIBILITY_FIXES.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/COMMUNITY_FEATURES_SUMMARY.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/COMMUNITY_IMPLEMENTATION_STATUS.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/CONSOLIDATION_SUMMARY.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/CONTINUATION_SUMMARY.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/DESIGN_SYSTEM_IMPLEMENTATION.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/EFFECTS_MIGRATION.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/ENHANCEMENT_SUMMARY.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/FEATURE_IMPLEMENTATION_SUMMARY.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/FEATURE_PACK_IMPLEMENTATION.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/FINAL_SUMMARY.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/IMPLEMENTATION_COMPLETE.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/IMPLEMENTATION_SUMMARY.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/ITERATION_134_COMPLETE.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/ITERATION_134_STATUS.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/ITERATION_135_SUMMARY.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/ITERATION_25_SUMMARY.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/ITERATION_SUMMARY.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/MIGRATION_PROGRESS.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/MIGRATION_PROGRESS_REANIMATED.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/MIGRATION_VERIFICATION_REPORT.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/MOBILE_POLISH_SUMMARY.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/MOBILE_STORE_READINESS_IMPLEMENTATION.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/OPTIMIZATION_SUMMARY.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/REAL_IMPLEMENTATION_SUMMARY.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/REFACTORING_COMPLETE.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/REFACTORING_SUMMARY.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/STRICT_OPTIONALS_MIGRATION.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/TYPING_INDICATOR_IMPLEMENTATION.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/UI_UPSCALE_SUMMARY.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/VISUAL_FIXES_UPSCALE.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/android-design-tokens/COMPLETE.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/android-design-tokens/COMPONENTS_IMPLEMENTATION.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/android-design-tokens/DELIVERABLES_SUMMARY.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/android-design-tokens/FINAL_SUMMARY.md` - Status/migration doc in non-docs directory or outdated date
- `apps/web/android-design-tokens/IMPLEMENTATION_SUMMARY.md` - Status/migration doc in non-docs directory or outdated date
## Unused Dependencies

### web

**Dependencies:**
- @ffmpeg/ffmpeg
- @heroicons/react
- @hookform/resolvers
- @radix-ui/colors
- @sentry/tracing
- @tailwindcss/container-queries
- @tensorflow/tfjs
- d3
- marked
- nsfwjs

**Dev Dependencies:**
- @size-limit/file
- @tailwindcss/postcss
- @types/lodash
- @vitest/coverage-v8
- c8
- fast-check
- postcss
- postcss-safe-parser
- pyright
- react-native-web
- stylelint-config-standard
- tailwindcss

