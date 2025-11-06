# V2 Migration Plan - Comprehensive Implementation

## Overview

This document outlines the comprehensive migration plan to upgrade PETSPARK to v2 with:
- Complete React Reanimated migration (removing Framer Motion)
- Full mobile parity
- React Query with offline persistence (replacing KV)
- Enhanced micro-interactions
- 60fps performance guarantee
- Zero warnings policy

## Phase 1: Enhanced Components Migration ✅

### Completed
- ✅ PremiumInput (web + mobile)
- ✅ PremiumSelect (web + mobile)
- ✅ PremiumToggle (web + mobile)
- ✅ PremiumSlider (web + mobile)
- ✅ PremiumTabs (web + mobile)
- ✅ Stepper (web + mobile)
- ✅ PremiumProgress (web + mobile)
- ✅ PremiumChip (web + mobile)
- ✅ PremiumAvatar (web + mobile)
- ✅ PremiumModal (web + mobile)
- ✅ PremiumDrawer (web + mobile)
- ✅ PremiumEmptyState (web + mobile)
- ✅ PremiumErrorState (web + mobile)
- ✅ ShimmerEffect (web)
- ✅ RippleEffect (web)

### Remaining Mobile Components
- [ ] PremiumToast.native.tsx
- [ ] RippleEffect.native.tsx
- [ ] ShimmerEffect.native.tsx
- [ ] AdvancedFilterPanel.native.tsx
- [ ] EnhancedButton.native.tsx
- [ ] EnhancedPetDetailView.native.tsx
- [ ] PetAnalyticsSkeleton.native.tsx
- [ ] PetDetailSkeleton.native.tsx
- [ ] UltraEnhancedView.native.tsx

## Phase 2: Framer Motion Migration

### Migration Strategy

1. **Replace motion components:**
   - `<motion.div>` → `<AnimatedView>`
   - `<motion.span>` → `<AnimatedView>`
   - `<motion.button>` → `<AnimatedView as="button">`
   - `<AnimatePresence>` → `<Presence>` from `@petspark/motion`

2. **Replace animation props:**
   - `initial` → Use `useSharedValue` with initial value
   - `animate` → Use `useAnimatedStyle` with `withSpring`/`withTiming`
   - `whileHover` → Use `useHoverLift` hook
   - `whileTap` → Use `useBounceOnTap` hook
   - `transition` → Use `springConfigs`/`timingConfigs` from transitions
   - `variants` → Inline `useAnimatedStyle` calls

3. **Pattern Examples:**

```typescript
// Before (Framer Motion)
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: "spring", stiffness: 400, damping: 30 }}
>
  Content
</motion.div>

// After (React Reanimated)
const opacity = useSharedValue(0)
const translateY = useSharedValue(20)

useEffect(() => {
  opacity.value = withSpring(1, springConfigs.smooth)
  translateY.value = withSpring(0, springConfigs.smooth)
}, [opacity, translateY])

const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ translateY: translateY.value }]
})) as AnimatedStyle

<AnimatedView style={animatedStyle}>
  Content
</AnimatedView>
```

### Files Requiring Migration (100 files)

**Priority 1 - Core Views:**
- [ ] `apps/web/src/components/views/DiscoverView.tsx` (956 lines, ~20 motion usages)
- [ ] `apps/web/src/components/views/CommunityView.tsx`
- [ ] `apps/web/src/components/chat/AdvancedChatWindow.tsx`

**Priority 2 - Enhanced Components:**
- [ ] All components in `apps/web/src/components/enhanced/` using framer-motion

**Priority 3 - Feature Components:**
- [ ] Stories components
- [ ] Playdate components
- [ ] Admin components
- [ ] Community components
- [ ] Adoption components

## Phase 3: React Query Migration (Replacing KV)

### Current KV Usage
- `useKV` hook in `apps/web/src/hooks/useStorage.ts`
- Used in:
  - `PlaydateScheduler.tsx`
  - `PremiumNotificationCenter.tsx`
  - Test files

### Migration Strategy

1. **Create React Query hooks with offline persistence:**
```typescript
// Before
const [data, setData] = useKV<DataType>('key', defaultValue)

// After
const { data, mutate } = useQuery({
  queryKey: ['storage', 'key'],
  queryFn: () => getFromStorage<DataType>('key') ?? defaultValue,
  staleTime: Infinity,
  gcTime: Infinity,
})

// With offline persistence
const queryClient = useQueryClient()
queryClient.setQueryData(['storage', 'key'], newValue)
persistToStorage('key', newValue)
```

