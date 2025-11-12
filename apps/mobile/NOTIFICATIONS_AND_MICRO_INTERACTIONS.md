# Notifications & Micro-Interactions System

Comprehensive notification system with animations, haptic feedback, and micro-interactions throughout the app.

## Overview

This system provides:

- **Toast Notifications**: Animated, accessible notifications with haptic feedback
- **Micro-Interactions**: Consistent press animations with haptics
- **Press Animations**: Reusable press interaction patterns
- **Unified API**: Single pattern for all interactions

## Components

### NotificationProvider

Global notification context provider. Wrap your app with it:

```typescript
import { NotificationProvider } from '@mobile/components/notifications'

export default function App() {
  return (
    <NotificationProvider maxNotifications={3}>
      {/* Your app */}
    </NotificationProvider>
  )
}
```

### NotificationToast

Animated toast component with:

- Spring animations (entrance/exit)
- Haptic feedback based on type
- Auto-dismiss with configurable duration
- Action button support
- Accessibility support

## Hooks

### useNotificationToast

Convenience hook for showing notifications:

```typescript
import { useNotificationToast } from '@mobile/hooks/use-notification-toast'

function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useNotificationToast()

  const handleSave = () => {
    showSuccess('Saved!', 'Your changes have been saved.')
  }

  return <Button onPress={handleSave}>Save</Button>
}
```

### useMicroInteractions

Hook for micro-interactions with haptic feedback:

```typescript
import { useMicroInteractions } from '@mobile/hooks/use-micro-interactions'
import { AnimatedView } from '@mobile/effects/reanimated/animated-view'

function MyButton() {
  const { animatedStyle, handlePress, handlePressIn, handlePressOut } =
    useMicroInteractions({
      hapticFeedback: true,
      hapticType: 'light',
      scaleAmount: 0.95,
      enableBounce: true,
    })

  return (
    <AnimatedView
      style={animatedStyle}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text>Press Me</Text>
    </AnimatedView>
  )
}
```

### usePressAnimation

Simplified press animation hook:

```typescript
import { usePressAnimation } from '@mobile/hooks/use-press-animation'

function MyButton() {
  const { animatedStyle, handlePressIn, handlePressOut } = usePressAnimation({
    scaleAmount: 0.95,
    hapticFeedback: true,
    hapticStyle: Haptics.ImpactFeedbackStyle.Light,
  })

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={animatedStyle}>
        <Text>Button</Text>
      </Animated.View>
    </Pressable>
  )
}
```

## Usage Examples

### Success Notification

```typescript
const { showSuccess } = useNotificationToast()

showSuccess('Operation completed!', 'Your changes have been saved successfully.')
```

### Error Notification with Action

```typescript
const { showError } = useNotificationToast()

showError('Connection failed', 'Unable to connect to the server.', {
  duration: 5000,
  action: {
    label: 'Retry',
    onPress: () => {
      // Retry logic
    },
  },
})
```

### Button with Micro-Interactions

```typescript
function SaveButton() {
  const { animatedStyle, handlePress } = useMicroInteractions({
    hapticFeedback: true,
    hapticType: 'medium',
  })

  const handleSave = () => {
    handlePress()
    // Save logic
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPress={handleSave}>
        <Text>Save</Text>
      </Pressable>
    </Animated.View>
  )
}
```

## Animation Configuration

All animations use consistent spring config:

```typescript
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 250,
  mass: 0.9,
}
```

## Haptic Feedback Types

- **success**: Success notification haptic
- **error**: Error notification haptic
- **warning**: Warning notification haptic
- **light**: Light impact haptic
- **medium**: Medium impact haptic
- **heavy**: Heavy impact haptic
- **selection**: Selection haptic

## Best Practices

1. **Use notifications for user feedback**: Success, error, warning messages
2. **Use micro-interactions for buttons**: All interactive elements should have haptic feedback
3. **Consistent animations**: Use the same hooks across the app
4. **Respect reduced motion**: Haptics and animations respect user preferences
5. **Accessibility**: All notifications are accessible with proper ARIA roles

## Testing

All hooks and components have comprehensive tests:

```bash
pnpm test use-notification-toast
pnpm test use-micro-interactions
pnpm test use-press-animation
pnpm test NotificationProvider
```

## Integration

The system integrates with:

- Existing haptic manager in `effects/chat/core/haptic-manager.ts`
- Push notifications system
- Theme system (colors)
- Reanimated animations

## Files

- `src/components/notifications/` - Notification components
- `src/hooks/use-notification-toast.ts` - Notification hook
- `src/hooks/use-micro-interactions.ts` - Micro-interactions hook
- `src/hooks/use-press-animation.ts` - Press animation hook
- `src/__tests__/` - Comprehensive tests
