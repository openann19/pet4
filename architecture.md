# PetSpark Architecture Documentation

**Version**: 2.0.0  
**Last Updated**: 2025-01-27  
**Status**: Production

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Monorepo Structure](#monorepo-structure)
3. [Applications](#applications)
4. [Shared Packages](#shared-packages)
5. [Architecture Patterns](#architecture-patterns)
6. [Development Workflow](#development-workflow)
7. [Deployment & Infrastructure](#deployment--infrastructure)
8. [Security & Compliance](#security--compliance)
9. [Performance Standards](#performance-standards)
10. [Future Improvements](#future-improvements)

---

## Executive Summary

### Project Overview

PetSpark is a comprehensive pet companion matching platform built as a monorepo containing web and mobile applications. The platform enables pet owners to discover, match, and connect with other pets through intelligent matching algorithms, real-time chat, and social features.

### Architecture Principles

1. **Monorepo First**: Single repository for all applications and shared packages
2. **Code Sharing**: Maximum code reuse between web and mobile platforms
3. **Type Safety**: Strict TypeScript across all packages
4. **Performance**: Optimized for 60fps animations and fast load times
5. **Accessibility**: WCAG 2.1 AA compliance
6. **Developer Experience**: Comprehensive tooling, testing, and documentation

### Technology Decisions

- **Package Manager**: pnpm (workspace protocol for internal dependencies)
- **Frontend Framework**: React 18.3.1 (web), React Native 0.74.5 (mobile)
- **Build Tools**: Vite (web), Metro/Expo (mobile)
- **State Management**: Zustand (global state), TanStack Query (server state)
- **Animation**: React Native Reanimated 3.10.1 (cross-platform), @petspark/motion (abstraction layer)
- **TypeScript**: 5.7.2 with strict mode enabled
- **Testing**: Vitest (unit/integration), Playwright (E2E web), React Native Testing Library (mobile)

---

## Monorepo Structure

### Workspace Configuration

The monorepo uses **pnpm workspaces** for dependency management and code sharing.

**File: `pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Directory Structure

```
pet3-main/
├── apps/
│   ├── web/              # React web application (Vite)
│   └── mobile/           # React Native mobile app (Expo)
├── packages/
│   ├── shared/           # Core utilities, types, API client
│   ├── motion/           # Cross-platform animation library
│   ├── core/             # Core business logic and API client
│   ├── chat-core/        # Chat functionality (outbox, queue)
│   ├── config/           # Feature flags and configuration
│   └── ui-mobile/        # Mobile UI components (placeholder)
├── .github/
│   └── workflows/        # CI/CD workflows
├── docs/                 # Documentation
├── scripts/              # Build and utility scripts
├── package.json          # Root workspace configuration
├── pnpm-workspace.yaml   # Workspace definition
├── tsconfig.base.json    # Base TypeScript configuration
└── architecture.md       # This document
```

### Dependency Management Strategy

#### Workspace Protocol

Packages reference each other using `workspace:*` protocol:

```json
{
  "dependencies": {
    "@petspark/shared": "workspace:*",
    "@petspark/motion": "workspace:*"
  }
}
```

#### Dependency Hoisting

- Common dependencies are hoisted to the root `node_modules`
- React, React Native, and TypeScript versions are aligned across workspaces
- Single `pnpm-lock.yaml` at the root manages all dependencies

#### Peer Dependencies

Critical dependencies are declared as peer dependencies to ensure version consistency:

- React ≥18
- React Native ≥0.74.5
- TypeScript ~5.7.2
- react-native-reanimated ~3.10.1

### Path Aliases

#### Web App (`apps/web/tsconfig.json`)

```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@design-system/*": ["./design-system/*"],
    "@petspark/chat-core": ["../../packages/chat-core/src/index.ts"],
    "@petspark/config": ["../../packages/config/src/index.ts"]
  }
}
```

#### Mobile App (`apps/mobile/tsconfig.json`)

```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@mobile/*": ["./src/*"],
    "@pet/domain/*": ["../web/src/core/domain/*"],
    "@petspark/shared": ["../../packages/shared/src"],
    "@shared/types": ["../../packages/shared/src/types/index.ts"],
    "@shared/utils": ["../../packages/shared/src/utils/index.ts"]
  }
}
```

---

## Applications

### Web Application (`apps/web/`)

#### Technology Stack

- **Framework**: React 18.3.1
- **Build Tool**: Vite 6.3.5
- **Routing**: React Router 6.28.0
- **UI Library**: Radix UI components
- **Styling**: Tailwind CSS 4.1.11
- **State Management**: 
  - Zustand (global state)
  - TanStack Query 5.83.1 (server state)
- **Animation**: 
  - React Native Reanimated (via @petspark/motion)
  - Framer Motion (web-only, restricted paths)

#### Build Configuration

**File: `apps/web/vite.config.ts`**

- React SWC plugin for fast compilation
- Tailwind CSS Vite plugin
- Node polyfills for compatibility
- Path alias resolution
- JSX transformation for react-native-reanimated

#### Key Features

- Progressive Web App (PWA) capabilities
- Real-time chat with WebSocket simulation
- Pet matching and discovery
- Media upload and processing
- Admin console for moderation
- Analytics and monitoring
- Accessibility features (WCAG 2.1 AA)

#### Project Structure

```
apps/web/src/
├── api/                    # API client implementations
├── components/              # React components
│   ├── auth/               # Authentication components
│   ├── chat/                # Chat components
│   ├── admin/               # Admin console
│   ├── enhanced/            # Enhanced UI components
│   └── ui/                  # Base UI components
├── core/                    # Domain logic
│   ├── domain/              # Domain models
│   ├── services/            # Business services
│   └── config/              # Configuration
├── effects/                 # Animation effects
│   ├── reanimated/          # Reanimated hooks
│   ├── chat/                # Chat-specific effects
│   └── animations/          # General animations
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities and helpers
├── providers/               # React context providers
└── types/                   # TypeScript type definitions
```

### Mobile Application (`apps/mobile/`)

#### Technology Stack

- **Framework**: React Native 0.74.5
- **Build System**: Expo SDK 51.0.39
- **Navigation**: React Navigation 7.x
- **Styling**: NativeWind 4.0.1 (Tailwind for React Native)
- **State Management**: 
  - Zustand 4.5.0 (global state)
  - TanStack Query 5.0.0 (server state)
- **Animation**: React Native Reanimated 3.10.1
- **UI Components**: Custom components + Radix UI primitives

#### Expo Configuration

**File: `apps/mobile/app.config.ts`**

- Bundle identifier: `com.pawfectmatch.app`
- Hermes JavaScript engine
- Automatic updates enabled
- Asset bundle patterns configured
- iOS and Android native configurations
- Privacy manifests for App Store compliance

#### Key Features

- Native iOS and Android apps
- Offline support with outbox pattern
- Push notifications (Expo Notifications)
- Camera and image picker integration
- Location services
- Biometric authentication
- Haptic feedback
- Performance optimizations (FlashList, FastImage)

#### Project Structure

```
apps/mobile/src/
├── components/              # React Native components
│   ├── auth/               # Authentication
│   ├── chat/               # Chat components
│   ├── enhanced/           # Enhanced UI components
│   ├── swipe/              # Swipe matching
│   └── ui/                 # Base UI components
├── effects/                # Animation effects
│   ├── reanimated/         # Reanimated hooks
│   ├── chat/               # Chat-specific effects
│   └── core/               # Core effects
├── hooks/                  # Custom hooks
├── lib/                    # Utilities
├── navigation/             # Navigation configuration
├── screens/                # Screen components
├── store/                  # Zustand stores
├── theme/                  # Theme configuration
└── utils/                  # Utility functions
```

#### Performance Budgets

- **Cold Start**: ≤ 1.8s
- **Time to Interactive (TTI)**: ≤ 2.2s
- **Bundle Size**: ≤ 12 MB JS
- **Install Size**: ≤ 60 MB
- **Frame Time**: ≤ 16.67ms (60 FPS)
- **Memory**: ≤ 200 MB

---

## Shared Packages

### @petspark/shared

**Location**: `packages/shared/`  
**Purpose**: Core utilities, types, and cross-platform API client

#### Exports

- **Types**: Pet types, story types, admin types
- **Utilities**: Validation, stories utilities, general utilities
- **API Client**: Cross-platform API client (`packages/shared/src/api/client.ts`)
- **Components**: Shared UI components (Card, Slider)
- **Storage**: Storage adapter interface
- **Device**: Device quality detection
- **Geo**: Kalman filter for location
- **Motion**: Re-exports from @petspark/motion (with type aliases)

#### Dependencies

- React 18.3.1
- React Native 0.74.5
- react-native-web 0.19.12
- react-native-reanimated ~3.10.1
- Zod 3.25.76 (validation)
- Radix UI Slider (for Slider component)

#### Usage

```typescript
import { Pet, Match } from '@petspark/shared'
import { createApiClient } from '@petspark/shared/api'
import { validatePetProfile } from '@petspark/shared/utils'
```

### @petspark/motion

**Location**: `packages/motion/`  
**Purpose**: Cross-platform animation library abstraction

#### Features

- React Native Reanimated facade
- Custom animation primitives (MotionView, MotionText, MotionScrollView)
- Animation recipes (usePressBounce, useHoverLift, useMagnetic, etc.)
- Chat-specific animations (bubble effects, reactions, typing indicators)
- Performance budget tracking
- Reduced motion support

#### Peer Dependencies

- React ≥18
- react-native-reanimated ~3.10.1

#### Usage

```typescript
import { 
  MotionView, 
  usePressBounce, 
  useBubbleEntry,
  haptic 
} from '@petspark/motion'
```

### @petspark/core

**Location**: `packages/core/`  
**Purpose**: Core business logic and unified API client

#### Exports

- **API Client**: UnifiedAPIClient class (`packages/core/src/api/client.ts`)
  - Auth refresh (401 → token refresh)
  - Retry/backoff for idempotent requests
  - Error normalization
  - Telemetry hooks

#### Dependencies

- Zod 3.25.76 (validation)

#### Usage

```typescript
import { UnifiedAPIClient } from '@petspark/core/api'

const client = new UnifiedAPIClient({
  baseURL: 'https://api.example.com',
  auth: {
    getAccessToken: () => token,
    refreshAccessToken: async () => newToken,
    setAccessToken: (token) => { /* ... */ }
  }
})
```

### @petspark/chat-core

**Location**: `packages/chat-core/`  
**Purpose**: Chat functionality (outbox pattern, message queue)

#### Exports

- `useOutbox`: Hook for offline message queue
- `useOutbox.native`: Native-specific implementation

#### Dependencies

- React 18.3.1

#### Usage

```typescript
import { useOutbox } from '@petspark/chat-core'

const { addMessage, flush } = useOutbox()
```

### @petspark/config

**Location**: `packages/config/`  
**Purpose**: Feature flags and configuration management

#### Exports

- Feature flag definitions
- Configuration schemas (Zod)

#### Dependencies

- Zod 3.25.76

#### Usage

```typescript
import { featureFlags } from '@petspark/config'

if (featureFlags.enableNewChat) {
  // ...
}
```

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

packages/motion
└── (peer: react-native-reanimated)

packages/shared
├── react
├── react-native
├── react-native-web
└── react-native-reanimated

packages/core
└── zod

packages/chat-core
└── react

packages/config
└── zod
```

---

## Architecture Patterns

### Component Architecture

#### Web Application

**Feature-Based Organization**

```
components/
├── auth/              # Authentication feature
├── chat/               # Chat feature
├── admin/              # Admin feature
├── enhanced/           # Enhanced UI components
└── ui/                 # Base UI components (Radix UI)
```

**Domain-Driven Design**

```
core/
├── domain/             # Pure domain logic
│   ├── pet-model.ts
│   ├── matching-engine.ts
│   └── business.ts
└── services/           # Business services
    ├── matching-service.ts
    └── chat-service.ts
```

#### Mobile Application

**Feature-Sliced Structure**

```
src/
├── components/          # UI components
│   ├── swipe/         # Swipe feature
│   ├── chat/          # Chat feature
│   └── enhanced/      # Enhanced components
├── screens/            # Screen components
├── hooks/              # Feature-specific hooks
└── store/              # Zustand stores
```

### State Management Patterns

#### Global State (Zustand)

Used for:
- User authentication state
- Pet store (cached pets)
- UI preferences (theme, settings)

**Example**:

```typescript
// apps/mobile/src/store/user-store.ts
import { create } from 'zustand'

interface UserState {
  user: User | null
  setUser: (user: User) => void
  logout: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null })
}))
```

#### Server State (TanStack Query)

Used for:
- API data fetching
- Caching and synchronization
- Optimistic updates
- Background refetching

**Example**:

```typescript
// apps/web/src/hooks/use-pets.ts
import { useQuery } from '@tanstack/react-query'
import { fetchPets } from '@/api/pets-api'

export function usePets() {
  return useQuery({
    queryKey: ['pets'],
    queryFn: fetchPets,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

#### Local Component State

Used for:
- Form inputs
- UI toggles (modals, drawers)
- Temporary filters
- Scroll positions

### API Communication Patterns

#### Current State

**Multiple API Client Implementations** (⚠️ Technical Debt)

1. **Web App**: `apps/web/src/lib/api-client.ts`
   - Cookie-based auth (production)
   - CSRF token support
   - Retry logic
   - Token refresh

2. **Core Package**: `packages/core/src/api/client.ts`
   - UnifiedAPIClient class
   - Telemetry hooks
   - Auth refresh pattern
   - Retry/backoff

3. **Shared Package**: `packages/shared/src/api/client.ts`
   - Simple API client factory
   - Basic error handling

4. **Mobile App**: `apps/mobile/src/utils/api-client.ts`
   - Mobile-specific implementation
   - Circuit breaker pattern

#### Recommended Pattern

**Standardize on UnifiedAPIClient** from `@petspark/core`:

```typescript
// Recommended usage
import { UnifiedAPIClient } from '@petspark/core/api'

const apiClient = new UnifiedAPIClient({
  baseURL: config.API_URL,
  timeout: 30000,
  auth: {
    getAccessToken: () => authStore.getToken(),
    refreshAccessToken: async () => {
      const newToken = await refreshToken()
      authStore.setToken(newToken)
      return newToken
    },
    setAccessToken: (token) => authStore.setToken(token),
    onAuthError: () => authStore.logout()
  },
  telemetry: {
    onRequest: (req) => analytics.track('api_request', req),
    onResponse: (res) => analytics.track('api_response', res),
    onError: (err) => errorTracking.captureException(err)
  }
})
```

### Error Handling Strategy

#### Error Boundaries

**Web**:

```typescript
// apps/web/src/components/ErrorBoundary.tsx
import { ErrorBoundary } from 'react-error-boundary'

<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onError={(error, errorInfo) => {
    logger.error('Error caught by boundary', { error, errorInfo })
    analytics.track('error_boundary', { error: error.message })
  }}
>
  <App />
</ErrorBoundary>
```

**Mobile**:

```typescript
// apps/mobile/src/components/ErrorBoundary.tsx
import React from 'react'

class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Error caught by boundary', { error, errorInfo })
    telemetry.trackError(error, { screen: this.props.screen })
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorState onRetry={this.handleRetry} />
    }
    return this.props.children
  }
}
```

#### API Error Handling

```typescript
try {
  const response = await apiClient.get('/pets')
  return response.data
} catch (error) {
  if (error instanceof APIError) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        // Handle auth error
        break
      case 'NOT_FOUND':
        // Handle not found
        break
      default:
        // Handle other errors
    }
  }
  throw error
}
```

### Performance Optimization Strategies

#### Web

1. **Code Splitting**: Route-based lazy loading
2. **Image Optimization**: WebP/AVIF formats, lazy loading
3. **Bundle Optimization**: Tree shaking, minification
4. **Caching**: Service worker for PWA
5. **Virtual Scrolling**: TanStack Virtual for long lists

#### Mobile

1. **List Optimization**: FlashList with `estimatedItemSize`
2. **Image Optimization**: react-native-fast-image, exact sizes
3. **Animation Optimization**: Reanimated worklets on UI thread
4. **Navigation**: Native-driven transitions
5. **Heavy Compute**: JSI modules or background tasks

---

## Development Workflow

### Local Development Setup

#### Prerequisites

- Node.js ≥18
- pnpm ≥8
- iOS: Xcode 14+ (for iOS development)
- Android: Android Studio (for Android development)

#### Installation

```bash
# Install all dependencies
pnpm install

