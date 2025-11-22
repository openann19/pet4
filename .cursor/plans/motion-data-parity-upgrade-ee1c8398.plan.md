<!-- ee1c8398-d843-4ee0-a5cc-74b7a4d347be 16c06342-e2a7-46e2-9f05-994b90e7f937 -->
# Motion + Data + Parity Upgrade (Web & Mobile)

## Overview

Unify animation system with React Reanimated, replace storage stubs with React Query, and achieve complete mobile parity. All changes maintain zero warnings, 60fps targets, and production-grade quality.

## Phase 1: Motion Facade (`packages/motion`)

### 1.1 Create Motion Facade Package

**Location**: `packages/motion/`

**Structure**:

```
packages/motion/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts (main exports)
│   ├── platform.ts (platform detection)
│   ├── reanimated.ts (Reanimated exports)
│   ├── framer.ts (Framer Motion exports - web-only)
│   ├── components/
│   │   ├── MotionView.tsx (unified View component)
│   │   ├── MotionText.tsx (unified Text component)
│   │   └── MotionScrollView.tsx (unified ScrollView)
│   ├── hooks/
│   │   ├── useMotionValue.ts
│   │   ├── useDerived.ts
│   │   ├── useSpring.ts
│   │   └── useTiming.ts
│   └── utils/
│       ├── spring-configs.ts (shared spring configs)
│       └── timing-configs.ts (shared timing configs)
```

**Implementation**:

- Platform detection: `Platform.OS === 'web'` for web-only Framer usage
- Default to Reanimated for all shared/mobile components
- Route to Framer only for DOM-specific web-only pages
- Export unified API: `Motion.View`, `Motion.Text`, `useMotionValue`, `withSpring`, `withTiming`

**Key Files**:

- `packages/motion/src/index.ts` - Main facade exports
- `packages/motion/src/platform.ts` - Platform detection logic
- `packages/motion/src/components/MotionView.tsx` - Unified View component

## Phase 2: Migrate Framer Motion to Reanimated

### 2.1 High-Priority Migrations (130+ files)

**Target Files** (from grep results):

- `apps/web/src/components/views/DiscoverView.tsx`
- `apps/web/src/components/views/CommunityView.tsx`
- `apps/web/src/components/stories/StoryViewer.tsx`
- `apps/web/src/components/chat/*` (all chat components)
- `apps/web/src/components/admin/*` (all admin components)
- `apps/web/src/components/enhanced/*` (enhanced components)

**Migration Pattern**:

```typescript
// BEFORE (Framer Motion)
import { motion } from 'framer-motion'
<motion.div animate={{ scale: 1.2 }} />

// AFTER (Reanimated via facade)
import { Motion } from '@petspark/motion'
import { useSpring } from '@petspark/motion'
const scale = useSpring(1.2)
<Motion.View style={{ transform: [{ scale }] }} />
```

**Steps**:

1. Replace `framer-motion` imports with `@petspark/motion`
2. Convert `motion.*` components to `Motion.*` components
3. Convert `animate` props to `useAnimatedStyle` hooks
4. Replace `AnimatePresence` with conditional rendering + transition hooks
5. Update all animation configs to use shared spring/timing configs

**Priority Order**:

1. Core views (DiscoverView, CommunityView, ChatView)
2. Enhanced components (all in `components/enhanced/`)
3. Stories system
4. Admin panels
5. Remaining components

### 2.2 Keep Framer Motion Only For

**Web-only DOM-specific effects**:

- Complex SVG animations
- Canvas-based effects
- Browser-specific APIs (IntersectionObserver, etc.)

**Files to keep Framer**:

- `apps/web/src/components/media-editor/*` (if using DOM-specific APIs)
- Any component explicitly marked as `web-only` in comments

## Phase 3: Replace KV/Storage Stubs with React Query

### 3.1 Web React Query Setup

**Current State**: Web has `@tanstack/react-query` in package.json but not integrated.

**Tasks**:

1. Create `apps/web/src/providers/QueryProvider.tsx` (mirror mobile setup)
2. Wrap app in `QueryProvider` in `apps/web/src/main.tsx`
3. Create API hooks in `apps/web/src/hooks/api/`:

   - `use-pets.ts` (mirror mobile)
   - `use-user.ts`
   - `use-matches.ts`
   - `use-chat.ts`
   - `use-community.ts`
   - `use-adoption.ts`

### 3.2 Replace Storage Stubs

**Files with KV references** (9 files found):

- `apps/web/src/components/playdate/PlaydateScheduler.tsx`
- `apps/web/src/components/notifications/PremiumNotificationCenter.tsx`
- `apps/web/src/lib/community-service.ts`
- `apps/web/src/lib/kyc-service.ts`
- `apps/web/src/lib/adoption-service.ts`
- `apps/web/src/lib/chat-service.ts`
- `apps/web/src/config/build-guards.ts`
- `apps/web/src/lib/storage.ts` (already has replacement, but check for spark.kv references)
- `apps/web/src/hooks/useStorage.ts`