2. **Implement offline persistence:**
- Use `@tanstack/react-query-persist-client`
- Configure with `localStorage` or `AsyncStorage` (mobile)
- Enable `persistQueryClient` with proper serialization

3. **Update API hooks:**
- Complete `use-chat.ts` ✅
- Complete `use-community.ts` ✅
- Complete `use-adoption.ts` ✅
- Add offline support to all hooks

## Phase 4: Micro-Interactions Enhancement

### Apply to All Interactive Elements

1. **Buttons:**
   - Use `usePressBounce` from `@petspark/motion`
   - Use `useHoverLift` for web
   - Add haptic feedback

2. **Cards:**
   - Use `useHoverLift` for elevation
   - Use `useParallax` for depth
   - Add `useMagnetic` for interactive cards

3. **Toasts:**
   - Use `Presence` from `@petspark/motion`
   - Animated entry/exit
   - Haptic feedback on show

4. **Page Transitions:**
   - Use `usePageTransitions` from `@petspark/motion`
   - Wire to router
   - Respect reduced motion

## Phase 5: Performance Optimization

### 60fps Guarantee

1. **Animation Performance:**
   - All animations use React Reanimated (UI thread)
   - No JS thread animations
   - Use `runOnUI` for heavy computations

2. **Component Optimization:**
   - Use `React.memo` for expensive components
   - Use `useMemo` for computed values
   - Use `useCallback` for handlers

3. **List Optimization:**
   - Use `FlashList` on mobile
   - Use virtualization on web
   - Implement proper `keyExtractor`

4. **Image Optimization:**
   - Use `ProgressiveImage` component
   - Implement lazy loading
   - Use proper image sizes

## Phase 6: Configuration & Build

### Babel Configuration

1. **Enable Reanimated Plugin:**
```json
{
  "plugins": [
    "react-native-reanimated/plugin"
  ]
}
```

2. **RN-Web Configuration:**
- Ensure proper webpack config
- Enable Reanimated web support
- Configure aliases

### TypeScript Configuration

1. **Strict Mode:**
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`

2. **Path Aliases:**
- `@/` → `apps/web/src/`
- `@mobile/` → `apps/mobile/src/`
- `@petspark/motion` → `packages/motion/src/`

## Phase 7: Testing & Quality

### Testing Requirements

1. **Unit Tests:**
   - All hooks tested
   - All utilities tested
   - ≥95% coverage

2. **Component Tests:**
   - All enhanced components tested
   - Accessibility tests
   - Interaction tests

3. **E2E Tests:**
   - Critical flows tested
   - Performance tests
   - Cross-platform tests

### Quality Gates

1. **TypeScript:**
   - `tsc --noEmit` passes
   - No `any` types
   - Strict mode enabled

2. **Linting:**
   - ESLint passes with 0 warnings
   - No console.log
   - No TODO/FIXME

3. **Performance:**
   - 60fps maintained
   - No jank
   - Fast initial load

## Implementation Checklist

### Week 1: Foundation
- [x] Create missing mobile components
- [ ] Migrate DiscoverView
- [ ] Migrate CommunityView
- [ ] Migrate ChatView
- [ ] Complete API hooks

### Week 2: Migration
- [ ] Migrate all enhanced components
- [ ] Migrate feature components (stories, playdate, etc.)
- [ ] Migrate admin components
- [ ] Remove framer-motion dependency

### Week 3: Optimization
- [ ] Implement React Query offline persistence
- [ ] Replace all KV usage
- [ ] Apply micro-interactions
- [ ] Wire page transitions

### Week 4: Polish
- [ ] Performance optimization
- [ ] Testing
- [ ] Documentation
- [ ] Final QA

## Migration Script Usage

```bash
# Generate migration report
npx tsx scripts/migrate-framer-motion.ts apps/web/src

# Manual migration steps:
# 1. Run script to identify files
# 2. Review each file
# 3. Apply migration patterns
# 4. Test thoroughly
# 5. Remove framer-motion import
```

## Success Criteria

✅ Zero framer-motion imports
✅ Zero TypeScript errors
✅ Zero ESLint warnings
✅ 60fps performance
✅ Full mobile parity
✅ React Query with offline persistence
✅ All tests passing
✅ Documentation complete

## Notes

- Migration should be incremental
- Test after each component migration
- Keep framer-motion as dependency until all migrations complete
- Use feature flags for gradual rollout if needed
- Monitor performance metrics during migration

