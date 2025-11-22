<!-- b7ba92da-2de5-4764-a60a-34f1e9b74a44 05286ca7-924e-49bc-94cd-8e4ec6696c0d -->
# Fix TypeScript Errors in Reanimated Hooks

## Current State

- 2 TypeScript errors in `packages/motion/src/recipes/useNavButtonAnimation.ts`
- Type mismatches between `AnimatedStyle` and `DefaultStyle`
- Platform-specific width handling (number vs string) causing type issues
- Minimal type definitions in `packages/motion/src/react-native-reanimated.d.ts` using `any` types

## Root Causes

1. **Incomplete Type Definitions**: The motion package uses minimal type declarations with `any` types instead of proper Reanimated types
2. **Platform-Specific Types**: Web vs React Native style types are incompatible (e.g., `width: number | string`)
3. **Type Assertion Issues**: `useAnimatedStyle` return types don't match expected `AnimatedStyle` type
4. **Missing Type Guards**: No proper type guards for platform-specific style properties

## Implementation Plan

### Phase 1: Fix Type Definitions (packages/motion)

1. **Update `packages/motion/src/react-native-reanimated.d.ts`**

- Replace `any` types with proper TypeScript types
- Add platform-aware type definitions for styles
- Define proper `AnimatedStyle` type that works for both web and React Native
- Add `DefaultStyle` type that's compatible with both platforms

2. **Create Platform-Aware Style Types**

- Create `StyleValue` type that handles `number | string` for width/height
- Create platform-specific type guards
- Ensure compatibility with React Native's `DimensionValue` type

### Phase 2: Fix Current Errors

3. **Fix `useNavButtonAnimation.ts`**

- Fix `indicatorStyle` to return proper type for `AnimatedStyle`
- Use platform-aware width handling with proper types
- Add type assertions where necessary (with proper type guards)
- Ensure return type matches `UseNavButtonAnimationReturn` interface

4. **Fix Type Assertions**

- Replace `as AnimatedStyle` with proper type guards
- Use conditional types for platform-specific style properties
- Ensure all `useAnimatedStyle` calls return compatible types

### Phase 3: Audit and Fix All Reanimated Hooks

5. **Audit All Reanimated Hooks**

- Scan all files in `apps/web/src/effects/reanimated/`
- Scan all files in `apps/mobile/src/effects/reanimated/`
- Scan all files in `packages/motion/src/recipes/`
- Identify patterns of type errors

6. **Fix Common Patterns**

- Fix `AnimatedStyle` type mismatches
- Fix `SharedValue` type issues
- Fix platform-specific style property types
- Add proper type guards for animated values

### Phase 4: Establish Type Safety Patterns

7. **Create Type Utilities**

- Create `PlatformStyle` type utility
- Create `AnimatedStyleOf<T>` type utility
- Create type guards for SharedValues
- Document type patterns in README

8. **Update Documentation**

- Document proper type patterns for Reanimated hooks
- Add examples of platform-aware style handling
- Create migration guide for fixing type errors

## Files to Modify

### Core Type Definitions

- `packages/motion/src/react-native-reanimated.d.ts` - Improve type definitions
- `packages/motion/src/types/` - Create type utilities (new directory)

### Hook Files with Errors

- `packages/motion/src/recipes/useNavButtonAnimation.ts` - Fix current errors
- (Additional files to be identified during audit)

### Documentation

- `packages/motion/README.md` - Document type patterns

## Acceptance Criteria

1. **Type Safety**

- `pnpm typecheck` passes with 0 errors in `packages/motion`
- All Reanimated hooks have proper type definitions
- No `any` types in Reanimated-related code

2. **Platform Compatibility**

- Types work correctly for both web and React Native
- Platform-specific style properties are properly typed
- No type assertions that bypass type checking

3. **Code Quality**

- All type errors are fixed with proper solutions (no hacks)
- Type definitions are consistent across all hooks
- Documentation explains type patterns

## Risk Mitigation

1. **Incremental Fixes**: Fix errors one file at a time to avoid breaking changes
2. **Type Testing**: Ensure types work correctly in both web and mobile contexts
3. **Backward Compatibility**: Maintain compatibility with existing hook usage
4. **Documentation**: Document type patterns to prevent future errors

## Notes

- The motion package is platform-agnostic, so type definitions must work for both web and React Native
- Some type errors may require runtime type guards for platform detection
- Type definitions should leverage TypeScript's conditional types for platform-specific handling

### To-dos

- [ ] Update packages/motion/src/react-native-reanimated.d.ts with proper TypeScript types instead of any
- [ ] Create platform-aware type utilities in packages/motion/src/types/ for StyleValue and AnimatedStyle
- [ ] Fix TypeScript errors in packages/motion/src/recipes/useNavButtonAnimation.ts
- [ ] Audit all Reanimated hooks in apps/web, apps/mobile, and packages/motion for type errors
- [ ] Fix common type error patterns across all Reanimated hooks
- [ ] Update documentation with type patterns and migration guide