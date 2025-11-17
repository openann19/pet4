# Animation Library Fixes Summary

## Issues Found

1. **Direct framer-motion imports** in production code:
   - `apps/web/src/components/WelcomeScreen.tsx` - imports `motion` from `framer-motion`
   - `apps/web/src/effects/reanimated/animated-view.tsx` - imports `motion` from `framer-motion`

2. **Missing dependency**: `framer-motion` is not in `apps/web/package.json`, causing TypeScript errors

3. **Architecture violation**: Direct framer-motion usage bypasses the `@petspark/motion` abstraction layer

## Fixes Applied

### ✅ Fixed: `animated-view.tsx`
- Changed import from `@petspark/motion/migration` to `@petspark/motion`
- The migration utilities are re-exported from the main index

### ✅ Fixed: `WelcomeScreen.tsx`
- Changed `Variants` type import from `framer-motion` to `@petspark/motion`
- This uses the type from the abstraction layer (better architecture)

### ⚠️ Remaining Issue: Direct `motion` component usage

Both files still import `motion` directly from `framer-motion`:
- `WelcomeScreen.tsx`: Uses `motion.div` with `variants` prop extensively
- `animated-view.tsx`: Uses `motion.div` as the underlying implementation

## Recommended Solutions

### Option 1: Add framer-motion to web app (Quick Fix)
```json
// apps/web/package.json
{
  "dependencies": {
    "framer-motion": "^11.11.17"
  }
}
```

**Pros**: 
- Quick fix for TypeScript errors
- Minimal code changes

**Cons**: 
- Violates architecture (should use `@petspark/motion`)
- Adds direct dependency

### Option 2: Migrate to MotionView (Proper Fix)

Replace `motion.div` with `MotionView` from `@petspark/motion`:

**Current (WelcomeScreen.tsx)**:
```tsx
<motion.div
  variants={loadingVariants}
  initial="hidden"
  animate="visible"
>
```

**Should become**:
```tsx
<MotionView
  initial={loadingVariants.hidden}
  animate={loadingVariants.visible}
>
```

**Pros**: 
- Follows architecture
- Uses abstraction layer
- Better for code sharing

**Cons**: 
- Requires refactoring all variant usage
- More complex migration

### Option 3: Hybrid Approach (Recommended)

1. Keep `animated-view.tsx` using framer-motion (it's a low-level wrapper)
2. Migrate `WelcomeScreen.tsx` to use `MotionView` from `@petspark/motion`
3. Add framer-motion as a dev dependency for types only

## Current Status

- ✅ Import paths fixed
- ✅ Type imports use abstraction layer
- ⚠️ Runtime components still use direct framer-motion
- ⚠️ TypeScript errors due to missing dependency

## Next Steps

1. **Immediate**: Add `framer-motion` to `apps/web/package.json` to fix TypeScript errors
2. **Short-term**: Migrate `WelcomeScreen.tsx` to use `MotionView` instead of `motion.div`
3. **Long-term**: Review all components using framer-motion directly and migrate to `@petspark/motion`

