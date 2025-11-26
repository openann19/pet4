# GitHub Copilot Instructions for PetSpark

## Architecture Overview

PetSpark is a pet social networking platform as a **pnpm monorepo**:

```
apps/
├── web/              # React 18 + Vite + Tailwind (spark-template)
├── mobile/           # React Native + Expo 51 (petspark-mobile)
└── backend/          # Express + Prisma + PostgreSQL (@petspark/backend)
packages/
├── shared/           # Cross-platform utils, types, API client (@petspark/shared)
├── motion/           # Animation façade (@petspark/motion) - Framer Motion (web) / Reanimated (mobile)
├── ui-mobile/        # Mobile UI components (@ui-mobile)
├── chat-core/        # Chat domain logic (@petspark/chat-core)
└── core/             # Core utilities (@petspark/core)
```

## Critical Rules (Non-Negotiable)

**BANNED in all code:**
- `@ts-ignore`, `@ts-expect-error`, `eslint-disable*` comments
- `any`, `as any`, untyped casts
- `console.log/error/warn` - use typed logger from `packages/shared/src/logger.ts`
- Magic numbers - use design tokens from `@/core/tokens`

## Commands Reference

```bash
# Development
pnpm web-dev                              # Web dev server (http://localhost:5173)
pnpm mobile-start                         # Expo dev server
pnpm --filter @petspark/backend dev       # Backend server (http://localhost:3001)

# Quality Gates (run before PR)
pnpm --filter spark-template ci           # Web: typecheck + lint + test + verify
pnpm --filter petspark-mobile ci          # Mobile: typecheck + lint + test + parity
pnpm lint                                 # Root lint (ESLint max-warnings=0)
pnpm typecheck                            # Root typecheck

# Testing
pnpm --filter spark-template test:run     # Web unit tests (Vitest)
pnpm --filter petspark-mobile test:run    # Mobile unit tests
pnpm e2e:smoke                            # Playwright E2E smoke tests
```

## Platform-Specific Patterns

### Animation (CRITICAL - Platform Split)

**Web** - Use `@petspark/motion` which wraps Framer Motion:
```tsx
// ✅ Correct - import from façade
import { motion, useMotionValue, animate } from '@petspark/motion';

<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />

// ❌ WRONG - Never import these in web code
import { Animated } from 'react-native';        // NO!
import Reanimated from 'react-native-reanimated'; // NO!
```

**Mobile** - Use React Native Reanimated directly:
```tsx
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
```

### File Naming for Platform Code
- `Component.tsx` - Web implementation
- `Component.native.tsx` - Mobile implementation (same filename, bundler resolves)
- `Component.test.tsx` / `Component.native.test.tsx` - Tests

### State Management
- **Server state**: TanStack Query v5 - define `useXxxQuery`/`useXxxMutation` hooks
- **Client state**: Zustand (mobile) or React Context (web)
- API hooks go in `packages/shared/src/api/` or feature-specific locations

## Component Patterns

```tsx
import { memo, type FC } from 'react';

interface Props {
  readonly id: string;
  readonly onAction: () => void;
}

export const MyComponent: FC<Props> = memo(({ id, onAction }) => {
  return (
    <div role="button" aria-label="Action" onClick={onAction}>
      {id}
    </div>
  );
});
MyComponent.displayName = 'MyComponent';
```

**Requirements:**
- Explicit `Props` interface with `readonly` fields
- `memo()` for pure components, `forwardRef` when exposing refs
- ARIA roles/labels for accessibility
- Tests: `*.test.tsx` with React Testing Library

## Backend Structure

Express server at `apps/backend/src/`:
- `routes/` - API endpoints (GDPR, admin, auth)
- `services/` - Business logic (GDPRService, AuditLogger, MonitoringService)
- `middleware/` - Auth (JWT), rate limiting, error handling
- `prisma/schema.prisma` - PostgreSQL schema (User, Pet, Match, Conversation, etc.)

## Import Paths

```tsx
// Workspace packages
import { cn } from '@petspark/shared';
import { motion } from '@petspark/motion';
import { SignInForm } from '@ui-mobile';

// Web app internal (apps/web)
import { Button } from '@/components/ui/button';
import { tokens } from '@/core/tokens';

// Mobile app internal (apps/mobile) 
import { HomeScreen } from '@mobile/screens/HomeScreen';
```

## Mobile Parity

When adding web features, create mobile equivalent:
1. Create `Component.native.tsx` alongside web version
2. Export from `packages/ui-mobile/index.ts`
3. Register screens in `apps/mobile/src/navigation/AppNavigator.tsx`
4. Run `pnpm check:parity` to verify

## TypeScript Configuration

Strict mode with: `noUncheckedIndexedAccess`, `noImplicitReturns`, `exactOptionalPropertyTypes` (in `src/core/`).

For update/patch DTOs with explicit `undefined` clearing, use:
```tsx
import type { OptionalWithUndef } from '@petspark/shared';
type UpdateUser = OptionalWithUndef<User>; // Distinguishes omitted vs undefined
```

## Key Files Reference

- `apps/web/src/components/` - UI components (Radix UI primitives)
- `apps/web/src/effects/` - Animation hooks and visual effects
- `apps/web/src/pages/` - Route pages
- `apps/mobile/src/screens/` - Mobile screens
- `apps/mobile/src/navigation/AppNavigator.tsx` - Navigation stack
- `packages/motion/src/index.ts` - Animation façade exports
- `FRAMER_MOTION_MIGRATION.md` - Animation migration guide
