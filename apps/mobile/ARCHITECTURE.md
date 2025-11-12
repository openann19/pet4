# Mobile App Architecture

## Ultra-Enhanced Mobile Engineering Rules

This document outlines the architecture and engineering standards for the PetSpark mobile application.

## Architecture Overview

### Feature-Sliced Structure

```
src/
├── app/                    # App initialization, providers, root component
├── features/               # Feature modules (swipe, chat, profile, etc.)
│   ├── swipe/
│   │   ├── ui/            # Presentational components
│   │   ├── hooks/         # Feature-specific hooks
│   │   ├── services/      # Business logic
│   │   └── adapters/      # Data adapters
├── entities/              # Business entities (Pet, Match, User, etc.)
│   ├── pet/
│   │   ├── model/         # Type definitions
│   │   └── api/           # API layer
├── shared/                # Shared utilities and components
│   ├── ui/                # Reusable UI components
│   ├── utils/             # Utility functions
│   ├── hooks/             # Shared hooks
│   └── config/            # Configuration
└── providers/             # React context providers
```

### Design Principles

1. **Separation of Concerns**
   - UI components are presentational only
   - Business logic in hooks/services
   - Data access in adapters

2. **State Management**
   - Global state minimized (Zustand/Redux Toolkit)
   - Remote state via React Query (TanStack Query)
   - Local component state when appropriate

3. **Side Effects**
   - Isolated in services/
   - Pure functions elsewhere
   - No business logic in components

## TypeScript Configuration

### Strict Mode Enabled

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true,
  "exactOptionalPropertyTypes": true
}
```

### Rules

- Zero `any` types (except in typed boundaries)
- Explicit return types for functions
- No implicit any
- Strict null checks

## Performance Standards

### Budgets

- **Cold Start**: ≤ 1.8s
- **TTI**: ≤ 2.2s
- **Bundle Size**: ≤ 12 MB JS
- **Install Size**: ≤ 60 MB
- **Frame Time**: ≤ 16.67ms (60 FPS)
- **Memory**: ≤ 200 MB

### Optimization Strategies

1. **Lists**: Use FlashList with `estimatedItemSize`
2. **Images**: Exact sizes, WebP/AVIF, react-native-fast-image
3. **Animations**: Reanimated v3 worklets only
4. **Navigation**: Native-driven transitions
5. **Heavy Compute**: JSI/native modules or background tasks

## Accessibility (A11y)

### Requirements

- WCAG 2.1 AA minimum
- Touch targets ≥ 44×44pt
- Dynamic Type support (200% scaling)
- Screen reader support (VoiceOver/TalkBack)
- Respect Reduce Motion preference

### Implementation

```typescript
import { getAccessibilityProps, ensureTouchTarget } from '@/utils/accessibility'

const touchTarget = ensureTouchTarget(44)
const a11yProps = getAccessibilityProps({
  role: 'button',
  label: 'Like pet',
  hint: 'Double tap to like this pet',
})
```

## Testing

### Coverage Requirements

- **Unit Tests**: ≥ 85% lines
- **Component Tests**: All shared UI components
- **E2E Tests**: Detox for P0 flows

### Test Structure

```
src/
├── __tests__/
│   ├── unit/              # Unit tests
│   ├── components/        # Component tests
│   └── e2e/              # E2E tests
```

## Code Quality

### Linting

- ESLint with TypeScript rules
- React Native specific rules
- Zero warnings policy

### Pre-commit Hooks

```bash
pnpm tsc --noEmit
pnpm eslint .
pnpm prettier --check
pnpm lint-staged
```

## Security

### Secrets Management

- Secrets in secure store (react-native-keychain)
- Never in JS source
- Environment variables via build-time injection

### Network Security

- TLS only
- Reject http:// in production
- Optional cert pinning for sensitive flows

## Telemetry

### Event Structure

```typescript
{
  name: string
  ts: number
  screen?: string
  userAnonId?: string
  payload?: Record<string, unknown>
  buildId?: string
}
```

### Critical Traces

- Cold start time
- Screen mount time
- List render time
- Network latency
- Errors with stack + buildId

## Motion & Animations

### Standards

- **Tap**: 120-180ms
- **Modal**: 220-280ms
- **Long transitions**: 320-420ms
- **Springs**: dampingRatio 0.9-1.0, stiffness 250-320

### Implementation

```typescript
import { useAnimatedStyle, withSpring } from 'react-native-reanimated'

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: withSpring(1.2, { damping: 20, stiffness: 300 }) }],
}))
```

## Networking

### HTTP Client

- Interceptors for auth, retry, telemetry
- 401 → token refresh once; then sign-out
- Exponential backoff with jitter
- Circuit breaker on repeated 5xx/429

### Caching

- ETag/If-None-Match honored
- React Query Persist for queries
- Optimistic updates with rollback

## Error Handling

### Error States

- No raw toasts for critical failures
- Use inline ErrorState with retry + diagnostics ID
- Distinguish: empty vs. error vs. loading

### Error Boundaries

```typescript
<ErrorBoundary
  fallback={<ErrorState onRetry={handleRetry} />}
  onError={(error, errorInfo) => {
    telemetry.trackError(error, { screen: 'Home' })
  }}
>
  <App />
</ErrorBoundary>
```

## CI/CD

### Release Gates

All must pass:

- `pnpm tsc --noEmit`
- `pnpm eslint .`
- Unit + component + e2e tests
- Bundle size check
- A11y lints
- Perf smoke (startup & scroll)

### Release Process

1. All gates pass
2. Upload dSYMs/ProGuard mappings
3. Create Sentry release
4. Upload source maps
5. Build via EAS/Fastlane
6. Deploy to Play/App Store

## Definition of Done

Per ticket:

- ✅ Meets tokens + a11y + motion rules
- ✅ Passes unit + component tests
- ✅ Perf verified (flame chart or logs)
- ✅ Telemetry added
- ✅ Docs updated
- ✅ Code reviewed
- ✅ No TODO/FIXME left
- ✅ Screenshots/GIF attached
