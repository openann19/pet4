# Global Coding Rules & Modern Techniques

This document outlines the **modern, production-grade coding standards** used throughout the PawfectMatch codebase. These rules are enforced in strict folders and should be followed for all new code.

## 🎯 Core Principles

### 1. Type Safety First

- **Zero `any` types** - Use proper TypeScript types or `unknown` with type guards
- **Strict optionals** - Use `OptionalWithUndef<T>` for update operations
- **Explicit return types** - All functions must have explicit return types
- **No `@ts-ignore` or `@ts-expect-error`** - Fix type errors properly

### 2. Modular Architecture

- **Single Responsibility** - Each module/component/hook does ONE thing well
- **Composition over Inheritance** - Prefer composition patterns
- **Pure Functions** - Domain logic should be pure and testable
- **Separation of Concerns** - UI, Logic, Data layers are separate

### 3. Performance & UX

- **React Reanimated** - Use for all animations (runs on UI thread)
- **Lazy Loading** - All views imported with `lazy()`
- **Memoization** - Use `useMemo` for expensive computations
- **Virtual Scrolling** - For long lists
- **Code Splitting** - Automatic with lazy imports

---

## 📁 Strict Optional Semantics

### When to Use `OptionalWithUndef<T>`

**Location**: `src/core/`, `src/api/`, `design-system/`

**Purpose**: Distinguish between omitted properties and explicitly undefined values.

```typescript
import type { OptionalWithUndef } from '@/types/optional-with-undef'

// ✅ CORRECT - Update operations
type UpdateUserData = OptionalWithUndef<Omit<User, 'id' | 'createdAt'>>

async updateUser(id: string, data: UpdateUserData) {
  // Can explicitly clear fields
  if (data.name !== undefined) {
    user.name = data.name ?? undefined
  }
}

// ❌ WRONG - Don't use Partial for updates
type UpdateUserData = Partial<User> // Can't distinguish omitted vs undefined
```

### Pattern: Domain Logic Validation

```typescript
// ✅ CORRECT - Pure domain functions
export function isValidLostAlertStatusTransition(
  current: LostAlertStatus,
  next: LostAlertStatus
): boolean {
  // Pure logic, no side effects
  if (current === next) return false;

  switch (current) {
    case 'active':
      return next === 'found' || next === 'archived';
    case 'found':
      return next === 'archived';
    case 'archived':
      return false;
    default:
      return false;
  }
}
```

---

## 🎣 Custom Hooks Pattern

### Standard Hook Structure

```typescript
'use client';

import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useEffect, useCallback } from 'react';
import { springConfigs } from '@/effects/reanimated/transitions';

export interface UseHookNameOptions {
  enabled?: boolean;
  duration?: number;
  hapticFeedback?: boolean;
}

export interface UseHookNameReturn {
  value: SharedValue<number>;
  animatedStyle: AnimatedStyle;
  trigger: () => void;
  reset: () => void;
}

export function useHookName(options: UseHookNameOptions = {}): UseHookNameReturn {
  const { enabled = true, duration = 300, hapticFeedback = true } = options;

  const value = useSharedValue(0);

  const trigger = useCallback(() => {
    if (hapticFeedback) {
      haptics.impact('light');
    }

    value.value = withSpring(1, springConfigs.smooth);
  }, [value, hapticFeedback]);

  const reset = useCallback(() => {
    value.value = withSpring(0, springConfigs.smooth);
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: value.value }],
    };
  }) as AnimatedStyle;

  return {
    value,
    animatedStyle,
    trigger,
    reset,
  };
}
```

### Hook Rules

1. **Always export interfaces** - `Options` and `Return` types
2. **Default parameters** - Provide sensible defaults
3. **`useCallback`** - Wrap all handlers
4. **`useEffect` cleanup** - Always clean up timers/listeners
5. **Type assertions** - Use `as AnimatedStyle` for Reanimated styles

---

## 🎨 React Reanimated Patterns

### Animation Hook Template

