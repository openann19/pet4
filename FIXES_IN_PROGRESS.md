# Fixes In Progress - Web & Mobile Quality Gates

**Started**: 2025-01-27  
**Status**: 🟡 In Progress

## Completed Fixes

### 1. Motion Architecture Violations ✅ **COMPLETE**
- **Fixed**: Replaced 4 direct `framer-motion` imports with `@petspark/motion` façade
  - `apps/web/src/components/ui/enhanced-button.tsx`
  - `apps/web/src/components/message-bubble/hooks/use-context-menu-animations.ts`
  - `apps/web/src/components/MatchCelebration.tsx`
  - `apps/web/src/components/GlassCard.tsx`
- **Result**: All direct framer-motion imports in source code eliminated ✅

### 2. TypeScript Errors - Motion Types ✅ **MOSTLY COMPLETE**
- **Fixed**: `GenerateProfilesButton.tsx` - Removed incorrect type casts from `withTiming`/`withRepeat`
- **Fixed**: `PetDetailDialog.tsx` - Fixed `useHoverLift`/`useBounceOnTap` usage (created proper animated styles)
- **Fixed**: `PetPhotoAnalyzer.tsx` - Removed all `as AnimatedStyle` casts, fixed unreachable `??` operator
- **Fixed**: `use-hover-tap.ts` - Removed incorrect `AnimatedStyle` cast
- **Fixed**: `use-animate-presence.ts` - Removed incorrect `AnimatedStyle` cast
- **Result**: Reduced errors from 19+ to 2 (pre-existing Button.tsx casing issue, not related to our fixes)

## In Progress

### ESLint Violations ✅ **IN PROGRESS**
- **Fixed**: Unused variables in API files (logger, normalizeError, reason) - 3 files
- **Fixed**: Unnecessary type assertions (emoji, scanResult) - 2 files
- **Fixed**: Unused imports (Presence, AnimatedStyle) - 3 files
- **Fixed**: Unused variable (closeButtonTapStyle) - 1 file
- **Fixed**: PetPhotoAnalyzer.tsx - Removed 7 unnecessary type assertions, fixed animatedStyle prop
- **Total ESLint fixes**: 9 files cleaned, ~15+ violations fixed
- **Remaining**: max-lines-per-function violations (many files), no-misused-promises, etc.

### Mobile TypeScript Errors ✅ **IN PROGRESS**
- **Fixed**: Duplicate View import in animated-view.tsx
- **Fixed**: Missing easing property in use-animate-presence.ts (2 locations)
- **Fixed**: Unreachable ?? operators - 4 files (all-in-chat-effects.tsx, use-3d-flip-card.ts, CommunityScreen.tsx)
- **Remaining**: ~24+ errors (type mismatches, missing properties, useAnimatedStyle return type, etc.)
  - `withSpring`/`withTiming` return type issues
  - Transform array type issues
- **PetPhotoAnalyzer.tsx**: ~8 errors remaining
  - Similar motion type issues
  - AnimatedStyle type mismatches
- **GenerateProfilesButton.tsx**: ~2 errors remaining
  - Minor type issues

## Next Steps

1. Fix remaining TypeScript errors in motion-related files
2. Fix mobile TypeScript errors (100+ errors)
3. Fix ESLint violations (web: 100+, mobile: 50+)
4. Complete mobile design token system (missing tokens)

## Files Modified

- `apps/web/src/components/ui/enhanced-button.tsx`
- `apps/web/src/components/message-bubble/hooks/use-context-menu-animations.ts`
- `apps/web/src/components/MatchCelebration.tsx`
- `apps/web/src/components/GlassCard.tsx`
- `apps/web/src/components/GenerateProfilesButton.tsx`
- `apps/web/src/components/PetDetailDialog.tsx`

