# Navigation Integration Guide

This project has two navigation systems available:

## 1. RootShell (New - Dependency-Light)

A simple, dependency-light bottom navigation system with no external navigation libraries.

**Location**: `src/navigation/RootShell.tsx`

**Features**:
- Zero new dependencies
- Custom bottom nav bar
- Haptic feedback
- Smooth animations
- Feed screen with Discovery/Map toggle

**Usage**:

Update `src/App.tsx`:

```typescript
import { RootShell } from '@mobile/navigation'

export default function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryProvider>
          <StatusBar style="light" backgroundColor={colors.card} />
          <OfflineIndicator />
          <RootShell />  {/* Replace <AppNavigator /> */}
        </QueryProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  )
}
```

## 2. EnhancedTabNavigator (Existing - React Navigation)

A full-featured navigation system using React Navigation.

**Location**: `src/navigation/EnhancedTabNavigator.tsx`

**Features**:
- React Navigation integration
- Deep linking support
- Navigation state management
- Theme-aware navigation

**Usage**:

Currently active in `src/App.tsx`:

```typescript
import { EnhancedTabNavigator as AppNavigator } from '@mobile/navigation/EnhancedTabNavigator'

export default function App(): React.JSX.Element {
  return (
    // ...
    <AppNavigator />
    // ...
  )
}
```

## Switching Between Navigation Systems

### To use RootShell:

1. Update `src/App.tsx`:
   ```typescript
   // Change this:
   import { EnhancedTabNavigator as AppNavigator } from '@mobile/navigation/EnhancedTabNavigator'
   
   // To this:
   import { RootShell } from '@mobile/navigation'
   
   // And replace:
   <AppNavigator />
   // With:
   <RootShell />
   ```

2. (Optional) Use FeedScreen instead of HomeScreen:
   - Update `src/navigation/RootShell.tsx` line 6:
   ```typescript
   // import { HomeScreen } from '@mobile/screens/HomeScreen'
   import { FeedScreen as HomeScreen } from '@mobile/screens/FeedScreen'
   ```

### To use EnhancedTabNavigator:

Simply keep the current setup in `src/App.tsx`.

## Components

### BottomNavBar

Custom bottom navigation bar component.

**Exported from**: `@mobile/components/BottomNavBar`

**Usage**:

```typescript
import { BottomNavBar, type TabKey } from '@mobile/components/BottomNavBar'

<BottomNavBar
  active={activeTab}
  onChange={setActiveTab}
  items={[
    { key: 'feed', label: 'Discover' },
    { key: 'community', label: 'Community' },
    // ... more items
  ]}
/>
```

### Screens

All screens are available in `src/screens/`:

- `FeedScreen` - Discovery/Map toggle feed
- `ChatScreen` - Chat/inbox
- `AdoptScreen` - Adoption marketplace
- `MatchesScreen` - Matches listing
- `HomeScreen` - Home screen
- `CommunityScreen` - Community feed
- `ProfileScreen` - User profile

## Notes

- Both navigation systems can coexist in the codebase
- RootShell is lighter and has fewer dependencies
- EnhancedTabNavigator provides more advanced navigation features
- Choose based on your needs: simplicity vs. advanced features

