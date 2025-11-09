# PR #2 – Autofix & Hygiene

## Summary

Completed autofix and hygiene improvements for the PETSPARK monorepo, fixing TypeScript errors and improving code quality.

## Changes

### 1. Fixed TypeScript Errors in `packages/chat-core`

#### Created `packages/chat-core/src/hooks/useStorage.ts`

- ✅ Created a simple localStorage-based storage hook for the chat-core package
- ✅ Works in both web and can be overridden in React Native environments
- ✅ Proper error handling and type safety

#### Fixed `packages/chat-core/src/useOutbox.ts`

- ✅ Fixed import path: Changed from `@/hooks/useStorage` to `./hooks/useStorage`
- ✅ Fixed TypeScript error: Added explicit type annotation for `results` variable
- ✅ Fixed circular dependency: Used refs (`processQueueRef`, `scheduleNextRef`) to break circular dependencies between `processQueue` and `scheduleNext`
- ✅ Fixed type guard: Simplified type guard predicate to avoid implicit any
- ✅ Removed circular dependencies from useCallback dependency arrays

### 2. ESLint Configuration

#### Simplified ESLint Config

- ✅ Restructured to apply type-aware rules only to source files (`apps/**/src/**/*.{ts,tsx}`, `packages/**/src/**/*.{ts,tsx}`)
- ✅ Fixed `consistent-type-imports` rule configuration
- ✅ Excluded test files and node_modules from type-aware rules
- ✅ Added proper ignores for config files

### 3. Code Quality Improvements

- ✅ Fixed all TypeScript errors in `packages/chat-core`
- ✅ Improved type safety with explicit type annotations
- ✅ Resolved circular dependencies using refs pattern
- ✅ Maintained React hooks best practices

## Files Modified

### New Files

- `packages/chat-core/src/hooks/useStorage.ts` - Storage hook implementation

### Modified Files

- `packages/chat-core/src/useOutbox.ts` - Fixed TypeScript errors and circular dependencies
- `eslint.config.js` - Simplified and fixed configuration

## Testing

### TypeScript

- ✅ `pnpm typecheck` - All packages pass type checking
- ✅ `packages/chat-core` - Zero TypeScript errors

### ESLint

- ✅ ESLint config loads without errors
- ⚠️ Some parsing warnings from react-native node_modules (harmless, expected)

### Formatting

- ✅ `pnpm format` - Code formatting works correctly

## Remaining Work

### PR #3 - Strictness Remediation

1. **Replace any/casts**: Fix all `as any` and `as unknown as` casts with proper types
2. **Add Zod/Valibot schemas**: Add validation schemas for env and network boundaries
3. **Fix react-hooks/exhaustive-deps**: Fix all dependency array warnings
4. **Promise safety**: Handle all floating promises properly
5. **Remove hacks**: Remove all suppressions and workarounds from `logs/hacks.txt`

## Acceptance Criteria Status

### PR #2

- ✅ Import organization - **Fixed** (useStorage import)
- ✅ TypeScript errors - **Fixed** (packages/chat-core)
- ✅ Circular dependencies - **Fixed** (useOutbox.ts)
- ⏳ Dead code removal - **Pending** (to be done in PR #3)
- ⏳ Path alias fixes - **Pending** (to be done in PR #3)

## Notes

- The ESLint config now properly handles type-aware rules for source files only
- Circular dependencies in React hooks are resolved using the refs pattern
- The useStorage hook is a simple implementation that can be overridden in native environments
- All TypeScript errors in the core packages are now fixed

## Next Steps

1. **PR #3**: Address remaining strictness issues
   - Replace all `as any` and `as unknown as` casts
   - Add Zod/Valibot schemas for validation
   - Fix all ESLint warnings
   - Remove all hacks and suppressions

2. **Dead Code Removal**: Run ts-prune/knip to identify and remove unused code

3. **Path Alias Fixes**: Ensure all path aliases are properly configured and used consistently
