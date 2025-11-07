# Navigation System

Clean, dependency-light bottom navigation system with a Feed screen that includes Discovery/Map toggle.

## Components

### RootShell

Main navigation container that manages screen switching and bottom bar.

```typescript
import { RootShell } from '@mobile/navigation'

// Use in App.tsx
export default function App() {
  return <RootShell />
}
```

### BottomNavBar

Custom bottom navigation bar with:
- Haptic feedback on press
- Badge support
- Accessibility-friendly
- Zero external dependencies (uses expo-haptics which is already installed)

Tabs:
- Community
- Chat
- Discover (Feed)
- Adopt
- Matches
- Profile

## Screens

### FeedScreen

Feed screen with Discovery/Map toggle:
- **Discovery View**: List of pets with details
- **Map View**: Optional map view (requires `react-native-maps`)

To use FeedScreen instead of HomeScreen in the feed tab, update `RootShell.tsx`:

```typescript
// import { HomeScreen } from '@mobile/screens/HomeScreen'
import { FeedScreen as HomeScreen } from '@mobile/screens/FeedScreen'
```

### Slim Screens

- **ChatScreen**: Chat/inbox placeholder
- **AdoptScreen**: Adoption marketplace placeholder
- **MatchesScreen**: Matches listing placeholder

## Usage

The navigation system is integrated and ready to use. Simply import `RootShell` in your `App.tsx`:

```typescript
import { RootShell } from '@mobile/navigation'

export default function App() {
  return <RootShell />
}
```

## Features

- ✅ Zero new dependencies
- ✅ Type-safe with strict TypeScript
- ✅ Haptic feedback
- ✅ Accessibility support
- ✅ Smooth animations (Reanimated)
- ✅ Optional map view with graceful fallback
- ✅ Follows existing design system

## Notes

- If `react-native-maps` is installed, the Map view will automatically work
- All screens use existing components (SectionHeader, FeatureCard)
- Uses existing theme colors from `@mobile/theme/colors`
- Compatible with existing navigation patterns

