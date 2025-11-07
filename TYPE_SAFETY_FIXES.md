# Type Safety Fixes - Strict Optional Properties

**Date:** 2024-12-19  
**Status:** ✅ Core Component Fixes Complete

## Summary

Fixed TypeScript strict optional property type errors (`exactOptionalPropertyTypes: true`) in key component files. The fixes ensure that optional properties are properly omitted when `undefined` rather than being explicitly set to `undefined`.

## Files Fixed ✅

### 1. Stories Components

#### `apps/web/src/components/stories/StoriesBar.tsx`
- **Issue:** `currentUserAvatar?: string` prop being passed as `string | undefined`
- **Fix:** Changed spread operator from `{...(currentUserAvatar && { currentUserAvatar })}` to `{...(currentUserAvatar !== undefined ? { currentUserAvatar } : {})}`
- **Locations:** Lines 89, 147, 161

#### `apps/web/src/components/stories/HighlightViewer.tsx`
- **Issue:** Same `currentUserAvatar` optional property issue
- **Fix:** Updated spread operator pattern
- **Location:** Line 68

#### `apps/web/src/components/stories/StoryViewer.tsx`
- **Issue:** `userAvatar?: string` in StoryReaction being set to `string | undefined`
- **Fix:** Changed from `{...(currentUserAvatar && { userAvatar: currentUserAvatar })}` to `{...(currentUserAvatar !== undefined ? { userAvatar: currentUserAvatar } : {})}`
- **Location:** Line 250

### 2. Playdate Components

#### `apps/web/src/components/playdate/PlaydateScheduler.tsx`
- **Issue:** `value?: PlaydateLocation` prop being passed as `PlaydateLocation | null`
- **Fix:** Changed from `{...(selectedLocation && { value: selectedLocation })}` to `{...(selectedLocation !== null ? { value: selectedLocation } : {})}`
- **Location:** Line 619

### 3. Streaming Components

#### `apps/web/src/components/streaming/GoLiveDialog.tsx`
- **Issue:** `description?: string` prop being set conditionally
- **Fix:** Changed from `{...(description.trim() && { description: description.trim() })}` to `{...(description.trim() ? { description: description.trim() } : {})}`
- **Location:** Line 79

### 4. Lost & Found Components

#### `apps/web/src/components/lost-found/CreateLostAlertDialog.tsx`
- **Issue:** Multiple optional properties (`ownerAvatar`, `reward`, `description`) being set to `undefined`
- **Fix:** Updated all spread operators to properly omit properties when `undefined`:
  - `ownerAvatar`: `{...(user.avatarUrl ? { ownerAvatar: user.avatarUrl } : {})}`
  - `reward`: `{...(reward !== undefined && reward !== null ? { reward } : {})}`
  - `description`: `{...(locationDescription ? { description: locationDescription } : {})}`
- **Location:** Lines 117, 120, 123

### 5. Admin Components

#### `apps/web/src/components/admin/MapSettingsView.tsx`
- **Issue:** Type narrowing issue with `'metric' | 'imperial'` union type
- **Fix:** Added explicit type assignment to ensure proper narrowing:
  ```typescript
  const unitValue: 'metric' | 'imperial' = value
  handleSettingChange('UNITS', unitValue)
  ```
- **Location:** Lines 293-296

## Fix Pattern

The consistent pattern for fixing strict optional property issues:

### Before (Incorrect)
```typescript
{...(value && { prop: value })}  // ❌ Fails with exactOptionalPropertyTypes
{...(value !== undefined && { prop: value })}  // ❌ Still fails if value is string | undefined
```

### After (Correct)
```typescript
// For string | undefined → string?
{...(value !== undefined ? { prop: value } : {})}

// For string | null → string?
{...(value !== null ? { prop: value } : {})}

// For truthy checks (strings)
{...(value ? { prop: value } : {})}

// For numbers with null/undefined
{...(value !== undefined && value !== null ? { prop: value } : {})}
```

## Remaining Issues ⚠️

The following TypeScript errors remain in library/utility files and are **separate issues** that should be addressed:

1. **Library Files** (`apps/web/src/lib/`)
   - `stories-utils.ts` - Object creation with optional properties
   - `streaming-service.ts` - Multiple optional property issues
   - `call-utils.ts` - Optional property assignment

2. **UI Components** (`apps/web/src/components/ui/`)
   - Type mismatches with third-party library types
   - React version compatibility issues

3. **Core Services** (`apps/web/src/core/services/`)
   - Media engine type issues
   - File system API type mismatches

**Note:** These are pre-existing issues unrelated to the component fixes and should be addressed as part of separate type safety improvement efforts.

## Verification

```bash
# Check remaining strict optional property errors in components
pnpm typecheck 2>&1 | grep -E "error TS2375|error TS2379" | grep "components/"
```

## Impact

✅ All critical component type errors fixed  
✅ Consistent pattern applied across all fixes  
✅ Proper handling of optional properties with `exactOptionalPropertyTypes: true`  
⚠️ Library/utility files still have some remaining issues (separate effort)

