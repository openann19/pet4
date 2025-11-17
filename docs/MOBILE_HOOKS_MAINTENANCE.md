# Mobile Animation Hooks Maintenance Guide

This guide covers how to maintain, test, and extend the mobile animation hooks.

## Quick Start

### Running Tests

```bash
# Run all mobile tests
cd apps/mobile
pnpm test

# Run specific test file
pnpm test use-bubble-theme.native.test.tsx

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

### Running Parity Check

```bash
# From project root
bash scripts/check_mobile_parity.sh
```

## Test Structure

All tests follow this structure:

1. **Setup**: Mock Reanimated, Gesture Handler, and shared hooks
2. **Initialization Tests**: Verify hook initializes correctly
3. **Reduced Motion Tests**: Verify reduced motion is respected
4. **Feature Tests**: Test specific features (gestures, animations, etc.)

### Test File Naming

- Pattern: `use-{hook-name}.native.test.tsx`
- Location: `apps/mobile/src/effects/reanimated/__tests__/`

### Example Test

```typescript
import { renderHook } from '@testing-library/react-native'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMyHook } from '../use-my-hook'

vi.mock('react-native-reanimated', () => {
  const actual = vi.importActual('react-native-reanimated')
  return {
    ...actual,
    useSharedValue: vi.fn((initial) => ({ value: initial })),
    useAnimatedStyle: vi.fn(() => ({})),
  }
})

describe('useMyHook (Mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useMyHook())
    expect(result.current.someValue).toBeDefined()
  })

  it('should respect reduced motion', async () => {
    const { useReducedMotionSV } = await import('../../effects/core/use-reduced-motion-sv')
    vi.mocked(useReducedMotionSV).mockReturnValue({ value: true })

    const { result } = renderHook(() => useMyHook())
    expect(result.current.animatedStyle).toBeDefined()
  })
})
```

## Adding New Hooks

### Step 1: Create Shared Logic (if applicable)

If the hook has reusable logic, extract it to `packages/motion/src/recipes/`:

```typescript
// packages/motion/src/recipes/useMyHook.ts
import { useSharedValue, useAnimatedStyle } from 'react-native-reanimated'

export function useMyHook(options: UseMyHookOptions) {
  const value = useSharedValue(0)
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: value.value,
  }))

  return { value, animatedStyle }
}
```

### Step 2: Create Mobile Adapter

Create the mobile adapter in `apps/mobile/src/effects/reanimated/`:

```typescript
// apps/mobile/src/effects/reanimated/use-my-hook.ts
import { useMyHook as useSharedMyHook } from '@petspark/motion'
import { useAnimatedStyle } from 'react-native-reanimated'
import { Gesture } from 'react-native-gesture-handler'
import { useReducedMotionSV } from '../../effects/core/use-reduced-motion-sv'
import { haptic } from '@petspark/motion'

export function useMyHook(options: UseMyHookOptions) {
  const isReducedMotion = useReducedMotionSV()
  const shared = useSharedMyHook(options)

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      if (!isReducedMotion.value) {
        // Handle gesture
      }
    })

  return {
    ...shared,
    gesture,
  }
}
```

### Step 3: Add Exports

Add to `apps/mobile/src/effects/reanimated/index.ts`:

```typescript
export { useMyHook } from './use-my-hook'
export type { UseMyHookOptions, UseMyHookReturn } from './use-my-hook'
```

### Step 4: Create Tests

Create test file `apps/mobile/src/effects/reanimated/__tests__/use-my-hook.native.test.tsx`:

```typescript
// Follow the test structure above
```

### Step 5: Create Story (Optional)

Create story file `apps/mobile/src/effects/reanimated/use-my-hook.stories.tsx`:

```typescript
import React from 'react'
import { View, Text } from 'react-native'
import { useMyHook } from './use-my-hook'

export default {
  title: 'Effects/Reanimated/useMyHook',
  component: MyHookDemo,
}

function MyHookDemo() {
  const { animatedStyle } = useMyHook()
  
  return (
    <View>
      <Animated.View style={animatedStyle}>
        <Text>Demo</Text>
      </Animated.View>
    </View>
  )
}

export const Default = () => <MyHookDemo />
```

### Step 6: Update Parity Script

Add to `scripts/check_mobile_parity.sh`:

```bash
# Add to appropriate phase array
phase1_hooks=(
  # ... existing hooks
  "use-my-hook"
)
```

## Common Patterns

### Reduced Motion Support

Always check `useReducedMotionSV` before animating:

```typescript
const isReducedMotion = useReducedMotionSV()

if (isReducedMotion.value) {
  // Set static values
  value.value = targetValue
} else {
  // Animate
  value.value = withSpring(targetValue)
}
```

### Haptic Feedback

Use `@petspark/motion/haptic` for haptic feedback:

```typescript
import { haptic } from '@petspark/motion'

// In gesture handler
if (hapticFeedback && !isReducedMotion.value) {
  haptic.selection()
}
```

### Gesture Handlers

Use `react-native-gesture-handler` for gestures:

```typescript
import { Gesture } from 'react-native-gesture-handler'

const gesture = Gesture.Pan()
  .enabled(enabled)
  .onStart(() => {
    // Handle start
  })
  .onUpdate((e) => {
    // Handle update
  })
  .onEnd(() => {
    // Handle end
  })
```

### Style Conversion

Convert web styles to React Native:

```typescript
// Web: boxShadow
// Mobile: shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation

const animatedStyle = useAnimatedStyle(() => {
  return {
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, // Android
  }
})
```

## Debugging

### Common Issues

1. **Tests failing with "Cannot find module"**
   - Check mock paths are correct
   - Ensure `vi.mock()` is called before imports

2. **Reduced motion not working**
   - Verify `useReducedMotionSV` is imported correctly
   - Check that `isReducedMotion.value` is checked before animations

3. **Gestures not working**
   - Ensure `GestureDetector` wraps the component
   - Check gesture is enabled

4. **Styles not applying**
   - Verify `useAnimatedStyle` is used
   - Check style properties are React Native compatible

### Debug Commands

```bash
# Check TypeScript errors
pnpm typecheck

# Check lint errors
pnpm lint

# Run specific test with verbose output
pnpm test use-my-hook.native.test.tsx --verbose
```

## Performance Considerations

1. **Use Native Driver**: Always use `useNativeDriver: true` when possible
2. **Minimize Re-renders**: Use `useSharedValue` for animated values
3. **Debounce Gestures**: Debounce gesture handlers for expensive operations
4. **Cancel Animations**: Cancel animations when components unmount

## Accessibility

1. **Reduced Motion**: Always respect `useReducedMotionSV`
2. **Haptic Feedback**: Provide haptic feedback for important interactions
3. **Screen Readers**: Ensure animated content is accessible

## CI/CD

### Pre-commit Checks

1. Run tests: `pnpm test`
2. Run parity check: `bash scripts/check_mobile_parity.sh`
3. Type check: `pnpm typecheck`
4. Lint: `pnpm lint`

### PR Checklist

- [ ] Tests pass
- [ ] Parity check passes
- [ ] Reduced motion tested
- [ ] Haptic feedback tested (if applicable)
- [ ] Story created (if applicable)
- [ ] Documentation updated

## Resources

- [React Native Reanimated Docs](https://docs.swmansion.com/react-native-reanimated/)
- [React Native Gesture Handler Docs](https://docs.swmansion.com/react-native-gesture-handler/)
- [Vitest Docs](https://vitest.dev/)
- [Testing Library React Native](https://callstack.github.io/react-native-testing-library/)

