# GitHub Copilot Instructions for PetSpark

## Repository Overview

PetSpark is a comprehensive pet social networking platform built as a **pnpm monorepo** with three main applications:

- **Web App** (`apps/web`): React + Vite web application
- **Mobile App** (`apps/mobile`): React Native + Expo mobile application
- **Native App** (`apps/native`): Native implementation

### Workspace Structure

```
pet3/
├── apps/
│   ├── web/          # Web application (React + Vite)
│   ├── mobile/       # Mobile application (React Native + Expo)
│   └── native/       # Native implementation
├── packages/
│   ├── shared/       # Shared utilities and components
│   ├── motion/       # Animation library
│   ├── core/         # Core utilities
│   ├── ui-mobile/    # Mobile UI components
│   ├── chat-core/    # Chat functionality
│   └── config/       # Configuration
└── .github/
    └── instructions/ # Custom instructions for specific patterns
```

## Tech Stack

### Web (`apps/web`)

- **Framework**: React 18.3+
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Testing**: Vitest, Playwright (E2E), React Testing Library
- **TypeScript**: Strict mode enabled

### Mobile (`apps/mobile`)

- **Framework**: React Native + Expo 51
- **Navigation**: React Navigation v7
- **Styling**: React Native StyleSheet, Tailwind-like utilities
- **State Management**: TanStack Query
- **Animation**: React Native Reanimated, Shopify Skia
- **Testing**: Vitest, React Native Testing Library

### Shared

- **Language**: TypeScript 5.7+ (strict mode)
- **Package Manager**: pnpm 10.18.3+
- **Node**: 18+
- **Linting**: ESLint (TypeScript, React, JSX-A11Y)
- **Validation**: Zod

## Build Commands

### Installation

```bash
pnpm install          # Install all dependencies
```

### Development

```bash
pnpm web-dev          # Start web dev server
pnpm mobile-start     # Start Expo development server
pnpm mobile-android   # Run on Android
pnpm mobile-ios       # Run on iOS
```

### Testing & Quality

```bash
# Type checking
pnpm typecheck        # Check types in shared package
pnpm --filter spark-template typecheck  # Web app
pnpm --filter petspark-mobile typecheck # Mobile app

# Linting
pnpm lint             # Lint shared package
pnpm --filter spark-template lint       # Web app
pnpm --filter petspark-mobile lint      # Mobile app

# Testing
pnpm test             # Run shared package tests
pnpm --filter spark-template test:run   # Web app tests
pnpm --filter petspark-mobile test:run  # Mobile app tests

# E2E Testing
pnpm --filter spark-template e2e:smoke  # Run smoke tests
```

### CI Commands

```bash
# Web CI pipeline
pnpm --filter spark-template ci

# Mobile CI pipeline
pnpm --filter petspark-mobile ci
```

## Code Standards

### TypeScript

- **Strict mode enabled** with all strict checks
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `noImplicitReturns: true`
- No `any` types allowed - use proper typing
- Use `readonly` for immutable data
- Use `as const` for literal unions

### React Components

- **Function components only** (no class components)
- Use `React.memo` for pure components
- Use `forwardRef` when exposing refs
- Explicit `Props` type interfaces
- Destructure props in function signature
- Use hooks following Rules of Hooks

### Code Quality

- **No `console.*` statements** - use proper logging utilities
- **No unused variables** - enforced by ESLint
- **No magic numbers** - use named constants or design tokens
- **Accessibility**: Include proper ARIA roles, labels, keyboard handlers
- **Performance**: Use `useMemo`/`useCallback` for expensive operations
- **Error Handling**: Use error boundaries, avoid silent failures

### Styling

- **Web**: Tailwind CSS classes, design tokens from `@/core/tokens`
- **Mobile**: StyleSheet, Tamagui/NativeWind if standard, shared design tokens
- **No inline styles** with magic numbers
- Use semantic color/spacing variables

### Testing

- **All new code must have tests**
- Web: `*.test.tsx` with React Testing Library
- Mobile: `*.native.test.tsx` with React Native Testing Library
- Hooks: `*.test.ts`
- Minimum coverage maintained per package standards

## Platform-Specific Guidelines

### Web vs Mobile Development

**Web Only** (use web-specific APIs):

- Use `react-router-dom` for navigation
- DOM APIs available
- Use `next/*` imports if Next.js (not currently used)

**Mobile Only** (use React Native APIs):

- Use React Navigation for routing
- Platform-specific APIs via Expo modules
- No DOM APIs - use React Native equivalents

**Shared Code** (works on both platforms):

- Platform-agnostic logic in `packages/shared/`
- Use `.native.tsx` suffix for mobile-specific implementations
- Component structure: `Component.tsx` (web) + `Component.native.tsx` (mobile)

### File Naming Convention

