# ⚡ Quick Reference Card - UI Audit Workflow

---

## 🎯 One-Liner Workflow

```bash
# 1. Generate inventory
node tools/ui-audit/inventory.ts

# 2. Fix screen/route
# (Apply fixes: hooks, i18n, boundaries, security, a11y, perf)

# 3. Test locally
cd apps/web && pnpm typecheck && pnpm lint && pnpm test && pnpm build

# 4. Generate artifacts
pnpm test:e2e:visual  # Screenshots
pnpm lighthouse:ci    # Performance

# 5. Commit & PR
git checkout -b fix/ui/web-<screen>
git commit -m "fix(ui): <screen> — <reason> [a11y][perf][security]"
```

---

## 📋 Fix Checklist (Per Screen/Route)

### 🔗 Hooks & Effects

- [ ] Merge duplicate `useEffect`
- [ ] Minimize dependencies
- [ ] Wrap handlers in `useCallback`
- [ ] Cleanup animations (`cancelAnimation`)

### ⚙️ Configuration

- [ ] Move URLs to `@petspark/config`
- [ ] Replace hardcoded strings with i18n keys
- [ ] Verify en + bg translations

### 🛡️ Error Handling

- [ ] Wrap with `RouteErrorBoundary`
- [ ] Convert errors to user-friendly messages
- [ ] Add retry functionality

### 📡 Offline Support

- [ ] Detect offline state
- [ ] Show offline indicator
- [ ] Implement retry with backoff

### 🔒 Security

- [ ] Use `safeText()` for user content
- [ ] No `dangerouslySetInnerHTML`
- [ ] Harden external links (`rel="noopener noreferrer"`)

### ♿ Accessibility

- [ ] Add `accessibilityLabel`/`accessibilityHint`
- [ ] Manage focus to alerts
- [ ] Visible focus rings
- [ ] Respect `reducedMotion`

### ⚡ Performance

- [ ] Virtualize lists
- [ ] Memoize expensive computations
- [ ] Lazy load images
- [ ] Remove dead imports
- [ ] Use Reanimated worklets for 60fps animations
- [ ] Minimize JS thread work in animations
- [ ] Use `useAnimatedScrollHandler` for scroll animations
- [ ] Use `useAnimatedProps` for native driver properties

---

## 🧪 Testing Commands

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Test
pnpm test

# Coverage (must be ≥95%)
pnpm test:coverage

# Build
pnpm build
```

---

## 📦 Import Patterns

### Basic Imports

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

### React Reanimated (Advanced)

```typescript
import {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedReaction,
  useAnimatedGestureHandler,
  useAnimatedScrollHandler,
  useAnimatedProps,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
  withDecay,
  runOnJS,
  runOnUI,
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
```

---

## 🚫 Banned Patterns

- ❌ `console.log`, `console.error`, `console.warn`
- ❌ `@ts-ignore`, `@ts-expect-error`
- ❌ `eslint-disable`
- ❌ `any` types
- ❌ `framer-motion` (use React Reanimated with advanced patterns)
- ❌ `dangerouslySetInnerHTML`
- ❌ Animations on JS thread (use Reanimated worklets)
- ❌ `Animated` from `react-native` (use `react-native-reanimated`)

---

## ✨ Advanced React Reanimated Patterns

### Basic Animation

```typescript
const translateX = useSharedValue(0);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: translateX.value }],
}));
```

### Gesture Handling

```typescript
const panGesture = Gesture.Pan()
  .onUpdate((event) => {
    'worklet';
    translateX.value = event.translationX;
  })
  .onEnd(() => {
    'worklet';
    translateX.value = withSpring(0);
  });
```

### Complex Sequences

```typescript
const triggerAnimation = () => {
  'worklet';
  opacity.value = withSequence(
    withTiming(0.5, { duration: 200 }),
    withTiming(1, { duration: 200 })
  );
};
```

### Layout Animations

```typescript
<Animated.View entering={FadeIn} exiting={FadeOut}>
  {/* Content */}
</Animated.View>
```

### Shared Element Transitions

```typescript
const sharedTransition = SharedTransition.custom((values) => {
  'worklet';
  return {
    height: withSpring(values.targetHeight),
    width: withSpring(values.targetWidth),
  };
});
```

---

## ✅ Acceptance Criteria

- [ ] 0 banned patterns
- [ ] TypeScript strict clean
- [ ] Axe violations = 0
- [ ] Coverage ≥95%
- [ ] Error boundaries present
- [ ] i18n complete (en, bg)
- [ ] All artifacts generated

---

## 📁 Key Files

```
tools/ui-audit/inventory.ts          # Inventory script
packages/config/src/legal.ts          # Legal URLs
apps/web/src/lib/safeText.ts          # Sanitization
audit/inventory/                      # Generated inventory
audit/artifacts/                      # Test artifacts
audit/reports/global/                 # Reports
```

---

## 🔗 Full Documentation

- **Complete Workflow**: `UI_AUDIT_WORKFLOW.md`
- **Progress Report**: `UI_AUDIT_PROGRESS.md`

---

**💡 Remember**: Quality over speed. All gates must pass before merging.
