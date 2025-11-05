# Pet3 Monorepo

This repository is organized as a monorepo containing web and native mobile applications with shared business logic.

## Structure

```
pet3/
├── apps/
│   ├── web/          # React web application (existing)
│   └── native/       # Expo/React Native mobile app (iOS, Android, Web)
├── packages/
│   └── shared/       # Shared TypeScript utilities and types
├── .github/
│   └── workflows/    # CI/CD workflows for all apps
└── docs/             # Documentation
```

## Workspaces

This project uses npm workspaces to manage dependencies and enable code sharing between applications.

### Apps

#### Web App (`apps/web/`)
- Existing React web application
- Vite build system
- See `apps/web/README.md` for details

#### Native App (`apps/native/`)
- Expo-managed React Native application
- Targets iOS, Android, and Web platforms
- Uses React Navigation, NativeWind (Tailwind), and shared packages
- See `apps/native/README.md` and `docs/MOBILE_README.md` for setup and development

### Packages

#### Shared Package (`packages/shared/`)
- Platform-agnostic TypeScript utilities, types, and business logic
- Used by both web and native applications
- Pure TypeScript with no platform-specific dependencies
- See `packages/shared/README.md` for usage

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- For mobile development: see `docs/MOBILE_README.md`

### Installation

```bash
# Install all workspace dependencies
npm install

# Build the shared package
cd packages/shared
npm run build
```

### Development

#### Web App
```bash
cd apps/web
npm run dev
```

#### Native App
```bash
cd apps/native
npm start
```

#### Shared Package
```bash
cd packages/shared
npm run build      # Build TypeScript
npm run typecheck  # Type check without building
```

### Testing

```bash
# Run all tests in all workspaces
npm test

# Or run tests in specific workspace
cd apps/web && npm test
```

### Linting & Type Checking

```bash
# Run typecheck across all workspaces
npm run typecheck

# Run linting across all workspaces
npm run lint
```

## CI/CD

### Workflows

- **CI (`ci.yml`)**: Runs on every push/PR
  - Type checks all packages
  - Lints all packages
  - Runs tests
  - Builds all packages

- **EAS Build (`eas-build.yml`)**: Builds native apps
  - Triggered manually or on version tags
  - Builds Android AAB and iOS IPA
  - Uses EAS Cloud Build service

### Required Secrets

See `docs/MOBILE_README.md` for the list of required GitHub secrets for EAS builds.

## Adding New Shared Code

1. Add your code to `packages/shared/src/`
2. Export from `packages/shared/src/index.ts`
3. Build: `cd packages/shared && npm run build`
4. Import in apps:
   ```typescript
   import { myFunction } from '@pet3/shared';
   ```

### Guidelines for Shared Code

- ✅ Pure TypeScript functions and types
- ✅ Business logic and utilities
- ✅ Constants and configuration
- ❌ No React components (use separate shared UI package if needed)
- ❌ No platform-specific APIs (DOM, React Native, etc.)
- ❌ No framework-specific code

## Scripts

### Root-level scripts

```bash
npm run install:all           # Install all dependencies
npm run mobile:start          # Start native app dev server
npm run mobile:build:android  # Build Android with EAS
npm run mobile:build:ios      # Build iOS with EAS
npm run web:dev               # Start web dev server
npm run shared:build          # Build shared package
npm run typecheck             # Type check all workspaces
npm run lint                  # Lint all workspaces
npm run test                  # Test all workspaces
```

## Validation

Run the validation script to verify the setup:

```bash
./validate-setup.sh
```

## Documentation

- **Mobile Development**: `docs/MOBILE_README.md`
- **Native App**: `apps/native/README.md`
- **Shared Package**: `packages/shared/README.md`
- **Web App**: `apps/web/README.md`

## Troubleshooting

### Peer Dependency Conflicts

The repository uses `.npmrc` with `legacy-peer-deps=true` to handle React version differences between web (React 19) and native (React 18).

### Module Resolution Issues

If shared package imports fail:
1. Ensure shared package is built: `cd packages/shared && npm run build`
2. Clear Metro cache (native): `cd apps/native && expo start --clear`
3. Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### TypeScript Errors

Run typecheck to identify issues:
```bash
cd packages/shared && npm run typecheck
cd apps/native && npm run typecheck
cd apps/web && npm run typecheck
```

## Contributing

When making changes:

1. Maintain backward compatibility in shared packages
2. Update relevant README files
3. Run validation: `./validate-setup.sh`
4. Run type checks: `npm run typecheck`
5. Run linting: `npm run lint`
6. Run tests: `npm run test`

## License

See `apps/web/LICENSE`
