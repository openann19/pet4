# Template Quick Start Guide

Quick reference guide for the PETSPARK monorepo template. For detailed documentation, see [TEMPLATE_STRUCTURE.md](./TEMPLATE_STRUCTURE.md).

## Essential Commands

### Setup

```bash
# Install all dependencies
pnpm install

# Verify setup
pnpm typecheck
```

### Development

```bash
# Start web app (http://localhost:5173)
pnpm web-dev

# Start mobile app (Expo dev server)
pnpm mobile-start

# Run mobile on specific platform
pnpm mobile-android
pnpm mobile-ios
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
cd apps/web && pnpm test:cov
cd apps/mobile && pnpm test:cov

# Run E2E tests (web)
cd apps/web && pnpm e2e
```

### Code Quality

```bash
# Type check all packages
pnpm typecheck

# Lint all packages
pnpm lint

# Full quality gate (web)
cd apps/web && pnpm strict

# Full quality gate (mobile)
cd apps/mobile && pnpm ci
```

### Build & Deploy

```bash
# Build web app
cd apps/web && pnpm build

# Build mobile app (EAS)
cd apps/mobile && pnpm build:eas
```

## Key File Locations

### Configuration Files

| File                           | Purpose                               |
| ------------------------------ | ------------------------------------- |
| `package.json` (root)          | Workspace configuration, root scripts |
| `pnpm-workspace.yaml`          | Workspace package definitions         |
| `tsconfig.base.json`           | Base TypeScript configuration         |
| `eslint.config.js`             | Shared ESLint configuration           |
| `apps/web/vite.config.ts`      | Web build configuration               |
| `apps/mobile/app.config.ts`    | Expo/mobile configuration             |
| `apps/mobile/metro.config.cjs` | Metro bundler configuration           |

### Source Code Structure

#### Web App (`apps/web/src/`)

```
src/
├── main.tsx              # Entry point
├── App.tsx               # Root component
├── components/           # UI components (by feature)
├── core/                 # Domain logic
│   ├── domain/          # Domain models
│   ├── services/        # Core services
│   └── tokens/          # Design tokens
├── effects/             # Animation system
├── hooks/               # Custom hooks
├── api/                 # API clients
└── contexts/            # React contexts
```

#### Mobile App (`apps/mobile/src/`)

```
src/
├── App.tsx               # Entry point
├── components/           # UI components
├── screens/             # Screen components
├── navigation/          # Navigation setup
├── hooks/               # Custom hooks
├── store/               # Zustand stores
├── effects/             # Animation effects
└── theme/               # Theme configuration
```

#### Shared Packages (`packages/`)

```
packages/
├── shared/              # Core utilities, types
├── motion/              # Animation library
├── config/              # Feature flags
└── chat-core/           # Chat functionality
```

## Common Patterns

### Creating a New Component (Web)

```typescript
// apps/web/src/components/my-feature/MyComponent.tsx
import { memo } from 'react'
import type { ReactNode } from 'react'

export interface MyComponentProps {
  children?: ReactNode
  title: string
  onAction?: () => void
}

export const MyComponent = memo(function MyComponent({
  children,
  title,
  onAction
}: MyComponentProps) {
  return (
    <div>
      <h2>{title}</h2>
      {children}
      {onAction && <button onClick={onAction}>Action</button>}
    </div>
  )
})
```

### Creating a New Component (Mobile)

```typescript
// apps/mobile/src/components/my-feature/MyComponent.tsx
import { memo } from 'react'
import { View, Text } from 'react-native'
import type { ReactNode } from 'react'

export interface MyComponentProps {
  children?: ReactNode
  title: string
  onAction?: () => void
}

export const MyComponent = memo(function MyComponent({
  children,
  title,
  onAction
}: MyComponentProps) {
  return (
    <View>
      <Text>{title}</Text>
      {children}
    </View>
  )
})
```

### Creating an API Hook (React Query)