# Build shared packages
pnpm --filter @petspark/shared typecheck
pnpm --filter @petspark/motion typecheck
```

#### Running Applications

**Web App**:

```bash
cd apps/web
pnpm dev
# or from root
pnpm web-dev
```

**Mobile App**:

```bash
cd apps/mobile
pnpm start
# or from root
pnpm mobile-start

# Run on specific platform
pnpm mobile-android  # Android
pnpm mobile-ios      # iOS
```

### Testing Strategy

#### Unit Tests (Vitest)

**Coverage Thresholds**:
- Lines: 90%
- Branches: 85%
- Functions: 90%
- Statements: 90%

**Running Tests**:

```bash
# All tests
pnpm test

# Specific package
pnpm --filter @petspark/shared test

# With coverage
pnpm test:cov
```

#### Component Tests

**Web**: React Testing Library + Vitest

```typescript
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

test('renders button', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByRole('button')).toBeInTheDocument()
})
```

**Mobile**: React Native Testing Library + Vitest

```typescript
import { render } from '@testing-library/react-native'
import { Button } from './Button'

test('renders button', () => {
  const { getByRole } = render(<Button>Click me</Button>)
  expect(getByRole('button')).toBeTruthy()
})
```

#### E2E Tests

**Web**: Playwright

```bash
cd apps/web
pnpm e2e
pnpm e2e:smoke  # Smoke tests only
```

**Mobile**: Detox (future)

### Code Quality Gates

#### Pre-commit Hooks (Husky)

```bash
# Runs on git commit
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test:run
```

#### Quality Scripts

**Web**:

```bash
pnpm strict  # Runs all quality checks
# Includes: typecheck, lint, stylelint, test:cov, 
#           semgrep, depcheck, tsprune, forbid, size
```

**Mobile**:

```bash
pnpm strict  # Runs all quality checks
# Includes: typecheck, lint, test:cov, depcheck, tsprune
```

### Git Workflow

1. **Feature Branches**: Create branch from `main`
2. **Commits**: Conventional commits format
3. **Pull Requests**: Required for all changes
4. **CI Checks**: Must pass before merge
5. **Code Review**: At least one approval required

---

## Deployment & Infrastructure

### Build Processes

#### Web Application

**Development Build**:

```bash
cd apps/web
pnpm dev
```

**Production Build**:

```bash
cd apps/web
pnpm build
# Output: dist/
```

**Build Configuration**:
- Vite for bundling
- TypeScript compilation
- Asset optimization
- Source maps (production)

#### Mobile Application

**Development**:

```bash
cd apps/mobile
pnpm start
```

**Production Build (EAS)**:

```bash
# Build for all platforms
pnpm build:eas