- Web components: `ComponentName.tsx`
- Mobile components: `ComponentName.native.tsx`
- Shared logic: `ComponentName.ts` (no JSX)
- Tests: `ComponentName.test.tsx` or `ComponentName.native.test.tsx`
- Stories: `ComponentName.stories.tsx`

## Mobile Parity Requirements

⚠️ **Important**: When adding features to web, consider mobile parity:

1. Check if component exists in mobile (`apps/mobile/`)
2. If missing, create mobile implementation (`.native.tsx`)
3. Export from `packages/ui-mobile/index.ts` if reusable
4. Add to navigator in `AppNavigator.tsx` if it's a screen
5. Include tests and stories for both platforms

Run mobile parity check:

```bash
pnpm check:parity
```

## Architecture Patterns

### State Management

- **Server State**: TanStack Query (React Query)
- Define `useXxxQuery`/`useXxxMutation` hooks in appropriate package
- Implement error boundaries and retry policies
- Use query keys consistently

### Data Layer

- API hooks in `packages/*/api/` or feature packages
- Centralized API client configuration
- Type-safe responses with Zod validation

### Component Structure

```typescript
// Example component pattern
import { memo, forwardRef } from 'react';

interface ComponentProps {
  readonly id: string;
  readonly onAction: () => void;
}

export const Component = memo<ComponentProps>(({ id, onAction }) => {
  // Hooks at top
  // Event handlers
  // Render logic

  return (
    <div role="region" aria-label="Component">
      {/* Accessible markup */}
    </div>
  );
});

Component.displayName = 'Component';
```

### Animation

- **Web: Use Framer Motion** - The web app uses Framer Motion for all animations
  - Import from `framer-motion` directly: `import { motion } from 'framer-motion'`
  - Or use `@petspark/motion` for compatibility APIs
  - **DO NOT** use React Native Reanimated in web code
  - **DO NOT** import from `react-native` in web files
- **Mobile**: React Native Reanimated + Shopify Skia
- **Shared**: Platform-agnostic animation utilities in `packages/motion/`
- **Migration**: See `FRAMER_MOTION_MIGRATION.md` for migration guide

#### Animation Patterns (Web)

```tsx
// ✅ Preferred: Declarative Framer Motion
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// ✅ Alternative: Imperative with motion values
import { useMotionValue, animate } from '@petspark/motion';

const opacity = useMotionValue(0);
animate(opacity, 1, { duration: 0.3 });

// ❌ AVOID: React Native imports in web
import { Animated } from 'react-native'; // Wrong!
```

## Git Workflow

### Commits

- Atomic commits per feature/fix
- Use conventional commits: `feat(scope): description`, `fix(scope): description`
- Keep commits focused and reviewable

### PR Requirements

- All tests must pass
- Linting must be clean (0 warnings)
- Type checking must pass
- E2E smoke tests must pass (web)
- Code review required before merge

## Common Issues & Solutions

### Mobile Parity Gap

Current mobile app has ~60% feature parity with web. When adding new features:

1. Implement web version first
2. Immediately implement mobile version
3. Use shared logic in `packages/shared/` where possible
4. Document any platform-specific differences

### Import Paths

- Use workspace protocol: `@petspark/shared`, `@petspark/motion`
- Relative imports within same package
- Avoid circular dependencies

### Performance

- Code split routes with lazy loading
- Optimize bundle size (web has budget checks)
- Use virtualization for long lists (@shopify/flash-list on mobile)
- Memoize expensive computations

## Custom Instructions

Additional specific instructions can be found in:

- `.github/instructions/tsx.instructions.md` - TS/TSX paste-to-integrate pattern

## Quality Gates Checklist

Before submitting code, ensure:

- [ ] TypeScript: No errors, no warnings
- [ ] ESLint: Clean (0 warnings)
- [ ] Tests: Added/updated, all passing
- [ ] Accessibility: Roles, labels, keyboard support
- [ ] Performance: No unnecessary re-renders
- [ ] Mobile: Cross-platform compatibility considered
- [ ] Documentation: Updated if needed
- [ ] No `console.*` statements
- [ ] No security vulnerabilities introduced

## Documentation

For detailed project information, see:

- `QUICK_REFERENCE.md` - Feature parity overview
- `EXECUTIVE_SUMMARY.md` - High-level project summary
- `MOBILE_PARITY_IMPLEMENTATION_PLAN.md` - Mobile implementation guide
- `WEB_VS_MOBILE_ANALYSIS.md` - Platform comparison

## Support

For questions about:

- **Architecture**: Review monorepo structure and package dependencies
- **Testing**: Check existing test files in the same package
- **Styling**: Refer to design tokens in `@/core/tokens`
- **Mobile**: See React Native/Expo documentation and existing mobile components
- **Web**: Check Vite config and existing web component patterns
