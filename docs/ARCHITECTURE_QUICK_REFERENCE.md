# Architecture Quick Reference

Quick answers to common architectural questions. For comprehensive documentation, see [`../architecture.md`](../architecture.md).

## Table of Contents

- [Project Structure](#project-structure)
- [Package Dependencies](#package-dependencies)
- [Common Tasks](#common-tasks)
- [Code Organization](#code-organization)
- [Development Commands](#development-commands)
- [Troubleshooting](#troubleshooting)

---

## Project Structure

### Monorepo Layout

```
pet3-main/
├── apps/
│   ├── web/          # React web app (Vite)
│   └── mobile/       # React Native app (Expo)
├── packages/
│   ├── shared/       # Core utilities, types
│   ├── motion/       # Animation library
│   ├── core/         # Business logic, API client
│   ├── chat-core/    # Chat functionality
│   └── config/       # Feature flags
└── docs/            # Documentation
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `apps/web/src/core/domain/` | Domain models and business logic |
| `apps/web/src/lib/` | Utilities and helpers |
| `apps/mobile/src/store/` | Zustand stores (global state) |
| `packages/shared/src/` | Shared utilities and types |
| `packages/motion/src/` | Animation primitives and recipes |

---

## Package Dependencies

### Package Dependency Graph

```
apps/web
├── @petspark/shared
├── @petspark/motion
├── @petspark/core
├── @petspark/config
└── @petspark/chat-core

apps/mobile
├── @petspark/shared
├── @petspark/motion
├── @petspark/config
└── @petspark/chat-core
```

### Using Shared Packages

```typescript
// Import from shared package
import { Pet, Match } from '@petspark/shared'
import { validatePetProfile } from '@petspark/shared/utils'

// Import from motion package
import { MotionView, usePressBounce } from '@petspark/motion'

// Import from core package
import { UnifiedAPIClient } from '@petspark/core/api'
```

---

## Common Tasks

### Adding a New Shared Utility

1. Add file to `packages/shared/src/utils/`
2. Export from `packages/shared/src/index.ts`
3. Use in apps: `import { myUtil } from '@petspark/shared'`

### Adding a New Animation

1. Add hook/recipe to `packages/motion/src/recipes/`
2. Export from `packages/motion/src/index.ts`
3. Use in apps: `import { useMyAnimation } from '@petspark/motion'`

### Adding a New API Endpoint

**Web App**:
```typescript
// apps/web/src/api/my-api.ts
import { APIClient } from '@/lib/api-client'

export async function getMyData() {
  const response = await APIClient.get('/my-endpoint')
  return response.data
}
```

**Mobile App**:
```typescript
// apps/mobile/src/api/my-api.ts
import { apiClient } from '@/utils/api-client'

export async function getMyData() {
  return apiClient.get('/my-endpoint')
}
```

### Adding a New Screen (Mobile)

1. Create screen component in `apps/mobile/src/screens/`
2. Add route in `apps/mobile/src/navigation/AppNavigator.tsx`
3. Add navigation type in `apps/mobile/src/navigation/types.ts`

### Adding a New Route (Web)

1. Create page component in `apps/web/src/components/views/`
2. Add route in `apps/web/src/App.tsx` (React Router)
3. Update navigation if needed

---

## Code Organization

### State Management

| Type | Tool | Location | Use Case |
|------|------|----------|----------|
| Global State | Zustand | `apps/*/src/store/` | User auth, cached data |
| Server State | TanStack Query | `apps/*/src/hooks/` | API data, caching |
| Local State | React useState | Component | Form inputs, UI toggles |

### Component Organization

**Web**:
```
components/
├── auth/          # Authentication components
├── chat/          # Chat components
├── admin/         # Admin components
├── enhanced/      # Enhanced UI components
└── ui/            # Base UI components
```

**Mobile**:
```
components/
├── auth/          # Authentication
├── chat/          # Chat
├── swipe/         # Swipe matching
├── enhanced/      # Enhanced components
└── ui/            # Base components
```

### API Client Usage

**Current State**: Multiple implementations exist (technical debt)

**Recommended**: Use `UnifiedAPIClient` from `@petspark/core/api`

```typescript
import { UnifiedAPIClient } from '@petspark/core/api'

const client = new UnifiedAPIClient({
  baseURL: config.API_URL,
  auth: {
    getAccessToken: () => token,
    refreshAccessToken: async () => newToken,
    setAccessToken: (token) => { /* ... */ }
  }
})
```

---

## Development Commands

### Installation

```bash
pnpm install
```

### Running Applications

```bash
# Web app
pnpm web-dev
# or
cd apps/web && pnpm dev

# Mobile app
pnpm mobile-start
# or
cd apps/mobile && pnpm start
```

### Type Checking

```bash
# All packages
pnpm typecheck

# Specific package
pnpm --filter @petspark/shared typecheck
```

### Testing

```bash
# All tests
pnpm test

# With coverage
pnpm test:cov

# Specific package
pnpm --filter @petspark/shared test
```

### Linting

```bash
# All packages
pnpm lint

# Specific package
pnpm --filter @petspark/shared lint
```

### Building

```bash
# Web app
cd apps/web && pnpm build

# Mobile app (EAS)
cd apps/mobile && pnpm build:eas
```

---

## Troubleshooting

### Import Errors

**Problem**: Cannot find module '@petspark/shared'

**Solution**:
1. Ensure package is built: `cd packages/shared && pnpm typecheck`
2. Clear node_modules: `rm -rf node_modules && pnpm install`
3. Check path aliases in `tsconfig.json`

### TypeScript Errors

**Problem**: Type errors in shared package

**Solution**:
1. Run typecheck: `pnpm typecheck`
2. Check `tsconfig.base.json` extends
3. Ensure strict mode is enabled

### Metro Cache Issues (Mobile)

**Problem**: Changes not reflected in mobile app

**Solution**:
```bash
cd apps/mobile
expo start --clear
```

### Bundle Size Warnings

**Problem**: Bundle size exceeds limits

**Solution**:
1. Check bundle analysis: `pnpm size`
2. Review imports for tree-shaking
3. Use code splitting for large features

### Dependency Conflicts

**Problem**: Peer dependency warnings

**Solution**:
1. Check React version alignment (should be 18.x)
2. Check `package.json` in root and apps
3. Clear lockfile: `rm pnpm-lock.yaml && pnpm install`

---

## Path Aliases

### Web App

```typescript
import { something } from '@/lib/utils'  // → apps/web/src/lib/utils
import { Component } from '@/components' // → apps/web/src/components
```

### Mobile App

```typescript
import { something } from '@mobile/utils'  // → apps/mobile/src/utils
import { Component } from '@mobile/components' // → apps/mobile/src/components
import { Pet } from '@petspark/shared'      // → packages/shared/src
```

---

## Performance Budgets

### Web

- FCP: < 1.8s
- LCP: < 2.5s
- TTI: < 3.8s
- Bundle: < 500 KB (gzipped)

### Mobile

- Cold Start: ≤ 1.8s
- TTI: ≤ 2.2s
- Bundle: ≤ 12 MB JS
- Frame Time: ≤ 16.67ms (60 FPS)

---

## Testing

### Unit Tests

```typescript
// Vitest + React Testing Library
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

test('renders button', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByRole('button')).toBeInTheDocument()
})
```

### Coverage Thresholds

- Lines: 90%
- Branches: 85%
- Functions: 90%
- Statements: 90%

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `architecture.md` | Comprehensive architecture documentation |
| `MONOREPO.md` | Monorepo overview and quick start |
| `tsconfig.base.json` | Base TypeScript configuration |
| `pnpm-workspace.yaml` | Workspace definition |
| `apps/web/vite.config.ts` | Web build configuration |
| `apps/mobile/app.config.ts` | Expo configuration |

---

## Getting Help

1. Check [`architecture.md`](../architecture.md) for detailed information
2. Review package-specific README files
3. Check existing code examples in the codebase
4. Review test files for usage examples

---

**Last Updated**: 2025-01-27  
**See Also**: [`architecture.md`](../architecture.md) for comprehensive documentation

