# 🚀 UI Audit & Production Readiness - Complete Workflow

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Workflow Phases](#workflow-phases)
4. [Step-by-Step Execution](#step-by-step-execution)
5. [Testing & Validation](#testing--validation)
6. [PR Workflow](#pr-workflow)
7. [Acceptance Criteria](#acceptance-criteria)
8. [Troubleshooting](#troubleshooting)
9. [Quick Reference](#quick-reference)

---

## Overview

This document provides a complete workflow for fixing all pages/screens/modules to meet production standards. The process ensures:

- ✅ **Quality**: Type safety, linting, testing
- ✅ **Performance**: Bundle size, Lighthouse scores, render times
- ✅ **Accessibility**: WCAG 2.1 AA compliance
- ✅ **Security**: XSS prevention, sanitization
- ✅ **Resilience**: Error boundaries, offline handling, retry logic
- ✅ **i18n**: English + Bulgarian translations
- ✅ **Standards**: No banned patterns, strict TypeScript

---

## Prerequisites

### Required Tools
```bash
# Verify installations
node --version    # v18+ required
pnpm --version    # v8+ required
git --version

# Required packages (already installed)
fast-glob         # For inventory generation
```

### Environment Setup
```bash
# Install dependencies
pnpm install

# Verify workspace structure
ls apps/web apps/mobile packages/
```

### Pre-flight Checks
```bash
# 1. Generate inventory
node tools/ui-audit/inventory.ts

# 2. Verify inventory files created
ls audit/inventory/

# 3. Check TypeScript config
cd apps/web && pnpm typecheck
cd apps/mobile && pnpm typecheck
```

---

## Workflow Phases

### Phase 1: Inventory & Discovery
**Goal**: Identify all routes, screens, and modules

**Steps**:
1. Run inventory script
2. Review generated JSON files
3. Prioritize screens/routes by usage

**Output**: `audit/inventory/{pages,screens,modules}.json`

### Phase 2: One-Time Setup
**Goal**: Establish foundation (error boundaries, config, sanitization)

**Status**: ✅ **COMPLETED**

**Files Created**:
- `tools/ui-audit/inventory.ts`
- `packages/config/src/legal.ts`
- `apps/web/src/lib/safeText.ts`
- `apps/mobile/src/components/RouteErrorBoundary.tsx`
- ESLint rules enhanced

### Phase 3: Hotspot Fixes
**Goal**: Fix critical screens first

**Status**: ✅ **COMPLETED**

**Screens Fixed**:
- ✅ WelcomeScreen (web)
- ✅ HomeScreen (mobile)
- ✅ use-domain-snapshots hook

### Phase 4: Systematic Fixes
**Goal**: Apply fixes to all remaining screens/routes

**Status**: 🔄 **IN PROGRESS**

### Phase 5: Testing & Validation
**Goal**: Ensure all gates pass

**Status**: ⏳ **PENDING**

### Phase 6: Artifacts & Documentation
**Goal**: Generate reports, screenshots, metrics

**Status**: ⏳ **PENDING**

---

## Step-by-Step Execution

### Step 1: Generate Inventory

```bash
# Navigate to project root
cd /home/ben/Public/PETSPARK

# Run inventory script
node tools/ui-audit/inventory.ts

# Verify output
cat audit/inventory/pages.json
cat audit/inventory/screens.json
cat audit/inventory/modules.json
```

**Expected Output**:
- `audit/inventory/pages.json` - Web routes
- `audit/inventory/screens.json` - Mobile screens
- `audit/inventory/modules.json` - Shared packages

---

### Step 2: Select Target Screen/Route

```bash
# Example: Select a screen from inventory
SCREEN="HomeScreen"
SCREEN_PATH=$(cat audit/inventory/screens.json | jq -r ".[] | select(.name==\"$SCREEN\") | .path")

echo "Fixing: $SCREEN at $SCREEN_PATH"
```

---

### Step 3: Apply Fixes to Target

For each screen/route, apply these fixes systematically:

#### 3.1 Remove Duplications & Fix Hooks

**Checklist**:
- [ ] Merge duplicate `useEffect` hooks
- [ ] Minimize dependency arrays (exclude stable values)
- [ ] Wrap event handlers in `useCallback`
- [ ] Ensure cleanup (cancelAnimation, abort controllers)
- [ ] Use React Reanimated worklets for animations (runOnJS for side effects)

**Example Pattern**:
```typescript
// ❌ BAD: Multiple separate effects
useEffect(() => { track('viewed'); }, [track]);
useEffect(() => { if (!isOnline) track('offline'); }, [isOnline, track]);
useEffect(() => { if (!isOnline) ref.current?.focus(); }, [isOnline]);

// ✅ GOOD: Merged effects
useEffect(() => {
  track('viewed');
  if (!isOnline) {
    track('offline');
    offlineRef.current?.focus();
  }
}, [isOnline, track]);
```

#### 3.1.1 Advanced React Reanimated Patterns

**Checklist**:
- [ ] Use `useSharedValue` for animated values
- [ ] Use `useAnimatedStyle` for style derivations
- [ ] Use `useDerivedValue` for computed animations
- [ ] Use `runOnJS` for side effects in worklets
- [ ] Use `withTiming`, `withSpring`, `withDecay` for animations
- [ ] Use `useAnimatedReaction` for reactive animations
- [ ] Use `useAnimatedGestureHandler` for gesture interactions
- [ ] Use `withSequence`, `withRepeat`, `withDelay` for complex animations
- [ ] Use `LayoutAnimation` for automatic layout transitions
- [ ] Use `SharedTransition` for shared element transitions

**Advanced Animation Pattern**:
```typescript
import { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

// ✅ GOOD: Advanced Reanimated pattern
function AdvancedAnimatedComponent() {
  // Shared values for animations
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Derived value for complex calculations
  const progress = useDerivedValue(() => {
    'worklet';
    return Math.abs(translateX.value) / 100;
  });

  // Animated style with multiple properties
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  // Reactive animation based on state changes
  useAnimatedReaction(
    () => progress.value,
    (current, previous) => {
      'worklet';
      if (current > 0.5 && previous !== undefined && previous <= 0.5) {
        // Trigger animation when crossing threshold
        scale.value = withSpring(1.2, { damping: 15, stiffness: 150 });
      } else if (current <= 0.5 && previous !== undefined && previous > 0.5) {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      }
    }
  );

  // Gesture handler with advanced interactions
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      'worklet';
      translateX.value = event.translationX;
      // Rotate based on drag distance
      rotation.value = event.translationX * 0.1;
    })
    .onEnd((event) => {
      'worklet';
      // Spring back to center with velocity
      translateX.value = withSpring(0, {
        velocity: event.velocityX,
        damping: 20,
        stiffness: 300,
      });
      rotation.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
    });

  // Complex animation sequence
  const triggerAnimation = useCallback(() => {
    'worklet';
    opacity.value = withSequence(
      withTiming(0.5, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );
    scale.value = withSequence(
      withTiming(1.2, { duration: 200 }),
      withSpring(1, { damping: 15, stiffness: 150 })
    );
  }, []);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        {/* Content */}
      </Animated.View>
    </GestureDetector>
  );
}
```

**Layout Animation Pattern**:
```typescript
import { Layout } from 'react-native-reanimated';

// ✅ GOOD: Automatic layout animations
function AnimatedList() {
  return (
    <Animated.FlatList
      itemLayoutAnimation={Layout.springify()}
      data={items}
      renderItem={({ item }) => (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          {/* Item content */}
        </Animated.View>
      )}
    />
  );
}
```

**Shared Element Transition Pattern**:
```typescript
import { SharedTransition } from 'react-native-reanimated';

// ✅ GOOD: Shared element transitions
const sharedTransition = SharedTransition.custom((values) => {
  'worklet';
  return {
    height: withSpring(values.targetHeight),
    width: withSpring(values.targetWidth),
    originX: withSpring(values.targetOriginX),
    originY: withSpring(values.targetOriginY),
  };
});

function SharedElementComponent() {
  return (
    <Animated.View sharedTransitionTag="shared-element" sharedTransitionStyle={sharedTransition}>
      {/* Content */}
    </Animated.View>
  );
}
```

#### 3.2 Replace Hardcoded Strings/URLs

**Checklist**:
- [ ] Move URLs to `packages/config`
- [ ] Replace literal UI strings with i18n keys
- [ ] Ensure en + bg translations exist

**Example Pattern**:
```typescript
// ❌ BAD: Hardcoded
<a href="https://pawfectmatch.app/terms">Terms</a>

// ✅ GOOD: Config + i18n
import { LEGAL_URLS } from '@petspark/config';
<a href={LEGAL_URLS.terms}>{t.welcome.terms}</a>
```

#### 3.3 Add Boundaries + Error Paths

**Checklist**:
- [ ] Wrap route/screen root with `RouteErrorBoundary`
- [ ] Convert thrown errors to typed user-friendly messages
- [ ] Surface retry functionality

**Example Pattern**:
```typescript
// ✅ GOOD: Wrapped with boundary
export function MyScreen(): JSX.Element {
  return (
    <RouteErrorBoundary
      onError={(error) => {
        logger.error('MyScreen error', { error });
      }}
    >
      <MyScreenContent />
    </RouteErrorBoundary>
  );
}
```

#### 3.4 Offline + Retry

**Checklist**:
- [ ] Web: `navigator.onLine` + Service Worker
- [ ] Mobile: NetInfo gating
- [ ] Show offline banner
- [ ] Retry with exponential backoff

**Example Pattern**:
```typescript
// ✅ GOOD: Offline handling
const { isConnected } = useNetworkStatus();

if (!isConnected) {
  return <OfflineIndicator />;
}
```

#### 3.5 Security

**Checklist**:
- [ ] Render user/content strings via `safeText`
- [ ] Forbid raw HTML (`dangerouslySetInnerHTML`)
- [ ] Harden all external links (`rel="noopener noreferrer"`)

**Example Pattern**:
```typescript
// ❌ BAD: Unsafe
<p>{userMessage}</p>

// ✅ GOOD: Sanitized
import { safeText } from '@/lib/safeText';
<p>{safeText(userMessage)}</p>
```

#### 3.6 Accessibility

**Checklist**:
- [ ] Roles/labels on interactive elements
- [ ] Manage focus to alerts
- [ ] Visible focus ring
- [ ] Respect reduced motion
- [ ] RN: `accessible`, `accessibilityLabel`, `accessibilityHint`, `hitSlop`

**Example Pattern**:
```typescript
// ✅ GOOD: Full a11y
<Button
  onClick={handleClick}
  accessible
  accessibilityLabel="Submit form"
  accessibilityHint="Submits the current form data"
  aria-label="Submit"
>
  Submit
</Button>
```

#### 3.7 Performance

**Checklist**:
- [ ] Virtualize lists
- [ ] Memoize selectors
- [ ] `useMemo` for expensive derived data
- [ ] Image optimization/lazy loading
- [ ] Route-level code splitting
- [ ] Remove dead imports
- [ ] Use Reanimated worklets for 60fps animations (UI thread)
- [ ] Minimize JS thread work in animations
- [ ] Use `runOnUI` for heavy computations in animations
- [ ] Use `useAnimatedProps` for native driver properties
- [ ] Avoid unnecessary re-renders with `useAnimatedReaction`

**Example Pattern**:
```typescript
// ✅ GOOD: Memoized expensive computation
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

**Advanced Reanimated Performance Pattern**:
```typescript
import { useSharedValue, useAnimatedStyle, useAnimatedProps, runOnUI, useAnimatedReaction } from 'react-native-reanimated';
import { useAnimatedScrollHandler } from 'react-native-reanimated';

// ✅ GOOD: High-performance scroll animations
function OptimizedScrollView() {
  const scrollY = useSharedValue(0);
  const headerHeight = useSharedValue(100);

  // Scroll handler runs on UI thread
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      scrollY.value = event.contentOffset.y;
      // Calculate header height on UI thread
      headerHeight.value = Math.max(50, 100 - scrollY.value * 0.5);
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      height: headerHeight.value,
      opacity: Math.max(0, 1 - scrollY.value / 200),
    };
  });

  return (
    <>
      <Animated.View style={headerStyle} />
      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
        {/* Content */}
      </Animated.ScrollView>
    </>
  );
}

// ✅ GOOD: Animated props for native components
function AnimatedImage() {
  const opacity = useSharedValue(1);

  const animatedProps = useAnimatedProps(() => {
    'worklet';
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.Image
      animatedProps={animatedProps}
      source={{ uri: '...' }}
    />
  );
}

// ✅ GOOD: Heavy computation on UI thread
function HeavyComputationComponent() {
  const input = useSharedValue(0);
  const result = useSharedValue(0);

  useAnimatedReaction(
    () => input.value,
    (value) => {
      'worklet';
      // Heavy computation runs on UI thread
      let sum = 0;
      for (let i = 0; i < 1000; i++) {
        sum += Math.sin(value + i) * Math.cos(value - i);
      }
      result.value = sum;
    }
  );

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: 1 + result.value * 0.001 }],
    };
  });

  return <Animated.View style={animatedStyle} />;
}
```

---

### Step 4: Run Local Tests

```bash
# Navigate to target app
cd apps/web  # or apps/mobile

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Unit tests
pnpm test