# Platform-specific
pnpm build:eas:ios
pnpm build:eas:android
```

**EAS Build Profiles** (`apps/mobile/eas.json`):
- `production`: Release builds for App Store/Play Store
- `preview`: Internal distribution (APK for Android)
- `development`: Development client

### CI/CD Pipelines

#### GitHub Actions Workflows

**Location**: `.github/workflows/`

**Workflows**:

1. **`ci.yml`**: Main CI pipeline
   - Type checking
   - Linting
   - Testing
   - Build verification

2. **`eas-build.yml`**: Mobile app builds
   - Triggered on version tags
   - Builds iOS and Android
   - Uploads artifacts

3. **`mobile-ci.yml`**: Mobile-specific checks
   - Type checking
   - Linting
   - Test execution

4. **`ui-quality.yml`**: UI quality checks
   - Component tests
   - Visual regression (future)

5. **`krasivo-quality.yml`**: Additional quality gates

#### CI Pipeline Steps

```yaml
# Example: ci.yml
jobs:
  quality-gates:
    - Checkout code
    - Setup Node.js
    - Install dependencies (pnpm)
    - Type check
    - Lint
    - Format check
    - Run tests with coverage
    - Check coverage thresholds
    - Build applications
    - Check bundle sizes
```

### Environment Management

#### Environment Variables

**Web** (`apps/web/.env`):

```env
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://ws.example.com
VITE_USE_MOCKS=false
VITE_SENTRY_DSN=...
```

**Mobile** (`apps/mobile/.env`):

```env
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_WS_URL=wss://ws.example.com
```

#### Environment-Specific Configs

- **Development**: Local API, mocks enabled
- **Staging**: Staging API, real services
- **Production**: Production API, monitoring enabled

### Monitoring and Observability

#### Error Tracking

**Web**: Sentry

```typescript
import * as Sentry from '@sentry/browser'

