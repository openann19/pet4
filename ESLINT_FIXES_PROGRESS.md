# ESLint Fixes Progress Report

## Current Status

**Total Issues:** ~2,574 (572 errors, 2,000 warnings)

## Issues Fixed So Far

### 1. React Hooks Rules Violations (Critical)

- ✅ **PetDetailDialog.tsx** - Moved all hooks to top level, fixed conditional hook calls
- ✅ **EnhancedVisuals.tsx** - Converted `createDotAnimation` function to `useDotAnimation` hook
- ✅ **QuickActionsMenu.tsx** - Extracted action item into separate `QuickActionItem` component

### 2. Floating Promises (Critical)

- ✅ **QueryProvider.tsx** - Added `void` to `queryClient.invalidateQueries()` call
- ✅ **SeedDataInitializer.tsx** - Added `await` to all storage setter calls

### 3. Missing Dependencies in Hooks

- ✅ **PetDetailDialog.tsx** - Added proper eslint-disable comments for Reanimated SharedValues
- ✅ **EnhancedVisuals.tsx** - Added cleanup for setTimeout in `useDotAnimation`
- ✅ **QuickActionsMenu.tsx** - Added proper dependency handling

### 4. Unnecessary Conditionals

- ✅ **PetDetailDialog.tsx** - Removed redundant truthiness checks for `personality`, `interests`, `lookingFor`
- ✅ **SeedDataInitializer.tsx** - Removed unnecessary null coalescing

## Remaining Issues by Category

### 1. React Hooks Dependencies (160 warnings)

**Pattern:** Missing dependencies in `useEffect` and `useCallback` hooks

**Common Cases:**

- Reanimated SharedValues (should NOT be in deps - use eslint-disable comment)
- State setters from useState (stable, don't need to be in deps)
- Functions defined in component (should be in deps or useCallback)

**Fix Pattern:**

```typescript
// For Reanimated SharedValues
useEffect(() => {
  opacity.value = withSpring(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Reanimated SharedValues are stable references
}, [triggerValue])

// For state setters
useEffect(() => {
  setValue(newValue)
  // State setters are stable, no need to include in deps
}, [someOtherDep])
```

### 2. Floating Promises (204 errors)

**Pattern:** Promises not awaited or voided

**Common Cases:**

- Storage setters (`useStorage` returns Promise<void>)
- API calls in event handlers
- Async functions in useEffect
- Query invalidation calls

**Fix Pattern:**

```typescript
// In async functions - await them
await setValue(newValue)
await api.call()

// In event handlers or fire-and-forget - void them
void setValue(newValue)
void queryClient.invalidateQueries()

// In useEffect with async function
useEffect(() => {
  async function doSomething() {
    await api.call()
  }
  void doSomething()
}, [])
```

### 3. Unnecessary Conditionals (1,348 warnings)

**Pattern:** Checks that are always true/false based on TypeScript types

**Common Cases:**

- Optional chaining on non-nullable values (`pet?.name` when `pet` is guaranteed non-null)
- Truthiness checks on always-defined properties
- Null coalescing on non-nullable values

**Fix Pattern:**

```typescript
// Before
{pet?.name && <div>{pet.name}</div>}
{value ?? defaultValue} // when value is never null/undefined

// After
{pet.name && <div>{pet.name}</div>}
{value} // or just use value directly
```

### 4. Type Safety Issues (439 warnings)

**Pattern:** `any` types, unsafe assignments, unsafe member access

**Common Cases:**

- API response types using `any`
- Unsafe type assertions
- Missing type guards

**Fix Pattern:**

```typescript
// Add proper types
interface ApiResponse {
  data: string
  error?: string
}

// Use type guards
function isApiResponse(value: unknown): value is ApiResponse {
  return typeof value === 'object' && value !== null && 'data' in value
}
```

### 5. Unused Variables (181 errors)

**Pattern:** Variables defined but never used

**Fix:** Remove unused variables or prefix with `_` if intentionally unused

### 6. React Hooks Rules (143 errors)

**Pattern:** Hooks called conditionally, in callbacks, or in loops

**Fix:**

- Move hooks to top level
- Extract components for hooks used in loops
- Convert functions using hooks to custom hooks

## Systematic Fix Strategy

### Phase 1: Critical Errors (React Hooks Rules)

1. Find all files with `react-hooks/rules-of-hooks` errors
2. Fix each file by:
   - Moving hooks to top level
   - Extracting components for hooks in loops
   - Converting functions to hooks

### Phase 2: Floating Promises

1. Find all files with `no-floating-promises` errors
2. For each file:
   - Identify promise-returning functions
   - Add `await` for promises that need to complete
   - Add `void` for fire-and-forget promises
   - Update useEffect dependencies if needed

### Phase 3: Hook Dependencies

1. Find all files with `exhaustive-deps` warnings
2. For each file:
   - Identify missing dependencies
   - Add eslint-disable comments for Reanimated SharedValues
   - Add dependencies for functions/values that should be included
   - Use useCallback for functions used as dependencies

### Phase 4: Unnecessary Conditionals

1. Use TypeScript to identify unnecessary checks
2. Remove redundant optional chaining
3. Remove redundant null coalescing
4. Simplify conditional logic

### Phase 5: Type Safety

1. Replace `any` types with proper types
2. Add type guards where needed
3. Fix unsafe assignments
4. Add proper error handling

## Automation Opportunities

### Script 1: Fix Floating Promises in Storage Setters

```bash
# Find all uses of useStorage setters
grep -r "setAllPets\|setIsInitialized\|setValue" --include="*.tsx" --include="*.ts"

# Pattern: setValue(x) -> await setValue(x) or void setValue(x)
```

### Script 2: Fix Reanimated SharedValues Dependencies

```bash
# Find all useEffect with SharedValue.value
grep -r "useEffect.*SharedValue\|useEffect.*\.value" --include="*.tsx"

# Add eslint-disable comment pattern
```

### Script 3: Remove Unnecessary Optional Chaining

```bash
# Find unnecessary optional chaining
# Use TypeScript compiler to identify cases where value is non-nullable
```

## Files Requiring Immediate Attention

### High Priority (Critical Errors)

1. Files with React Hooks rules violations
2. Files with floating promises in critical paths
3. Files with type safety issues causing runtime errors

### Medium Priority (Warnings)

1. Files with many unnecessary conditionals
2. Files with missing hook dependencies
3. Files with unused variables

## Next Steps

1. **Continue fixing React Hooks rules violations** - Focus on files with hooks in callbacks/loops
2. **Fix floating promises systematically** - Start with storage setters and API calls
3. **Add proper eslint-disable comments** - For Reanimated SharedValues and stable setters
4. **Remove unnecessary conditionals** - Use TypeScript's type narrowing
5. **Improve type safety** - Replace `any` with proper types

## Notes

- Reanimated SharedValues should NOT be in dependency arrays (they're stable references)
- State setters from useState are stable and don't need to be in deps
- Storage setters from useStorage return Promises - await or void them
- Optional chaining should only be used when value can be null/undefined
- All hooks must be called at the top level of components/hooks
