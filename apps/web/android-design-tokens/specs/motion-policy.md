# Motion & Haptics Policy

## Motion Durations

### Standard Durations

| Token   | Duration | Usage                   |
| ------- | -------- | ----------------------- |
| instant | 0ms      | Immediate state changes |
| fast    | 150ms    | Button press feedback   |
| normal  | 240ms    | Standard transitions    |
| smooth  | 320ms    | Entry/exit animations   |
| slow    | 400ms    | Complex transitions     |
| slower  | 600ms    | Page transitions        |

### Component-Specific Durations

| Component | Action     | Duration | Easing     |
| --------- | ---------- | -------- | ---------- |
| Button    | Press      | 150ms    | spring     |
| Button    | Hover      | 240ms    | standard   |
| Card      | Entry      | 320ms    | emphasized |
| Card      | Exit       | 240ms    | accelerate |
| Card      | Drag       | 0ms      | none       |
| Sheet     | Open       | 320ms    | emphasized |
| Sheet     | Close      | 240ms    | accelerate |
| Sheet     | Swipe Down | 240ms    | accelerate |
| Modal     | Open       | 320ms    | emphasized |
| Modal     | Close      | 240ms    | accelerate |
| Modal     | Backdrop   | 240ms    | standard   |
| Toast     | Show       | 240ms    | decelerate |
| Toast     | Hide       | 150ms    | accelerate |
| Badge     | Scale      | 150ms    | spring     |
| Badge     | Fade       | 240ms    | standard   |

## Easing Functions

### Standard Easing

```kotlin
// Standard (Material 3)
StandardEasing = CubicBezier(0.2f, 0f, 0f, 1f)
// Usage: Standard entry/exit

// Decelerate
DecelerateEasing = CubicBezier(0f, 0f, 0.2f, 1f)
// Usage: Decelerating (ease-out)

// Accelerate
AccelerateEasing = CubicBezier(0.4f, 0f, 1f, 1f)
// Usage: Accelerating (ease-in)

// Emphasized (Material 3)
EmphasizedEasing = CubicBezier(0.2f, 0f, 0f, 1f)
// Usage: Emphasized transitions

// Spring
SpringSpec = SpringSpec(
    dampingRatio = 15f,
    stiffness = 250f,
    mass = 0.9f
)
// Usage: Natural spring physics
```

## Motion Usage Rules

### When to Use Motion

1. **State Changes**: Button press, selection, toggle
2. **Entry/Exit**: Cards, sheets, modals, toasts
3. **Navigation**: Page transitions, route changes
4. **Feedback**: Success, error, loading states

### When NOT to Use Motion

1. **During Gestures**: No animation during drag/swipe
2. **Reduce Motion**: Respect system preference
3. **Low-End Devices**: Disable heavy parallax
4. **Layout Shifts**: Never animate width/height

### Performance Rules

1. **Animate Only**: `transform`, `opacity`
2. **Avoid Animating**: `width`, `height`, `layout`
3. **Max Concurrent**: 8 animations
4. **Gesture Priority**: Cancel animations on gesture start

## Reduce Motion Support

### System Preference

```kotlin
val reduceMotion = LocalConfiguration.current.isScreenReaderEnabled
    || isReduceMotionEnabled()

if (reduceMotion) {
    // Disable non-essential animations
    // Keep: state feedback, focus rings
    // Remove: parallax, decorative animations
    durationMultiplier = 0.0f
}
```

### What to Disable

- Parallax effects
- Decorative animations
- Complex transitions
- Background animations

### What to Keep

- State feedback (press, hover)
- Focus rings
- Loading indicators
- Essential transitions

## Haptics Mapping

### Haptic Types

| Type   | Strength                          | Usage                      |
| ------ | --------------------------------- | -------------------------- |
| Light  | HapticFeedbackType.TextHandleMove | Taps, selections           |
| Medium | HapticFeedbackType.LongPress      | Navigation, confirmations  |
| Strong | HapticFeedbackType.KeyboardTap    | Matches, successes, errors |

### Component Haptics

| Component  | Action         | Haptic Type |
| ---------- | -------------- | ----------- |
| Button     | Press          | Light       |
| Button     | Long Press     | Medium      |
| Card       | Swipe Start    | Light       |
| Card       | Swipe Complete | Medium      |
| Match      | Like           | Strong      |
| Match      | Match          | Strong      |
| Navigation | Tab Switch     | Medium      |
| Navigation | Back           | Light       |
| Sheet      | Swipe Start    | Light       |
| Sheet      | Dismiss        | Medium      |
| Toast      | Show           | Light       |
| Error      | Show           | Strong      |
| Success    | Show           | Strong      |

### Haptic Rules

1. **Respect Preferences**: Check haptic settings
2. **Consistent Mapping**: Same action = same haptic
3. **Not Overwhelming**: Max 1 haptic per gesture
4. **Meaningful**: Only for important feedback

## Motion Implementation Checklist

### ✅ Requirements

- [ ] All animations use token durations
- [ ] All animations use token easing
- [ ] Gestures cancel animations
- [ ] Reduce Motion respected
- [ ] Haptics mapped correctly
- [ ] Performance optimized (transform/opacity only)

### ✅ Testing

- [ ] Test with Reduce Motion enabled
- [ ] Test gesture cancellation
- [ ] Test haptic feedback
- [ ] Test performance (60fps)
- [ ] Test on low-end devices

## Code Examples

### Button Press Animation

```kotlin
val scale = remember { Animatable(1f) }
val elevation = remember { Animatable(1.dp) }

LaunchedEffect(pressed) {
    if (pressed) {
        scale.animateTo(0.95f, springSpec = SpringSpec())
        elevation.animateTo(0.dp, springSpec = SpringSpec())
        performHapticFeedback(HapticFeedbackType.TextHandleMove)
    } else {
        scale.animateTo(1f, springSpec = SpringSpec())
        elevation.animateTo(1.dp, springSpec = SpringSpec())
    }
}
```

### Card Entry Animation

```kotlin
val alpha = remember { Animatable(0f) }
val scale = remember { Animatable(0.9f) }

LaunchedEffect(Unit) {
    alpha.animateTo(1f, animationSpec = tween(320, easing = EmphasizedEasing))
    scale.animateTo(1f, animationSpec = tween(320, easing = EmphasizedEasing))
}
```

### Sheet Swipe Animation

```kotlin
val offsetY = remember { Animatable(0f) }

LaunchedEffect(dismissed) {
    if (dismissed) {
        offsetY.animateTo(
            targetValue = height,
            animationSpec = tween(240, easing = AccelerateEasing)
        )
    }
}
```