# Coverage check (must be ≥95%)
pnpm test:coverage
```

**Expected Results**:
- ✅ TypeScript: No errors
- ✅ ESLint: 0 errors
- ✅ Tests: All passing
- ✅ Coverage: ≥95% statements/branches/functions/lines

---

### Step 5: Generate Artifacts

#### 5.1 Web Artifacts

```bash
cd apps/web

# Build
pnpm build

# Run Lighthouse CI (if configured)
pnpm lighthouse:ci

# Run Axe tests (if configured)
pnpm axe:test

# Screenshots (Playwright)
pnpm test:e2e:visual
```

**Output Locations**:
- `audit/artifacts/web/axe/<slug>.json`
- `audit/artifacts/web/lighthouse/<slug>.json`
- `audit/artifacts/web/snapshots/<slug>/{before,after}.png`

#### 5.2 Mobile Artifacts

```bash
cd apps/mobile

# Build
pnpm build

# Run Detox tests (if configured)
pnpm test:e2e

# Performance profiling
pnpm test:perf
```

**Output Locations**:
- `audit/artifacts/mobile/perf/<slug>.json`
- `audit/artifacts/mobile/snapshots/<slug>/{before,after}.png`

---

### Step 6: Update Documentation

```bash
# Update progress report
vim audit/reports/global/UI_AUDIT_PROGRESS.md

