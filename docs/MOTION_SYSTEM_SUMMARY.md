# Motion System Summary

## Overview

The PETSPARK motion system provides a unified, canonical set of motion tokens and hooks that work across web (Framer Motion) and mobile (React Native Reanimated) platforms. This system ensures consistent, premium animations throughout the application with Telegram X / iMessage-level feel.

## Motion Tokens

### Location
- `packages/motion/src/motionTokens.ts` - Core token definitions
- `packages/motion/src/framer-api/motionTokens.ts` - Web-specific mappings

### Token Categories

#### Durations
- `instant`: 75ms - Immediate feedback, reduced motion fallback
- `fast`: 150ms - Quick interactions, micro-animations
- `normal`: 260ms - Standard transitions, default timing
- `slow`: 400ms - Deliberate animations, emphasis

#### Easings (cubic-bezier tuples)
- `standard`: [0.2, 0, 0.2, 1] - Balanced, natural motion
- `decel`: [0, 0, 0.2, 1] - Deceleration, easing out
- `accel`: [0.4, 0, 1, 1] - Acceleration, quick start
- `springy`: [0.34, 1.56, 0.64, 1] - Spring-like feel

#### Springs
- `press`: { stiffness: 400, damping: 25, mass: 0.8 } - Quick, responsive press feedback
- `bubble`: { stiffness: 300, damping: 20, mass: 1 } - Chat bubble entry animations
- `sheet`: { stiffness: 280, damping: 30, mass: 1 } - Bottom sheets, side panels
- `modal`: { stiffness: 250, damping: 28, mass: 1.2 } - Dialogs, overlays, modals

## Canonical Hooks

### Location
- `packages/motion/src/hooks/` - Platform-agnostic hook definitions
- Web: `*.ts` files use Framer Motion
- Mobile: `*.native.ts` files use React Native Reanimated

### Available Hooks

#### usePressMotion
For buttons, icon buttons, FABs, and small pills.

**Web Usage:**
```tsx
const pressMotion = usePressMotion({ scaleOnPress: 0.95, scaleOnHover: 1.02 })
<MotionView {...pressMotion.motionProps}>...</MotionView>
```

**Mobile Usage:**
```tsx
const pressMotion = usePressMotion({ scaleOnPress: 0.95 })
<Animated.View style={pressMotion.animatedStyle}>
  <Pressable onPressIn={pressMotion.onPressIn} onPressOut={pressMotion.onPressOut}>
    ...
  </Pressable>
</Animated.View>
```

#### useBubbleEntryMotion
For chat bubbles and small cards entering a list.

**Web Usage:**
```tsx
const bubbleMotion = useBubbleEntryMotion({ index: 0, direction: 'right', isOwn: true })
<MotionView {...bubbleMotion.motionProps}>...</MotionView>
```

**Mobile Usage:**
```tsx
const bubbleMotion = useBubbleEntryMotion({ index: 0, direction: 'right', isOwn: true })
<Animated.View entering={bubbleMotion.entering} exiting={bubbleMotion.exiting} style={bubbleMotion.animatedStyle}>
  ...
</Animated.View>
```

#### useListItemPresenceMotion
For list items (conversations, notifications, adoption cards).

**Web Usage:**
```tsx
const listItemMotion = useListItemPresenceMotion({ index: 0 })
<MotionView {...listItemMotion.motionProps}>...</MotionView>
```

**Mobile Usage:**
```tsx
const listItemMotion = useListItemPresenceMotion({ index: 0 })
<Animated.View entering={listItemMotion.entering} exiting={listItemMotion.exiting}>
  ...
</Animated.View>
```

#### useOverlayTransition
For sheets, dialogs, drawers, and modals.

**Web Usage:**
```tsx
const overlay = useOverlayTransition({ type: 'modal', isOpen: true })
<MotionView {...overlay.backdropProps}>...</MotionView>
<MotionView {...overlay.contentProps}>...</MotionView>
```

**Mobile Usage:**
```tsx
const overlay = useOverlayTransition({ type: 'modal', isOpen: true })
<Animated.View entering={overlay.backdropEntering} exiting={overlay.backdropExiting} style={overlay.backdropStyle}>
  <Animated.View entering={overlay.contentEntering} exiting={overlay.contentExiting} style={overlay.contentStyle}>
    ...
  </Animated.View>
</Animated.View>
```

## Current Applications

### Web Components Migrated
- ✅ `apps/web/src/components/ui/enhanced-button.tsx` - Uses `usePressMotion`
- ✅ `apps/web/src/components/enhanced/PremiumButton.tsx` - Uses `usePressMotion`
- ✅ `apps/web/src/components/ui/dialog.tsx` - Uses `useOverlayTransition`

### Mobile Components
- Mobile hooks are available and ready for migration
- Components can be migrated incrementally as needed

## Reduced Motion Support

All hooks and tokens respect the `useReducedMotion()` hook from `@petspark/motion`. When reduced motion is enabled:
- Animations use instant durations (≤120ms)
- Scale transforms are disabled
- Only minimal opacity changes are applied

## Migration Notes

### From Legacy Hooks
When migrating from existing hooks like `useHoverLift`, `useBounceOnTap`, etc.:

1. Replace with `usePressMotion` for button interactions
2. Replace entry animations with `useBubbleEntryMotion` or `useListItemPresenceMotion`
3. Replace overlay animations with `useOverlayTransition`

### Platform Differences
- Web hooks return `motionProps` for Framer Motion
- Mobile hooks return `animatedStyle`, `entering`, `exiting` for Reanimated
- Both maintain the same TypeScript interface for app code

## Future Enhancements

- Additional motion tokens as needed
- More specialized hooks for specific use cases
- Performance optimizations
- Animation presets for common patterns