**Migration Pattern**:

```typescript
// BEFORE (KV stub)
const data = await window.spark.kv.get('key')
await window.spark.kv.set('key', value)

// AFTER (React Query)
const { data } = useQuery({
  queryKey: ['key'],
  queryFn: () => apiClient.get('/api/data')
})
const mutation = useMutation({
  mutationFn: (value) => apiClient.post('/api/data', value)
})
```

**Steps**:

1. Identify all `window.spark.kv` usages
2. Create corresponding API endpoints/hooks
3. Replace KV reads with `useQuery`
4. Replace KV writes with `useMutation`
5. Add offline cache via React Query Persist (IndexedDB on web, AsyncStorage on mobile)

### 3.3 Offline Cache Implementation

**Web**: Use `@tanstack/react-query-persist-client` with IndexedDB

**Mobile**: Use `@tanstack/react-query-persist-client` with AsyncStorage

**Storage Adapter Interface**:

```typescript
// packages/shared/src/storage/StorageAdapter.ts
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}
```

**Implementations**:

- `apps/web/src/lib/storage-adapter.ts` - IndexedDB adapter
- `apps/mobile/src/utils/storage-adapter.ts` - AsyncStorage adapter

## Phase 4: Mobile Parity

### 4.1 Enhanced Components Parity

**Web Components Missing Mobile Versions** (from directory comparison):

- `AchievementBadge.tsx` → `AchievementBadge.native.tsx`
- `AdvancedFilterPanel.tsx` → `AdvancedFilterPanel.native.tsx`
- `DetailedPetAnalytics.tsx` → `DetailedPetAnalytics.native.tsx`
- `EnhancedButton.tsx` → `EnhancedButton.native.tsx`
- `EnhancedCarousel.tsx` → `EnhancedCarousel.native.tsx`
- `EnhancedPetDetailView.tsx` → `EnhancedPetDetailView.native.tsx`
- `GlowingBadge.tsx` → `GlowingBadge.native.tsx`
- `NotificationCenter.tsx` → `NotificationCenter.native.tsx`
- `ParticleEffect.tsx` → `ParticleEffect.native.tsx`
- `PetAnalyticsSkeleton.tsx` → `PetAnalyticsSkeleton.native.tsx`
- `PetDetailSkeleton.tsx` → `PetDetailSkeleton.native.tsx`
- `PremiumButton.tsx` → `PremiumButton.native.tsx`
- `PremiumCard.tsx` → `PremiumCard.native.tsx`
- `ProgressiveImage.tsx` → `ProgressiveImage.native.tsx`
- `SmartSearch.tsx` → `SmartSearch.native.tsx`
- `SmartToast.tsx` → `SmartToast.native.tsx`
- `TrustBadges.tsx` → `TrustBadges.native.tsx`
- `UltraButton.tsx` → `UltraButton.native.tsx`
- `UltraCard.tsx` → `UltraCard.native.tsx`
- `UltraEnhancedView.tsx` → `UltraEnhancedView.native.tsx`

**Implementation Pattern**:

```typescript
// apps/mobile/src/components/enhanced/ComponentName.native.tsx
import { Motion } from '@petspark/motion'
import { useSpring } from '@petspark/motion'
// Use React Native primitives + Reanimated
// Match web props API exactly
```

**Steps**:

1. Create `.native.tsx` file for each missing component
2. Use React Native primitives (`View`, `Text`, `Pressable`)
3. Use `@petspark/motion` for animations
4. Match web props API exactly
5. Export from `packages/ui-mobile/index.ts`
6. Register screens in mobile navigator if needed

### 4.2 Mobile Navigator Registration

**File**: `apps/mobile/src/navigation/AppNavigator.tsx` (or equivalent)

**Tasks**:

- Register all new screens/components
- Add typed navigation params
- Ensure proper screen transitions

### 4.3 Parity Verification Script

**File**: `scripts/check-mobile-parity.mjs`

**Functionality**:

- Scan `apps/web/src/components/enhanced/` for `.tsx` files
- Check for corresponding `.native.tsx` in `apps/mobile/src/components/enhanced/`
- Report missing files
- Exit with error if parity gaps found

## Phase 5: Visual Quality & Performance

### 5.1 Apply Design Tokens

**Location**: `apps/web/src/core/tokens/` (already exists)

**Tasks**:

- Ensure all components use tokens from `@/core/tokens`
- Apply motion tokens from `motion.ts`
- Apply color/spacing/typography tokens consistently

### 5.2 Micro-Interactions

**Enhancements**:

- Hover effects (web): `useHoverLift` hook
- Press effects: `useBounceOnTap` hook
- Entry/exit animations: `usePageTransition` hook
- Magnetic effects: `useMagneticEffect` hook