# Add entry for fixed screen
# - Screen name
# - Fixes applied
# - Test results
# - Artifacts generated
```

---

## Testing & Validation

### Pre-Commit Checklist

Before committing, verify:

```bash
# 1. Type safety
pnpm -C apps/web typecheck
pnpm -C apps/mobile typecheck

# 2. Linting
pnpm -C apps/web lint
pnpm -C apps/mobile lint

# 3. Tests
pnpm -C apps/web test
pnpm -C apps/mobile test

# 4. Coverage
pnpm -C apps/web test:coverage
pnpm -C apps/mobile test:coverage

# 5. Build
pnpm -C apps/web build
pnpm -C apps/mobile build
```

### CI Gates (Blocking)

All of these must pass:

1. **Type Safety**: `tsc --noEmit` ✅
2. **Linting**: `eslint` (errors only) ✅
3. **Tests**: `vitest` with coverage ≥95% ✅
4. **Security**: `semgrep` ruleset ✅
5. **Dependencies**: `depcheck`, `ts-prune` ✅
6. **Hygiene**: No reserved words (TODO, FIXME, HACK) ✅
7. **Bundle Size**: `size-limit` thresholds ✅

### Web-Specific Gates

Per route:
- **Lighthouse CI**: JS ≤ budget, LCP ≤ 2.5s, CLS ≤ 0.1, TBT ≤ 200ms
- **Axe**: 0 violations
- **Bundle**: Size within limits

### Mobile-Specific Gates

Per screen:
- **Initial Render**: ≤ target on mid device
- **Lists**: Virtualized
- **Images**: Lazy loaded
- **Effects**: Cleaned on unmount

---

## PR Workflow

### Branch Naming

```bash
# Format: fix/ui/<area>-<slug>
git checkout -b fix/ui/web-welcome-screen
git checkout -b fix/ui/mobile-home-screen
```

### Commit Message Format

```
fix(ui): <route/screen> — <short reason> [a11y][perf][security]

