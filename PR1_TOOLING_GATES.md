# PR #1 – Tooling/Gates

## Summary

Implemented comprehensive tooling and quality gates for the PETSPARK monorepo to enforce zero TypeScript errors and zero ESLint warnings.

## Changes

### 1. Root package.json Scripts

Added comprehensive scripts:

- `typecheck`: Runs TypeScript check across all packages and apps
- `lint`: Runs ESLint with zero warnings tolerance
- `lint:fix`: Auto-fixes linting issues
- `format`: Formats code with Prettier
- `format:check`: Checks formatting without modifying files
- `validate`: Full validation (typecheck + lint + test)
- `depcheck`: Dependency checking across all packages

### 2. TypeScript Configuration

Updated `tsconfig.base.json`:

- ✅ Added `noImplicitReturns: true`
- ✅ Verified all strict options are enabled:
  - `strict: true`
  - `noUncheckedIndexedAccess: true`
  - `exactOptionalPropertyTypes: true`
  - `noImplicitOverride: true`
  - `noImplicitReturns: true`
  - `noFallthroughCasesInSwitch: true`
  - `useUnknownInCatchVariables: true`
  - `skipLibCheck: true`

### 3. ESLint Configuration

Updated `eslint.config.js`:

- ✅ Removed `@eslint/eslintrc` dependency (not needed for ESLint 9)
- ✅ Fixed plugin imports to work with ESLint 9 flat config
- ✅ Verified type-aware rules only apply to `*.ts,*.tsx` files
- ✅ JS config files are excluded from type-aware rules
- ✅ All strict rules enabled (no-unsafe-\*, no-floating-promises, etc.)

### 4. Prettier Configuration

Created `.prettierrc.json` and `.prettierignore`:

- ✅ Consistent code formatting across the monorepo
- ✅ Proper ignore patterns for build artifacts and dependencies

### 5. Git Hooks (Husky)

Updated `.husky/pre-commit`:

- ✅ Runs `pnpm lint:fix` and `pnpm format` on staged files

Created `.husky/pre-push`:

- ✅ Runs `pnpm validate` (typecheck + lint + test) before push

### 6. CI/CD Workflow

Created `.github/workflows/ci.yml`:

- ✅ Runs on every push and PR
- ✅ Installs dependencies with `--frozen-lockfile`
- ✅ Runs typecheck, lint, format check, and tests
- ✅ Non-blocking depcheck

### 7. Documentation

Created `TYPE_AND_LINT_DISCIPLINE.md`:

- ✅ Comprehensive documentation of rules and practices
- ✅ Instructions for adding new packages
- ✅ Common issues and solutions

### 8. TypeScript Fixes

Fixed TypeScript errors in `packages/core/src/api/client.ts`:

- ✅ Fixed `exactOptionalPropertyTypes` issues in `APIError` interface
- ✅ Fixed `normalizeError` function to handle optional properties correctly
- ✅ Fixed `UnifiedAPIClient` constructor to handle optional `auth` and `telemetry` properties
- ✅ Removed unused `url` parameter (prefixed with `_`)

## Dependencies Added

- `@eslint/js`: ESLint core rules
- `@types/node`: Node.js type definitions
- `depcheck`: Dependency checking
- `eslint`: ESLint core
- `eslint-plugin-import`: Import/export linting
- `eslint-plugin-jsx-a11y`: Accessibility linting
- `eslint-plugin-react`: React linting
- `eslint-plugin-react-hooks`: React Hooks linting
- `eslint-plugin-react-refresh`: React Refresh linting
- `globals`: Global variables for ESLint
- `prettier`: Code formatting
- `ts-prune`: Dead code detection
- `typescript-eslint`: TypeScript ESLint integration

## Testing

- ✅ `pnpm install` - Dependencies installed successfully
- ✅ `pnpm format` - Prettier formatting works
- ✅ `pnpm typecheck` - TypeScript check runs (some errors remain to be fixed in PR #2 and #3)
- ✅ `pnpm lint` - ESLint runs (some warnings remain to be fixed in PR #2 and #3)

## Next Steps

- **PR #2**: Autofix & Hygiene
  - Organize imports, remove unused
  - Delete dead code
  - Fix import order/resolver issues

- **PR #3**: Strictness Remediation
  - Replace any/casts with proper types
  - Add Zod/Valibot schemas for env and network boundaries
  - Fix all `react-hooks/exhaustive-deps`
  - Handle promises safely
  - Remove all hacks from `logs/hacks.txt`

## Notes

- ESLint warnings about parsing node_modules files are expected and harmless - they're just informational messages about files that can't be parsed by the TypeScript parser
- Some TypeScript errors and ESLint warnings remain and will be addressed in PR #2 and PR #3
- The Husky hooks are set up but may need to be initialized with `husky install` if not already done

## Acceptance Criteria Status

- ✅ Root `tsconfig.base.json` with all strict options
- ✅ Flat `eslint.config.js` with type-aware rules for `*.ts,*.tsx` only
- ✅ Scripts in root `package.json`: `typecheck`, `lint`, `lint:fix`, `format`, `validate`, `depcheck`
- ✅ Husky hooks: `pre-commit` and `pre-push`
- ✅ CI workflow running typecheck, lint, and test
- ⚠️ Zero TypeScript errors: **In Progress** (some errors remain)
- ⚠️ Zero ESLint warnings: **In Progress** (some warnings remain)
- ⚠️ Zero hacks: **In Progress** (to be addressed in PR #3)
