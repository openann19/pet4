# Semantic Audit - Truly Unused Files

**Date:** 2025-11-06  
**Method:** Semantic analysis of actual usage patterns (not just import/export)

## Summary

After semantic analysis of the codebase, here are files that are **truly unused** based on actual application flow:

## Confirmed Unused Files

### 1. Design System Files (2 files) - UNUSED

**Location:** `apps/web/design-system/`

- **`ThemeProvider.tsx`** - NOT USED
  - Reason: App uses `UIContext` and `AppContext` for theming, not this provider
  - Only referenced in `visuals.txt` (documentation), never imported in actual code
- **`themes.ts`** - NOT USED
  - Reason: Exports `getThemeTokens`, `applyTheme`, `designTokens` but none are imported anywhere
  - App uses different theme system via contexts

**Action:** ✅ SAFE TO DELETE

### 2. AGI UI Engine (Mostly Unused)

**Location:** `apps/web/src/agi_ui_engine/`

**Status:** Only config is used in tests, effects are NOT used

- **`config/ABSOLUTE_MAX_UI_MODE.ts`** - Used in tests only
  - Used in: `useUIConfig.test.tsx`, `UIContext.test.tsx`, `absolute-max-ui-mode.test.ts`
  - NOT used in any actual components
- **All effect hooks** (`useAIReplyAura`, `useTypingTrail`, `useBubbleGlow`, etc.) - NOT USED
  - Exported from `index.ts` but never imported in components
  - App uses `@/effects/reanimated` hooks instead

**Action:** ⚠️ REVIEW - Config might be needed for tests, but effects can be removed

### 3. API Files - ALL USED ✅

All API files in `apps/web/src/api/` are **ACTUALLY USED**:

- Exported from `api/index.ts`
- Imported and used in components, services, and hooks
- **DO NOT DELETE** - These are false positives from AST analysis

### 4. Scripts Directory - Review Needed

**Location:** `apps/web/scripts/`

- **`e2e-walkthrough.ts`** - Flagged as unused but might be run manually
  - Contains `runWalkthrough` function
  - Check if it's used in CI/CD or run manually

**Action:** ⚠️ MANUAL REVIEW

## Files That Appear Unused But Are Actually Used

### False Positives (DO NOT DELETE):

1. **Package files** (`packages/motion/`, `packages/shared/`, etc.)
   - Imported via workspace references (`@petspark/motion`, `@petspark/shared`)
   - AST analysis doesn't detect workspace imports correctly

2. **API files** (`adoption-api.ts`, `matching-api.ts`, `community-api.ts`)
   - All exported from `api/index.ts` and used throughout app
   - Used in: components, services, hooks, admin panels

3. **Service files** (`adoption-service.ts`, `chat-service.ts`, etc.)
   - Used by components and hooks
   - Part of the application's data layer

4. **Effect hooks** (`@/effects/reanimated/*`)
   - Used extensively in `App.tsx` and components
   - Part of the animation system

## Recommendations

### Immediate Actions:

1. **DELETE** `apps/web/design-system/ThemeProvider.tsx`
2. **DELETE** `apps/web/design-system/themes.ts`
3. **REVIEW** `apps/web/src/agi_ui_engine/` - Remove unused effect hooks, keep config if tests need it
4. **KEEP** All API files - they're actively used
5. **KEEP** All service files - they're part of the data layer

### Files Requiring Manual Review:

1. `apps/web/scripts/e2e-walkthrough.ts` - Check if used in CI/CD
2. Test files that might reference deleted files
3. Documentation that references deleted files

## Verification Method

To verify a file is truly unused:

1. **Check exports** - Is it exported from a barrel file (`index.ts`)?
2. **Check imports** - Search for imports across the codebase
3. **Check dynamic imports** - Look for `import()` or `require()` calls
4. **Check routes** - Is it a route component?
5. **Check entry points** - Is it imported in `main.tsx`, `App.tsx`, or `admin-main.tsx`?
6. **Check tests** - Is it used in test files?

## Conclusion

**Truly unused files:** ~2-3 files (design-system files)
**False positives:** ~1,100+ files (packages, APIs, services that ARE used)

The AST-based analysis had many false positives because:

- Workspace imports aren't detected correctly
- Dynamic imports aren't tracked
- Barrel exports create indirect dependencies
- Build-time usage (config files) isn't detected

**Next Steps:**

1. Delete confirmed unused files (design-system)
2. Review agi_ui_engine usage in tests
3. Keep all API/service files - they're actively used
