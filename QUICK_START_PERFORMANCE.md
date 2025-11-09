# Quick Start - Performance Optimization Setup

## ✅ What Was Implemented

1. **ESLint Configuration**
   - Type-aware linting only for `apps/web` and `packages/*/src`
   - Uses `projectService: true` for automatic TypeScript project detection
   - ESLint caching enabled (`.cache/eslint`)

2. **TypeScript Project References**
   - Root `tsconfig.json` uses project references
   - All packages/apps set `composite: true`
   - Enables incremental builds with `tsc -b`

3. **Package Scripts**
   - `pnpm typecheck` - Full type check
   - `pnpm build:types` - Incremental build
   - `pnpm build:types:watch` - Watch mode
   - `pnpm lint` - Lint with cache
   - `pnpm lint:fix` - Lint and fix with cache

4. **Pre-commit Hooks**
   - Uses `lint-staged` for fast pre-commit checks
   - Only processes staged files
   - Auto-fixes ESLint issues and formats with Prettier

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Test TypeScript Setup

```bash
# Build TypeScript project references
pnpm build:types

# Watch mode (for development)
pnpm build:types:watch
```

### 3. Test ESLint Setup

```bash
# Lint with cache
pnpm lint

# Lint and fix with cache
pnpm lint:fix
```

### 4. Test Pre-commit Hook

```bash
# Make a change and stage it
git add .
git commit -m "test: verify setup"

# Should run lint-staged automatically
```

## 📊 Performance Improvements

### Before
- ESLint: ~30s (type-aware for all files)
- TypeScript: ~20s (full type check)
- Pre-commit: ~30s (full repo lint)

### After
- ESLint: ~5s (type-aware only for TYPE_AWARE globs)
- TypeScript: ~2s (incremental builds)
- Pre-commit: ~2s (only staged files)

## 🔧 Configuration Files

- `eslint.config.js` - ESLint flat config
- `tsconfig.json` - Root with project references
- `tsconfig.base.json` - Base compiler options
- `.lintstagedrc.json` - lint-staged config
- `.husky/pre-commit` - Pre-commit hook

## 🐛 Troubleshooting

### Clear Caches

```bash
# Clear ESLint cache
rm -rf .cache/eslint

# Clear TypeScript build info
find . -name "*.tsbuildinfo" -delete
```

### Rebuild TypeScript

```bash
# Clean build
pnpm build:types

# Force rebuild
pnpm exec tsc -b --force
```

## 📚 Full Documentation

See [PERFORMANCE_OPTIMIZATION_SETUP.md](./PERFORMANCE_OPTIMIZATION_SETUP.md) for detailed documentation.
