# 🔧 Remaining Linting Issues - Detailed Breakdown

**Date**: 2024-11-12  
**Total Issues**: 61 errors  
**Scope**: Hooks, Utils, Components, Tests (NOT Screens)  
**Status**: Screens are ✅ CLEAN (0 errors)

---

## 📊 Executive Summary

### Issue Distribution
- **Hooks**: ~40 errors (66%)
- **Components**: ~10 errors (16%)
- **Utils/Lib**: ~6 errors (10%)
- **Tests**: ~5 errors (8%)

### By Type
| Type | Count | Severity | Fix Time |
|------|-------|----------|----------|
| Unused Variables/Imports | 12 | Low | 10 min |
| Missing Return Types | 15 | Low | 20 min |
| Floating Promises | 8 | Medium | 15 min |
| Async Without Await | 7 | Low | 10 min |
| Promise in Void Context | 6 | Medium | 15 min |
| Redundant Await | 4 | Low | 5 min |
| Filename Case | 3 | Low | 5 min |
| Array Callback Reference | 2 | Low | 5 min |
| Other | 4 | Low | 10 min |
| **TOTAL** | **61** | **Mixed** | **~2 hours** |

---

## 🗂️ Detailed Issues by File

### 1. 🎣 Hooks (14 files)

#### `use-domain-snapshots.ts` ⚠️ **12 errors**
**Priority**: HIGH (20% of all errors)

```typescript
// Unused imports that need to be removed:
- canEditListing
- canReceiveApplications  
- isValidApplicationStatusTransition
- isValidListingStatusTransition
- AdoptionApplicationStatus
- AdoptionListingStatus
- canEditPost
- canReceiveComments
- isValidCommentStatusTransition
- isValidPostStatusTransition
- CommentStatus
- PostStatus
```

**Fix**: Remove all unused imports or prefix with `_` if intentionally unused  
**Time**: 5 minutes

---

#### `call/useCallManager.ts` ⚠️ **3 errors**
```
Line 1: Filename not kebab-case (should be use-call-manager.ts)
Line 184: Async arrow function without await
Line 252: Async arrow function without await
```

**Fix**: 
1. Rename file to `use-call-manager.ts`
2. Remove `async` or add `await` calls

**Time**: 5 minutes

---

#### `call/useWebRTC.ts` ⚠️ **4 errors**
```
Line 1: Filename not kebab-case (should be use-web-rtc.ts)
Line 82: Missing return type
Line 186: Async arrow function without await
Line 401: Floating promise
```

**Fix**:
1. Rename file to `use-web-rtc.ts`
2. Add return type annotation
3. Handle async properly
4. Add `void` operator or `.catch()`

**Time**: 8 minutes

---

#### `payments/useSubscription.ts` ⚠️ **2 errors**
```
Line 1: Filename not kebab-case (should be use-subscription.ts)
Line 261: Async arrow function without await
```

**Fix**: Rename file, remove async or add await  
**Time**: 3 minutes

---

#### `api/use-payments.ts` ⚠️ **4 errors**
```
Line 110: Missing return type
Line 143: Redundant await
Line 177: Redundant await
Line 216: Redundant await
```

**Fix**: Add return type, remove redundant awaits  
**Time**: 5 minutes

---

#### Other Hooks (5 files, 7 errors total)
- `use-camera.ts`: 1 error (async without await)
- `use-filters.ts`: 1 error (missing return type)
- `use-reduced-motion.ts`: 1 error (floating promise)
- `use-storage.ts`: 2 errors (missing return type, floating promise)

**Time**: 10 minutes total

---

### 2. 🧩 Components (7 files)

#### `call/CallInterface.tsx` ⚠️ **3 errors**
```
Lines 185, 235, 247: Promise-returning function in void context
```

**Fix**: Wrap callbacks to not return promises
```typescript
// ❌ Before
onPress={handleAsyncAction}

// ✅ After
onPress={() => { handleAsyncAction().catch(handleError) }}
```

**Time**: 5 minutes

---

#### `call/VideoQualitySettings.tsx` ⚠️ **2 errors**
```
Line 205: Array callback reference
Line 256: Promise in void context
```

**Fix**: Wrap in arrow functions  
**Time**: 3 minutes

---

#### Payment Components (3 files, 3 errors)
- `PaymentMethodSelector.tsx`: Missing return type
- `PricingModal.tsx`: Array callback reference
- `SubscriptionStatusCard.tsx`: Promise in void context

**Time**: 5 minutes total

---

#### Other Components (2 files, 2 errors)
- `enhanced/EnhancedButton.tsx`: Missing return type
- `camera/camera-view.tsx`: Missing return type

**Time**: 3 minutes total

---

### 3. 🛠️ Utils/Lib (2 files)

#### `lib/camera-permissions.ts` ⚠️ **4 errors**
```
Line 28: Async function without await
Line 46: Floating promise
Line 48: Floating promise
Line 70: Async function without await
```

**Fix**: Remove async or add await, handle promises with `void` or `.catch()`  
**Time**: 8 minutes

---

#### `lib/realtime.ts` ⚠️ **2 errors**
```
Line 154: Async method without await
Line 167: Missing return type
```

**Fix**: Remove async or add await, add return type  
**Time**: 3 minutes

---

#### `utils/storage-adapter.ts` ⚠️ **1 error**
```
Line 6: Redundant await
```

**Fix**: Remove redundant await  
**Time**: 1 minute

---

### 4. 🧪 Tests (5 files, 5 errors)

```
e2e/ui-audit/screens.spec.ts (line 47): Missing return type
e2e/ui-audit/capture-baseline.e2e.ts (line 43): Missing return type
e2e/nav.e2e.ts (line 129): Unused variable _error
e2e/global.d.ts (line 16): Require import
test/setup.ts (line 73): Missing return type
```

