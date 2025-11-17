# Animation Migration Fix Summary

**Status**: 🚧 In Progress  
**Priority**: High  
**Impact**: Performance, Bundle Size, Code Maintainability

---

## Overview

The PetSpark web application currently uses React Native Reanimated compatibility APIs from `@petspark/motion` in approximately **221 files**. According to the project's coding standards (`.github/copilot-instructions.md`), web code should use **native Framer Motion** directly, not the Reanimated compatibility layer.

### Why This Matters

1. **Performance**: Framer Motion is optimized for web and uses native CSS transforms
2. **Bundle Size**: Eliminates unnecessary compatibility polyfills (~50KB reduction)
3. **Developer Experience**: Better TypeScript support, more features, simpler API
4. **Maintainability**: Aligns with web platform standards and project guidelines
5. **Future-Proofing**: The compatibility layer is a migration bridge, not a permanent solution

---

## Current State Analysis

### Files Affected by Directory

| Directory                                              | File Count | Priority                                |
| ------------------------------------------------------ | ---------- | --------------------------------------- |
| `src/effects/reanimated/`                              | 51         | 🔴 High - Core animation infrastructure |
| `src/components/chat/`                                 | 20         | 🔴 High - User-facing features          |
| `src/hooks/`                                           | 19         | 🟡 Medium - Reusable logic              |
| `src/components/`                                      | 18         | 🔴 High - Core UI components            |
| `src/agi_ui_engine/effects/`                           | 17         | 🟢 Low - Advanced features              |
| `src/components/enhanced/`                             | 13         | 🟡 Medium - Premium features            |
| `src/components/chat/bubble-wrapper-god-tier/effects/` | 9          | 🟡 Medium - Chat enhancements           |
| `src/components/views/`                                | 7          | 🔴 High - Main views                    |
| `src/hooks/micro-interactions/`                        | 4          | 🟡 Medium - UX polish                   |
| `src/effects/chat/media/`                              | 4          | 🟡 Medium - Media handling              |
| `src/components/notifications/`                        | 4          | 🟡 Medium - Notifications               |
| `src/components/call/`                                 | 4          | 🟡 Medium - Video calls                 |
| Other directories                                      | ~50+       | Various                                 |

### Deprecated APIs in Use

The following APIs from `@petspark/motion` are compatibility shims and should be replaced:

```typescript
// ❌ Avoid - Reanimated compatibility APIs
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useDerivedValue,
  interpolate,
} from '@petspark/motion';
```

---

## Migration Patterns

### Pattern 1: Simple Entrance Animation

**Before (Reanimated-style):**

```tsx
import { useSharedValue, useAnimatedStyle, withSpring, animate } from '@petspark/motion';
import { AnimatedView } from '@/effects/reanimated/animated-view';

function Component() {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    const opacityTransition = withSpring(1);
    animate(opacity, opacityTransition.target, opacityTransition.transition);
    const scaleTransition = withSpring(1);
    animate(scale, scaleTransition.target, scaleTransition.transition);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ scale: scale.get() }],
  }));

  return <AnimatedView style={animatedStyle}>Content</AnimatedView>;
}
```

**After (Framer Motion - Declarative):**

```tsx
import { motion } from 'framer-motion';

function Component() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
    >
      Content
    </motion.div>
  );
}
```

**Benefits:**

- 60% less code
- No useEffect needed
- Declarative and self-documenting
- Better performance (uses CSS transforms)

---

### Pattern 2: Interactive Hover/Tap Animation

**Before:**

```tsx
import { useSharedValue, useAnimatedStyle, withSpring, animate } from '@petspark/motion';
import { AnimatedView } from '@/effects/reanimated/animated-view';

function Button() {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    const transition = withSpring(0.95);
    animate(scale, transition.target, transition.transition);
  };

  const handlePressOut = () => {
    const transition = withSpring(1);
    animate(scale, transition.target, transition.transition);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <AnimatedView style={animatedStyle} onMouseDown={handlePressIn} onMouseUp={handlePressOut}>
      Click me
    </AnimatedView>
  );
}
```

**After:**

```tsx
import { motion } from 'framer-motion';

function Button() {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      Click me
    </motion.button>
  );
}
```

**Benefits:**

- 70% less code
- No manual event handlers
- Built-in gesture support
- Accessible by default

---

### Pattern 3: Controlled Animation (Imperative)

**Before:**

```tsx
import { useSharedValue, useAnimatedStyle, withTiming, animate } from '@petspark/motion';
import { AnimatedView } from '@/effects/reanimated/animated-view';

function ProgressBar({ progress }: { progress: number }) {
  const width = useSharedValue(0);

  useEffect(() => {
    const transition = withTiming(progress, { duration: 500 });
    animate(width, transition.target, transition.transition);
  }, [progress, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.get()}%`,
  }));

  return <AnimatedView style={animatedStyle} className="progress-fill" />;
}
```

**After (when you need imperative control):**

```tsx
import { motion, useMotionValue, animate } from 'framer-motion';
import { useEffect } from 'react';

