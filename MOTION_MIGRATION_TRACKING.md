# Motion Migration Tracking - Detailed Status

## 📊 MIGRATION OVERVIEW

- **Total TSX files**: 457
- **Already migrated**: 98 files (21.4%)
- **Still needing migration**: 26 files (5.7%)
- **Migration progress**: 78.6% complete

## 🎯 PRIORITY BREAKDOWN

### 🔥 CRITICAL PRIORITY (High Impact - User Facing)

**Chat Components (5 files)** - Core user interaction
**View Components (2 files)** - Main app screens

### ⚡ HIGH PRIORITY (Medium Impact - User Facing)

**Enhanced Components (3 files)** - Visual polish
**UI Components (6 files)** - Core interactions

### �� MEDIUM PRIORITY (Low Impact - User Facing)

**Dialog Components (6 files)** - Modal interactions
**Community Components (3 files)** - Social features

### 🟢 LOW PRIORITY (Minimal Impact)

**Auth Components (1 file)** - Test files
**Special Cases (1 file)** - Infrastructure

---

## 📋 DETAILED FILE TRACKING

### 🔥 CRITICAL: CHAT COMPONENTS (5 files)

| File                                            | Status             | Complexity | Est. Time | Notes                                         |
| ----------------------------------------------- | ------------------ | ---------- | --------- | --------------------------------------------- |
| `components/chat/AdvancedChatWindow.tsx`        | 🔄 **IN PROGRESS** | HIGH       | 2-3 hrs   | Complex chat UI with multiple motion elements |
| `components/chat/components/ChatFooter.tsx`     | ⏳ **PENDING**     | MEDIUM     | 45 min    | Footer animations                             |
| `components/chat/window/ChatInputBar.tsx`       | ⏳ **PENDING**     | MEDIUM     | 45 min    | Input animations                              |
| `components/chat/window/MessageList.tsx`        | ⏳ **PENDING**     | LOW        | 30 min    | Message list scrolling                        |
| `components/chat/window/VirtualMessageList.tsx` | ⏳ **PENDING**     | LOW        | 30 min    | Virtual list animations                       |

### 🔥 CRITICAL: VIEW COMPONENTS (2 files)

| File                                | Status         | Complexity | Est. Time | Notes                                  |
| ----------------------------------- | -------------- | ---------- | --------- | -------------------------------------- |
| `components/views/DiscoverView.tsx` | ⏳ **PENDING** | HIGH       | 2 hrs     | Main discovery screen                  |
| `components/views/MatchesView.tsx`  | ⏳ **PENDING** | HIGH       | 2 hrs     | Matches screen with complex animations |

### ⚡ HIGH: ENHANCED COMPONENTS (3 files)

| File                                                           | Status         | Complexity | Est. Time | Notes                    |
| -------------------------------------------------------------- | -------------- | ---------- | --------- | ------------------------ |
| `components/enhanced/AnimatedBadge.tsx`                        | ⏳ **PENDING** | MEDIUM     | 45 min    | Badge animations         |
| `components/enhanced/ProgressiveImage.tsx`                     | ⏳ **PENDING** | LOW        | 30 min    | Image loading animations |
| `components/enhanced/__tests__/EnhancedPetDetailView.test.tsx` | ⏳ **PENDING** | LOW        | 15 min    | Test file cleanup        |

### ⚡ HIGH: UI COMPONENTS (6 files)

| File                              | Status         | Complexity | Est. Time | Notes                    |
| --------------------------------- | -------------- | ---------- | --------- | ------------------------ |
| `components/AdvancedCard.tsx`     | ⏳ **PENDING** | MEDIUM     | 45 min    | Card hover/tap effects   |
| `components/EnhancedCard.tsx`     | ⏳ **PENDING** | MEDIUM     | 45 min    | Enhanced card animations |
| `components/EnhancedVisuals.tsx`  | ⏳ **PENDING** | HIGH       | 1.5 hrs   | Complex visual effects   |
| `components/GlassCard.tsx`        | ⏳ **PENDING** | MEDIUM     | 45 min    | Glass morphism effects   |
| `components/QuickActionsMenu.tsx` | ⏳ **PENDING** | MEDIUM     | 45 min    | Menu animations          |
| `components/web-only/Slider.tsx`  | ⏳ **PENDING** | LOW        | 30 min    | Slider controls          |

### 🔄 MEDIUM: DIALOG COMPONENTS (6 files)

| File                                                  | Status         | Complexity | Est. Time | Notes                                |
| ----------------------------------------------------- | -------------- | ---------- | --------- | ------------------------------------ |
| `components/adoption/AdoptionDetailDialog.tsx`        | ⏳ **PENDING** | MEDIUM     | 45 min    | Adoption dialog                      |
| `components/adoption/AdoptionListingDetailDialog.tsx` | ⏳ **PENDING** | MEDIUM     | 45 min    | Listing dialog                       |
| `components/PetDetailDialog.tsx`                      | ⏳ **PENDING** | MEDIUM     | 45 min    | Pet detail modal                     |
| `components/verification/VerificationDialog.tsx`      | ⏳ **PENDING** | LOW        | 30 min    | Verification modal                   |
| `components/stories/StoryViewer.tsx`                  | ⏳ **PENDING** | HIGH       | 1.5 hrs   | Story viewer with complex animations |