Example:
fix(ui): WelcomeScreen — merge duplicate effects, add safeText [a11y][security]
```

### PR Requirements

Each PR must include:

1. **Before/After Screenshots**
   - Web: `audit/artifacts/web/snapshots/<slug>/before.png`
   - Mobile: `audit/artifacts/mobile/snapshots/<slug>/before.png`

2. **Metrics**
   - Lighthouse/Axe reports
   - Bundle size comparison
   - Performance metrics

3. **Test Results**
   - Unit test diffs
   - Integration test results
   - Coverage reports
   - E2E test results

4. **Documentation**
   - Short rationale
   - Risk assessment
   - Breaking changes (if any)

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] Performance improvement
- [ ] Accessibility enhancement
- [ ] Security fix
- [ ] Code quality improvement

## Screenshots
### Before
![Before](audit/artifacts/web/snapshots/welcome-screen/before.png)

### After
![After](audit/artifacts/web/snapshots/welcome-screen/after.png)

## Test Results
- Type checking: ✅
- Linting: ✅
- Unit tests: ✅ (95% coverage)
- Integration tests: ✅
- E2E tests: ✅

## Metrics
- Lighthouse Score: 95
- Axe Violations: 0
- Bundle Size: -2KB

## Checklist
- [ ] All tests pass
- [ ] Coverage ≥95%
- [ ] No banned patterns
- [ ] i18n strings added
- [ ] Error boundaries added
- [ ] Accessibility verified
- [ ] Security sanitization applied
```

