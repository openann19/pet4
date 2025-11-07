# Discover View - Modular Structure

This directory contains the modular refactoring of the DiscoverView component.

## Structure

```
discover/
├── DiscoverView.tsx          # Main container (200 lines)
├── hooks/
│   ├── useDiscoverData.ts    # Data fetching logic
│   ├── useDiscoverSwipe.ts   # Swipe gesture handling
│   ├── useDiscoverFilters.ts # Filter management
│   └── useDiscoverAnimations.ts # Animation logic
├── components/
│   ├── SwipeCard.tsx         # Individual card component
│   ├── SwipeActions.tsx      # Like/Pass buttons
│   ├── DiscoverFilters.tsx   # Filter UI
│   ├── EmptyState.tsx        # No more pets state
│   └── MatchCelebration.tsx  # Match animation
└── types.ts                  # Discover-specific types
```

## Usage

The main DiscoverView component should be simplified to orchestrate these modules:

```typescript
export default function DiscoverView() {
  const data = useDiscoverData({ ... })
  const swipe = useDiscoverSwipe({ ... })
  const filters = useDiscoverFilters({ ... })
  
  return (
    <div>
      <DiscoverFilters {...filters} />
      <SwipeCard {...data} {...swipe} />
      <EmptyState {...data} />
    </div>
  )
}
```

## Migration Status

- [x] Core hooks created (useDiscoverData, useDiscoverSwipe)
- [x] Types extracted
- [ ] Component extraction (SwipeCard, etc.)
- [ ] Full integration into DiscoverView.tsx
- [ ] Testing