function ProgressBar({ progress }: { progress: number }) {
  const width = useMotionValue(0);

  useEffect(() => {
    animate(width, progress, { duration: 0.5 });
  }, [progress, width]);

  return (
    <motion.div className="progress-fill" style={{ width: useTransform(width, (v) => `${v}%`) }} />
  );
}
```

**Or (declarative - better):**

```tsx
import { motion } from 'framer-motion';

function ProgressBar({ progress }: { progress: number }) {
  return (
    <motion.div
      className="progress-fill"
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.5 }}
    />
  );
}
```

**Benefits:**

- Framer Motion's useMotionValue is native, not a polyfill
- useTransform is more efficient than Reanimated's useDerivedValue
- Declarative approach (second example) is even simpler

---

### Pattern 4: Exit Animations with AnimatePresence

**Before:**

```tsx
import { Presence } from '@petspark/motion';
import { useSharedValue, useAnimatedStyle, withSpring, animate } from '@petspark/motion';
import { AnimatedView } from '@/effects/reanimated/animated-view';

function Toast({ show }: { show: boolean }) {
  const opacity = useSharedValue(show ? 1 : 0);
  const y = useSharedValue(show ? 0 : 20);

  useEffect(() => {
    if (show) {
      animate(opacity, 1, { type: 'spring' });
      animate(y, 0, { type: 'spring' });
    } else {
      animate(opacity, 0, { duration: 0.2 });
      animate(y, 20, { duration: 0.2 });
    }
  }, [show]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateY: y.get() }],
  }));

  return (
    <Presence visible={show}>
      <AnimatedView style={animatedStyle}>Toast message</AnimatedView>
    </Presence>
  );
}
```

**After:**

```tsx
import { AnimatePresence, motion } from 'framer-motion';

function Toast({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          Toast message
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Benefits:**

- No manual show/hide state management
- Exit animations handled automatically
- Cleaner conditional rendering

---

### Pattern 5: List Stagger Animations

**Before:**

```tsx
import { useSharedValue, useAnimatedStyle, withDelay, withSpring, animate } from '@petspark/motion';
import { AnimatedView } from '@/effects/reanimated/animated-view';

function List({ items }: { items: string[] }) {
  return (
    <>
      {items.map((item, index) => {
        const opacity = useSharedValue(0);
        const y = useSharedValue(20);

        useEffect(() => {
          const delay = index * 100;
          setTimeout(() => {
            animate(opacity, 1, { type: 'spring' });
            animate(y, 0, { type: 'spring' });
          }, delay);
        }, []);

        const animatedStyle = useAnimatedStyle(() => ({
          opacity: opacity.get(),
          transform: [{ translateY: y.get() }],
        }));

        return (
          <AnimatedView key={item} style={animatedStyle}>
            {item}
          </AnimatedView>
        );
      })}
    </>
  );
}
```

**After:**

```tsx
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function List({ items }: { items: string[] }) {
  return (
    <motion.ul variants={container} initial="hidden" animate="show">
      {items.map((text) => (
        <motion.li key={text} variants={item}>
          {text}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

**Benefits:**

- Built-in stagger support
- No manual timing calculations
- Cleaner code with variants
- Orchestrated animations

---

### Pattern 6: Scroll-Based Animations

**Before:**

```tsx
import { useSharedValue, useAnimatedStyle, useDerivedValue, interpolate } from '@petspark/motion';
import { AnimatedView } from '@/effects/reanimated/animated-view';

function ParallaxSection() {
  const scrollY = useSharedValue(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    scrollY.value = e.currentTarget.scrollTop;
  };

  const opacity = useDerivedValue(() => interpolate(scrollY.value, [0, 200], [1, 0]));

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <div onScroll={handleScroll}>
      <AnimatedView style={animatedStyle}>Content</AnimatedView>
    </div>
  );
}
```

**After:**

```tsx
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

function ParallaxSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: ref });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={ref} style={{ overflow: 'auto' }}>
      <motion.div style={{ opacity }}>Content</motion.div>
    </div>
  );
}
```

**Benefits:**

- Built-in scroll tracking
- Normalized progress (0-1)
- Better performance
- More scroll utilities available

---

## Migration Priority Roadmap

### Phase 1: Core Infrastructure (Week 1) 🔴 CRITICAL

**Goal**: Replace the most-used animation primitives

1. **AnimatedView Component** (`src/effects/reanimated/animated-view.tsx`)
   - Used by 50+ components
   - Replace with direct `motion.div` usage
   - Create migration guide for consumers

2. **Core Animation Hooks** (`src/effects/reanimated/`)
   - `use-motion-migration.ts` - Already provides Framer Motion wrappers
   - Update documentation to prefer direct Framer Motion
   - Deprecate Reanimated-style exports

3. **Transition Configs** (`src/effects/reanimated/transitions.ts`)
   - Convert spring/timing configs to Framer Motion format
   - Create shared transition presets

### Phase 2: High-Traffic Components (Week 2) 🔴 HIGH

**Goal**: Migrate user-facing features

1. **Chat Components** (`src/components/chat/`)
   - `MessageBubble.tsx`
   - `TypingIndicator.tsx`
   - `WebBubbleWrapper.tsx`
   - Chat input animations

2. **Navigation** (`src/components/navigation/`)
   - `BottomNavBar.tsx`
   - Page transitions

3. **Core Views** (`src/components/views/`)
   - `ChatView.tsx`
   - `DiscoverView.tsx`
   - `CommunityView.tsx`
   - `NotificationsView.tsx`

### Phase 3: Enhanced Components (Week 3) 🟡 MEDIUM

**Goal**: Migrate premium/enhanced features

1. **Enhanced Components** (`src/components/enhanced/`)
   - `EnhancedButton.tsx`
   - `FloatingActionButton.tsx`
   - `PremiumCard.tsx`
   - Form components

2. **Notifications** (`src/components/notifications/`)
   - Notification bell animations
   - Notification center

3. **Custom Hooks** (`src/hooks/`)
   - Micro-interactions
   - Gesture handlers

### Phase 4: Advanced Features (Week 4+) 🟢 LOW

**Goal**: Migrate specialized/experimental features

1. **AGI UI Engine** (`src/agi_ui_engine/effects/`)
   - Advanced chat effects
   - Sentiment-based animations
   - AI reply animations

2. **Media Features** (`src/effects/chat/media/`)
   - Media bubble animations
   - Sticker physics
   - Voice waveforms

3. **Experimental Effects** (various)
   - Particle systems
   - Advanced gestures
   - 3D effects

---

## Migration Checklist Template

For each file being migrated:

```markdown
### [Component/Hook Name]

