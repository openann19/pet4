# PETSPARK Monorepo Template Structure

This document provides a comprehensive blueprint for the PETSPARK monorepo template structure, designed to be reusable for future web + mobile application projects.

## Table of Contents

1. [Monorepo Overview](#monorepo-overview)
2. [Monorepo Structure](#monorepo-structure)
3. [Web Application Template](#web-application-template)
4. [Mobile Application Template](#mobile-application-template)
5. [Shared Packages](#shared-packages)
6. [Core Architecture Patterns](#core-architecture-patterns)
7. [Configuration Standards](#configuration-standards)
8. [Development Workflow](#development-workflow)
9. [Key Dependencies & Versions](#key-dependencies--versions)
10. [Migration Guide](#migration-guide)

---

## Monorepo Overview

### Workspace Configuration

The monorepo uses **pnpm workspaces** for dependency management and code sharing.

**File: `pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Package Organization

```
PETSPARK/
├── apps/
│   ├── web/           # React web application (Vite)
│   └── mobile/        # React Native mobile app (Expo)
├── packages/
│   ├── shared/        # Core utilities, types, API client
│   ├── motion/        # Cross-platform animation library
│   ├── config/        # Feature flags and configuration
│   └── chat-core/     # Chat functionality
├── package.json       # Root workspace configuration
├── pnpm-workspace.yaml
├── tsconfig.base.json # Base TypeScript configuration
└── eslint.config.js   # Shared ESLint configuration
```

### Dependency Management Strategy

- **Workspace Protocol**: Packages reference each other using `workspace:*`
- **Shared Dependencies**: Common dependencies are hoisted to the root
- **Peer Dependencies**: React, React Native, and TypeScript versions are aligned across workspaces
- **Lockfile**: Single `pnpm-lock.yaml` at the root manages all dependencies

### Root-Level Scripts

**File: `package.json` (root)**

```json
{
  "scripts": {
    "install:all": "pnpm install",
    "typecheck": "pnpm --filter ./packages/shared typecheck",
    "lint": "pnpm --filter ./packages/shared lint",
    "test": "pnpm --filter ./packages/shared test:run",
    "web-dev": "pnpm --filter spark-template dev",
    "mobile-start": "pnpm --filter petspark-mobile start",
    "mobile-android": "pnpm --filter petspark-mobile android",
    "mobile-ios": "pnpm --filter petspark-mobile ios",
    "typecheck:motion": "pnpm --filter ./packages/motion typecheck && pnpm --filter ./apps/web typecheck && pnpm --filter ./apps/mobile typecheck"
  }
}
```

---

## Web Application Template

### Build System

**Framework**: Vite with React SWC

**File: `apps/web/vite.config.ts`**

- React SWC plugin for fast compilation
- Tailwind CSS plugin
- Node polyfills for browser compatibility
- React Native Web support
- Workspace package resolution
- Code splitting by feature (vendor chunks, feature chunks)

### TypeScript Configuration

**File: `apps/web/tsconfig.json`**

- Extends `tsconfig.base.json`
- Strict mode enabled
- Path aliases: `@/*` → `./src/*`
- Target: ES2022
- Module: ESNext

### Component Architecture

```
apps/web/src/
├── components/          # UI components (feature-based)
│   ├── auth/           # Authentication components
│   ├── chat/           # Chat feature components
│   ├── community/      # Community feature components
│   ├── enhanced/       # Premium UI components
│   ├── enhanced-ui/    # Advanced UI components
│   ├── ui/             # Base UI components (shadcn/ui)
│   └── views/          # Page-level views (lazy-loaded)
├── core/               # Domain logic and business rules
│   ├── domain/         # Domain models and pure functions
│   ├── services/       # Core services (moderation, media, etc.)
│   ├── tokens/         # Design tokens (colors, typography, spacing)
│   └── utils/          # Core utilities
├── effects/            # Animation and effects system
│   ├── animations/     # Framer Motion variants
│   ├── chat/           # Chat-specific effects
│   ├── micro-interactions/ # DOM-based interactions
│   ├── reanimated/     # React Native Reanimated hooks (web-compatible)
│   └── visual/         # Visual effects components
├── hooks/              # Custom React hooks
│   ├── api/            # API hooks (React Query)
│   └── ...             # Feature-specific hooks
├── api/                # API client layer
│   ├── *-api.ts        # Feature-specific API clients
│   └── types.ts        # API type definitions
├── contexts/           # React context providers
│   ├── AppContext.tsx
│   ├── AuthContext.tsx
│   └── UIContext.tsx
├── lib/                # Legacy utilities (gradual migration to core/)
└── main.tsx            # Application entry point
```

### Routing Strategy

- **React Router**: BrowserRouter with lazy-loaded routes
- **Lazy Loading**: All views imported with `lazy()` for code splitting
- **Protected Routes**: Authentication guard components

### State Management

- **Remote State**: TanStack React Query (with persistence)
- **Global State**: Zustand (minimal, feature-specific stores)
- **Local State**: React useState/useReducer
- **URL State**: React Router for navigation state

### Styling Approach

- **Framework**: Tailwind CSS 4.x
- **Design Tokens**: CSS variables in `styles/theme.css`
- **Dark Mode**: CSS selector-based (`[data-appearance="dark"]`)
- **Responsive**: Mobile-first breakpoints
- **Custom Theme**: `theme.json` for runtime theme customization

**File: `apps/web/tailwind.config.js`**

- CSS variable-based color system
- Design token spacing scale
- Custom animations (shimmer, etc.)
- Dark mode configuration

### Effects/Animations System

**Location**: `apps/web/src/effects/`

- **React Reanimated**: Cross-platform animations (web polyfill)
- **Framer Motion**: Web-only DOM animations (SVG/canvas)
- **Micro-interactions**: Ripple, shimmer, hover effects
- **Chat Effects**: Bubble animations, typing indicators, reactions
- **Performance**: Worklet-based animations, reduced motion support

### Testing Setup

- **Unit/Component Tests**: Vitest with React Testing Library
- **E2E Tests**: Playwright
- **Coverage**: 95% threshold (statements, branches, functions, lines)
- **Test Structure**: Co-located with source files (`*.test.ts`, `*.test.tsx`)

**File: `apps/web/vitest.config.ts`**

- jsdom environment
- Path aliases configured
- Coverage thresholds enforced

### Code Quality Gates

**Script: `apps/web/package.json` → `strict`**

```bash
pnpm typecheck &&
pnpm typecheck:strict-optionals &&
pnpm lint &&
pnpm stylelint &&
pnpm test:cov &&
pnpm semgrep &&
pnpm depcheck &&
pnpm tsprune &&
pnpm forbid &&
pnpm size
```

- TypeScript strict mode (zero errors)
- ESLint (zero warnings)
- Stylelint (CSS linting)
- Test coverage (≥95%)
- Security scanning (Semgrep)
- Dependency checking
- Dead code elimination (ts-prune)
- Forbidden words (TODO, FIXME, etc.)
- Bundle size limits

---

## Mobile Application Template

### Framework

**Expo SDK**: ~51.0.39
**React Native**: 0.74.5
**React**: 18.2.0

**File: `apps/mobile/app.config.ts`**

- Expo configuration
- iOS/Android native configs
- Permissions declarations
- Splash screen configuration

### TypeScript Configuration

**File: `apps/mobile/tsconfig.json`**

- Extends `tsconfig.base.json`
- Strict mode enabled
- Path aliases:
  - `@mobile/*` → `./src/*`
  - `@petspark/shared` → workspace package
  - `@pet/domain/*` → web domain logic

### Component Architecture

```
apps/mobile/src/
├── components/          # UI components
│   ├── auth/           # Authentication components
│   ├── chat/           # Chat feature components
│   ├── enhanced/       # Premium UI components
│   ├── swipe/          # Swipe gesture components
│   └── ui/             # Base UI components
├── screens/            # Screen components (route-level)
│   ├── HomeScreen.tsx
│   ├── ChatScreen.tsx
│   ├── MatchesScreen.tsx
│   └── ...
├── navigation/         # Navigation configuration
│   ├── AppNavigator.tsx
│   ├── RootShell.tsx
│   └── types.ts
├── hooks/              # Custom React hooks
│   ├── api/            # API hooks (React Query)
│   └── ...             # Feature-specific hooks
├── store/              # Zustand stores
│   ├── pets-store.ts
│   └── user-store.ts
├── providers/          # React context providers
│   └── QueryProvider.tsx
├── effects/            # Animation effects
│   ├── chat/           # Chat-specific effects
│   └── reanimated/     # React Native Reanimated hooks
├── lib/                # Utilities
│   ├── logger.ts
│   ├── haptics.ts
│   └── ...
├── theme/              # Theme configuration
│   ├── colors.ts
│   └── themes.ts
└── App.tsx             # Application entry point
```

### Navigation

- **Library**: React Navigation v7
- **Navigation Type**: Bottom tabs + Native stack
- **Structure**: RootShell → AppNavigator → TabNavigator
- **Deep Linking**: Configured via `linking.ts`

**File: `apps/mobile/src/navigation/AppNavigator.tsx`**

- Tab navigation with 6 tabs (Community, Chat, Discover, Adopt, Matches, Profile)
- Stack navigation for detail screens
- Type-safe navigation with TypeScript

### State Management

- **Remote State**: TanStack React Query (with AsyncStorage persistence)
- **Global State**: Zustand (pets, user stores)
- **Local State**: React useState/useReducer
- **Offline Support**: React Query persistence + offline queue

### Styling

- **Framework**: NativeWind (Tailwind CSS for React Native)
- **Design Tokens**: Shared with web via CSS variables bridge
- **Dark Mode**: System preference + manual toggle
- **Responsive**: Platform-specific styles (iOS/Android)

**File: `apps/mobile/tailwind.config.js`**

- NativeWind configuration
- Design token integration

### Native Modules Integration

**Expo Modules Used**:

- `expo-camera` - Camera access
- `expo-image-picker` - Image selection
- `expo-location` - Location services
- `expo-haptics` - Haptic feedback
- `expo-notifications` - Push notifications
- `expo-secure-store` - Secure storage
- `expo-file-system` - File operations
- `react-native-reanimated` - Animations (JSI)
- `@shopify/react-native-skia` - GPU graphics

### Testing Setup

- **Unit/Component Tests**: Vitest with React Native Testing Library
- **E2E Tests**: Detox (configured but optional)
- **Coverage**: 95% threshold
- **Test Structure**: `__tests__/` directories

**File: `apps/mobile/vitest.config.ts`**

- jsdom environment (web-compatible)
- Path aliases configured
- Coverage thresholds enforced

### Build & Deployment

- **Build Service**: EAS Build (Expo Application Services)
- **Configuration**: `apps/mobile/eas.json`
- **Platforms**: iOS (App Store) + Android (Play Store)
- **CI/CD**: GitHub Actions with EAS CLI

**Scripts**:

```bash
pnpm build:eas              # Build for all platforms
pnpm build:eas:ios          # Build iOS only
pnpm build:eas:android      # Build Android only
pnpm submit:ios             # Submit to App Store
pnpm submit:android         # Submit to Play Store
```

### Metro Configuration

**File: `apps/mobile/metro.config.cjs`**

- Workspace package resolution
- Node modules from workspace root
- Watch folders configured

---

## Shared Packages

### @petspark/shared

**Location**: `packages/shared/`

**Purpose**: Core utilities, types, and platform-agnostic business logic

**Structure**:

```
packages/shared/src/
├── api/                 # API client and types
├── components/          # Shared React components (Slider)
├── config/              # Configuration utilities
├── core/                # Core utilities (logger)
├── device/              # Device quality detection
├── geo/                 # Geolocation utilities (Kalman filter)
├── storage/             # Storage adapters
├── types/               # Shared TypeScript types
│   ├── pet-types.ts
│   ├── stories-types.ts
│   └── optional-with-undef.ts
└── utils/               # Utility functions
```

**Key Exports**:

- Type definitions (Pet, Story, Admin types)
- Storage adapter (cross-platform storage)
- Device quality utilities
- Geolocation utilities
- API client types

**Dependencies**:

- React 18.3.1
- React Native 0.74.5
- React Native Web 0.19.12
- React Native Reanimated 3.19.3

### @petspark/motion

**Location**: `packages/motion/`

**Purpose**: Cross-platform animation library

**Structure**:

```
packages/motion/src/
├── primitives/          # Motion primitives (MotionView, MotionText, MotionScrollView)
├── recipes/             # Animation recipes (hooks)
│   ├── usePressBounce.ts
│   ├── useHoverLift.ts
│   ├── useMagnetic.ts
│   ├── useParallax.ts
│   ├── useShimmer.ts
│   └── useRipple.ts
├── transitions/         # Transition utilities
│   └── presence.tsx
├── tokens.ts            # Animation tokens (timings, easings)
├── reduced-motion.ts    # Reduced motion utilities
└── usePerfBudget.ts     # Performance budget hooks
```

**Key Features**:

- Cross-platform (web + mobile)
- Reduced motion support
- Performance budget tracking
- Spring-based animations
- Haptic feedback integration

**Peer Dependencies**:

- React ≥18
- React Native Reanimated ≥3.6.0

### @petspark/config

**Location**: `packages/config/`

**Purpose**: Feature flags and configuration management

**Structure**:

```
packages/config/src/
├── feature-flags.ts     # Feature flag definitions
└── index.ts             # Public exports
```

**Dependencies**:

- Zod 3.25.76 (validation)

### @petspark/chat-core

**Location**: `packages/chat-core/`

**Purpose**: Chat functionality (outbox, message queue)

**Structure**:

```
packages/chat-core/src/
├── useOutbox.ts         # Outbox hook for offline messages
└── index.ts             # Public exports
```

**Dependencies**:

- React 18.3.1

### Package Dependency Graph

```
apps/web
├── @petspark/shared
├── @petspark/motion
├── @petspark/config
└── @petspark/chat-core

apps/mobile
├── @petspark/shared
├── @petspark/motion
├── @petspark/config
└── @petspark/chat-core

packages/motion
└── (peer: react-native-reanimated)

packages/shared
├── react
├── react-native
└── react-native-web
```

---

## Core Architecture Patterns

### Domain-Driven Design

**Location**: `apps/web/src/core/domain/`

Pure domain logic separated from infrastructure:

```
apps/web/src/core/domain/
├── pet-model.ts         # Pet domain model
├── matching-config.ts   # Matching configuration
├── matching-engine.ts   # Matching algorithm
├── breeds.ts            # Breed definitions
├── species.ts           # Species definitions
├── business.ts          # Business rules (entitlements, plans)
├── adoption.ts          # Adoption domain logic
├── community.ts         # Community domain logic
└── lost-found.ts        # Lost & found domain logic
```

**Principles**:

- Pure functions (no side effects)
- Type-safe domain models
- Business rule validation
- Testable in isolation

### Feature-Sliced Structure

**Web**: Feature-based component organization

```
components/
├── auth/          # Authentication feature
├── chat/          # Chat feature
├── community/     # Community feature
└── ...
```

**Mobile**: Feature-sliced with entities

```
src/
├── components/    # UI components (by feature)
├── screens/       # Screen components
├── hooks/         # Feature hooks
└── store/         # Feature stores
```

### Strict Optional Semantics

**Type**: `OptionalWithUndef<T>`

**Location**: `packages/shared/src/types/optional-with-undef.ts`

**Purpose**: Distinguish between omitted properties and explicitly undefined values

**Usage**:

```typescript
// Update operations allow explicit undefined
type UpdateUser = OptionalWithUndef<Omit<User, 'id' | 'createdAt'>>

// Can explicitly clear a field
await api.updateUser(id, { name: undefined })

// Can omit a field (don't change it)
await api.updateUser(id, { email: 'new@example.com' })
```

**Enforcement**: `tsconfig.strict-optionals.json` with `exactOptionalPropertyTypes: true`

### API Layer Patterns

**Location**: `apps/web/src/api/`

**Structure**:

```typescript
// Feature-specific API clients
export class FeatureAPI {
  async getItems(): Promise<Item[]>
  async createItem(data: CreateItemData): Promise<Item>
  async updateItem(id: string, data: UpdateItemData): Promise<Item>
  async deleteItem(id: string): Promise<void>
}

// Strict update types
type UpdateItemData = OptionalWithUndef<Omit<Item, 'id' | 'createdAt'>>
```

**Patterns**:

- Class-based API clients
- Type-safe request/response types
- Error handling with typed errors
- Domain logic validation before API calls

### Service Layer Patterns

**Location**: `apps/web/src/core/services/`

**Structure**:

```typescript
// Base service class
export abstract class BaseService {
  protected abstract serviceName: string
  // Common service functionality
}

// Feature services
export class ContentModerationService extends BaseService {
  async moderateContent(content: string): Promise<ModerationResult>
}
```

### Type Safety Patterns

**Strict TypeScript**:

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitReturns: true`
- `exactOptionalPropertyTypes: true`
- Zero `any` types (except in typed boundaries)

**Type Guards**:

```typescript
export function isPet(obj: unknown): obj is Pet {
  return typeof obj === 'object' && obj !== null && 'id' in obj
}
```

**Branded Types**:

```typescript
type UserId = string & { readonly __brand: 'UserId' }
```

---

## Configuration Standards

### TypeScript Base Configuration

**File: `tsconfig.base.json`**

**Key Settings**:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "skipLibCheck": true
  }
}
```

**All apps/packages extend this base config**.

### ESLint Configuration

**File: `eslint.config.js` (root)**

**Key Rules**:

- Zero warnings policy
- TypeScript strict rules
- React hooks rules
- Accessibility rules (jsx-a11y)
- Import rules
- No console.log (error)
- Motion library restrictions (prefer @petspark/motion over framer-motion)

**Configuration Structure**:

- Base config for all files
- Platform-specific overrides (web/mobile)
- Test file overrides (relaxed rules)
- Config file overrides (allow console)

### Prettier Setup

**Configuration**: Default Prettier settings
**Integration**: ESLint + Prettier (no conflicts)
**Pre-commit**: Format on commit via lint-staged

### Pre-commit Hooks

**Tool**: Husky + lint-staged

**File: `apps/web/.husky/pre-commit`** (if exists)

**Checks**:

- TypeScript compilation
- ESLint
- Prettier formatting
- Test execution (optional)

### CI/CD Configuration

**GitHub Actions Workflows** (typical):

**`.github/workflows/ci.yml`**:

- Type checking (all packages)
- Linting (all packages)
- Testing (all packages)
- Build verification

**`.github/workflows/eas-build.yml`** (mobile):

- EAS build for iOS/Android
- Triggered on version tags
- Artifact upload

### Performance Budgets

**Web Bundle Size**:

- Target: ≤ 500 KB (compressed)
- Monitoring: `size-limit` package

**Mobile Bundle Size**:

- Target: ≤ 12 MB JS
- Install Size: ≤ 60 MB
- Monitoring: EAS build reports

**Performance Targets**:

- Cold Start: ≤ 1.8s (mobile)
- TTI: ≤ 2.2s (mobile)
- Frame Time: ≤ 16.67ms (60 FPS)

---

## Development Workflow

### Local Development Setup

**Prerequisites**:

- Node.js ≥18
- pnpm ≥8
- (Mobile) Expo CLI (optional, EAS CLI recommended)

**Initial Setup**:

```bash
# Install all dependencies
pnpm install

# Build shared packages (if needed)
cd packages/shared && pnpm typecheck
cd packages/motion && pnpm typecheck

# Start web app
pnpm web-dev

# Start mobile app
pnpm mobile-start
```

### Dependency Installation

**Adding Dependencies**:

```bash
# Add to workspace root (shared dependency)
pnpm add -w <package>

# Add to specific app
cd apps/web && pnpm add <package>

# Add to specific package
cd packages/shared && pnpm add <package>
```

**Workspace Dependencies**:

```json
{
  "dependencies": {
    "@petspark/shared": "workspace:*"
  }
}
```

### Scripts and Commands

**Root Scripts**:

- `pnpm install:all` - Install all dependencies
- `pnpm typecheck` - Type check all packages
- `pnpm lint` - Lint all packages
- `pnpm test` - Run all tests

**Web Scripts** (apps/web):

- `pnpm dev` - Start dev server
- `pnpm build` - Production build
- `pnpm typecheck` - Type check
- `pnpm lint` - Lint
- `pnpm test` - Run tests
- `pnpm strict` - Run all quality gates

**Mobile Scripts** (apps/mobile):

- `pnpm start` - Start Expo dev server
- `pnpm android` - Run on Android
- `pnpm ios` - Run on iOS
- `pnpm typecheck` - Type check
- `pnpm lint` - Lint
- `pnpm test` - Run tests
- `pnpm ci` - Run CI checks

### Testing Workflow

**Unit Tests**:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:cov
```

**E2E Tests** (web):

```bash
cd apps/web
pnpm e2e              # Run all E2E tests
pnpm e2e:smoke        # Run smoke tests
pnpm e2e:ui           # Run with Playwright UI
```

### Code Quality Checks

**Before Commit**:

1. Type check: `pnpm typecheck`
2. Lint: `pnpm lint`
3. Format: `pnpm format:check`
4. Tests: `pnpm test:run`

**Full Quality Gate** (web):

```bash
cd apps/web
pnpm strict
```

### Deployment Process

**Web Deployment**:

1. Build: `pnpm build`
2. Deploy `dist/` to hosting (Vercel, Netlify, etc.)

**Mobile Deployment**:

1. Update version in `app.config.ts`
2. Build: `pnpm build:eas:ios` or `pnpm build:eas:android`
3. Submit: `pnpm submit:ios` or `pnpm submit:android`

---

## Key Dependencies & Versions

### React Ecosystem

| Package          | Version | Usage                         |
| ---------------- | ------- | ----------------------------- |
| React            | 18.2.0  | Core framework (web + mobile) |
| React DOM        | 18.2.0  | Web rendering                 |
| React Native     | 0.74.5  | Mobile framework              |
| React Native Web | 0.19.12 | Web compatibility layer       |

### TypeScript

| Package    | Version | Usage                         |
| ---------- | ------- | ----------------------------- |
| TypeScript | ~5.7.2  | Type checking and compilation |

### Build Tools

| Package | Version   | Usage                |
| ------- | --------- | -------------------- |
| Vite    | ^6.3.5    | Web build tool       |
| Expo    | ~51.0.39  | Mobile framework     |
| Metro   | (bundled) | React Native bundler |

### State Management

| Package               | Version | Usage                   |
| --------------------- | ------- | ----------------------- |
| @tanstack/react-query | ^5.83.1 | Remote state management |
| zustand               | ^4.5.0  | Global state management |

### Animation Libraries

| Package                 | Version      | Usage                     |
| ----------------------- | ------------ | ------------------------- |
| react-native-reanimated | ~3.10.1      | Cross-platform animations |
| framer-motion           | ^12.6.2      | Web-only DOM animations   |
| @petspark/motion        | workspace:\* | Shared animation library  |

### Styling

| Package     | Version                        | Usage                     |
| ----------- | ------------------------------ | ------------------------- |
| tailwindcss | ^4.1.11 (web), ^3.4.1 (mobile) | CSS framework             |
| nativewind  | ^4.0.1                         | Tailwind for React Native |

### Testing

| Package                       | Version | Usage                      |
| ----------------------------- | ------- | -------------------------- |
| vitest                        | ^4.0.6  | Test runner                |
| @testing-library/react        | ^14.3.1 | Component testing (web)    |
| @testing-library/react-native | ^13.3.3 | Component testing (mobile) |
| @playwright/test              | ^1.56.1 | E2E testing (web)          |

### Navigation

| Package                  | Version | Usage             |
| ------------------------ | ------- | ----------------- |
| react-router-dom         | (web)   | Web routing       |
| @react-navigation/native | ^7.0.14 | Mobile navigation |

### Code Quality

| Package           | Version  | Usage                   |
| ----------------- | -------- | ----------------------- |
| eslint            | ^9.28.0  | Linting                 |
| typescript-eslint | ^8.38.0  | TypeScript ESLint rules |
| prettier          | ^3.4.2   | Code formatting         |
| husky             | ^9.1.6   | Git hooks               |
| lint-staged       | ^15.2.10 | Pre-commit linting      |

---

## Migration Guide

### Creating a New Project from This Template

#### Step 1: Repository Setup

1. **Clone/Copy Template**:

   ```bash
   git clone <template-repo> my-new-project
   cd my-new-project
   rm -rf .git
   git init
   ```

2. **Update Project Name**:
   - Update `package.json` name fields
   - Update `apps/web/package.json` (name: "spark-template" → your name)
   - Update `apps/mobile/package.json` (name: "petspark-mobile" → your name)
   - Update workspace package names (`@petspark/*` → `@yourproject/*`)

3. **Update Configuration Files**:
   - `apps/mobile/app.config.ts` (name, slug, bundle identifiers)
   - `apps/web/vite.config.ts` (project-specific aliases)
   - Update all references to "PETSPARK" / "PetSpark"

#### Step 2: Dependencies

1. **Install Dependencies**:

   ```bash
   pnpm install
   ```

2. **Verify Workspace Resolution**:

   ```bash
   pnpm typecheck
   ```

#### Step 3: Domain Logic

1. **Update Domain Models**:
   - Modify `apps/web/src/core/domain/` for your domain
   - Update type definitions in `packages/shared/src/types/`

2. **Update API Clients**:
   - Modify `apps/web/src/api/` for your API endpoints
   - Update API types in `apps/web/src/api/types.ts`

#### Step 4: Features

1. **Remove Unused Features**:
   - Delete feature directories you don't need
   - Update navigation/routing

2. **Add Your Features**:
   - Create feature directories in `components/`
   - Add API clients in `api/`
   - Add hooks in `hooks/`

#### Step 5: Styling

1. **Update Design Tokens**:
   - Modify `apps/web/src/styles/theme.css`
   - Update `apps/web/tailwind.config.js`
   - Update `apps/mobile/src/theme/colors.ts`

2. **Update Branding**:
   - Update colors, fonts, spacing
   - Update logo/assets

#### Step 6: Configuration

1. **Update Environment Variables**:
   - Create `.env.example` files
   - Update environment configs

2. **Update CI/CD**:
   - Modify GitHub Actions workflows
   - Update EAS configuration (mobile)

#### Step 7: Testing

1. **Update Tests**:
   - Modify test files for your domain
   - Update test data/mocks

2. **Verify Quality Gates**:

   ```bash
   cd apps/web && pnpm strict
   cd apps/mobile && pnpm ci
   ```

### Key Files to Update

| File                         | What to Update                    |
| ---------------------------- | --------------------------------- |
| `package.json` (root)        | Project name, scripts             |
| `apps/web/package.json`      | App name, dependencies            |
| `apps/mobile/package.json`   | App name, dependencies            |
| `apps/mobile/app.config.ts`  | App name, bundle IDs, permissions |
| `apps/web/vite.config.ts`    | Build configuration               |
| `apps/web/src/core/domain/`  | Domain models                     |
| `apps/web/src/api/`          | API clients                       |
| `packages/shared/src/types/` | Shared types                      |
| `README.md`                  | Project documentation             |

### Common Patterns to Reuse

1. **Component Structure**: Feature-based organization
2. **API Layer**: Class-based API clients with strict types
3. **State Management**: React Query + Zustand pattern
4. **Animations**: @petspark/motion for cross-platform
5. **Testing**: Vitest + Testing Library pattern
6. **Code Quality**: Strict TypeScript + ESLint zero-warning policy

---

## Summary

This template provides:

- ✅ **Monorepo Structure**: pnpm workspaces with shared packages
- ✅ **Web App**: Vite + React + TypeScript (strict mode)
- ✅ **Mobile App**: Expo + React Native + TypeScript (strict mode)
- ✅ **Shared Code**: Cross-platform utilities and types
- ✅ **Architecture**: Domain-driven design + feature-sliced structure
- ✅ **Type Safety**: Strict TypeScript with OptionalWithUndef<T>
- ✅ **Animations**: Cross-platform animation library
- ✅ **Testing**: Vitest + Testing Library + Playwright
- ✅ **Code Quality**: Zero-warning policy with automated gates
- ✅ **Performance**: Bundle size limits and performance budgets

**Ready for Production**: All quality gates, testing, and performance budgets are configured and enforced.

---

**Last Updated**: 2024  
**Template Version**: 1.0.0  
**Maintained By**: Engineering Team