Sentry.init({
  dsn: config.SENTRY_DSN,
  environment: config.ENV,
  release: config.BUILD_VERSION
})
```

**Mobile**: Sentry (via Expo)

#### Analytics

- User events tracking
- Performance metrics
- Feature usage analytics

#### Performance Monitoring

- Web Vitals (web)
- Frame rate monitoring (mobile)
- Network request tracking
- Bundle size tracking

---

## Security & Compliance

### Authentication Flows

#### Web Application

**Cookie-Based Auth (Production)**:

1. User logs in → Backend sets httpOnly refresh token cookie
2. Access token stored in memory (not localStorage)
3. 401 response → Automatic token refresh
4. CSRF token included in state-changing requests

**Token-Based Auth (Development)**:

1. User logs in → Access + refresh tokens in memory
2. Refresh token used for token refresh
3. Tokens cleared on logout

#### Mobile Application

**Token-Based Auth**:

1. User logs in → Tokens stored in secure storage (Expo SecureStore)
2. Access token used for API requests
3. 401 response → Automatic token refresh
4. Biometric authentication available

### Data Protection

- **Sensitive Data**: Stored in secure storage (not plain text)
- **API Communication**: HTTPS only
- **Token Storage**: 
  - Web: Memory (access), httpOnly cookies (refresh)
  - Mobile: Expo SecureStore
- **Input Validation**: Zod schemas for all inputs
- **XSS Protection**: React's built-in escaping
- **CSRF Protection**: CSRF tokens for state-changing requests

### Security Best Practices

1. **Dependency Scanning**: Regular security audits
2. **Secret Management**: Environment variables, never in code
3. **Input Sanitization**: All user inputs validated
4. **Rate Limiting**: API rate limiting implemented
5. **Error Handling**: No sensitive data in error messages

### Compliance

- **GDPR**: Data protection and user rights
- **COPPA**: Age verification for users under 13
- **Accessibility**: WCAG 2.1 AA compliance
- **Privacy**: Privacy manifests for App Store

---

## Performance Standards

### Web Performance Budgets

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Total Bundle Size**: < 500 KB (gzipped)
- **Main Bundle**: < 200 KB (gzipped)

### Mobile Performance Budgets

- **Cold Start**: ≤ 1.8s
- **Time to Interactive (TTI)**: ≤ 2.2s
- **Bundle Size**: ≤ 12 MB JS
- **Install Size**: ≤ 60 MB
- **Frame Time**: ≤ 16.67ms (60 FPS)
- **Memory**: ≤ 200 MB

### Optimization Strategies

#### Web

1. **Code Splitting**: Route-based and component-based
2. **Image Optimization**: WebP/AVIF, lazy loading, responsive images
3. **Caching**: Service worker, HTTP caching headers
4. **Bundle Analysis**: Regular bundle size monitoring
5. **Tree Shaking**: Remove unused code

#### Mobile

1. **List Optimization**: FlashList with proper `estimatedItemSize`
2. **Image Optimization**: Exact sizes, WebP format, react-native-fast-image
3. **Animation Optimization**: Reanimated worklets on UI thread
4. **Navigation**: Native-driven transitions
5. **Memory Management**: Proper cleanup, avoid memory leaks

---

## Future Improvements

### Identified Technical Debt

#### 1. API Client Consolidation ⚠️ HIGH PRIORITY

**Current State**: Multiple API client implementations
- `apps/web/src/lib/api-client.ts` (web-specific)
- `packages/core/src/api/client.ts` (UnifiedAPIClient)
- `packages/shared/src/api/client.ts` (simple client)
- `apps/mobile/src/utils/api-client.ts` (mobile-specific)

**Recommended Action**:
- Standardize on `UnifiedAPIClient` from `@petspark/core`
- Migrate web app to use `@petspark/core/api`
- Migrate mobile app to use `@petspark/core/api`
- Deprecate other implementations
- Create migration guide

#### 2. TypeScript Strictness

**Current State**: 
- Base config has strict mode enabled
- Some packages may have inconsistencies

**Recommended Action**:
- Audit all `tsconfig.json` files
- Ensure `strict: true` in all packages
- Fix any `any` types in production code
- Enable `noUncheckedIndexedAccess` everywhere

#### 3. Documentation Cleanup

**Current State**: 
- Many outdated markdown files in root
- Scattered architecture documentation
- Duplicate information

**Recommended Action**:
- Archive completed implementation summaries
- Move outdated docs to `docs/archive/`
- Consolidate duplicate documentation
- Update cross-references

#### 4. Testing Coverage

**Current State**:
- Good coverage in some areas
- Gaps in E2E testing
- Mobile E2E tests not implemented

**Recommended Action**:
- Implement Detox for mobile E2E
- Increase E2E coverage for critical paths
- Add visual regression testing
- Improve integration test coverage

#### 5. Build Optimization

**Current State**:
- Bundle sizes within limits
- Some optimization opportunities

**Recommended Action**:
- Review and optimize shared package exports
- Implement better code splitting
- Optimize image assets
- Review and optimize dependencies

### Recommended Refactorings

1. **Feature Flag System**: Centralize in `@petspark/config`
2. **Error Handling**: Standardize error types and handling
3. **Logging**: Unified logging interface
4. **Analytics**: Unified analytics interface
5. **Storage**: Standardize storage adapters

### Scalability Considerations

1. **Microservices**: Consider backend service separation
2. **CDN**: Implement CDN for static assets
3. **Caching**: Implement Redis for server-side caching
4. **Database**: Optimize queries and indexing
5. **Monitoring**: Enhanced observability and alerting

---

## Appendix

### Key Files Reference

#### Configuration Files

- `package.json` - Root workspace configuration
- `pnpm-workspace.yaml` - Workspace definition
- `tsconfig.base.json` - Base TypeScript configuration
- `apps/web/vite.config.ts` - Web build configuration
- `apps/mobile/app.config.ts` - Expo configuration
- `apps/mobile/eas.json` - EAS build configuration

#### Documentation Files

- `MONOREPO.md` - Monorepo overview (legacy)
- `apps/web/ARCHITECTURE.md` - Web app architecture (legacy)
- `apps/mobile/ARCHITECTURE.md` - Mobile app architecture
- `TEMPLATE_STRUCTURE.md` - Template structure reference

### Quick Commands Reference

```bash
# Installation
pnpm install

# Development
pnpm web-dev              # Start web app
pnpm mobile-start         # Start mobile app

# Testing
pnpm test                 # Run all tests
pnpm test:cov            # Run tests with coverage

# Type Checking
pnpm typecheck           # Type check all packages

# Linting
pnpm lint                # Lint all packages

# Building
cd apps/web && pnpm build
cd apps/mobile && pnpm build:eas
```

### Contributing Guidelines

1. Follow TypeScript strict mode
2. Write tests for new features
3. Update documentation
4. Follow code style (ESLint, Prettier)
5. Get code review approval
6. Ensure CI passes

---

**Document Maintained By**: Architecture Team  
**Last Review**: 2025-01-27  
**Next Review**: 2025-04-27

