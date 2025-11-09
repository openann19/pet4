# Core Testing Stack Setup

## Overview

This document describes the standardized testing infrastructure across the PETSPARK monorepo. All packages and apps use Vitest with consistent configuration, coverage thresholds, and test scripts.

## Testing Stack

### Tools

- **Vitest**: Fast, ESM-aware test runner with built-in TypeScript support
- **@testing-library/react**: Component testing for React components
- **@testing-library/react-native**: Component testing for React Native components
- **@vitest/coverage-v8**: Coverage reporting with v8 provider
- **jsdom**: DOM simulation for web package tests

### Coverage Thresholds

All packages enforce 95% coverage for:

- Statements
- Branches
- Functions
- Lines

## Standardized Test Scripts

All packages include the following test scripts:

```json
{
  "test": "vitest",                    // Watch mode (development)
  "test:watch": "vitest",              // Watch mode (explicit)
  "test:run": "vitest run --passWithNoTests",  // Run once (CI)
  "test:cov": "vitest run --coverage", // Run with coverage
  "test:ci": "vitest run --coverage --reporter=verbose"  // CI mode
}
```

## Root-Level Test Commands

From the monorepo root:

```bash
pnpm test          # Run all tests once
pnpm test:watch    # Run all tests in watch mode
pnpm test:cov      # Run all tests with coverage
pnpm test:ci       # Run all tests in CI mode (with coverage + verbose)
```

## Package Configurations

### Apps

- **apps/web**: jsdom environment, React testing setup
- **apps/mobile**: jsdom environment, React Native testing setup

### Packages

- **packages/shared**: jsdom environment, React/React Native mocks
- **packages/core**: node environment, no DOM mocks
- **packages/chat-core**: jsdom environment, React testing setup
- **packages/motion**: jsdom environment, React Native Reanimated mocks

## Test Setup Files

Each package has a `src/test/setup.ts` file that:

1. Configures Vitest globals
2. Sets up React/React Native mocks (if needed)
3. Configures cleanup after tests
4. Mocks environment-specific APIs (window, matchMedia, etc.)

### Setup File Locations

- `apps/web/src/test/setup.ts`
- `apps/mobile/src/test/setup.ts`
- `packages/shared/src/test/setup.ts`
- `packages/core/src/test/setup.ts`
- `packages/chat-core/src/test/setup.ts`
- `packages/motion/src/test/setup.ts`

## Vitest Configuration

All `vitest.config.ts` files include:

- `globals: true` - Global test functions (describe, it, expect)
- `environment: 'jsdom' | 'node'` - Test environment
- `setupFiles: ['./src/test/setup.ts']` - Setup file path
- `include: ['src/**/*.{test,spec}.{ts,tsx}']` - Test file patterns
- Coverage thresholds: 95% for all metrics
- Coverage reporters: `['text', 'json', 'html', 'lcov']`
- Coverage exclusions: test files, node_modules, dist, build

## Pre-Commit Hooks

### Husky Setup

Pre-commit hooks are configured via Husky:

- **Pre-commit**: Runs `lint-staged` (ESLint fix + Prettier)
- **Pre-push**: Runs `pnpm validate` (typecheck + lint + tests)

### Lint-Staged Configuration

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix --max-warnings=0",
      "prettier --write"
    ],
    "*.{json,md,mdx,css,scss,yaml,yml}": [
      "prettier --write"
    ]
  }
}
```

## CI Integration

The CI workflow (`.github/workflows/ci.yml`) runs:

1. TypeScript type checking
2. ESLint (zero warnings)
3. Format check (Prettier)
4. Tests with coverage (`pnpm test:ci`)
5. Dependency check (depcheck)

## Running Tests

### Development (Watch Mode)

```bash
# Run all tests in watch mode
pnpm test:watch

# Run tests for a specific package
pnpm --filter ./packages/shared test:watch
```

### CI Mode

```bash
# Run all tests with coverage (CI)
pnpm test:ci

# Run tests for a specific package
pnpm --filter ./packages/shared test:ci
```

### Coverage Reports

Coverage reports are generated in:

- `coverage/` directory (per package)
- HTML report: `coverage/index.html`
- LCOV report: `coverage/lcov.info`

## Best Practices

1. **Write tests alongside code** - Tests should be in the same directory as the code they test
2. **Use descriptive test names** - Test names should clearly describe what they test
3. **Keep tests focused** - Each test should test one thing
4. **Mock external dependencies** - Use Vitest mocks for external APIs and modules
5. **Maintain coverage** - Keep coverage above 95% for all metrics

## Troubleshooting

### Tests Not Running

1. Check that `vitest.config.ts` exists in the package
2. Verify `setupFiles` path is correct
3. Ensure test files match the `include` pattern

### Coverage Below Threshold

1. Run `pnpm test:cov` to see coverage report
2. Identify untested code paths
3. Add tests to cover missing paths
4. Consider if some code should be excluded from coverage

### Mock Issues

1. Check that mocks are in `src/test/setup.ts`
2. Verify mock implementations match actual APIs
3. Use `vi.mock()` for module mocks
4. Use `vi.fn()` for function mocks

## Next Steps

1. **Add more tests** - Increase coverage for existing code
2. **E2E tests** - Add Playwright tests for critical user flows
3. **Integration tests** - Add tests for API integration
4. **Performance tests** - Add tests for performance-critical code
5. **Visual regression tests** - Add tests for UI components

## References

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [React Testing Library](https://testing-library.com/react)
- [React Native Testing Library](https://testing-library.com/react-native)
