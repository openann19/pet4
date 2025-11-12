# Type & Lint Discipline

This document outlines the strict TypeScript and ESLint rules enforced across the PETSPARK monorepo.

## Overview

The monorepo enforces **zero TypeScript errors** and **zero ESLint warnings** with no hacks or workarounds. All code must be production-grade.

## Rules

### Non-Negotiables

- **Ban**: `// @ts-nocheck`, `// @ts-ignore`, blanket `eslint-disable`, `as any`, double casts (`as unknown as`), non-null assertions (`!`), implicit `any`
- **Third-party type gaps**: Add minimal `types/vendor/*.d.ts` shim (precise, no `any`) and file a ticket to replace it
- **JS config files**: Excluded from type-aware ESLint rules to avoid parser/type crashes
- **Runtime boundaries**: Validate with Zod or Valibot—no blind casts

## TypeScript Configuration

### Strict Options

The root `tsconfig.base.json` enforces:

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `noImplicitOverride: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `useUnknownInCatchVariables: true`
- `skipLibCheck: true`

### Project Structure

Each app and package extends `tsconfig.base.json`:

- `apps/*/tsconfig.json` - App-specific configs
- `packages/*/tsconfig.json` - Package-specific configs

## ESLint Configuration

### Flat Config

The root `eslint.config.js` uses ESLint flat config with:

- **Type-aware rules** for `*.ts,*.tsx` files only
- **Non-type-aware rules** for JS/config files
- **Strict rules**: error on unsafe any/return/call/member-access, no-floating-promises, require-await, await-thenable, consistent-type-imports, react-hooks rules

### Core Rules

- `@typescript-eslint/no-explicit-any: error`
- `@typescript-eslint/no-unsafe-*: error`
- `@typescript-eslint/no-floating-promises: error`
- `@typescript-eslint/require-await: error`
- `@typescript-eslint/await-thenable: error`
- `@typescript-eslint/consistent-type-imports: error`
- `react-hooks/rules-of-hooks: error`
- `react-hooks/exhaustive-deps: error`

## Scripts

### Root Package.json Scripts

```bash
# Type checking across all packages and apps
pnpm typecheck

# Linting with zero warnings
pnpm lint

# Auto-fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Format check
pnpm format:check

# Full validation (typecheck + lint + test)
pnpm validate

# Dependency check
pnpm depcheck

# Run tests
pnpm test
```

## Git Hooks

### Pre-commit Hook

Runs `pnpm lint:fix` and `pnpm format` on staged files.

### Pre-push Hook

Runs `pnpm validate` (typecheck + lint + test) before allowing push.

## CI/CD

### GitHub Actions

The `.github/workflows/ci.yml` workflow runs on every push and PR:

1. **Install dependencies**: `pnpm install --frozen-lockfile`
2. **TypeScript check**: `pnpm typecheck` (must have 0 errors)
3. **ESLint**: `pnpm lint` (must have 0 warnings)
4. **Format check**: `pnpm format:check`
5. **Tests**: `pnpm test`
6. **Depcheck**: `pnpm depcheck` (non-blocking)

## Adding New Packages

When adding a new package or app:

1. **Create `tsconfig.json`** that extends `tsconfig.base.json`:

   ```json
   {
     "extends": "../../tsconfig.base.json",
     "compilerOptions": {
       "outDir": "./dist",
       "rootDir": "./src"
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
   }
   ```

2. **Ensure ESLint picks it up**: The root `eslint.config.js` includes:

   ```js
   parserOptions: {
     project: [
       './tsconfig.base.json',
       './apps/*/tsconfig.json',
       './packages/*/tsconfig.json',
     ],
   }
   ```

3. **Add test script**: Ensure the package has a `test:run` script in its `package.json`:
   ```json
   {
     "scripts": {
       "test:run": "vitest run"
     }
   }
   ```

## Common Issues & Solutions

### Type Errors

**Issue**: Type errors in third-party libraries

**Solution**: Create a minimal type shim in `types/vendor/*.d.ts`:

```typescript
declare module 'vendor-library' {
  export interface VendorType {
    // Minimal type definition
  }
}
```

### ESLint Errors

**Issue**: Type-aware rules failing on JS config files

**Solution**: JS config files are automatically excluded. If you need to lint them, they use non-type-aware rules.

### Runtime Validation

**Issue**: External data needs validation

**Solution**: Use Zod or Valibot schemas:

```typescript
import { z } from 'zod'

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
})

type User = z.infer<typeof UserSchema>

function parseUser(data: unknown): User {
  return UserSchema.parse(data)
}
```

## Acceptance Criteria

Before merging any PR:

- ✅ `pnpm typecheck` → **0 errors**
- ✅ `pnpm eslint . --max-warnings=0` → **0 warnings, 0 errors**
- ✅ Repo contains **0** `@ts-nocheck` / `@ts-ignore`
- ✅ Repo contains **0** `eslint-disable` (except line-scoped with clear reason)
- ✅ **0** `as any` and **0** double casts
- ✅ CI green on PRs
- ✅ Husky hooks active

## Enforcement

- **Pre-commit**: Automatically fixes linting and formatting issues
- **Pre-push**: Blocks push if validation fails
- **CI**: Blocks merge if any gate fails

## Migration Notes

If you encounter legacy code with suppressions:

1. **Remove the suppression** (e.g., `// @ts-ignore`)
2. **Fix the underlying issue** with proper types
3. **Add tests** to lock the behavior
4. **Update this document** if the fix requires a pattern change

## Resources

- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [Zod Validation](https://zod.dev/)
- [Valibot Validation](https://valibot.dev/)
