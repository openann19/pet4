<!-- 1bc2ce06-2fb7-4657-864c-29992d85ace0 40b69bdf-1f38-470b-9bf6-241a895c2758 -->
# Resolve Production Blockers

## Phase 1: Critical Build Blockers (Must Fix First)

### 1.1 Fix ESLint Config Parser Error

**File**: `apps/web/eslint.config.js`

- **Issue**: ESLint fails with `@typescript-eslint/await-thenable` requiring type info on JS config file
- **Fix**: Exclude `eslint.config.js` from type-checked rules or add proper parserOptions
- **Action**: Add ignore pattern for config files in type-checked rules section

### 1.2 Fix Web Env Schema (Already Partially Fixed)

**File**: `apps/web/src/config/env.ts`

- **Status**: Already makes Mapbox/Stripe/Sentry optional in dev (line 39)
- **Remaining**: Ensure production builds don't require secrets that should be server-side
- **Action**: Verify current implementation is correct, add .env.example with safe defaults

### 1.3 Fix Mobile API Client Default URL

**File**: `apps/mobile/src/utils/api-client.ts`

- **Issue**: Defaults to `http://localhost:3000/api` which crashes production builds
- **Fix**: Require `EXPO_PUBLIC_API_URL` in production, throw clear error if missing
- **Action**: Update `getApiBaseUrl()` to throw descriptive error when env var missing in production

## Phase 2: Mobile Core Fixes

### 2.1 Add react-native-mmkv Dependency

**File**: `apps/mobile/package.json`

- **Issue**: Offline cache expects MMKV but dependency missing
- **Fix**: Add `react-native-mmkv` to dependencies
- **Action**: Add dependency, document native setup requirements

### 2.2 Implement SignUp Screen Flow

**File**: `apps/mobile/src/navigation/AppNavigator.tsx`

- **Issue**: SignUpScreen immediately redirects to SignIn (line 42-44)
- **Fix**: Create proper SignUpForm component or implement inline form
- **Action**: 
- Check if `SignUpForm` exists in `@ui-mobile`
- If exists, use it; if not, create basic form with email/password/confirm fields
- Wire to auth API, handle success/error, navigate to MainTabs on success

### 2.3 Migrate use-pets Hook to API Client

**File**: `apps/mobile/src/hooks/use-pets.ts`

- **Issue**: Uses raw `fetch` calls bypassing hardened API client (lines 24-29, 43-48, 61-66)
- **Fix**: Replace fetch calls with `apiClient` from `@/utils/api-client`
- **Action**: 
- Import `apiClient` from `@/utils/api-client`
- Replace `fetchPets`, `likePet`, `dislikePet` to use `apiClient.get/post`
- Remove hardcoded `API_BASE_URL` constant

### 2.4 Implement Upload Queue Module

**File**: `apps/mobile/src/lib/upload-queue.ts` (create new)

- **Issue**: `background-uploads.ts` imports missing `../lib/upload-queue` (line 8)
- **Fix**: Create upload queue module with storage, retry logic, and flushPendingUploads function
- **Action**:
- Create module with queue storage (use MMKV or AsyncStorage)
- Implement `flushPendingUploads()` that processes queue
- Add retry logic with exponential backoff
- Wire to background task scheduler

### 2.5 Update Mobile Expo Config

**Files**: `apps/mobile/app.config.ts`, `apps/mobile/eas.json`

- **Issue**: Placeholder bundle IDs, zeroed projectId, dummy store credentials
- **Fix**: 
- Update bundle identifiers to real values (or document as placeholders)
- Add EAS projectId (or document how to obtain)
- Document store credentials setup in secure vault
- **Action**:
- Update `bundleIdentifier` and `package` to production values or add comments
- Update `projectId` in `app.config.ts` extra.eas or document setup
- Add comments in `eas.json` explaining how to configure store credentials

## Phase 3: Quality Gates

### 3.1 Fix TypeScript Errors

**Scope**: `apps/web/src/effects/reanimated/*`, `packages/motion/src/*`

- **Issue**: 300+ TypeScript errors in Reanimated hooks and motion package
- **Fix**: 
- Fix type imports and AnimatedStyle type assertions
- Resolve DTO drift between packages
- Add proper type guards where needed
- **Action**: Run typecheck, export errors to log, fix top 20 most common errors first