---

## Acceptance Criteria

### Must Pass (All)

- [ ] 0 banned-pattern violations
- [ ] TypeScript strict mode clean
- [ ] Axe violations = 0
- [ ] WCAG AA focus/contrast verified
- [ ] Budgets met (web + mobile)
- [ ] Coverage ≥95% for touched files
- [ ] Error boundaries present
- [ ] Offline flows present
- [ ] i18n for all UI strings (en, bg)
- [ ] All artifacts generated

### Code Quality

- [ ] No `console.log`, `console.error`, `console.warn`
- [ ] No `@ts-ignore`, `@ts-expect-error`
- [ ] No `eslint-disable` comments
- [ ] No `any` types (unless fully justified)
- [ ] No `framer-motion` (use React Reanimated with advanced patterns)
- [ ] No `dangerouslySetInnerHTML`
- [ ] Hooks have correct dependencies
- [ ] Event handlers use `useCallback`
- [ ] Animations use React Reanimated worklets (UI thread)
- [ ] Shared values properly initialized and cleaned
- [ ] Gesture handlers properly configured
- [ ] Layout animations configured for lists

### Performance

- [ ] Lists virtualized
- [ ] Images lazy loaded
- [ ] Expensive computations memoized
- [ ] Dead code removed
- [ ] Bundle size within limits
- [ ] Lighthouse scores meet thresholds

### Accessibility

- [ ] All interactive elements have labels
- [ ] Focus management implemented
- [ ] Visible focus rings
- [ ] Reduced motion respected
- [ ] ARIA roles/labels correct
- [ ] Color contrast meets WCAG AA

### Security

- [ ] User content sanitized
- [ ] External links hardened
- [ ] No XSS vulnerabilities
- [ ] No hardcoded secrets

### Resilience

- [ ] Error boundaries on routes/screens
- [ ] Offline detection
- [ ] Retry logic with backoff
- [ ] Graceful degradation
- [ ] Typed error handling

---

## Troubleshooting

### Common Issues

#### Issue: TypeScript Errors

```bash
# Clear cache and rebuild
rm -rf node_modules/.cache
pnpm typecheck
```

#### Issue: ESLint Errors

```bash
# Check specific rule
pnpm lint --rule max-lines

# Fix auto-fixable issues
pnpm lint --fix
```

#### Issue: Test Failures

```bash
# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test WelcomeScreen.test.tsx
```

#### Issue: Coverage Below 95%

```bash
# Check coverage report
pnpm test:coverage

# Identify uncovered lines
open coverage/lcov-report/index.html
```

#### Issue: Bundle Size Exceeded

```bash
# Analyze bundle
pnpm build --analyze

# Check size-limit output
pnpm size-limit
```

### Getting Help

1. Check existing issues in `audit/reports/global/`
2. Review `UI_AUDIT_PROGRESS.md` for similar fixes
3. Check ESLint/TypeScript error messages
4. Review test output for clues

---

## Quick Reference

### Commands Cheat Sheet