### 🔄 MEDIUM: COMMUNITY COMPONENTS (3 files)

| File                                                    | Status         | Complexity | Est. Time | Notes            |
| ------------------------------------------------------- | -------------- | ---------- | --------- | ---------------- |
| `components/community/RankingSkeleton.tsx`              | ⏳ **PENDING** | LOW        | 30 min    | Skeleton loading |
| `components/community/__tests__/CommentsSheet.test.tsx` | ⏳ **PENDING** | LOW        | 15 min    | Test file        |
| `components/community/__tests__/PostComposer.test.tsx`  | ⏳ **PENDING** | LOW        | 15 min    | Test file        |

### 🟢 LOW: AUTH COMPONENTS (1 file)

| File                                              | Status         | Complexity | Est. Time | Notes             |
| ------------------------------------------------- | -------------- | ---------- | --------- | ----------------- |
| `components/auth/__tests__/AgeGateModal.test.tsx` | ⏳ **PENDING** | LOW        | 15 min    | Test file cleanup |

### 🟢 LOW: SPECIAL CASES (1 file)

| File                                      | Status         | Complexity | Est. Time | Notes                    |
| ----------------------------------------- | -------------- | ---------- | --------- | ------------------------ |
| `effects/reanimated/animate-presence.tsx` | ⏳ **PENDING** | LOW        | 30 min    | Infrastructure component |

---

## 🔧 MIGRATION PATTERNS

### Common Patterns to Replace:

#### 1. Simple Component Replacement

```tsx
// BEFORE
import { motion } from 'framer-motion'
;<motion.div animate={{ opacity: 1 }} />

// AFTER
import { MotionView } from '@petspark/motion'
;<MotionView animatedStyle={opacityStyle} />
```

#### 2. Entry Animations

```tsx
// BEFORE
<motion.div initial={{ y: 20 }} animate={{ y: 0 }} />

// AFTER
const animation = useEntryAnimation({ initialY: 20 })
<MotionView animatedStyle={animation.animatedStyle} />
```

#### 3. Hover/Tap Interactions

```tsx
// BEFORE
<motion.button whileHover={{ scale: 1.05 }} />

// AFTER
const hover = useHoverLift({ scale: 1.05 })
<MotionView animatedStyle={hover.animatedStyle} onMouseEnter={hover.onMouseEnter} />
```

#### 4. AnimatePresence

```tsx
// BEFORE
<AnimatePresence>
  {visible && <motion.div exit={{ opacity: 0 }} />}
</AnimatePresence>

// AFTER
<Presence>
  {visible && <MotionView key="item" />}
</Presence>
```

---

## 📈 MIGRATION PROGRESS TIMELINE

### Phase 1: Critical Components (Week 1)

- [ ] Chat components (5 files) - 3-4 hours
- [ ] View components (2 files) - 4 hours
      **Total: 7-8 hours**

### Phase 2: High Priority (Week 1-2)

- [ ] Enhanced components (3 files) - 2 hours
- [ ] UI components (6 files) - 4-5 hours
      **Total: 6-7 hours**

### Phase 3: Medium Priority (Week 2)

- [ ] Dialog components (6 files) - 5-6 hours
- [ ] Community components (3 files) - 1 hour
      **Total: 6-7 hours**

### Phase 4: Cleanup (Week 2)

- [ ] Auth components (1 file) - 15 min
- [ ] Special cases (1 file) - 30 min
- [ ] Final verification - 2 hours
      **Total: 2.75 hours**

**Estimated Total Time: 22-24 hours**

---

## ✅ VERIFICATION CHECKLIST

After each migration:

- [ ] TypeScript compilation passes
- [ ] ESLint passes
- [ ] Animations work correctly
- [ ] Reduced motion support works
- [ ] Mobile parity maintained

After all migrations:

- [ ] Run full typecheck (`pnpm typecheck`)
- [ ] Run full lint (`pnpm lint`)
- [ ] Run tests (`pnpm test`)
- [ ] Verify mobile parity
- [ ] Performance testing (60fps)

---

## 🚨 BLOCKERS & DEPENDENCIES

### Current Blockers:

- None identified

### Dependencies:

- `@petspark/motion` package must be available
- Reanimated hooks must be properly set up
- Mobile parity components must exist for critical features

---

## 📞 SUPPORT RESOURCES

### Documentation:

- `@petspark/motion` package README
- Reanimated migration guide
- Motion token documentation

### Tools:

- Migration script: `scripts/motion-migrate.mjs`
- Type checker: `pnpm typecheck:motion`
- Lint checker: `pnpm lint:motion`

---

**Last updated: November 6, 2025**
**Migration Progress: 78.6% complete**