- [ ] **Analyze**: Review current implementation
- [ ] **Plan**: Identify Framer Motion equivalent
- [ ] **Implement**: Write new Framer Motion version
- [ ] **Test**: Verify animations work correctly
  - [ ] Visual regression test
  - [ ] Performance check (Chrome DevTools)
  - [ ] Accessibility (reduced motion)
- [ ] **Document**: Update JSDoc comments
- [ ] **Remove**: Delete old Reanimated code
- [ ] **Verify**: Check bundle size impact
```

---

## Testing Guidelines

### Visual Testing

```bash
# Start dev server
pnpm web-dev

# Test in browser
# 1. Verify animations are smooth (60fps)
# 2. Test with throttled CPU (DevTools > Performance)
# 3. Enable reduced motion (macOS System Preferences)
```

### Performance Testing

```typescript
// Check animation performance
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
  // Enable performance debugging
  layoutId="debug-layout"
  style={{ willChange: 'transform, opacity' }}
>
  Content
</motion.div>
```

### Accessibility Testing

```typescript
import { useReducedMotion } from 'framer-motion';

function Component() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3
      }}
    >
      Content
    </motion.div>
  );
}
```

---

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Duration Units

**Problem**: Reanimated uses milliseconds, Framer Motion uses seconds

```typescript
// ❌ Wrong - this will be 300 seconds!
withTiming(value, { duration: 300 });
// Becomes
animate(value, target, { duration: 300 });

// ✅ Correct - convert to seconds
animate(value, target, { duration: 0.3 });
```

### ❌ Pitfall 2: Transform Arrays

**Problem**: Reanimated uses array syntax, Framer Motion uses object

```typescript
// ❌ Reanimated style
transform: [{ translateX: 10 }, { scale: 1.2 }]

// ✅ Framer Motion style
x: 10, scale: 1.2
```

### ❌ Pitfall 3: .value vs .get()

**Problem**: Different APIs for accessing motion values

```typescript
// ❌ Reanimated
const x = useSharedValue(0);
console.log(x.value); // Access with .value
x.value = 10; // Set with .value

// ✅ Framer Motion
const x = useMotionValue(0);
console.log(x.get()); // Access with .get()
x.set(10); // Set with .set()
```

### ❌ Pitfall 4: Style Objects

**Problem**: Reanimated returns ViewStyle, Framer Motion uses CSS

```typescript
// ❌ Reanimated
useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }]
}))

