# PETSPARK Project Structure

Comprehensive documentation of the PETSPARK monorepo structure, including all directories, files, configurations, and organizational patterns.

## Table of Contents

1. [Root Directory Structure](#root-directory-structure)
2. [Apps Directory Structure](#apps-directory-structure)
3. [Packages Directory Structure](#packages-directory-structure)
4. [Configuration Files](#configuration-files)
5. [Scripts and Tooling](#scripts-and-tooling)
6. [Testing Structure](#testing-structure)
7. [Documentation Organization](#documentation-organization)
8. [Build Outputs](#build-outputs)
9. [Environment Configuration](#environment-configuration)
10. [CI/CD Setup](#cicd-setup)

---

## Root Directory Structure

```
PETSPARK/
├── apps/                          # Application packages
│   ├── web/                       # React web application (Vite)
│   ├── mobile/                    # React Native mobile app (Expo)
│   ├── backend/                   # Backend API server
│   └── native/                    # React Native native app
├── packages/                      # Shared packages
│   ├── shared/                    # Core utilities, types, API client
│   ├── motion/                    # Cross-platform animation library
│   ├── config/                    # Feature flags and configuration
│   ├── chat-core/                 # Chat functionality
│   └── core/                      # Core API client
├── scripts/                       # Build and utility scripts
│   ├── qa/                        # Quality assurance scripts
│   └── performance/               # Performance validation scripts
├── docs/                          # Project documentation
├── logs/                          # Build and audit logs
├── android/                       # Android native configuration
├── ios/                           # iOS native configuration (if exists)
├── .github/                       # GitHub configuration
│   └── workflows/                 # GitHub Actions workflows
├── .husky/                        # Git hooks (if configured)
├── node_modules/                  # Root node_modules (pnpm hoisted)
├── package.json                   # Root workspace configuration
├── pnpm-workspace.yaml            # PNPM workspace configuration
├── pnpm-lock.yaml                 # PNPM lockfile
├── tsconfig.base.json             # Base TypeScript configuration
├── tsconfig.json                  # Root TypeScript configuration
├── eslint.config.js               # Shared ESLint configuration
├── .prettierrc.json               # Prettier configuration
├── jest.config.base.js            # Base Jest configuration
├── .gitignore                     # Git ignore patterns
├── .editorconfig                  # Editor configuration
└── README.md                      # Project README
```

---

## Apps Directory Structure

### Web Application (`apps/web/`)

```
apps/web/
├── public/                        # Static assets
│   ├── manifest.json              # PWA manifest
│   ├── icon-192.png               # PWA icon (192x192)
│   ├── icon-512.png               # PWA icon (512x512)
│   └── ...                        # Other static assets
├── src/
│   ├── main.tsx                   # Application entry point
│   ├── App.tsx                    # Root application component
│   ├── index.html                 # HTML template
│   ├── index.css                  # Global styles
│   ├── main.css                   # Main styles
│   ├── ErrorFallback.tsx          # Error boundary fallback
│   │
│   ├── components/                # UI components (feature-based)
│   │   ├── a11y/                  # Accessibility components
│   │   ├── admin/                 # Admin console components
│   │   ├── adoption/              # Adoption feature components
│   │   ├── auth/                  # Authentication components
│   │   ├── call/                  # Video/voice call components
│   │   ├── chat/                  # Chat feature components
│   │   ├── community/             # Community feature components
│   │   ├── enhanced/              # Premium UI components
│   │   ├── enhanced-ui/           # Advanced UI components
│   │   ├── gdpr/                  # GDPR compliance components
│   │   ├── lost-found/            # Lost & found components
│   │   ├── maps/                  # Map components
│   │   ├── media/                 # Media components
│   │   ├── media-editor/          # Media editor components
│   │   ├── navigation/            # Navigation components
│   │   ├── notifications/         # Notification components
│   │   ├── offline/               # Offline mode components
│   │   ├── payments/              # Payment components
│   │   ├── pwa/                   # PWA components
│   │   ├── settings/              # Settings components
│   │   ├── stories/               # Stories feature components
│   │   ├── streaming/             # Live streaming components
│   │   ├── swipe/                 # Swipe gesture components
│   │   ├── ui/                    # Base UI components (shadcn/ui)
│   │   ├── verification/          # Verification components
│   │   ├── views/                 # Page-level views (lazy-loaded)
│   │   └── virtual/               # Virtual scrolling components
│   │
│   ├── core/                      # Domain logic and business rules
│   │   ├── domain/                # Domain models and pure functions
│   │   │   ├── pet-model.ts       # Pet domain model
│   │   │   ├── matching-config.ts # Matching configuration
│   │   │   ├── matching-engine.ts # Matching algorithm
│   │   │   ├── breeds.ts          # Breed definitions
│   │   │   ├── species.ts         # Species definitions
│   │   │   ├── business.ts        # Business rules
│   │   │   ├── adoption.ts        # Adoption domain logic
│   │   │   ├── community.ts       # Community domain logic
│   │   │   └── lost-found.ts      # Lost & found domain logic
│   │   ├── services/              # Core services
│   │   ├── tokens/                # Design tokens
│   │   └── utils/                 # Core utilities
│   │
│   ├── effects/                   # Animation and effects system
│   │   ├── animations/            # Framer Motion variants
│   │   ├── chat/                  # Chat-specific effects
│   │   │   ├── bubbles/           # Bubble animations
│   │   │   ├── celebrations/      # Celebration effects
│   │   │   ├── reactions/         # Reaction animations
│   │   │   └── typing/            # Typing indicators
│   │   ├── micro-interactions/    # DOM-based interactions
│   │   ├── reanimated/            # React Native Reanimated hooks
│   │   └── visual/                # Visual effects components
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── accessibility/         # Accessibility hooks
│   │   ├── analytics/             # Analytics hooks
│   │   ├── api/                   # API hooks (React Query)
│   │   ├── call/                  # WebRTC hooks
│   │   ├── chat/                  # Chat hooks
│   │   ├── gestures/              # Gesture hooks
│   │   ├── media/                 # Media hooks
│   │   ├── media-editor/          # Media editor hooks
│   │   ├── micro-interactions/    # Micro-interaction hooks
│   │   ├── offline/               # Offline hooks
│   │   ├── performance/           # Performance hooks
│   │   ├── security/              # Security hooks
│   │   └── streaming/             # Streaming hooks
│   │
│   ├── api/                       # API client layer
│   │   ├── adoption-api.ts        # Adoption API client
│   │   ├── matching-api.ts        # Matching API client
│   │   ├── community-api.ts       # Community API client
│   │   ├── lost-found-api.ts      # Lost & found API client
│   │   ├── chat-api.ts            # Chat API client
│   │   └── types.ts               # API type definitions
│   │
│   ├── contexts/                  # React context providers
│   │   ├── AppContext.tsx         # Application context
│   │   ├── AuthContext.tsx        # Authentication context
│   │   └── UIContext.tsx          # UI context
│   │
│   ├── providers/                 # React providers
│   │   └── QueryProvider.tsx      # React Query provider
│   │
│   ├── lib/                       # Legacy utilities (gradual migration)
│   │   ├── api/                   # API utilities
│   │   ├── domain/                # Domain utilities
│   │   ├── logger.ts              # Logging utility
│   │   ├── storage.ts             # Storage utility
│   │   ├── theme-init.ts          # Theme initialization
│   │   ├── pwa/                   # PWA utilities
│   │   ├── error-reporting.ts     # Error reporting
│   │   ├── web-vitals.ts          # Web Vitals
│   │   └── refresh-rate.ts        # Refresh rate detection
│   │
│   ├── styles/                    # Global styles
│   │   └── theme.css              # Theme styles (CSS variables)
│   │
│   ├── test/                      # Test utilities
│   │   ├── setup.ts               # Test setup
│   │   └── utils/                 # Test utilities
│   │
│   └── types/                     # Type definitions
│       └── *.d.ts                 # Type declaration files
│
├── design-system/                 # Design system (if exists)
├── e2e/                           # End-to-end tests (Playwright)
│   └── *.spec.ts                  # E2E test files
│
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript configuration
├── tsconfig.strict-optionals.json # Strict optionals configuration
├── eslint.config.js               # ESLint configuration
├── .prettierrc.json               # Prettier configuration
├── vitest.config.ts               # Vitest configuration
├── playwright.config.ts           # Playwright configuration
├── package.json                   # Web app package.json
└── tailwind.config.js             # Tailwind CSS configuration
```

### Mobile Application (`apps/mobile/`)

```
apps/mobile/
├── android/                       # Android native configuration
│   ├── app/                       # Android app module
│   │   ├── build.gradle           # App build configuration
│   │   ├── proguard-rules.pro     # ProGuard rules
│   │   └── src/                   # Android source files
│   ├── build.gradle               # Project build configuration
│   ├── gradle/                    # Gradle wrapper
│   ├── gradle.properties          # Gradle properties
│   ├── settings.gradle            # Gradle settings
│   └── gradlew                    # Gradle wrapper script
│
├── assets/                        # Static assets
│   ├── icon.png                   # App icon
│   └── splash.png                 # Splash screen
│
├── src/
│   ├── App.tsx                    # Root application component
│   ├── components/                # UI components
│   │   ├── a11y/                  # Accessibility components
│   │   ├── auth/                  # Authentication components
│   │   ├── camera/                # Camera components
│   │   ├── chat/                  # Chat components
│   │   ├── chrome/                # Chrome components
│   │   ├── community/             # Community components
│   │   ├── enhanced/              # Premium UI components
│   │   ├── gdpr/                  # GDPR components
│   │   ├── media/                 # Media components
│   │   ├── media-editor/          # Media editor components
│   │   ├── navigation/            # Navigation components
│   │   ├── notifications/         # Notification components
│   │   ├── settings/              # Settings components
│   │   ├── stories/               # Stories components
│   │   ├── swipe/                 # Swipe components
│   │   ├── ui/                    # Base UI components
│   │   └── visuals/               # Visual components
│   │
│   ├── screens/                   # Screen components
│   │   ├── HomeScreen.tsx         # Home screen
│   │   ├── DiscoverScreen.tsx     # Discover screen
│   │   ├── ChatScreen.tsx         # Chat screen
│   │   └── ...                    # Other screens
│   │
│   ├── navigation/                # Navigation setup
│   │   ├── AppNavigator.tsx       # Main navigator
│   │   └── types.ts               # Navigation types
│   │
│   ├── hooks/                     # Custom hooks
│   │   ├── api/                   # API hooks
│   │   ├── chat/                  # Chat hooks
│   │   ├── media/                 # Media hooks
│   │   └── ...                    # Other hooks
│   │
│   ├── store/                     # Zustand stores
│   │   ├── index.ts               # Store index
│   │   ├── user-store.ts          # User store
│   │   └── pets-store.ts          # Pets store
│   │
│   ├── effects/                   # Animation effects
│   │   ├── chat/                  # Chat effects
│   │   ├── core/                  # Core effects
│   │   ├── gestures/              # Gesture effects
│   │   └── reanimated/            # Reanimated hooks
│   │
│   ├── config/                    # Configuration
│   │   ├── absolute-max-ui-mode.ts # UI mode configuration
│   │   └── feature-flags.ts       # Feature flags
│   │
│   ├── contexts/                  # React contexts
│   │   └── UIContext.tsx          # UI context
│   │
│   ├── providers/                 # React providers
│   │   └── QueryProvider.tsx      # React Query provider
│   │
│   ├── core/                      # Core utilities
│   │   └── a11y/                  # Accessibility utilities
│   │
│   ├── data/                      # Mock data
│   │   └── mock-data.ts           # Mock data
│   │
│   ├── lib/                       # Utilities
│   │   └── ...                    # Utility files
│   │
│   ├── theme/                     # Theme configuration
│   │   ├── colors.ts              # Color definitions
│   │   ├── spacing.ts             # Spacing definitions
│   │   └── typography.ts          # Typography definitions
│   │
│   ├── types/                     # Type definitions
│   │   ├── globals.d.ts           # Global types
│   │   ├── dom-shim.d.ts          # DOM shim types
│   │   └── vendor/                # Vendor type definitions
│   │
│   ├── utils/                     # Utility functions
│   │   └── ...                    # Utility files
│   │
│   ├── test/                      # Test utilities
│   │   └── mocks/                 # Test mocks
│   │
│   └── __tests__/                 # Test files
│       ├── components/            # Component tests
│       ├── effects/               # Effect tests
│       ├── hooks/                 # Hook tests
│       ├── navigation/            # Navigation tests
│       ├── screens/               # Screen tests
│       ├── store/                 # Store tests
│       ├── types/                 # Type tests
│       └── utils/                 # Utility tests
│
├── tools/                         # Development tools
│   └── ultra-chatfx/              # Chat effects tools
│
├── scripts/                       # Build scripts
│   ├── ci-check.mjs               # CI check script
│   ├── performance/               # Performance scripts
│   ├── run-expo-offline.mjs       # Expo offline script
│   ├── verify-budget.mjs          # Budget verification
│   ├── verify-parity.mjs          # Parity verification
│   └── verify-ultra-chatfx.mjs    # Chat effects verification
│
├── app.config.ts                  # Expo configuration
├── eas.json                       # EAS Build configuration
├── babel.config.js                # Babel configuration
├── metro.config.cjs               # Metro bundler configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
├── eslint.config.js               # ESLint configuration
├── eslint.config.mjs              # ESLint configuration (alternative)
├── vitest.config.ts               # Vitest configuration
├── vitest.min.config.ts           # Minimal Vitest configuration
├── package.json                   # Mobile app package.json
├── global.css                     # Global styles
└── index.js                       # Application entry point
```

### Backend Application (`apps/backend/`)

```
apps/backend/
├── src/
│   ├── index.ts                   # Server entry point
│   ├── middleware/                # Express middleware
│   │   ├── auth.ts                # Authentication middleware
│   │   ├── error-handler.ts       # Error handler middleware
│   │   ├── jwt-auth.ts            # JWT authentication
│   │   └── rate-limit.ts          # Rate limiting
│   ├── routes/                    # API routes
│   │   ├── admin-config-routes.ts # Admin config routes
│   │   ├── admin-routes.ts        # Admin routes
│   │   ├── gdpr-routes.ts         # GDPR routes
│   │   └── __tests__/             # Route tests
│   ├── services/                  # Business logic services
│   │   ├── admin-audit-logger.ts  # Audit logging
│   │   ├── admin-config-service.ts # Config service
│   │   ├── audit-logger.ts        # Audit logger
│   │   ├── config-history-service.ts # Config history
│   │   ├── gdpr-service.ts        # GDPR service
│   │   ├── monitoring.ts          # Monitoring service
│   │   ├── mock-database.ts       # Mock database
│   │   └── postgres-database.ts   # PostgreSQL database
│   ├── types/                     # Type definitions
│   │   ├── express.d.ts           # Express type extensions
│   │   └── motion-stub.d.ts       # Motion stub types
│   └── utils/                     # Utilities
│       ├── errors.ts              # Error utilities
│       └── logger.ts              # Logger utility
│
├── migrations/                    # Database migrations
│   ├── 001_create_audit_logs.sql  # Audit logs migration
│   ├── 002_create_monitoring_alerts.sql # Monitoring alerts
│   ├── 003_create_admin_configs.sql # Admin configs
│   ├── 004_create_config_history.sql # Config history
│   └── 005_create_admin_audit_logs.sql # Admin audit logs
│
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Backend package.json
└── README.md                      # Backend README
```

### Native Application (`apps/native/`)

```
apps/native/
├── src/
│   ├── App.tsx                    # Root application component
│   ├── animations/                # Animation utilities
│   ├── api/                       # API clients
│   ├── components/                # UI components
│   ├── data/                      # Mock data
│   ├── hooks/                     # Custom hooks
│   ├── lib/                       # Utilities
│   ├── screens/                   # Screen components
│   ├── types/                     # Type definitions
│   └── utils/                     # Utility functions
│
├── assets/                        # Static assets
├── app.json                       # Expo configuration
├── eas.json                       # EAS Build configuration
├── babel.config.js                # Babel configuration
├── metro.config.js                # Metro bundler configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Native app package.json
└── README.md                      # Native app README
```

---

## Packages Directory Structure

### Shared Package (`packages/shared/`)

```
packages/shared/
├── src/
│   ├── index.ts                   # Public exports
│   ├── api/                       # API client
│   │   ├── client.ts              # API client implementation
│   │   ├── types.ts               # API types
│   │   ├── index.ts               # API exports
│   │   └── __tests__/             # API tests
│   ├── chat/                      # Chat functionality
│   │   ├── types.ts               # Chat types
│   │   ├── schemas.ts             # Chat schemas
│   │   └── index.ts               # Chat exports
│   ├── components/                # Shared components
│   │   ├── Card.tsx               # Card component
│   │   ├── Slider.tsx             # Slider component
│   │   └── __tests__/             # Component tests
│   ├── config/                    # Configuration
│   │   └── feature-flags.ts       # Feature flags
│   ├── core/                      # Core utilities
│   │   ├── logger.ts              # Logger utility
│   │   └── __tests__/             # Core tests
│   ├── device/                    # Device utilities
│   │   ├── quality.ts             # Device quality detection
│   │   └── __tests__/             # Device tests
│   ├── gdpr/                      # GDPR compliance
│   │   ├── consent-manager.ts     # Consent manager
│   │   ├── consent-types.ts       # Consent types
│   │   ├── gdpr-service.ts        # GDPR service
│   │   ├── gdpr-types.ts          # GDPR types
│   │   ├── index.ts               # GDPR exports
│   │   └── __tests__/             # GDPR tests
│   ├── geo/                       # Geolocation utilities
│   │   └── kalman.ts              # Kalman filter
│   ├── motion.ts                  # Motion utilities
│   ├── rng.ts                     # Random number generator
│   ├── storage/                   # Storage utilities
│   │   └── StorageAdapter.ts      # Storage adapter
│   ├── types/                     # Type definitions
│   │   ├── index.ts               # Type exports
│   │   ├── admin.ts               # Admin types
│   │   ├── optional-with-undef.ts # Optional with undefined types
│   │   ├── pet-types.ts           # Pet types
│   │   ├── process.ts             # Process types
│   │   └── stories-types.ts       # Stories types
│   └── utils/                     # Utility functions
│       ├── index.ts               # Utility exports
│       ├── stories-utils.ts       # Stories utilities
│       ├── utils.ts               # General utilities
│       ├── validation.ts          # Validation utilities
│       └── __tests__/             # Utility tests
│
├── test/                          # Test utilities
│   └── setup.ts                   # Test setup
│
├── types/                         # Type definitions (legacy)
│
├── tsconfig.json                  # TypeScript configuration
├── tsconfig.test.json             # Test TypeScript configuration
├── vitest.config.ts               # Vitest configuration
└── package.json                   # Shared package.json
```

### Motion Package (`packages/motion/`)

```
packages/motion/
├── src/
│   ├── index.ts                   # Public exports
│   ├── global.d.ts                # Global type definitions
│   ├── platform.ts                # Platform detection
│   ├── primitives/                # Motion primitives
│   │   ├── MotionScrollView.tsx   # ScrollView component
│   │   ├── MotionText.tsx         # Text component
│   │   └── MotionView.tsx         # View component
│   ├── recipes/                   # Animation recipes
│   │   ├── haptic.ts              # Haptic feedback
│   │   ├── useHoverLift.ts        # Hover lift effect
│   │   ├── useMagnetic.ts         # Magnetic effect
│   │   ├── useParallax.ts         # Parallax effect
│   │   ├── usePressBounce.ts      # Press bounce effect
│   │   ├── useRipple.ts           # Ripple effect
│   │   ├── useShimmer.ts          # Shimmer effect
│   │   └── __tests__/             # Recipe tests
│   ├── reduced-motion.ts          # Reduced motion utilities
│   ├── tokens.ts                  # Motion tokens
│   ├── transitions/               # Transition utilities
│   │   └── presence.tsx           # Presence transitions
│   ├── types/                     # Type definitions
│   │   ├── expo-haptics.d.ts      # Expo haptics types
│   │   └── react-native-gesture-handler.d.ts # Gesture handler types
│   ├── usePerfBudget.ts           # Performance budget hook
│   └── react-native-reanimated.d.ts # Reanimated type extensions
│
├── types/                         # Type definitions
│   ├── dom-shim.d.ts              # DOM shim types
│   └── vendor/                    # Vendor type definitions
│       ├── expo-haptics.d.ts      # Expo haptics types
│       └── react-native-gesture-handler.d.ts # Gesture handler types
│
├── test/                          # Test utilities
│   └── setup.ts                   # Test setup
│
├── tsconfig.json                  # TypeScript configuration
├── vitest.config.ts               # Vitest configuration
└── package.json                   # Motion package.json
```

### Config Package (`packages/config/`)

```
packages/config/
├── src/
│   ├── index.ts                   # Public exports
│   └── feature-flags.ts           # Feature flag definitions
│
├── tsconfig.json                  # TypeScript configuration
└── package.json                   # Config package.json
```

### Chat Core Package (`packages/chat-core/`)

```
packages/chat-core/
├── src/
│   ├── index.ts                   # Public exports
│   ├── useOutbox.ts               # Outbox hook
│   └── hooks/
│       └── use-storage.ts         # Storage hook
│
├── test/                          # Test utilities
│   └── setup.ts                   # Test setup
│
├── tsconfig.json                  # TypeScript configuration
├── vitest.config.ts               # Vitest configuration
└── package.json                   # Chat core package.json
```

### Core Package (`packages/core/`)

```
packages/core/
├── src/
│   ├── index.ts                   # Public exports
│   └── api/                       # API client
│       ├── client.ts              # API client implementation
│       ├── index.ts               # API exports
│       └── client_fix.txt         # Client fix notes
│
├── test/                          # Test utilities
│   └── setup.ts                   # Test setup
│
├── tsconfig.json                  # TypeScript configuration
├── vitest.config.ts               # Vitest configuration
└── package.json                   # Core package.json
```

---

## Configuration Files

### TypeScript Configuration

#### Root `tsconfig.base.json`

Base TypeScript configuration shared across all packages:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": false,
    "skipLibCheck": true,
    ...
  }
}
```

#### Web App `apps/web/tsconfig.json`

Extends base config with web-specific settings:

- `lib: ["ES2022", "DOM", "DOM.Iterable"]`
- Path aliases: `@/*` → `./src/*`
- Type definitions for Vite

#### Mobile App `apps/mobile/tsconfig.json`

Extends base config with React Native settings:

- React Native types
- Expo types
- Path aliases for mobile

### ESLint Configuration

#### Root `eslint.config.js`

Flat ESLint configuration with:

- Type-aware rules for `*.ts,*.tsx` files
- Non-type-aware rules for JS/config files
- React and React Hooks plugins
- JSX A11y plugin
- TypeScript ESLint plugin
- Zero-warning policy

### Prettier Configuration

#### Root `.prettierrc.json`

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### Vite Configuration (`apps/web/vite.config.ts`)

- React SWC plugin
- Tailwind CSS plugin
- Node polyfills
- React Native Web support
- Workspace package resolution
- Code splitting by feature
- Build optimization

### Expo Configuration (`apps/mobile/app.config.ts`)

- App name and slug
- Version and orientation
- Icons and splash screens
- iOS configuration
- Android configuration
- Permissions
- EAS Build configuration

### EAS Build Configuration (`apps/mobile/eas.json`)

- Development builds
- Preview builds
- Production builds
- Submit configuration

### Manifest.json (`apps/web/public/manifest.json`)

PWA manifest with:

- App name and description
- Icons (192x192, 512x512)
- Theme colors
- Display mode
- Shortcuts
- Share target

---

## Scripts and Tooling

### Root Scripts (`package.json`)

- `install:all` - Install all dependencies
- `typecheck` - Type check all packages
- `lint` - Lint all packages
- `test` - Run tests in all packages
- `web-dev` - Start web development server
- `mobile-start` - Start mobile development server
- `mobile-android` - Run Android app
- `mobile-ios` - Run iOS app
- `check:parity` - Check mobile/web parity
- `validate:effects` - Validate effects compliance

### Web Scripts (`apps/web/package.json`)

- `dev` - Start development server
- `build` - Build production bundle
- `preview` - Preview production build
- `typecheck` - Type check
- `lint` - Lint code
- `test` - Run tests
- `e2e` - Run E2E tests
- `strict` - Run all quality gates

### Mobile Scripts (`apps/mobile/package.json`)

- `start` - Start Expo development server
- `android` - Run Android app
- `ios` - Run iOS app
- `typecheck` - Type check
- `lint` - Lint code
- `test` - Run tests
- `ci` - Run CI checks
- `build:eas` - Build with EAS

### Utility Scripts (`scripts/`)

- `check-mobile-parity.ts` - Check mobile/web parity
- `validate-effects-compliance.ts` - Validate effects compliance
- `audit-*.ts` - Audit scripts
- `verify-*.mjs` - Verification scripts
- `performance/` - Performance validation scripts
- `qa/` - Quality assurance scripts

---

## Testing Structure

### Unit Tests

- Location: Co-located with source files (`*.test.ts`, `*.test.tsx`)
- Framework: Vitest
- Coverage: 95% threshold (statements, branches, functions, lines)

### Component Tests

- Framework: React Testing Library
- Location: `__tests__/` directories or co-located
- Web: `@testing-library/react`
- Mobile: `@testing-library/react-native`

### E2E Tests

- Framework: Playwright (web)
- Location: `apps/web/e2e/`
- Detox (mobile, if configured)
- Location: `apps/mobile/e2e/`

### Test Utilities

- `test/setup.ts` - Test setup files
- `test/mocks/` - Test mocks
- `test/utils/` - Test utilities

---

## Documentation Organization

### Root Documentation

- `README.md` - Project README
- `PROJECT_STRUCTURE.md` - This file
- `PROJECT_TEMPLATE.md` - Template guide
- `TEMPLATE_STRUCTURE.md` - Template structure
- `TEMPLATE_QUICK_START.md` - Quick start guide
- `TYPE_AND_LINT_DISCIPLINE.md` - Type and lint discipline
- `MONOREPO.md` - Monorepo documentation

### App Documentation

- `apps/web/README.md` - Web app README
- `apps/mobile/README.md` - Mobile app README
- `apps/backend/README.md` - Backend README
- Feature-specific READMEs in component directories

### Package Documentation

- `packages/shared/README.md` - Shared package README
- `packages/motion/README.md` - Motion package README

---

## Build Outputs

### Web Build Output

- Location: `apps/web/dist/`
- Contents: Production bundle, assets, HTML
- Format: ESM modules with code splitting

### Mobile Build Output

- Location: `apps/mobile/build/` (Android), `apps/mobile/ios/` (iOS)
- Contents: Native app binaries
- Format: APK (Android), IPA (iOS)

### Package Build Outputs

- Location: Package-specific (if any)
- Contents: Compiled TypeScript, type definitions
- Format: ESM modules

---

## Environment Configuration

### Environment Variables

#### Web (`apps/web/.env`)

```env
VITE_API_URL=https://api.example.com
VITE_APP_NAME=PetSpark
VITE_APP_VERSION=1.0.0
```

#### Mobile (`apps/mobile/.env`)

```env
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_EAS_PROJECT_ID=your-project-id
```

#### Backend (`apps/backend/.env`)

```env
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
```

### Environment Files

- `.env` - Local development
- `.env.local` - Local overrides
- `.env.production` - Production
- `.env.example` - Example template

---

## CI/CD Setup

### GitHub Actions

Location: `.github/workflows/`

Workflows:

- `ci.yml` - Continuous integration
- `deploy.yml` - Deployment
- `test.yml` - Testing
- `lint.yml` - Linting

### Husky Hooks

Location: `.husky/`

Hooks:

- `pre-commit` - Pre-commit checks
- `pre-push` - Pre-push checks

### EAS Build

Configuration: `apps/mobile/eas.json`

- Development builds
- Preview builds
- Production builds
- Submit to app stores

---

## Key Conventions

### File Naming

- Components: `PascalCase.tsx`
- Hooks: `use-kebab-case.ts`
- Utilities: `kebab-case.ts`
- Types: `kebab-case.ts`
- Tests: `*.test.ts`, `*.test.tsx`

### Directory Organization

- Feature-based components
- Co-located tests
- Shared utilities in packages
- Domain logic in `core/domain/`

### Code Quality

- Zero TypeScript errors
- Zero ESLint warnings
- 95% test coverage
- Strict TypeScript mode
- No `any` types
- No `@ts-ignore`

### Performance

- Lazy loading for routes
- Code splitting by feature
- Virtual scrolling for lists
- Image optimization
- Bundle size limits

### Accessibility

- ARIA labels
- Keyboard navigation
- Screen reader support
- High contrast mode
- Reduced motion support

---

## Summary

This project structure provides:

- ✅ Monorepo organization with pnpm workspaces
- ✅ Web application (Vite + React)
- ✅ Mobile application (Expo + React Native)
- ✅ Shared packages for code reuse
- ✅ Strict TypeScript configuration
- ✅ Zero-warning ESLint configuration
- ✅ Comprehensive testing setup
- ✅ CI/CD configuration
- ✅ Quality gates and performance budgets
- ✅ Accessibility support
- ✅ Production-ready configuration

For detailed templates and setup instructions, see [PROJECT_TEMPLATE.md](./PROJECT_TEMPLATE.md).