**Fix**: Add return types, remove unused vars, convert to ES6 import  
**Time**: 8 minutes

---

### 5. ⚙️ Config & Other (3 files, 3 errors)

```
vitest.config.ts (line 27): Unused variable 'importer'
src/App.tsx: 1 error (need to check)
effects/chat/core/haptic-manager.ts: 1 error (need to check)
```

**Fix**: Remove unused vars, check specific errors  
**Time**: 5 minutes

---

## 🎯 Prioritized Fix Strategy

### Phase 1: Quick Wins (30 minutes) ⚡
**Target**: Fix 19 errors (31% reduction)

1. **Remove unused imports** in `use-domain-snapshots.ts` (12 errors) - 5 min
2. **Rename files** to kebab-case (3 errors) - 5 min
3. **Remove redundant awaits** in `use-payments.ts` (4 errors) - 5 min
4. **Fix test files** (5 errors) - 8 min
5. **Fix config** (1 error) - 2 min

**Result**: 61 → 42 errors

---

### Phase 2: Pattern Fixes (45 minutes) 🔧
**Target**: Fix 30 errors (80% total reduction)

1. **Add missing return types** (~15 errors) - 20 min
   ```typescript
   // Pattern
   function name(): ReturnType { ... }
   ```

2. **Fix floating promises** (~8 errors) - 15 min
   ```typescript
   // Pattern
   void asyncFunction()
   // or
   asyncFunction().catch(handleError)
   ```

3. **Fix async without await** (~7 errors) - 10 min
   ```typescript
   // Remove async if no await
   const handler = () => { ... }
   ```

**Result**: 42 → 12 errors

---

### Phase 3: Polish (30 minutes) ✨
**Target**: Fix 12 errors (100% complete)

1. **Promise in void context** (~6 errors) - 15 min
   ```typescript
   onPress={() => { asyncFn().catch(handleError) }}
   ```

2. **Array callback reference** (2 errors) - 5 min
   ```typescript
   .map(item => callback(item))
   ```

3. **Remaining issues** (4 errors) - 10 min

**Result**: 12 → 0 errors ✅

---

## 📋 Fix Checklist

### Phase 1: Quick Wins ⚡
- [ ] Remove 12 unused imports in `use-domain-snapshots.ts`
- [ ] Rename `useCallManager.ts` → `use-call-manager.ts`
- [ ] Rename `useWebRTC.ts` → `use-web-rtc.ts`
- [ ] Rename `useSubscription.ts` → `use-subscription.ts`
- [ ] Remove 4 redundant awaits in `use-payments.ts`
- [ ] Fix 5 test file issues
- [ ] Fix vitest.config.ts unused var

### Phase 2: Pattern Fixes 🔧
- [ ] Add 15 missing return types
- [ ] Fix 8 floating promises
- [ ] Fix 7 async without await

### Phase 3: Polish ✨
- [ ] Fix 6 promise in void context
- [ ] Fix 2 array callback references
- [ ] Fix remaining 4 issues

---

## 🔍 Common Fix Patterns

### Pattern 1: Unused Imports
```typescript
// ❌ Before
import { unused, used } from './module'

// ✅ After
import { used } from './module'
```

### Pattern 2: Missing Return Type
```typescript
// ❌ Before
function getData() {
  return { data: [] }
}

// ✅ After
function getData(): { data: unknown[] } {
  return { data: [] }
}
```

### Pattern 3: Floating Promise
```typescript
// ❌ Before
useEffect(() => {
  loadData()
}, [])

// ✅ After
useEffect(() => {
  void loadData()
}, [])
```

### Pattern 4: Async Without Await
```typescript
// ❌ Before
const handler = async () => {
  doSomething()
}

// ✅ After
const handler = () => {
  doSomething()
}
```

### Pattern 5: Promise in Void Context
```typescript
// ❌ Before
<Button onPress={asyncHandler} />

// ✅ After
<Button onPress={() => { asyncHandler().catch(handleError) }} />
```

### Pattern 6: Redundant Await
```typescript
// ❌ Before
async function getData() {
  return await fetchData()
}

// ✅ After
async function getData() {
  return fetchData()
}
```

---

## 📊 Impact Analysis

### Current State
- **Screens**: ✅ 0 errors (PRODUCTION READY)
- **Supporting Code**: ⚠️ 61 errors (needs cleanup)

### After Phase 1 (30 min)
- **Screens**: ✅ 0 errors
- **Supporting Code**: ⚠️ 42 errors (-31%)

### After Phase 2 (75 min)
- **Screens**: ✅ 0 errors
- **Supporting Code**: ⚠️ 12 errors (-80%)

### After Phase 3 (105 min)
- **Screens**: ✅ 0 errors
- **Supporting Code**: ✅ 0 errors (-100%)

---

## ✅ Success Criteria

- [ ] `pnpm lint` returns 0 errors
- [ ] All 61 issues resolved
- [ ] No new errors introduced
- [ ] Code maintains functionality
- [ ] Consistent patterns applied

---

## 📝 Notes

- **Screens are production-ready**: All 11 screens pass with 0 errors ✅
- **These are housekeeping issues**: In supporting code (hooks, utils, components)
- **Not blocking**: Screens can be deployed as-is
- **Good practice**: Should be fixed for code quality and maintainability
- **Systematic approach**: Follow phases for efficient resolution
- **Estimated total time**: ~2 hours for all 61 errors

---

**Next Action**: Start with Phase 1 (Quick Wins) to get 31% reduction in 30 minutes