```bash
# Inventory
node tools/ui-audit/inventory.ts

# Type checking
pnpm -C apps/web typecheck
pnpm -C apps/mobile typecheck

# Linting
pnpm -C apps/web lint
pnpm -C apps/mobile lint

# Testing
pnpm -C apps/web test
pnpm -C apps/mobile test

# Coverage
pnpm -C apps/web test:coverage
pnpm -C apps/mobile test:coverage

# Build
pnpm -C apps/web build
pnpm -C apps/mobile build

# Full pipeline (web)
cd apps/web && pnpm typecheck && pnpm lint && pnpm test && pnpm build

# Full pipeline (mobile)
cd apps/mobile && pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

### File Locations

```
# Inventory
tools/ui-audit/inventory.ts
audit/inventory/{pages,screens,modules}.json

# Config
packages/config/src/legal.ts
packages/config/src/index.ts

# Utilities
apps/web/src/lib/safeText.ts
apps/mobile/src/components/RouteErrorBoundary.tsx

# Artifacts
audit/artifacts/web/{axe,lighthouse,snapshots}/
audit/artifacts/mobile/{perf,snapshots}/

# Reports
audit/reports/global/
```

### Import Patterns

```typescript
// Legal URLs
import { LEGAL_URLS } from '@petspark/config';

// Safe text
import { safeText } from '@/lib/safeText';

// Error boundary (web)
import { RouteErrorBoundary } from '@/components/error/RouteErrorBoundary';

// Error boundary (mobile)
import { RouteErrorBoundary } from '@mobile/components/RouteErrorBoundary';
```

### Common Fixes

```typescript
// Merge effects
useEffect(() => {
  // Combined logic
}, [deps]);

// Sanitize user input
const safe = safeText(userInput);

// Error boundary wrapper
<RouteErrorBoundary>
  <Component />
</RouteErrorBoundary>

// Memoized callback
const handleClick = useCallback(() => {
  // Handler logic
}, [deps]);

// Memoized value
const value = useMemo(() => {
  return expensiveComputation(data);
}, [data]);
```

### Advanced React Reanimated Patterns

```typescript
import {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedReaction,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
  runOnJS,
  useAnimatedGestureHandler,
  Layout,
  SharedTransition,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

// Basic shared value and animated style
const translateX = useSharedValue(0);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: translateX.value }],
}));

// Derived value for computed animations
const progress = useDerivedValue(() => {
  'worklet';
  return Math.abs(translateX.value) / 100;
});

// Reactive animations
useAnimatedReaction(
  () => progress.value,
  (current, previous) => {
    'worklet';
    if (current > 0.5 && previous !== undefined && previous <= 0.5) {
      // Trigger animation on threshold
      scale.value = withSpring(1.2);
    }
  }
);

// Gesture handler
const panGesture = Gesture.Pan()
  .onUpdate((event) => {
    'worklet';
    translateX.value = event.translationX;
  })
  .onEnd(() => {
    'worklet';
    translateX.value = withSpring(0);
  });

// Complex animation sequences
const triggerAnimation = () => {
  'worklet';
  opacity.value = withSequence(
    withTiming(0.5, { duration: 200 }),
    withTiming(1, { duration: 200 })
  );
  scale.value = withSequence(
    withTiming(1.2, { duration: 200 }),
    withSpring(1, { damping: 15, stiffness: 150 })
  );
};

// Layout animations
<Animated.View entering={FadeIn} exiting={FadeOut}>
  {/* Content */}
</Animated.View>

// Shared element transitions
const sharedTransition = SharedTransition.custom((values) => {
  'worklet';
  return {
    height: withSpring(values.targetHeight),
    width: withSpring(values.targetWidth),
  };
});
```

---

## Next Steps

1. **Continue Systematic Fixes**: Apply workflow to remaining screens
2. **Generate Artifacts**: Run screenshot/performance tests
3. **Update Documentation**: Keep progress report current
4. **Open PRs**: Create scoped PRs for each area
5. **Monitor CI**: Ensure all gates pass
6. **Iterate**: Fix issues found in CI

---

## Status Tracking

See `audit/reports/global/UI_AUDIT_PROGRESS.md` for current status.

**Last Updated**: 2024-11-12

**Completed**: 2 screens (WelcomeScreen, HomeScreen)
**In Progress**: Systematic fixes
**Remaining**: All other screens/routes

---

## Support

For questions or issues:
1. Review this document
2. Check `UI_AUDIT_PROGRESS.md`
3. Review code examples in fixed screens
4. Check ESLint/TypeScript error messages

---

**Remember**: Quality over speed. Each fix must meet all acceptance criteria before merging.