```typescript
// apps/web/src/hooks/api/use-my-feature.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MyFeatureAPI } from '@/api/my-feature-api'

const api = new MyFeatureAPI()

export function useMyFeature(id: string) {
  return useQuery({
    queryKey: ['my-feature', id],
    queryFn: () => api.getItem(id),
  })
}

export function useCreateMyFeature() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateData) => api.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-feature'] })
    },
  })
}
```

### Creating a Domain Function

```typescript
// apps/web/src/core/domain/my-domain.ts
export interface MyDomainEntity {
  id: string
  name: string
  status: 'active' | 'inactive'
}

export function validateStatusTransition(
  current: MyDomainEntity['status'],
  next: MyDomainEntity['status']
): boolean {
  if (current === next) return false

  const validTransitions: Record<string, string[]> = {
    active: ['inactive'],
    inactive: ['active'],
  }

  return validTransitions[current]?.includes(next) ?? false
}
```

### Creating an API Client

```typescript
// apps/web/src/api/my-feature-api.ts
import type { OptionalWithUndef } from '@/types/optional-with-undef'
import type { MyDomainEntity } from '@/core/domain/my-domain'

export interface CreateMyFeatureData {
  name: string
  status: 'active' | 'inactive'
}

export type UpdateMyFeatureData = OptionalWithUndef<Omit<MyDomainEntity, 'id' | 'createdAt'>>

export class MyFeatureAPI {
  async getItem(id: string): Promise<MyDomainEntity> {
    // Implementation
  }

  async createItem(data: CreateMyFeatureData): Promise<MyDomainEntity> {
    // Implementation
  }

  async updateItem(id: string, data: UpdateMyFeatureData): Promise<MyDomainEntity> {
    // Implementation
  }

  async deleteItem(id: string): Promise<void> {
    // Implementation
  }
}
```

### Using Animations (Cross-Platform)

```typescript
// Using @petspark/motion
import { usePressBounce, MotionView } from '@petspark/motion'

function MyComponent() {
  const { animatedStyle, handlePress } = usePressBounce()

  return (
    <MotionView style={animatedStyle} onPress={handlePress}>
      <Text>Press me</Text>
    </MotionView>
  )
}
```

### Using Shared Types

```typescript
// Import from shared package
import type { Pet, Story } from '@petspark/shared'

function MyComponent({ pet }: { pet: Pet }) {
  // Use pet type
}
```

## Troubleshooting

### Type Errors

**Problem**: TypeScript errors in workspace packages

```bash
# Solution: Rebuild shared packages
cd packages/shared && pnpm typecheck
cd packages/motion && pnpm typecheck
```

### Module Resolution Issues

**Problem**: Cannot find module `@petspark/shared`

```bash
# Solution: Verify workspace configuration
pnpm install
# Check tsconfig.json paths are correct
```

### Mobile Build Issues

**Problem**: Metro bundler can't resolve modules

```bash
# Solution: Clear Metro cache
cd apps/mobile
expo start --clear
# Or
rm -rf .expo node_modules
pnpm install
```

### ESLint Errors

**Problem**: ESLint can't find config

```bash
# Solution: Verify eslint.config.js exists at root
# Check package.json has eslint in devDependencies
pnpm install
```

### Workspace Dependency Issues

**Problem**: Workspace packages not updating