**Apply to**:

- All buttons
- All cards
- All interactive elements

### 5.3 Performance Targets

**60fps Requirements**:

- All animations use Reanimated (UI thread)
- No JS-thread animations
- Use `useAnimatedStyle` for all animated styles
- Prefer `withSpring` over `withTiming` for natural feel
- Limit concurrent animations

**Optimization**:

- Use `React.memo` for animated components
- Use `useCallback` for animation handlers
- Avoid re-renders during animations

## Phase 6: Cleanup & Verification

### 6.1 Remove Framer Motion

**After Migration**:

1. Remove `framer-motion` from `apps/web/package.json`
2. Run `pnpm install`
3. Verify no broken imports
4. Update `MIGRATION_PROGRESS_REANIMATED.md`

### 6.2 Remove KV Stubs

**After Migration**:

1. Remove all `window.spark.kv` references
2. Remove `spark-patch.ts` if no longer needed
3. Update storage service to use React Query only

### 6.3 Testing

**Test Coverage**:

- Unit tests for all new hooks (`packages/motion`)
- Component tests for migrated components
- Integration tests for React Query hooks
- E2E tests for critical flows

**Run**:

```bash
pnpm -w test
pnpm -w typecheck
pnpm -w lint
```

### 6.4 Build Verification

**Verify**:

- Web build: `cd apps/web && pnpm build`
- Mobile build: `cd apps/mobile && pnpm build:eas` (or equivalent)
- Storybook build: `pnpm storybook:build` (if configured)

## File Changes Summary

### New Files

- `packages/motion/` (entire package)
- `apps/web/src/providers/QueryProvider.tsx`
- `apps/web/src/hooks/api/*.ts` (API hooks)
- `apps/mobile/src/components/enhanced/*.native.tsx` (18+ files)
- `packages/shared/src/storage/StorageAdapter.ts`
- `apps/web/src/lib/storage-adapter.ts`
- `apps/mobile/src/utils/storage-adapter.ts`
- `scripts/check-mobile-parity.mjs`

### Modified Files

- `apps/web/src/main.tsx` (add QueryProvider)
- `apps/web/src/components/**/*.tsx` (130+ files - migrate Framer to Reanimated)
- `apps/web/src/lib/*-service.ts` (replace KV with API calls)
- `apps/web/package.json` (remove framer-motion after migration)
- `packages/ui-mobile/index.ts` (export new components)
- `apps/mobile/src/navigation/AppNavigator.tsx` (register new screens)

## Acceptance Criteria

1. ✅ `packages/motion` facade in place, shared components compile on both targets
2. ✅ All Framer Motion migrated to Reanimated (0 framer-motion imports in shared code)
3. ✅ All KV/localStorage stubs removed, data flows via React Query hooks
4. ✅ Offline cache works (IndexedDB web, AsyncStorage mobile)
5. ✅ Mobile parity script returns ✅ (no missing .native.tsx)
6. ✅ All tests pass (web + mobile)
7. ✅ Zero ESLint warnings
8. ✅ Zero TypeScript errors
9. ✅ 60fps animations verified
10. ✅ Builds succeed (web + mobile)

## Notes

- Prefer Reanimated for gestures/physics; only use Framer on pure DOM routes
- No new deps without PR justification (size/perf)
- All changes follow STRICT MODE requirements (zero warnings, zero console.*)
- Maintain identical props API across platforms for shared components

### To-dos

- [ ] Create packages/motion facade with platform detection, unified Motion.View/Motion.Text components, and hooks (useMotionValue, useSpring, useTiming)
- [ ] Migrate core views (DiscoverView, CommunityView, ChatView) from Framer Motion to Reanimated via motion facade
- [ ] Migrate all enhanced components from Framer Motion to Reanimated
- [ ] Migrate remaining 130+ files from Framer Motion to Reanimated (stories, admin, etc.)
- [ ] Set up React Query in web app (QueryProvider, API hooks: use-pets, use-user, use-matches, use-chat, use-community, use-adoption)
- [ ] Replace all window.spark.kv/localStorage stubs with React Query hooks (9 files: PlaydateScheduler, PremiumNotificationCenter, *-service.ts files)
- [ ] Implement offline cache with StorageAdapter interface (IndexedDB web, AsyncStorage mobile) and React Query Persist
- [ ] Create mobile .native.tsx versions for all 18+ missing enhanced components (AchievementBadge, AdvancedFilterPanel, DetailedPetAnalytics, etc.)
- [ ] Register all new mobile screens in AppNavigator with typed params
- [ ] Create scripts/check-mobile-parity.mjs to verify component parity
- [ ] Apply design tokens, micro-interactions (hover/press/enter/exit), and ensure 60fps performance targets
- [ ] Remove framer-motion from package.json after migration complete
- [ ] Run full test suite, typecheck, lint, and build verification (web + mobile)