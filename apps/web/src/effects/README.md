# Effects Module

Modular effects system organized by category.

## Structure

```
src/effects/
├── animations/        # Animation variants and transitions
│   ├── transitions.ts # Animation timing configurations
│   ├── variants.ts    # Component animation variants
│   ├── interactions.ts # Hover/tap interactions
│   ├── loops.ts       # Looping animations
│   └── index.ts       # Public exports
├── micro-interactions/ # DOM-based micro-interactions
│   ├── types.ts       # Type definitions
│   ├── core.ts        # Core interaction utilities
│   └── index.ts       # Public exports
├── visual/            # Visual effects components
│   ├── particle-effect.tsx
│   └── index.ts
├── hooks/            # Reusable effect hooks
│   ├── use-ripple.ts
│   ├── use-count-up.ts
│   ├── use-shimmer.ts
│   └── index.ts
└── index.ts          # Main entry point
```

## Usage

### Animations

```typescript
import { fadeInUp, springTransition } from '@/effects/animations'
import { hoverLift } from '@/effects/animations/interactions'
```

### Micro Interactions

```typescript
import { MicroInteractions } from '@/effects/micro-interactions'
import { useRipple } from '@/effects/hooks'
```

### Visual Effects

```typescript
import { ParticleEffect } from '@/effects/visual'
```

## Categories

- **Animations**: Framer Motion variants and transitions
- **Micro Interactions**: DOM-based interactions (ripples, shimmer, etc.)
- **Visual**: React components for visual effects
- **Hooks**: Reusable React hooks for effects

