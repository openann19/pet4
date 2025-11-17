# Animation Library Investigation Report

## Summary

Your codebase uses **BOTH React Native Reanimated AND Framer Motion**, but in a layered architecture:

### Current State

1. **Primary: React Native Reanimated** (242 direct imports)
   - Used directly in most components
   - Web-compatible via `react-native-reanimated` web support
   - Examples: `WelcomeScreen.tsx`, `TopNavBar.tsx`, `PremiumToast.tsx`

2. **Abstraction Layer: @petspark/motion** (69 imports)
   - Custom motion package that provides unified API
   - **Web implementation**: Uses Framer Motion under the hood (`MotionView.web.tsx`)
   - **Native implementation**: Uses React Native Reanimated (`MotionView.native.tsx`)
   - Provides hooks: `useHoverLift`, `useBounceOnTap`, `useMotionVariants`, etc.

3. **Custom Wrapper: AnimatedView**
   - Located in `apps/web/src/effects/reanimated/animated-view.tsx`
   - Converts React Native Reanimated styles to CSS for web
   - Used in `WelcomeScreen.tsx` and other components

## Architecture Breakdown

### Package: `@petspark/motion`

**Location**: `packages/motion/`

**Dependencies**:
- `framer-motion: ^11.11.17` (for web)
- `react-native-reanimated: ~3.10.1` (peer dependency)

**Structure**:
```
packages/motion/
├── src/
│   ├── primitives/
│   │   ├── MotionView.web.tsx      → Uses framer-motion
│   │   ├── MotionView.native.tsx  → Uses react-native-reanimated
│   │   └── MotionView.tsx          → Platform selector
│   ├── recipes/                    → Custom animation hooks
│   └── index.ts                    → Exports unified API
```

### Web Implementation (`MotionView.web.tsx`)

```typescript
import { motion } from 'framer-motion';

// Uses framer-motion's motion.div for web
export const MotionView = forwardRef((props, ref) => {
  return <motion.div ref={ref} {...props} />
});
```

### Native Implementation (`MotionView.native.tsx`)

```typescript
import Animated from 'react-native-reanimated';

// Uses react-native-reanimated for native
export const MotionView = forwardRef((props, ref) => {
  return <Animated.View ref={ref} {...props} />
});
```

## Usage Patterns

### Pattern 1: Direct React Native Reanimated (Most Common)

```typescript
// apps/web/src/components/WelcomeScreen.tsx
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { AnimatedView } from '@/effects/reanimated/animated-view'

const scale = useSharedValue(1)
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }]
}))

<AnimatedView style={animatedStyle}>...</AnimatedView>
```

**Files using this**: 242 files

### Pattern 2: @petspark/motion Abstraction

```typescript
// apps/web/src/components/auth/SignInForm.tsx
import { MotionView } from '@petspark/motion'
import { useHoverLift, useMotionVariants } from '@petspark/motion'

const hover = useHoverLift({ scale: 1.05 })
const entry = useMotionVariants({...})

<MotionView style={hover.animatedStyle}>...</MotionView>
```

**Files using this**: 69 files

### Pattern 3: Direct Framer Motion (Legacy/Test Files)

Only found in:
- Test files (mocks)
- Comments/documentation
- `StatsCard.tsx` (comment reference)

**No production code directly imports framer-motion**

## Migration Status

Based on git history and documentation:

✅ **Completed**:
- Migration from direct framer-motion to `@petspark/motion` abstraction
- Mobile/shared code uses React Native Reanimated only
- Web code uses abstraction layer

⚠️ **Current State**:
- `@petspark/motion` still depends on framer-motion for web
- Most components use React Native Reanimated directly
- Some components use `@petspark/motion` abstraction

## Recommendations

### Option 1: Keep Current Architecture (Recommended)
- **Pros**: 
  - Unified API across web/native
  - Framer Motion provides better web performance for complex animations
  - React Native Reanimated works well for simple animations
- **Cons**: 
  - Two animation libraries in bundle (but only one used per platform)

### Option 2: Migrate Everything to React Native Reanimated
- **Pros**: 
  - Single animation library
  - Smaller bundle size
  - Better mobile parity
- **Cons**: 
  - More complex web animations may be harder
  - Requires rewriting `MotionView.web.tsx`

### Option 3: Migrate Everything to Framer Motion
- **Pros**: 
  - Better web performance
  - More animation features
- **Cons**: 
  - Doesn't work on native (would need separate implementation)
  - Larger bundle size

## Current Files Using Each Approach

### Direct React Native Reanimated (242 files)
- `apps/web/src/components/WelcomeScreen.tsx`
- `apps/web/src/components/navigation/TopNavBar.tsx`
- `apps/web/src/components/enhanced/navigation/PremiumToast.tsx`
- `apps/web/src/components/enhanced/forms/PremiumToggle.tsx`
- `apps/web/src/components/enhanced/ProgressiveImage.tsx`
- `apps/web/src/components/LoadingState.tsx`
- And 237 more...

### @petspark/motion Abstraction (69 files)
- `apps/web/src/components/auth/SignInForm.tsx`
- `apps/web/src/components/auth/SignUpForm.tsx`
- `apps/web/src/components/maps/VenuePicker.tsx`
- `apps/web/src/components/playdate/PlaydateMap.tsx`
- `apps/web/src/components/web-only/Slider.tsx`
- And 64 more...

## Conclusion

**You are using BOTH, but in a smart layered way:**

1. **React Native Reanimated** = Primary library (direct usage)
2. **Framer Motion** = Used indirectly via `@petspark/motion` abstraction (web only)
3. **Custom AnimatedView** = Helper to convert Reanimated styles to CSS

The architecture allows:
- Web to use Framer Motion's powerful features via abstraction
- Native to use React Native Reanimated
- Direct Reanimated usage for simpler animations
- Unified API when needed via `@petspark/motion`

This is a **hybrid approach** that gives you the best of both worlds while maintaining code sharing between web and mobile.

