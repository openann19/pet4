<!-- f9a8c86e-3184-4290-b38d-40c16176e1a8 8d17c7e0-1aa9-4cda-8cb4-7d64bb7e8427 -->
# Web App TypeScript Error Fixes

## Current State

- ~1686 TypeScript errors
- Main issues:
  - 403 instances of `MotionView`/`MotionText` usage (need replacement)
  - 61 unused `motion` imports from `@petspark/motion`
  - Missing return types on functions
  - Unused variables (TS6133)
  - Floating promises
  - Console statements in scripts
  - exactOptionalPropertyTypes issues (TS2375)
  - Type mismatches and missing properties

## Strategy

### Phase 1: Replace MotionView/MotionText (403 errors)

**Files affected**: 95+ files using `@petspark/motion`

**Approach**:

1. Replace `MotionView` with `AnimatedView` from `@/effects/reanimated/animated-view`
2. Replace `MotionText` with regular text elements wrapped in `AnimatedView` or styled divs
3. Replace `Presence` component with `useAnimatePresence` hook from `@/effects/reanimated/use-animate-presence`
4. Update animation props to use Reanimated hooks (`useAnimatedStyle`, `withSpring`, `withTiming`)
5. Remove unused `motion` imports

**Key files to fix**:

- `src/components/DiscoverMapMode.tsx`
- `src/components/DiscoveryFilters.tsx`
- `src/components/DismissibleOverlay.tsx`
- `src/components/PetPhotoAnalyzer.tsx`
- `src/components/GenerateProfilesButton.tsx`
- `src/components/PetProfileTemplatesDialog.tsx`
- `src/components/MatchCelebration.tsx`
- And 88+ more files

**Pattern**:

```typescript
// Before
import { motion, Presence } from '@petspark/motion';
<Presence>
  {condition && (
    <MotionView
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
    >
      Content
    </MotionView>
  )}
</Presence>

// After
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useAnimatePresence } from '@/effects/reanimated/use-animate-presence';
const presence = useAnimatePresence({ isVisible: condition });
{presence.shouldRender && (
  <AnimatedView style={presence.animatedStyle}>
    Content
  </AnimatedView>
)}
```

### Phase 2: Fix Missing Return Types

**Files affected**: 1304+ exported functions

**Approach**:

1. Add explicit return types to all exported functions
2. Focus on hooks, API functions, and utility functions first
3. Use TypeScript's inferred types where appropriate but make explicit for public APIs

**Key files**:

- `src/hooks/useMatching.ts`
- `src/hooks/useEntitlements.ts`
- `src/hooks/useStorage.ts`
- `src/lib/backend-services.ts`
- All files in `src/api/`
- All files in `src/hooks/`

### Phase 3: Fix Unused Variables & Imports (TS6133)

**Approach**:

1. Remove unused variables or prefix with `_` if intentionally unused
2. Remove unused imports
3. Fix unused parameters in callbacks

**Examples**:

- `src/components/CreatePetDialog.tsx` - unused animation hooks (lines 93-96)
- `src/components/DiscoverMapMode.tsx` - unused `motion` import
- Many files with unused `idx` parameters in map functions

### Phase 4: Fix exactOptionalPropertyTypes Issues (TS2375)

**Approach**:

1. Add `| undefined` to optional properties where `undefined` is explicitly assigned
2. Use `OptionalWithUndef<T>` for update operations in strict folders
3. Fix prop type mismatches

**Key files**:

- `src/components/ChatWindowNew.tsx` - `AnnounceNewMessageProps` issue
- API types that need strict optional semantics

### Phase 5: Fix Floating Promises

**Approach**:

1. Add `void` for fire-and-forget promises
2. Add `await` for promises that need to complete
3. Add error handling where appropriate

**Pattern**:

```typescript
// Before
someAsyncFunction();

// After
void someAsyncFunction(); // Fire-and-forget
// OR
await someAsyncFunction(); // Needs completion
// OR
someAsyncFunction().catch(error => {
  logger.error('Failed', error);
});
```

### Phase 6: Remove Console Statements

**Files affected**: Script files and test files

**Approach**:

1. Replace `console.log/warn/error` with `logger` from `@/lib/logger`
2. Remove console statements from production code
3. Keep console in test files if needed for debugging

**Files**:

- `scripts/performance/validate-performance.ts`
- Other scripts in `scripts/` directory

### Phase 7: Fix Type Mismatches

**Approach**:

1. Fix `UseHoverLiftReturn` interface - add missing `handleHover` and `buttonStyle` properties
2. Fix `UseAnimatePresenceReturn` - add `isVisible` property or update usage
3. Fix `TimingConfig` - remove invalid `delay` property
4. Fix icon type mismatches
5. Fix element type mismatches (HTMLElement vs Element)

**Key fixes**:

- `src/components/CreatePetDialog.tsx` - `UseHoverLiftReturn` missing properties
- `src/components/MatchCelebration.tsx` - `UseAnimatePresence` usage
- `src/components/EnhancedVisuals.tsx` - `TimingConfig` with `delay`
- `src/lib/notifications.ts` - ToastOptions type issue

### Phase 8: Fix Remaining Issues

**Approach**:

1. Fix read-only property assignments
2. Fix argument count mismatches
3. Fix component prop type mismatches
4. Fix any remaining `any` types

## Implementation Order

1. **Phase 1** - Replace MotionView (highest impact, 403 errors)
2. **Phase 3** - Fix unused variables (quick wins, improves code quality)
3. **Phase 7** - Fix type mismatches (blocks other fixes)
4. **Phase 4** - Fix exactOptionalPropertyTypes (type safety)
5. **Phase 2** - Add return types (comprehensive but straightforward)
6. **Phase 5** - Fix floating promises (async safety)
7. **Phase 6** - Remove console statements (code quality)
8. **Phase 8** - Fix remaining issues (final cleanup)

## Validation

After each phase:

1. Run `pnpm tsc --noEmit` to check error count
2. Run `pnpm eslint .` to check lint errors
3. Verify no regressions in functionality
4. Run tests to ensure nothing broke

## Success Criteria

- Zero TypeScript errors (`tsc --noEmit` passes)
- Zero ESLint warnings
- All tests pass
- No console statements in production code
- All functions have explicit return types
- No `any` types (except in type guards)
- All animations use Reanimated hooks/AnimatedView

### To-dos

- [ ] Replace all MotionView/MotionText usage with AnimatedView and useAnimatePresence hook (403 errors across 95+ files)
- [ ] Add explicit return types to all exported functions (1304+ functions)
- [ ] Fix unused variables and imports - remove or prefix with '_' (TS6133 errors)
- [ ] Fix exactOptionalPropertyTypes issues - add | undefined where needed (TS2375 errors)
- [ ] Fix floating promises - add void/await/error handling
- [ ] Remove console statements and replace with logger
- [ ] Fix type mismatches - UseHoverLiftReturn, UseAnimatePresence, TimingConfig, icon types
- [ ] Fix remaining issues - read-only properties, argument counts, component props
- [ ] Run full validation - tsc, eslint, tests - ensure zero errors