```typescript
'use client';

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

export function useGodTierAnimation(options = {}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  // Spring animations - Natural, bouncy
  const springAnimation = useCallback(() => {
    scale.value = withSpring(1.2, springConfigs.bouncy);
  }, [scale]);

  // Sequence animations - Chain multiple effects
  const sequenceAnimation = useCallback(() => {
    scale.value = withSequence(
      withSpring(0.9, springConfigs.smooth),
      withSpring(1.1, springConfigs.bouncy),
      withSpring(1, springConfigs.smooth)
    );
  }, [scale]);

  // Repeat animations - Continuous effects
  const pulseAnimation = useCallback(() => {
    scale.value = withRepeat(
      withSequence(withSpring(1.2, springConfigs.bouncy), withSpring(1, springConfigs.smooth)),
      -1,
      true
    );
  }, [scale]);

  // Interpolation - Smooth value mapping
  const animatedStyle = useAnimatedStyle(() => {
    const opacityValue = interpolate(scale.value, [0, 1], [0, 1], Extrapolation.CLAMP);

    return {
      transform: [{ scale: scale.value }],
      opacity: opacityValue,
    };
  }) as AnimatedStyle;

  return { animatedStyle, springAnimation, sequenceAnimation, pulseAnimation };
}
```

### Spring Configs (Predefined)

```typescript
// Use these configs - don't create custom ones
springConfigs.gentle; // { damping: 30, stiffness: 300, mass: 0.8 }
springConfigs.smooth; // { damping: 25, stiffness: 400 }
springConfigs.bouncy; // { damping: 15, stiffness: 500 }
springConfigs.snappy; // { damping: 20, stiffness: 600 }

timingConfigs.fast; // { duration: 150, easing: Easing.ease }
timingConfigs.smooth; // { duration: 300, easing: Easing.inOut(Easing.ease) }
timingConfigs.slow; // { duration: 500, easing: Easing.inOut(Easing.ease) }
timingConfigs.elastic; // { duration: 400, easing: Easing.elastic(1) }
```

### Animation Best Practices

1. **Always use `AnimatedView`** - Not regular `div` or `motion.div`
2. **Type assertions** - Cast `useAnimatedStyle` result to `AnimatedStyle`
3. **SharedValues** - Use for all animated values
4. **Interpolation** - Use for smooth value mapping
5. **Cleanup** - Cancel animations in `useEffect` cleanup

---

## 🧩 Component Architecture

### Strict Component Pattern

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useNavButtonAnimation } from '@/hooks/use-nav-button-animation'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ComponentName')

export interface ComponentNameProps {
  children?: ReactNode
  enabled?: boolean
  onAction?: (value: string) => void
}

export function ComponentName({
  children,
  enabled = true,
  onAction
}: ComponentNameProps) {
  const [state, setState] = useState<string>('')

  const animation = useNavButtonAnimation({
    isActive: enabled,
    enablePulse: true,
    enableRotation: true
  })

  const handleClick = useCallback(() => {
    if (!enabled) return

    try {
      animation.handlePress()
      onAction?.(state)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Action failed', err, { state })
    }
  }, [enabled, state, onAction, animation])

  return (
    <AnimatedView
      style={animation.buttonStyle}
      onClick={handleClick}
      onMouseEnter={animation.handleHover}
      onMouseLeave={animation.handleLeave}
    >
      {children}
    </AnimatedView>
  )
}
```

### Component Rules

1. **Always export props interface** - `ComponentNameProps`
2. **Default props** - Provide sensible defaults
3. **Error handling** - Wrap in try-catch with logging
4. **Type guards** - Use `instanceof Error` checks
5. **Structured logging** - Use `createLogger` with context

---

## 🔧 Domain Logic Pattern

### Pure Domain Functions

```typescript
/**
 * Domain logic file - Pure functions only
 * Location: src/core/domain/
 */

export type LostAlertStatus = 'active' | 'found' | 'archived';

/**
 * Validate status transition
 * Pure function - no side effects, easily testable
 */
export function isValidLostAlertStatusTransition(
  current: LostAlertStatus,
  next: LostAlertStatus
): boolean {
  if (current === next) return false;

  const validTransitions: Record<LostAlertStatus, LostAlertStatus[]> = {
    active: ['found', 'archived'],
    found: ['archived'],
    archived: [],
  };

  return validTransitions[current].includes(next);
}

/**
 * Check if alert can receive sightings
 */
export function canReceiveSightings(status: LostAlertStatus): boolean {
  return status === 'active';
}
```

### Domain Rules

1. **Pure functions** - No side effects, no dependencies
2. **Comprehensive types** - Use union types for state machines
3. **Documentation** - JSDoc comments for all public functions
4. **Testable** - Easy to unit test

---

## 🚀 API Layer Pattern

### Strict API Implementation

```typescript
import type { OptionalWithUndef } from '@/types/optional-with-undef';
import type { LostAlert } from '@/lib/lost-found-types';
import { isValidLostAlertStatusTransition } from '@/core/domain/lost-found';