### 3.2 Fix Test Failures

**Files**: Test setup and component tests

- **Issue**: 429 failing tests, haptics.trigger and logger.warn not mocked properly
- **Fix**:
- Verify `apps/web/src/test/setup.ts` has proper haptics mock (already fixed per blockers.md)
- Ensure logger.warn is available in test environment
- Fix remaining test failures systematically
- **Action**: 
- Verify haptics mock includes `trigger` method
- Add logger.warn to test mocks if missing
- Run tests, fix top 10 failing suites

### 3.3 Fix Lint Errors

**Scope**: All files

- **Issue**: 14k+ lint errors (alias resolver, any types, etc.)
- **Fix**: 
- Fix alias resolver issues in JS configs
- Replace `any` with proper types or `unknown` + guards
- Clean up unused eslint-disable directives
- **Action**: 
- Fix ESLint config parser error first (Phase 1.1)
- Run lint, fix top 50 errors by category
- Iterate until manageable

### 3.4 Update Security Vulnerabilities

**Scope**: Dependencies

- **Issue**: 12 vulnerabilities (nanoid, send, esbuild, etc.)
- **Fix**: Update vulnerable packages to patched versions
- **Action**:
- Update `nanoid` to >=3.3.8
- Update `send` to >=0.19.0 (via Expo CLI update)
- Update `esbuild` to >=0.25.0
- Rerun `pnpm audit`

## Phase 4: Documentation & Verification

### 4.1 Create .env.example Files

**Files**: `apps/web/.env.example`, `apps/mobile/.env.example`

- **Action**: 
- Document all required env vars with safe defaults
- Mark server-side secrets clearly
- Add setup instructions

### 4.2 Update Blockers Documentation

**File**: `apps/mobile/src/components/chrome/blockers.md`

- **Action**: 
- Mark completed fixes as done
- Update status for each blocker
- Add verification checklist

### 4.3 Run Verification Suite

**Commands**:

- `pnpm --filter spark-template lint` (should pass)
- `pnpm --filter spark-template typecheck` (should pass)
- `pnpm --filter spark-template test` (should pass)
- `pnpm --filter petspark-mobile lint` (should pass)
- `pnpm --filter petspark-mobile typecheck` (should pass)
- `pnpm audit` (should show reduced vulnerabilities)

## Implementation Order

1. **Phase 1** (Critical - blocks builds): ESLint config, env schema verification, API client
2. **Phase 2** (Mobile readiness): MMKV, SignUp, use-pets migration, upload queue, Expo config
3. **Phase 3** (Quality gates): TypeScript, tests, lint, security
4. **Phase 4** (Documentation): .env examples, blockers update, verification

## Success Criteria

- All builds succeed (web and mobile)
- Lint passes with <100 errors (staged cleanup acceptable)
- TypeScript compiles with 0 errors
- Tests pass with >90% success rate
- Security audit shows <5 vulnerabilities (all low severity)
- Mobile app can build with EAS
- SignUp flow works end-to-end
- API client used consistently across mobile hooks

### To-dos

- [ ] Fix ESLint config parser error by excluding eslint.config.js from type-checked rules
- [ ] Verify web env schema handles optional secrets correctly, add .env.example
- [ ] Update mobile API client to require EXPO_PUBLIC_API_URL in production with clear error
- [ ] Add react-native-mmkv to mobile package.json dependencies
- [ ] Implement SignUp screen with proper form, API integration, and navigation
- [ ] Migrate use-pets hook to use hardened API client instead of raw fetch
- [ ] Create upload-queue module with storage, retry logic, and flushPendingUploads function
- [ ] Update mobile Expo config with real bundle IDs or document placeholder setup
- [ ] Fix TypeScript errors in Reanimated hooks and motion package (top 20 first)
- [ ] Fix test failures by ensuring haptics and logger mocks are complete
- [ ] Fix lint errors systematically (alias resolver, any types, unused directives)
- [ ] Update vulnerable dependencies (nanoid, send, esbuild) to patched versions
- [ ] Create .env.example files for web and mobile with safe defaults
- [ ] Update blockers.md to reflect completed fixes and current status
- [ ] Run full verification suite (lint, typecheck, test, audit) for both apps