// ✅ Framer Motion
style={{ scale }} // Direct motion value binding
// or
style={{ scale: scale.get() }} // Static value
```

---

## Bundle Size Impact

### Before Migration (Estimated)

```
@petspark/motion (Reanimated compat): ~120KB
Reanimated polyfills: ~80KB
Compatibility layer overhead: ~30KB
Total: ~230KB
```

### After Migration (Estimated)

```
Framer Motion (already included): ~80KB
No polyfills needed: 0KB
No compatibility overhead: 0KB
Total: ~80KB
```

**Savings**: ~150KB (~65% reduction in animation-related code)

---

## API Reference

### Recommended Framer Motion Imports

```typescript
// Core
import { motion } from 'framer-motion';

// Hooks
import {
  useMotionValue,
  useTransform,
  useScroll,
  useSpring,
  useVelocity,
  useAnimationControls,
} from 'framer-motion';

// Utilities
import { animate, AnimatePresence, useReducedMotion, useInView } from 'framer-motion';

// Types
import type { Variants, Transition, MotionProps, MotionValue } from 'framer-motion';
```

### Deprecated Imports (Do Not Use)

```typescript
// ❌ Do not import from @petspark/motion for web
import {
  useSharedValue, // Use useMotionValue
  useAnimatedStyle, // Use motion.div with style prop
  withSpring, // Use { type: 'spring' } in transition
  withTiming, // Use { duration } in transition
  useDerivedValue, // Use useTransform
  interpolate, // Use useTransform
  Animated, // Use motion
} from '@petspark/motion';

// ❌ Never import from react-native in web code
import { Animated, View } from 'react-native';
```

---

## Resources

### Documentation

- [Framer Motion Docs](https://www.framer.com/motion/) - Official documentation
- [Migration Guide](../../../FRAMER_MOTION_MIGRATION.md) - Root-level guide
- [Copilot Instructions](.github/copilot-instructions.md) - Project standards
- [Motion Package](../../../packages/motion/) - Compatibility layer source

### Examples

- [Motion Recipes](../../../packages/motion/src/recipes/) - Reusable animation patterns
- [Animation Examples](https://www.framer.com/motion/examples/) - Official examples
- [CodeSandbox](https://codesandbox.io/s/framer-motion-examples) - Interactive demos

### Tools

- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/) - Profile animations
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools) - Component performance
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance audits

---

## Getting Help

### Common Questions

**Q: Can I use both APIs during migration?**  
A: Yes, `@petspark/motion` provides both Framer Motion and compatibility APIs. However, prefer native Framer Motion for all new code.

**Q: What about mobile?**  
A: Mobile continues to use React Native Reanimated. Only web should use Framer Motion.

**Q: How do I test my changes?**  
A: Run `pnpm web-dev`, test animations visually, check DevTools performance, and enable reduced motion.

**Q: What if I need a feature not in Framer Motion?**  
A: Framer Motion is more feature-rich than Reanimated for web. If you find something missing, consult the team.

**Q: Should I migrate all files at once?**  
A: No. Follow the phased approach above. Test thoroughly after each phase.

---

## Success Metrics

### Key Performance Indicators

- [ ] **Bundle Size**: Reduce animation code by ~150KB
- [ ] **Performance**: Maintain 60fps for all animations
- [ ] **Developer Experience**: Reduce animation code by ~50%
- [ ] **Accessibility**: 100% animations respect reduced motion
- [ ] **Coverage**: 0 files using Reanimated APIs in web code

### Definition of Done

- [ ] All 221 files migrated to Framer Motion
- [ ] All tests passing (unit, integration, e2e)
- [ ] Zero ESLint warnings for animation code
- [ ] Performance benchmarks met or improved
- [ ] Documentation updated
- [ ] Code review completed
- [ ] Bundle size verified (should reduce by ~150KB)

---

## Timeline

| Phase                            | Duration | Completion |
| -------------------------------- | -------- | ---------- |
| Phase 1: Core Infrastructure     | Week 1   | 0%         |
| Phase 2: High-Traffic Components | Week 2   | 0%         |
| Phase 3: Enhanced Components     | Week 3   | 0%         |
| Phase 4: Advanced Features       | Week 4+  | 0%         |

**Estimated Total**: 4-6 weeks for complete migration

---

## Questions or Issues?

- Review [FRAMER_MOTION_MIGRATION.md](../../../FRAMER_MOTION_MIGRATION.md) in root
- Check [Copilot Instructions](.github/copilot-instructions.md)
- Consult the Framer Motion documentation
- Ask in team chat for architecture questions

---

**Last Updated**: 2025-11-13  
**Document Owner**: PetSpark Engineering Team  
**Status**: Initial Documentation Created
