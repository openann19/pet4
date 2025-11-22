<!-- 3c081ab1-e614-4d49-9931-a10e4c722683 df083f9f-bd8b-4e5f-afb0-1c3beb67335f -->
# Remove All Cheats and Implement Professional Standards

## Overview

This plan identifies and fixes all ESLint disable comments, TypeScript hacks (`as any`, `as unknown as`), unsafe type assertions, `require()` workarounds, and implements proper type-safe solutions following strict TypeScript and ESLint standards.

## Phase 1: Fix Optional Dependency Loading (Remove `require()` Hacks)

### 1.1 Replace `require()` with Proper Dynamic Imports

**Files to Fix:**

- `apps/mobile/src/effects/chat/core/haptic-manager.ts` (lines 33, 42)
- `apps/mobile/src/effects/chat/core/reduced-motion.ts` (line 18)
- `packages/motion/src/reduced-motion.ts` (line 18)
- `packages/motion/src/recipes/haptic.ts` (line 15)
- `packages/motion/src/recipes/useMagnetic.ts` (line 16)
- `apps/web/src/lib/kyc-native.ts` (line 10)
- `apps/web/src/effects/sound/SendPing.ts` (line 19)
- `apps/mobile/src/utils/offline-cache.ts` (line 65)
- `apps/mobile/src/screens/FeedScreen.tsx` (line 163)
- `apps/mobile/src/effects/chat/core/performance.ts` (line 40)
- `apps/native/src/components/chat/VoiceRecorder.tsx` (line 67)
- `apps/native/src/components/call/VideoQualitySettings.tsx` (line 78)

**Solution:**

- Create typed dynamic import utilities with proper type guards
- Replace `require()` with `import()` and handle errors properly
- Add proper type definitions for optional dependencies
- Remove eslint-disable comments by fixing the root cause

**Implementation:**

```typescript
// Create: apps/mobile/src/utils/optional-imports.ts
export async function importOptional<T>(
  modulePath: string,
  typeGuard?: (module: unknown) => module is T
): Promise<T | null> {
  try {
    const module = await import(modulePath)
    const defaultExport = module.default ?? module
    if (typeGuard) {
      return typeGuard(defaultExport) ? defaultExport : null
    }
    return defaultExport as T
  } catch {
    return null
  }
}
```

## Phase 2: Fix Type Safety Violations

### 2.1 Fix `as any` Type Assertions

**Files to Fix:**

- `apps/mobile/src/utils/offline-cache.ts` (line 77) - MMKV type assertion
- `packages/shared/src/config/feature-flags.ts` (line 13) - `globalThis.process` access

**Solution:**

- Create proper MMKV type definitions
- Create type-safe environment variable access utility
- Remove all `as any` assertions

**Implementation:**

```typescript
// Create: apps/mobile/src/types/mmkv.d.ts
export interface MMKVInstance {
  set: (key: string, value: string) => void
  getString: (key: string) => string | undefined
  delete: (key: string) => void
  clearAll: () => void
  contains: (key: string) => boolean
  getAllKeys: () => string[]
}

export interface MMKVConstructor {
  new (config: { id: string; encryptionKey: string }): MMKVInstance
}

// Fix: apps/mobile/src/utils/offline-cache.ts
// Replace `as any` with proper type guard and typed import
```

### 2.2 Fix `as unknown as` Type Assertions

**Files to Fix:**

- `apps/web/src/components/chat/LiquidDots.tsx` (line 108)
- `apps/web/src/components/chat/window/LiveRegions.tsx` (line 161)
- `apps/web/src/lib/pwa/service-worker-registration.ts` (line 100)
- `apps/web/src/lib/optimization-core.ts` (line 234)
- `apps/web/src/lib/backend-services.ts` (line 330)
- `apps/web/src/lib/advanced-features.ts` (lines 183, 220, 330)
- `apps/web/src/hooks/useDebounce.ts` (line 34)
- `apps/web/src/core/services/media/video-engine.ts` (lines 62, 124)

**Solution:**

- Create proper type definitions for extended interfaces
- Use type guards instead of assertions
- Create utility types for window extensions
- Fix React Native Reanimated style type compatibility

**Implementation:**

```typescript
// Create: apps/web/src/types/window-extensions.d.ts
interface WindowWithNavigator extends Window {
  navigator: Navigator & {
    standalone?: boolean
    getBattery?: () => Promise<BatteryManager>
  }
}

// Create: apps/web/src/types/video-extensions.d.ts
interface HTMLVideoElementWithRVFC extends HTMLVideoElement {
  requestVideoFrameCallback?: (callback: () => void) => number
  cancelVideoFrameCallback?: (id: number) => void
}
```

### 2.3 Fix Unsafe Type Assertions in Tests

**Files to Fix:**

- `apps/web/src/lib/__tests__/realtime-events.test.ts` (lines 36, 50)
- `apps/web/src/components/auth/__tests__/SignInForm.test.tsx` (line 58)
- `apps/web/src/components/auth/__tests__/SignUpForm.test.tsx` (lines 60, 74, 205)
- `apps/web/src/lib/__tests__/purchase-service.test.tsx` (line 53)