export interface UpdateLostAlertData
  extends OptionalWithUndef<Omit<LostAlert, 'id' | 'createdAt' | 'updatedAt'>> {}

export class LostFoundAPI {
  async updateAlertStatus(id: string, status: LostAlertStatus, userId: string): Promise<LostAlert> {
    const alert = await this.getAlertById(id);

    if (!alert) {
      throw new Error('Alert not found');
    }

    // Use domain logic for validation
    if (!isValidLostAlertStatusTransition(alert.status, status)) {
      throw new Error(`Invalid status transition from ${alert.status} to ${status}`);
    }

    // Only owner can update
    if (alert.ownerId !== userId) {
      throw new Error('Unauthorized: Only alert owner can update status');
    }

    alert.status = status;
    alert.updatedAt = new Date().toISOString();

    await this.setAlerts(alerts);
    return alert;
  }
}
```

### API Rules

1. **Use domain logic** - Import validation from `src/core/domain/`
2. **Strict optionals** - Use `OptionalWithUndef<T>` for updates
3. **Error handling** - Specific error messages
4. **Authorization** - Check permissions before operations
5. **Type safety** - No `any`, explicit types

---

## 🎭 Effects & Animations

### Available Animation Hooks

**Location**: `src/effects/reanimated/`

```typescript
// Navigation
useNavButtonAnimation(); // Navigation button animations
useHoverLift(); // Hover lift effect
useParallaxTilt(); // Parallax tilt on mouse move

// Bubbles & Messages
useBubbleEntry(); // Message bubble entry animation
useBubbleGesture(); // Swipe gestures for bubbles
useBubbleTilt(); // 3D tilt effect
useSwipeReply(); // Swipe to reply gesture

// Reactions & Interactions
useReactionSparkles(); // Particle effects for reactions
useReactionAnimation(); // Reaction emoji animation
useBounceOnTap(); // Bounce on tap/click

// Visual Effects
useShimmer(); // Shimmer loading effect
useGlowPulse(); // Glowing pulse effect
useMagneticEffect(); // Magnetic attraction effect
useTypingShimmer(); // Typing indicator shimmer

// Media
useMediaBubble(); // Media bubble animations
useTimestampReveal(); // Timestamp reveal animation
useReceiptTransition(); // Delivery receipt transitions
```

### Using Animation Hooks

```typescript
import { useNavButtonAnimation } from '@/hooks/use-nav-button-animation'
import { AnimatedView } from '@/effects/reanimated/animated-view'

function MyComponent() {
  const animation = useNavButtonAnimation({
    isActive: true,
    enablePulse: true,
    enableRotation: true,
    hapticFeedback: true
  })

  return (
    <AnimatedView
      style={animation.buttonStyle}
      onClick={animation.handlePress}
      onMouseEnter={animation.handleHover}
      onMouseLeave={animation.handleLeave}
    >
      <AnimatedView style={animation.iconStyle}>
        <Icon />
      </AnimatedView>

      {animation.isActive && (
        <AnimatedView style={animation.indicatorStyle}>
          <div />
        </AnimatedView>
      )}
    </AnimatedView>
  )
}
```

---

## 📝 File Organization

### Directory Structure

```text
src/
├── core/                    # Strict optional domain logic
│   ├── domain/             # Pure domain functions
│   ├── types.ts            # Core types with OptionalWithUndef
│   └── utils.ts            # Domain utilities
│
├── api/                     # Strict optional API layer
│   ├── types.ts            # API types with OptionalWithUndef
│   └── *-api.ts            # API implementations
│
├── hooks/                   # Custom React hooks
│   ├── use-*.ts            # Feature hooks
│   └── use-nav-button-animation.ts
│
├── effects/                 # Animation & effects
│   └── reanimated/         # React Reanimated hooks
│       ├── transitions.ts   # Spring/timing configs
│       ├── use-*.ts         # Animation hooks
│       └── animated-view.tsx
│
├── components/              # React components
│   ├── views/              # Page views (lazy loaded)
│   ├── enhanced-ui/        # Premium UI components
│   └── lost-found/         # Feature components
│
└── lib/                     # Legacy code (gradual migration)
```

### File Naming Conventions

- **Components**: `PascalCase.tsx` - `ComponentName.tsx`
- **Hooks**: `kebab-case.ts` - `use-feature-name.ts`
- **Types**: `kebab-case.ts` - `feature-types.ts`
- **Utils**: `kebab-case.ts` - `feature-utils.ts`
- **Tests**: `*.test.ts` - `component.test.tsx`

---

## ✅ Code Quality Rules

### TypeScript Strict Mode

```typescript
// ✅ CORRECT
export function processData(data: string): number {
  return parseInt(data, 10);
}

