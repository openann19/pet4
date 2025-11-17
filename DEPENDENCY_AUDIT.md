# Dependency Version Audit

## Overview

This document tracks dependency version consistency across the PETSPARK monorepo.

## Critical Version Inconsistencies

### React and React Types

- **apps/web**: `react@^18.3.1`, `react-dom@^18.3.1`, `@types/react@^18.3.12`
- **apps/mobile**: `@types/react@~18.2.79`, `@types/react-dom@~18.2.25`
- **Root overrides**: `@types/react@18.3.12` (enforced)

**Status**: ⚠️ Inconsistent - Mobile uses older type definitions
**Recommendation**: Update mobile to match web versions or use root override

### @tanstack/react-query

- **apps/web**: `^5.83.1`
- **apps/mobile**: `^5.0.0`

**Status**: ⚠️ Major version mismatch
**Recommendation**: Update mobile to `^5.83.1` to match web

### @tanstack/react-query-persist-client

- **apps/web**: `^5.90.9`
- **apps/mobile**: `^5.90.9`

**Status**: ✅ Consistent

### @tanstack/react-query-devtools

- **apps/web**: `^5.90.2`
- **apps/mobile**: Not present

**Status**: ℹ️ Dev dependency, not critical for consistency

## Consistent Dependencies

The following dependencies are consistent across packages:

- `@petspark/shared`: `workspace:*` ✅
- `@petspark/motion`: `workspace:*` ✅
- `@petspark/config`: `workspace:*` ✅
- `@petspark/chat-core`: `workspace:*` ✅
- `clsx`: `^2.1.1` ✅
- `zod`: Consistent versions ✅

## Root-Level Overrides

The root `package.json` enforces:

```json
{
  "pnpm": {
    "overrides": {
      "vite": "6.4.1",
      "@types/react": "18.3.12",
      "form-data": ">=4.0.4"
    }
  }
}
```

These overrides ensure consistency even if individual packages specify different versions.

## Recommendations

1. **Update mobile React Query**: Update `apps/mobile/package.json` to use `@tanstack/react-query@^5.83.1`
2. **Standardize React types**: Ensure all packages use the same React type versions via root override
3. **Add dependency check script**: Create a script to automatically detect version mismatches
4. **Use pnpm overrides**: Leverage pnpm overrides for critical dependencies to ensure consistency

## Action Items

- [ ] Update `apps/mobile/package.json` to use `@tanstack/react-query@^5.83.1`
- [ ] Verify React type versions are consistent via root override
- [ ] Add automated dependency audit to CI pipeline
- [ ] Document dependency update policy
