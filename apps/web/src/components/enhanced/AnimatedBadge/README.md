# AnimatedBadge

An animated badge component that provides smooth scale and opacity animations using React Native Reanimated. Replaces `framer-motion` badges with a mobile-compatible solution.

## Overview

`AnimatedBadge` is a lightweight, performant badge component that animates in and out with spring-based animations. It uses React Native Reanimated for 60fps animations that work seamlessly on both web and mobile platforms.

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `children` | `ReactNode` | - | ✅ | Content to display inside the badge |
| `show` | `boolean` | `true` | ❌ | Controls badge visibility and animation |
| `className` | `string` | - | ❌ | Additional CSS classes to apply |

## Usage

### Basic Badge

```tsx
import { AnimatedBadge } from '@/components/enhanced/AnimatedBadge';

function NotificationBadge() {
  const [hasNotifications, setHasNotifications] = useState(false);

  return (
    <AnimatedBadge show={hasNotifications} className="bg-red-500 text-white px-2 py-1 rounded-full">
      {notificationCount}
    </AnimatedBadge>
  );
}
```

### Conditional Badge

```tsx
import { AnimatedBadge } from '@/components/enhanced/AnimatedBadge';

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <AnimatedBadge show={isActive} className="bg-green-500 text-white px-3 py-1 rounded-md">
      Active
    </AnimatedBadge>
  );
}
```

### With Custom Styling

```tsx
import { AnimatedBadge } from '@/components/enhanced/AnimatedBadge';

function CustomBadge() {
  return (
    <AnimatedBadge
      show={true}
      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg shadow-lg"
    >
      Premium
    </AnimatedBadge>
  );
}
```

## Animation Details

- **Enter Animation**: Scale from 0 to 1 with bouncy spring, opacity from 0 to 1 with smooth spring
- **Exit Animation**: Scale to 0 with smooth spring, opacity to 0 with smooth spring
- **Performance**: Animations run on the UI thread for 60fps performance
- **Reduced Motion**: Respects user's `prefers-reduced-motion` preference automatically

## Accessibility

- ✅ **ARIA Live Regions**: Badge content is announced to screen readers when visibility changes
- ✅ **Reduced Motion**: Automatically respects `prefers-reduced-motion` media query
- ✅ **Focus Management**: Badge does not interfere with keyboard navigation
- ✅ **Semantic HTML**: Renders as a `div` element (use `role="status"` if needed for live updates)

### A11y Best Practices

```tsx
// For status updates that should be announced
<AnimatedBadge
  show={hasNewMessages}
  className="bg-blue-500 text-white px-2 py-1 rounded-full"
  role="status"
  aria-live="polite"
>
  {messageCount} new messages
</AnimatedBadge>
```

## Related Components

- `Presence` - Used internally for enter/exit animations
- `AnimatedView` - Base animated component wrapper
- `useScaleAnimation` - Hook for custom scale animations
- `useAnimatePresence` - Hook for presence-based animations

## Implementation Notes

- Uses `react-native-reanimated` for animations (not `framer-motion`)
- Wraps content in `Presence` component for enter/exit animations
- Uses `AnimatedView` for web-compatible Reanimated styles
- Spring configs come from `@/effects/reanimated/transitions`

## Migration from Framer Motion

If migrating from `framer-motion`, replace:

```tsx
// Before (framer-motion)
<motion.div
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  exit={{ scale: 0, opacity: 0 }}
  className="badge"
>
  {content}
</motion.div>

// After (AnimatedBadge)
<AnimatedBadge show={true} className="badge">
  {content}
</AnimatedBadge>
```