// ❌ WRONG
export function processData(data: any): any {
  return parseInt(data);
}
```

### Error Handling

```typescript
// ✅ CORRECT - Structured error handling
try {
  await api.update(data);
} catch (error) {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error('Update failed', err, {
    dataId: data.id,
    action: 'update',
  });
  throw err;
}

// ❌ WRONG - Bare catch
try {
  await api.update(data);
} catch (error) {
  // Error swallowed
}
```

### Logging

```typescript
// ✅ CORRECT - Structured logging
const logger = createLogger('ComponentName');
logger.info('Action completed', { userId, action });
logger.error('Action failed', error, { context });

// ❌ WRONG - Console logging
console.log('Action completed');
console.error(error);
```

---

## 🎯 Animation Performance Rules

### DO ✅

1. **Use React Reanimated** - Runs on UI thread, 60fps
2. **Use SharedValues** - For all animated values
3. **Use Spring configs** - Predefined configs for consistency
4. **Use Interpolation** - Smooth value mapping
5. **Clean up animations** - Cancel in useEffect cleanup

### DON'T ❌

1. **Don't use Framer Motion** - For new animations (use Reanimated)
2. **Don't animate in JS thread** - Use SharedValues
3. **Don't create custom configs** - Use predefined springConfigs
4. **Don't forget cleanup** - Always cancel animations
5. **Don't animate too many values** - Optimize for performance

---

## 🧪 Testing Patterns

### Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useNavButtonAnimation } from './use-nav-button-animation';

describe('useNavButtonAnimation', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useNavButtonAnimation());

    expect(result.current.scale.value).toBe(1);
    expect(result.current.iconScale.value).toBe(1);
  });

  it('should handle press animation', () => {
    const { result } = renderHook(() => useNavButtonAnimation());

    act(() => {
      result.current.handlePress();
    });

    // Assert animation values
  });
});
```

### Component Testing

```typescript
import { render, screen } from '@testing-library/react'
import { ComponentName } from './ComponentName'

describe('ComponentName', () => {
  it('should render with default props', () => {
    render(<ComponentName />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should handle interactions', async () => {
    const onAction = vi.fn()
    render(<ComponentName onAction={onAction} />)

    // Simulate interaction
    await userEvent.click(screen.getByRole('button'))

    expect(onAction).toHaveBeenCalled()
  })
})
```

---

## 📚 Best Practices Summary

### TypeScript

- ✅ Strict optional semantics in `src/core/` and `src/api/`
- ✅ Explicit return types
- ✅ No `any` types
- ✅ Proper error types

### React

- ✅ Lazy loading for views
- ✅ Custom hooks for reusable logic
- ✅ Proper cleanup in useEffect
- ✅ useCallback for handlers

### Animations

- ✅ React Reanimated for all animations
- ✅ Predefined spring configs
- ✅ SharedValues for performance
- ✅ Proper type assertions

### Architecture

- ✅ Pure domain functions
- ✅ Separation of concerns
- ✅ Modular components
- ✅ Structured logging

### Performance

- ✅ Memoization for expensive computations
- ✅ Virtual scrolling for lists
- ✅ Code splitting
- ✅ UI thread animations

---

## 🚨 Critical Rules (Non-Negotiable)

1. **Zero warnings** - Code must compile and lint with 0 warnings
2. **No console.log** - Use structured logging only
3. **No TODO/FIXME** - Fix issues immediately
4. **Type safety** - No `any`, no `@ts-ignore`
5. **Test coverage** - ≥95% for new code
6. **Strict mode** - All strict folder code must pass strict checks

---

## 📖 References

- **Strict Optionals**: `STRICT_OPTIONALS_MIGRATION.md`
- **Reanimated Docs**: `src/effects/reanimated/README.md`
- **Core Domain**: `src/core/README.md`
- **API Layer**: `src/api/README.md`
- **Migration Progress**: `MIGRATION_PROGRESS.md`

---

**Last Updated**: 2024
**Version**: 1.0.0