**Solution:**

- Create proper test utilities with typed mocks
- Use `vi.mocked()` for type-safe mocking
- Create factory functions for test data
- Remove `as any` from test files

## Phase 3: Fix React Hooks Dependency Arrays

### 3.1 Fix ESLint-disable for react-hooks/exhaustive-deps

**Files to Fix:**

- `apps/web/src/components/chat/LiquidDots.tsx` (lines 43, 56)
- `apps/web/src/components/notifications/NotificationBell.tsx` (line 140)
- `apps/native/src/screens/MapScreen.tsx` (line 125)
- `apps/mobile/src/components/chat/ReactionBurstParticles.native.tsx` (line 55)

**Solution:**

- Fix dependency arrays by adding missing dependencies
- Use `useCallback` and `useMemo` properly
- Extract stable references
- Remove eslint-disable comments

**Implementation:**

- `LiquidDots.tsx`: Add `t` to dependency array or extract animation setup
- `NotificationBell.tsx`: Fix empty dependency array
- `MapScreen.tsx`: Add proper dependencies
- `ReactionBurstParticles.native.tsx`: Fix hook usage outside component

## Phase 4: Fix Test Setup Files

### 4.1 Create Proper Typed Mocks

**Files to Fix:**

- `apps/web/src/test/setup.ts` (lines 216-258)
- `apps/mobile/src/test/setup.ts` (lines 18, 22)

**Solution:**

- Create typed mock classes that implement interfaces properly
- Remove eslint-disable for empty functions in mocks
- Use proper type definitions for mocks
- Create mock utilities module

**Implementation:**

```typescript
// Create: apps/web/src/test/mocks/match-media.ts
export function createMockMatchMedia(matches = false): MediaQueryList {
  return {
    media: '',
    matches,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as MediaQueryList
}
```

## Phase 5: Fix Console Usage

### 5.1 Verify Logger Implementation

**Files to Review:**

- `apps/web/src/lib/logger.ts` (lines 92-98)
- `apps/mobile/src/test/setup.ts` (lines 19, 23)

**Solution:**

- Logger.ts is acceptable (it's the logging infrastructure)
- Test setup console.error is acceptable for error handling
- Verify no console.* in production code paths

## Phase 6: Fix Script Files

### 6.1 Fix Type Safety in Scripts

**Files to Fix:**

- `apps/web/scripts/check-i18n-lengths.ts` (lines 143-150)

**Solution:**

- Add proper type definitions for i18n modules
- Use type guards instead of eslint-disable
- Create typed import utilities

## Phase 7: Remove Unused Variables

### 7.1 Fix Unused Variable Warnings

**Files to Fix:**

- `apps/web/src/components/stories/CreateStoryDialog.tsx` (lines 56, 77)
- `apps/mobile/src/utils/performance-budget.ts` (line 181)

**Solution:**

- Remove unused variables or prefix with underscore
- Use proper destructuring
- Remove eslint-disable comments

## Phase 8: Create Type Definitions

### 8.1 Create Missing Type Definitions

**New Files to Create:**

- `apps/mobile/src/types/mmkv.d.ts` - MMKV type definitions
- `apps/web/src/types/window-extensions.d.ts` - Window extension types
- `apps/web/src/types/video-extensions.d.ts` - Video element extensions
- `apps/mobile/src/utils/optional-imports.ts` - Optional import utility
- `apps/web/src/test/mocks/` - Typed mock utilities
- `packages/shared/src/types/process.d.ts` - Process type definitions

## Phase 9: Update ESLint Configuration

### 9.1 Stricter ESLint Rules

**Changes:**

- Disallow `eslint-disable` without justification
- Require `@typescript-eslint/no-explicit-any` error level
- Require `@typescript-eslint/no-unsafe-*` rules
- Add rule to prevent `as any` and `as unknown as`

## Phase 10: Verification

### 10.1 Run All Checks

**Commands:**

```bash
# Type check
pnpm tsc --noEmit

# Lint check
pnpm eslint . --max-warnings 0

# Test coverage
pnpm test:cov

# Build verification
pnpm build
```

## Deliverables

1. **Zero ESLint disable comments** in production code (except test setup mocks)
2. **Zero `as any` type assertions** in production code
3. **Zero `as unknown as` unsafe casts** (replaced with proper types)
4. **Zero `require()` calls** (replaced with dynamic imports)
5. **Proper type definitions** for all optional dependencies
6. **Fixed React hooks dependency arrays**
7. **Typed mock utilities** for tests
8. **Strict ESLint configuration** enforcement

## Files Summary

**Files to Modify:** ~25 files

**New Files to Create:** ~8 files

**ESLint Disable Comments to Remove:** ~20 instances

**Type Assertions to Fix:** ~15 instances

**Require() Calls to Replace:** ~12 instances

## Success Criteria

- ✅ Zero TypeScript errors
- ✅ Zero ESLint warnings
- ✅ All tests pass
- ✅ Build succeeds
- ✅ No `as any` in production code
- ✅ No `require()` in production code
- ✅ All optional dependencies properly typed
- ✅ All hooks have correct dependency arrays