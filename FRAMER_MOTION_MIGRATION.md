# Framer Motion Migration Guide

## Overview

The PetSpark web application has been migrated from React Native Reanimated compatibility layer to native Framer Motion animations. This document explains the migration and how to use animations going forward.

> **📋 For comprehensive migration details, file-by-file guidance, and roadmap:**  
> See [apps/web/FIX_SUMMARY.md](apps/web/FIX_SUMMARY.md) for complete technical details and migration guidance.

## What Changed

### Before (React Native Reanimated Compatibility)

```tsx
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from '@petspark/motion'

function Component() {
  const opacity = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return <Animated.View style={animatedStyle}>Content</Animated.View>
}
```

### After (Framer Motion - Preferred)

```tsx
import { motion } from 'framer-motion'

function Component() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      Content
    </motion.div>
  )
}
```

### Alternative (Using Motion Package Compatibility Layer)

```tsx
import { useMotionValue, animate } from '@petspark/motion'

function Component() {
  const opacity = useMotionValue(0)

  useEffect(() => {
    animate(opacity, 1, { duration: 0.3 })
  }, [opacity])

  return <motion.div style={{ opacity }}>Content</motion.div>
}
```

## Migration Patterns

### 1. Animated.View → motion.div

**Before:**

```tsx
<Animated.View style={animatedStyle}>
  <Text>Hello</Text>
</Animated.View>
```

**After:**

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <span>Hello</span>
</motion.div>
```

### 2. useSharedValue → useMotionValue

**Before:**

```tsx
const scale = useSharedValue(1)
scale.value = withSpring(1.2)
```

**After:**

```tsx
const scale = useMotionValue(1)
animate(scale, 1.2, { type: 'spring', stiffness: 200, damping: 20 })
```

### 3. useAnimatedStyle → Direct Style Binding

**Before:**

```tsx
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
  opacity: opacity.value,
}))

return <Animated.View style={animatedStyle} />
```

**After:**

```tsx
return (
  <motion.div
    style={{
      scale,
      opacity,
    }}
  />
)
```

### 4. withSpring/withTiming → Spring/Tween Transitions

**Before:**

```tsx
opacity.value = withSpring(1, { damping: 20, stiffness: 200 })
opacity.value = withTiming(1, { duration: 300 })
```

**After:**

```tsx
// Spring
animate(opacity, 1, {
  type: 'spring',
  damping: 20,
  stiffness: 200,
})

// Timing
animate(opacity, 1, {
  duration: 0.3, // in seconds, not milliseconds
})
```

### 5. Complex Animations with useTransform

**Before:**

```tsx
const scrollY = useSharedValue(0)
const opacity = useDerivedValue(() => {
  return interpolate(scrollY.value, [0, 100], [1, 0])
})
```

**After:**

```tsx
const scrollY = useMotionValue(0)
const opacity = useTransform(scrollY, [0, 100], [1, 0])
```

## Component Patterns

### Entrance Animations

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

### Exit Animations (with AnimatePresence)

```tsx
import { AnimatePresence, motion } from 'framer-motion'

;<AnimatePresence>
  {show && (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      Content
    </motion.div>
  )}
</AnimatePresence>
```

### Gesture Animations

```tsx
<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
  Click me
</motion.div>
```

### List Animations

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

;<motion.ul variants={container} initial="hidden" animate="show">
  {items.map(item => (
    <motion.li key={item.id} variants={item}>
      {item.text}
    </motion.li>
  ))}
</motion.ul>
```

## Motion Package API Reference

The `@petspark/motion` package provides both Framer Motion APIs and compatibility APIs:

### Direct Framer Motion (Recommended)

```tsx
import { motion, animate, useMotionValue, useTransform } from '@petspark/motion'
```

### Reanimated-Compatible APIs (For Gradual Migration)

```tsx
import {
  useSharedValue, // Maps to useMotionValue
  useAnimatedStyle, // Returns CSS styles
  withSpring, // Returns animation config
  withTiming, // Returns animation config
  animate, // Direct animation function
} from '@petspark/motion'
```

### Custom Components

```tsx
import { MotionView, MotionText, MotionScrollView } from '@petspark/motion'
```

## Benefits of Framer Motion

1. **Better TypeScript Support** - Full type inference for animations
2. **Smaller Bundle Size** - No React Native polyfills needed
3. **More Features** - Layout animations, scroll animations, gestures
4. **Better Performance** - Optimized for web, uses CSS transforms
5. **Simpler API** - Declarative animations with JSX props
6. **Better Documentation** - Extensive docs at framer.com/motion

## Best Practices

1. **Use Declarative Animations** - Prefer `initial`/`animate`/`exit` props over imperative `animate()` calls
2. **Leverage Variants** - Create reusable animation configurations
3. **Use Layout Animations** - Add `layout` prop for automatic layout transitions
4. **Optimize Performance** - Use `will-change` CSS property for complex animations
5. **Consider Reduced Motion** - Use `useReducedMotion` hook for accessibility

```tsx
import { useReducedMotion } from '@petspark/motion'

function Component() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3,
      }}
    >
      Content
    </motion.div>
  )
}
```

## Resources

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Framer Motion Examples](https://www.framer.com/motion/examples/)
- [Motion Package Source](./packages/motion/)
- [Animation Recipes](./packages/motion/src/recipes/)

## Troubleshooting

### Issue: Animations not working

**Solution:** Ensure you're importing from the correct package:

```tsx
// ✅ Correct
import { motion } from 'framer-motion'
// or
import { motion } from '@petspark/motion'

// ❌ Incorrect
import { motion } from 'react-native-reanimated'
```

### Issue: Type errors with motion values

**Solution:** Use `MotionValue` type from framer-motion:

```tsx
import type { MotionValue } from 'framer-motion'

const myValue: MotionValue<number> = useMotionValue(0)
```

### Issue: Animations feel too fast/slow

**Solution:** Remember Framer Motion uses seconds, not milliseconds:

```tsx
// 300ms in Reanimated
withTiming(value, { duration: 300 })

// Same in Framer Motion
animate(value, target, { duration: 0.3 })
```

## Migration Checklist

- [x] Replace `Animated.View` with `motion.div`
- [x] Replace `Animated.Text` with `motion.span`
- [x] Update `useSharedValue` to `useMotionValue`
- [x] Convert `withSpring`/`withTiming` to `animate()` calls
- [x] Update duration values (ms → seconds)
- [x] Remove React Native imports from web code
- [x] Test all animations
- [x] Verify reduced motion support
- [x] Update documentation

## Next Steps

1. Continue migrating remaining animation hooks to use Framer Motion directly
2. Remove deprecated compatibility APIs
3. Add more animation recipes to the motion package
4. Create design system animation tokens
