# DiscoverView Migration Guide

## Overview

DiscoverView.tsx has ~20 framer-motion usages that need to be migrated to React Reanimated.

## Migration Patterns

### 1. AnimatePresence → Presence

```typescript
// Before
<AnimatePresence>
  {condition && <motion.div>...</motion.div>}
</AnimatePresence>

// After
<Presence visible={condition}>
  {condition && <AnimatedView>...</AnimatedView>}
</Presence>
```

### 2. motion.div with initial/animate → useMotionDiv + AnimatedView

```typescript
// Before
<motion.div
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ type: "spring", stiffness: 400, damping: 20 }}
>
  Content
</motion.div>

// After
const badgeMotion = useMotionDiv({
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { type: "spring", stiffness: 400, damping: 20 }
})

<AnimatedView style={badgeMotion.animatedStyle}>
  Content
</AnimatedView>
```

### 3. motion.div with whileHover/whileTap → useInteractiveMotion

```typescript
// Before
<motion.div
  whileHover={{ scale: 1.05, y: -2 }}
  whileTap={{ scale: 0.95 }}
>
  Content
</motion.div>

// After
const interactive = useInteractiveMotion({
  whileHover: { scale: 1.05, y: -2 },
  whileTap: { scale: 0.95 }
})

<AnimatedView
  style={interactive.animatedStyle}
  onMouseEnter={interactive.onMouseEnter}
  onMouseLeave={interactive.onMouseLeave}
  onMouseDown={interactive.onMouseDown}
  onMouseUp={interactive.onMouseUp}
>
  Content
</AnimatedView>
```

### 4. motion.div badges → AnimatedBadge

```typescript
// Before
<motion.div
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  exit={{ scale: 0, opacity: 0 }}
>
  <Badge>...</Badge>
</motion.div>

// After
<AnimatedBadge show={condition}>
  <Badge>...</Badge>
</AnimatedBadge>
```

### 5. motion.img with whileHover → useHoverLift

```typescript
// Before
<motion.img
  src={src}
  whileHover={{ scale: 1.1 }}
  transition={{ duration: 0.7 }}
/>

// After
const hoverLift = useHoverLift({ scale: 1.1 })

<img
  src={src}
  style={hoverLift.containerStyle}
  onMouseEnter={hoverLift.handleEnter}
  onMouseLeave={hoverLift.handleLeave}
/>
```

### 6. motion.div with repeating animations → useRepeatingAnimation

```typescript
// Before
<motion.div
  animate={{ rotate: [0, -10, 10, 0] }}
  transition={{ duration: 2, repeat: Infinity }}
>
  Content
</motion.div>

// After
const rotateAnim = useRepeatingAnimation({
  animate: { rotate: [0, -10, 10, 0] },
  duration: 2000,
  repeat: Infinity
})

<AnimatedView style={rotateAnim.animatedStyle}>
  Content
</AnimatedView>
```

## Specific Migrations Needed

### Line ~600: Badge animations

- Replace motion.div badges with AnimatedBadge component ✅ (Already done)

### Line ~765-830: Card image and buttons

- motion.img → img with useHoverLift
- motion.div with initial/animate → useMotionDiv
- motion.button → button with useInteractiveMotion

### Line ~850-860: Distance badge

- motion.div → AnimatedBadge

### Line ~915-960: Action buttons

- motion.div with whileHover/whileTap → useInteractiveMotion
- motion.div with repeating animations → useRepeatingAnimation

### Line ~962: AnimatePresence

- Replace with Presence component

### Line ~967: Dialog motion.div

- motion.div → AnimatedView with useMotionDiv

## Implementation Steps

1. ✅ Add migration hooks (useMotionDiv, useInteractiveMotion, useRepeatingAnimation)
2. ✅ Add AnimatedBadge component
3. ✅ Update imports
4. ⏳ Migrate badge animations (lines ~600)
5. ⏳ Migrate card animations (lines ~765-830)
6. ⏳ Migrate action buttons (lines ~915-960)
7. ⏳ Replace AnimatePresence (line ~962)
8. ⏳ Migrate dialog (line ~967)
9. ⏳ Test all animations
10. ⏳ Remove framer-motion import

## Testing Checklist

- [ ] Badge animations work correctly
- [ ] Card hover effects work
- [ ] Button interactions work
- [ ] Repeating animations work
- [ ] Presence transitions work
- [ ] No console errors
- [ ] 60fps maintained
- [ ] Reduced motion respected