```bash
# Solution: Reinstall dependencies
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

### Test Failures

**Problem**: Tests failing after dependency updates

```bash
# Solution: Clear test cache
cd apps/web && pnpm test:run --clearCache
cd apps/mobile && pnpm test:run --clearCache
```

## Quick Reference Tables

### Path Aliases

#### Web (`apps/web`)

- `@/*` → `./src/*`

#### Mobile (`apps/mobile`)

- `@mobile/*` → `./src/*`
- `@petspark/shared` → `../../packages/shared/src`
- `@pet/domain/*` → `../web/src/core/domain/*`

### Package Scripts

#### Root

- `pnpm install:all` - Install all dependencies
- `pnpm typecheck` - Type check all packages
- `pnpm lint` - Lint all packages
- `pnpm test` - Run all tests

#### Web

- `pnpm dev` - Start dev server
- `pnpm build` - Production build
- `pnpm typecheck` - Type check
- `pnpm lint` - Lint
- `pnpm test` - Run tests
- `pnpm strict` - Run all quality gates

#### Mobile

- `pnpm start` - Start Expo dev server
- `pnpm android` - Run on Android
- `pnpm ios` - Run on iOS
- `pnpm typecheck` - Type check
- `pnpm lint` - Lint
- `pnpm test` - Run tests
- `pnpm ci` - Run CI checks

### Key Dependencies

| Package     | Version       | Purpose          |
| ----------- | ------------- | ---------------- |
| React       | 18.2.0        | Core framework   |
| TypeScript  | ~5.7.2        | Type checking    |
| Vite        | ^6.3.5        | Web build tool   |
| Expo        | ~51.0.39      | Mobile framework |
| React Query | ^5.83.1       | State management |
| Zustand     | ^4.5.0        | Global state     |
| Tailwind    | ^4.1.11 (web) | Styling          |
| Vitest      | ^4.0.6        | Testing          |

## File Naming Conventions

- **Components**: `PascalCase.tsx` (e.g., `MyComponent.tsx`)
- **Hooks**: `kebab-case.ts` (e.g., `use-my-feature.ts`)
- **Utils**: `kebab-case.ts` (e.g., `format-date.ts`)
- **Types**: `kebab-case.ts` (e.g., `user-types.ts`)
- **Tests**: `*.test.ts` or `*.test.tsx`
- **Stories**: `*.stories.tsx`

## Code Style Rules

### TypeScript

- ✅ Strict mode enabled
- ✅ Explicit return types for functions
- ✅ No `any` types (except in typed boundaries)
- ✅ Use `OptionalWithUndef<T>` for update operations

### React

- ✅ Functional components only
- ✅ Use `memo` for pure components
- ✅ Custom hooks for reusable logic
- ✅ Type props with interfaces

### Imports

- ✅ Absolute imports using path aliases
- ✅ Type-only imports: `import type { ... }`
- ✅ Group imports: external → internal → types

### Error Handling

- ✅ Always catch errors
- ✅ Use typed error classes
- ✅ Log errors with context
- ✅ Provide user-friendly error messages

## Performance Guidelines

### Web

- Lazy load routes and heavy components
- Use React.memo for expensive components
- Optimize images (WebP, lazy loading)
- Code split by feature

### Mobile

- Use FlashList for long lists
- Optimize images (exact sizes, WebP)
- Use Reanimated worklets for animations
- Avoid unnecessary re-renders

### Both

- Memoize expensive computations
- Debounce/throttle user inputs
- Use React Query caching
- Monitor bundle sizes

## Security Best Practices

- ✅ Never commit secrets
- ✅ Use environment variables
- ✅ Validate all user inputs
- ✅ Sanitize user-generated content
- ✅ Use HTTPS in production
- ✅ Implement rate limiting
- ✅ Use secure storage for sensitive data

## Accessibility (A11y)

### Web

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus management
- Screen reader testing

### Mobile

- Accessibility labels
- Touch targets ≥ 44×44pt
- Dynamic Type support
- VoiceOver/TalkBack testing
- Reduce Motion support

---

## Getting Help

1. **Check Documentation**: See [TEMPLATE_STRUCTURE.md](./TEMPLATE_STRUCTURE.md) for detailed docs
2. **Check TypeScript Errors**: Run `pnpm typecheck` to see all type errors
3. **Check Linter Errors**: Run `pnpm lint` to see all linting issues
4. **Check Test Failures**: Run `pnpm test` to see test output

---

**Quick Start Version**: 1.0.0
**Last Updated**: 2024
