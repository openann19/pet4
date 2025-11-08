# File Removal Plan

**Generated:** 2025-11-06T21:09:12.779Z

## Summary

- **Documentation files to remove:** 48
- **Source files to review:** 1111
- **Workspaces with unused dependencies:** 1

## Documentation Files (Safe to Remove)

These are duplicate or outdated documentation files:

- `apps/web/docs/MIGRATION_CHECKLIST.md`
  - Reason: Similar content and size
  - Duplicate of: `packages/shared/README.md`

- `PRODUCTION_CONSOLE_ELIMINATION_COMPLETE.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `PRODUCTION_READINESS_STATUS.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/PRODUCTION_FIXES_SUMMARY.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/mobile/EXPO_FIXES.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/mobile/IMPLEMENTATION_COMPLETE.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/mobile/MICRO_INTERACTIONS_IMPLEMENTATION.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/mobile/ULTRA_ENHANCED_IMPLEMENTATION.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/mobile/ULTRA_ENHANCED_IMPLEMENTATION_STATUS.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/AUDIT_SUMMARY.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/BUSINESS_CORE_IMPLEMENTATION.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/BUTTON_VISIBILITY_COMPLETE.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/BUTTON_VISIBILITY_FIXES.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/COMMUNITY_FEATURES_SUMMARY.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/COMMUNITY_IMPLEMENTATION_STATUS.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/CONSOLIDATION_SUMMARY.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/CONTINUATION_SUMMARY.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/DESIGN_SYSTEM_IMPLEMENTATION.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/EFFECTS_MIGRATION.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/ENHANCEMENT_SUMMARY.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/FEATURE_IMPLEMENTATION_SUMMARY.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/FEATURE_PACK_IMPLEMENTATION.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/FINAL_SUMMARY.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/IMPLEMENTATION_COMPLETE.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/IMPLEMENTATION_SUMMARY.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/ITERATION_134_COMPLETE.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/ITERATION_134_STATUS.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/ITERATION_135_SUMMARY.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/ITERATION_25_SUMMARY.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/ITERATION_SUMMARY.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/MIGRATION_PROGRESS.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/MIGRATION_PROGRESS_REANIMATED.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/MIGRATION_VERIFICATION_REPORT.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/MOBILE_POLISH_SUMMARY.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/MOBILE_STORE_READINESS_IMPLEMENTATION.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/OPTIMIZATION_SUMMARY.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/REAL_IMPLEMENTATION_SUMMARY.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/REFACTORING_COMPLETE.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/REFACTORING_SUMMARY.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/STRICT_OPTIONALS_MIGRATION.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/TYPING_INDICATOR_IMPLEMENTATION.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/UI_UPSCALE_SUMMARY.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/VISUAL_FIXES_UPSCALE.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/android-design-tokens/COMPLETE.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/android-design-tokens/COMPONENTS_IMPLEMENTATION.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/android-design-tokens/DELIVERABLES_SUMMARY.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/android-design-tokens/FINAL_SUMMARY.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

- `apps/web/android-design-tokens/IMPLEMENTATION_SUMMARY.md`
  - Reason: Status/migration doc in non-docs directory or outdated date

## Source Files (Review Before Removing)

These source files appear unused but need manual review:

- `design-system/ThemeProvider.tsx` (apps/web)
  - Reason: No imports found

- `design-system/themes.ts` (apps/web)
  - Reason: No imports found

- `scripts/e2e-walkthrough.ts` (apps/web)
  - Reason: No imports found

- `src/ErrorFallback.tsx` (apps/web)
  - Reason: No imports found

- `src/api/admin-api.ts` (apps/web)
  - Reason: No imports found

- `src/api/adoption-api-strict.ts` (apps/web)
  - Reason: No imports found

- `src/api/adoption-api.ts` (apps/web)
  - Reason: No imports found

- `src/api/analytics-api.ts` (apps/web)
  - Reason: No imports found

- `src/api/api-config-api.ts` (apps/web)
  - Reason: No imports found

- `src/api/auth-api.ts` (apps/web)
  - Reason: No imports found

- `src/api/chat-api.ts` (apps/web)
  - Reason: No imports found

- `src/api/community-api-client.ts` (apps/web)
  - Reason: No imports found

- `src/api/community-api.ts` (apps/web)
  - Reason: No imports found

- `src/api/feature-flags-api.ts` (apps/web)
  - Reason: No imports found

- `src/api/image-upload-api.ts` (apps/web)
  - Reason: No imports found

- `src/api/kyc-api.ts` (apps/web)
  - Reason: No imports found

- `src/api/live-streaming-api.ts` (apps/web)
  - Reason: No imports found

- `src/api/llm-api.ts` (apps/web)
  - Reason: No imports found

- `src/api/lost-found-api.ts` (apps/web)
  - Reason: No imports found

- `src/api/matching-api-strict.ts` (apps/web)
  - Reason: No imports found

- `src/api/matching-api.ts` (apps/web)
  - Reason: No imports found

- `src/api/notifications-api.ts` (apps/web)
  - Reason: No imports found

- `src/api/payments-api.ts` (apps/web)
  - Reason: No imports found

- `src/api/photo-moderation-api.ts` (apps/web)
  - Reason: No imports found

- `src/api/rate-limiting-api.ts` (apps/web)
  - Reason: No imports found

- `src/api/streaming-api.ts` (apps/web)
  - Reason: No imports found

- `src/api/support-api.ts` (apps/web)
  - Reason: No imports found

- `src/api/types.ts` (apps/web)
  - Reason: No imports found

- `src/api/verification-api.ts` (apps/web)
  - Reason: No imports found

- `src/components/AdminConsole.tsx` (apps/web)
  - Reason: No imports found

... and 70 more files

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
