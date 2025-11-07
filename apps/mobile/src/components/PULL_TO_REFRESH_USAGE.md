/**
 * Pull-to-Refresh Usage Examples
 * Location: src/components/PULL_TO_REFRESH_USAGE.md
 */

# Pull-to-Refresh Implementation

This document shows how to use the production-grade pull-to-refresh hook and components.

## Quick Start

### Option 1: Use PullableContainer (Recommended)

Wrap your content with `PullableContainer` for automatic gesture handling:

```tsx
import { PullableContainer } from '@/components'

function MyScreen() {
  const handleRefresh = async () => {
    await fetchData()
  }

  return (
    <PullableContainer
      onRefresh={handleRefresh}
      refreshOptions={{
        threshold: 80,
        maxPull: 120,
        resistance: 2.5,
      }}
    >
      <ScrollView>
        {/* Your content */}
      </ScrollView>
    </PullableContainer>
  )
}
```

### Option 2: Manual Integration

For more control, use the hook directly:

```tsx
import { GestureDetector } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import { RefreshControl } from '@/components'

function MyScreen() {
  const { gesture, animatedStyle, isRefreshing, translateY, progress } = usePullToRefresh(
    async () => {
      await fetchData()
    },
    {
      threshold: 80,
      haptics: true,
      onPullProgress: (p) => {
        // Optional: Custom progress handling
      },
    }
  )

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle}>
        <RefreshControl
          refreshing={isRefreshing}
          translateY={translateY}
          progress={progress}
          threshold={80}
        />
        <ScrollView>
          {/* Your content */}
        </ScrollView>
      </Animated.View>
    </GestureDetector>
  )
}
```

## Features

- ✅ Real gesture support with resistance and max pull
- ✅ Progress tracking [0..1] for custom animations
- ✅ One-shot haptic feedback at threshold
- ✅ Reduced motion support (respects accessibility settings)
- ✅ Safe re-entry prevention
- ✅ UI thread animations (60fps)
- ✅ Type-safe with full TypeScript support

## API Reference

### `usePullToRefresh(onRefresh, options?)`

**Parameters:**
- `onRefresh: () => Promise<void>` - Async refresh callback
- `options?: UsePullToRefreshOptions`

**Returns:**
- `isRefreshing: boolean` - React state for UI
- `refresh: () => Promise<void>` - Programmatic trigger
- `translateY: SharedValue<number>` - Animated translate value
- `progress: SharedValue<number>` - Normalized progress [0..1]
- `gesture: Gesture.Pan` - Gesture handler for GestureDetector
- `animatedStyle: AnimatedStyle` - Ready-to-use transform style

### `UsePullToRefreshOptions`

```typescript
{
  threshold?: number              // Trigger distance (default: 80px)
  maxPull?: number                // Max pull distance (default: 120px)
  resistance?: number             // Drag resistance >1 (default: 2.5)
  springConfig?: WithSpringConfig // Spring animation config
  haptics?: boolean               // Enable haptics (default: true)
  hapticStyle?: ImpactFeedbackStyle // Haptic style (default: Light)
  onPullProgress?: (progress: number) => void // Progress callback
}
```

### `PullableContainer` Props

```typescript
{
  onRefresh: () => Promise<void>
  children: ReactNode
  refreshOptions?: UsePullToRefreshOptions
  showRefreshControl?: boolean   // Show default refresh UI (default: true)
  style?: AnimatedStyle
  contentContainerStyle?: AnimatedStyle
}
```

### `RefreshControl` Props

```typescript
{
  refreshing?: boolean
  translateY: SharedValue<number>
  progress?: SharedValue<number>  // Optional, falls back to translateY
  threshold?: number              // Used if progress not provided
}
```

## Best Practices

1. **Always use async callbacks** - The hook expects `Promise<void>` return
2. **Handle errors gracefully** - Errors are logged but won't break the UI
3. **Respect reduced motion** - The hook automatically handles this
4. **Use PullableContainer** - Simplifies integration unless you need custom gestures
5. **Progress callbacks** - Use sparingly; they're throttled to avoid JS thread overload

## Performance Notes

- All animations run on UI thread (60fps)
- Progress callbacks are throttled (>2% change)
- Haptics are one-shot to prevent buzz-storms
- Gesture cancels ongoing animations for smooth interaction

