# Framer Motion to React Reanimated Migration Tracking

**Last Updated**: 2024-12-19  
**Total Files Audited**: 105  
**Status**: In Progress

## Executive Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Migrated | 0 | 0% |
| 🔄 Partial Migration | 8 | 7.6% |
| ❌ Needs Migration | 92 | 87.6% |
| 📱 Native Files | 5 | 4.8% |

**Note**: Files marked as "Migrated" in previous reports (DiscoverView, StoryViewer, AdvancedChatWindow) still contain MotionView imports but have been converted to use React Reanimated. They are counted as "Partial" until all MotionView references are removed.

---

## Migration Status by Category

### 🔄 Partial Migration (8 files)

These files have both Framer Motion and React Reanimated imports, indicating they're in transition:

1. `apps/web/src/components/chat/AdvancedChatWindow.tsx`
2. `apps/web/src/components/chat/components/ChatFooter.tsx`
3. `apps/web/src/components/enhanced/ProgressiveImage.tsx`
4. `apps/web/src/components/enhanced/SmartSearch.tsx`
5. `apps/web/src/components/enhanced/NotificationCenter.tsx`
6. `apps/web/src/components/views/DiscoverView.tsx` ⚠️ (Uses Reanimated but has MotionView imports)
7. `apps/web/src/components/stories/StoryViewer.tsx` ⚠️ (Uses Reanimated but has MotionView imports)
8. `apps/web/src/components/TrustBadges.tsx`

**Action Required**: Remove remaining MotionView/MotionText imports and replace with AnimatedView.

---

## Files Needing Migration (92 files)

### 📋 Admin Panel (11 files)

**Priority**: Medium  
**Complexity**: Medium  
**Estimated Effort**: 2-3 hours per file

- [ ] `apps/web/src/components/admin/AuditLogView.tsx`
- [ ] `apps/web/src/components/admin/ChatModerationPanel.tsx`
- [ ] `apps/web/src/components/admin/ContentModerationQueue.tsx`
- [ ] `apps/web/src/components/admin/ContentView.tsx`
- [ ] `apps/web/src/components/admin/DashboardView.tsx`
- [ ] `apps/web/src/components/admin/KYCManagement.tsx`
- [ ] `apps/web/src/components/admin/ModerationQueue.tsx`
- [ ] `apps/web/src/components/admin/PerformanceMonitoring.tsx`
- [ ] `apps/web/src/components/admin/ReportsView.tsx`
- [ ] `apps/web/src/components/admin/UsersView.tsx`
- [ ] `apps/web/src/components/admin/VerificationReviewDashboard.tsx`

**Migration Notes**:
- Admin panels typically use simple fade/slide animations
- Focus on modal transitions and table row animations
- Use `AnimatedView` with `withSpring` for smooth transitions

---

### 🏠 Adoption Features (5 files)

**Priority**: High  
**Complexity**: Medium  
**Estimated Effort**: 2-3 hours per file

- [ ] `apps/web/src/components/adoption/AdoptionDetailDialog.tsx`
- [ ] `apps/web/src/components/adoption/AdoptionListingCard.tsx`
- [ ] `apps/web/src/components/adoption/AdoptionListingDetailDialog.tsx`
- [ ] `apps/web/src/components/adoption/CreateAdoptionListingWizard.tsx`
- [ ] `apps/web/src/components/adoption/MyApplicationsView.tsx`

**Migration Notes**:
- Wizard components need step transition animations
- Card components need hover/tap animations
- Use `useHoverLift` and `useBounceOnTap` hooks from `@/effects/reanimated`

---

### 🔐 Authentication (4 files)

**Priority**: High  
**Complexity**: Low-Medium  
**Estimated Effort**: 1-2 hours per file

- [ ] `apps/web/src/components/auth/AgeGateModal.tsx`
- [ ] `apps/web/src/components/auth/OAuthButtons.tsx`
- [ ] `apps/web/src/components/auth/SignInForm.tsx`
- [ ] `apps/web/src/components/auth/SignUpForm.tsx`
- [ ] `apps/web/src/components/AuthScreen.tsx`

**Migration Notes**:
- Form animations typically use fade/slide transitions
- Modal entry/exit animations
- Button hover/tap feedback
- Use `AnimatedView` with `withSpring` for form field focus animations

---

### 💬 Chat Components (5 files)

**Priority**: High  
**Complexity**: Medium-High  
**Estimated Effort**: 3-4 hours per file

- [ ] `apps/web/src/components/ChatRoomsList.tsx`
- [ ] `apps/web/src/components/ChatWindowNew.tsx`
- [ ] `apps/web/src/components/chat/window/ChatInputBar.tsx`
- [ ] `apps/web/src/components/chat/window/MessageList.tsx`
- [ ] `apps/web/src/components/chat/window/VirtualMessageList.tsx`

**Migration Notes**:
- Message list animations are critical for UX
- Use Layout Animations for message insertions
- Input bar needs smooth expand/collapse animations
- Chat rooms list needs swipe gestures

---

### 👥 Community Features (4 files)

**Priority**: Medium  
**Complexity**: Medium  
**Estimated Effort**: 2-3 hours per file

- [ ] `apps/web/src/components/community/CommentsSheet.tsx`
- [ ] `apps/web/src/components/community/PostComposer.tsx`
- [ ] `apps/web/src/components/community/RankingSkeleton.tsx`
- [ ] `apps/web/src/components/community/ReportDialog.tsx`

**Migration Notes**:
- Comments sheet needs slide-up animation
- Post composer needs expand/collapse animations
- Ranking skeleton needs shimmer effect (use `useShimmer` hook)
- Report dialog needs modal animations

---

### ✨ Enhanced Components (3 files)

**Priority**: High  
**Complexity**: High  
**Estimated Effort**: 3-5 hours per file

- [ ] `apps/web/src/components/enhanced/EnhancedCarousel.tsx`
- [ ] `apps/web/src/components/enhanced/AnimatedBadge.tsx`
- [ ] `apps/web/src/components/enhanced/DetailedPetAnalytics.tsx`
- [ ] `apps/web/src/components/enhanced/EnhancedButton.tsx` (Partial)
- [ ] `apps/web/src/components/enhanced/EnhancedPetDetailView.tsx` ⚠️ (Uses `usePressBounce` but has MotionView)
- [ ] `apps/web/src/components/enhanced/PremiumCard.tsx` (Partial)
- [ ] `apps/web/src/components/enhanced/SmartToast.tsx`
- [ ] `apps/web/src/components/enhanced/UltraButton.tsx`

**Migration Notes**:
- These are premium UI components with complex animations
- Carousel needs smooth swipe gestures
- Buttons need hover/tap animations (use `useHoverLift`, `useBounceOnTap`)
- Toast notifications need slide-in/out animations
- Premium cards need 3D tilt effects (use `useParallaxTilt`)

---

### 📖 Stories Features (9 files)

**Priority**: High  
**Complexity**: High  
**Estimated Effort**: 3-5 hours per file

- [ ] `apps/web/src/components/stories/CreateHighlightDialog.tsx`
- [ ] `apps/web/src/components/stories/CreateStoryDialog.tsx`
- [ ] `apps/web/src/components/stories/HighlightsBar.tsx`
- [ ] `apps/web/src/components/stories/HighlightViewer.tsx`
- [ ] `apps/web/src/components/stories/SaveToHighlightDialog.tsx`
- [ ] `apps/web/src/components/stories/StoriesBar.tsx`
- [ ] `apps/web/src/components/stories/StoryFilterSelector.tsx`
- [ ] `apps/web/src/components/stories/StoryRing.tsx`
- [ ] `apps/web/src/components/stories/StoryTemplateSelector.tsx`

**Migration Notes**:
- Stories have complex swipe gestures and transitions
- Story rings need circular progress animations
- Filter selector needs slide animations
- Template selector needs grid animations
- Use `useSwipeGesture` hook for swipe interactions

---

### ✅ Verification Features (4 files)

**Priority**: Medium  
**Complexity**: Low-Medium  
**Estimated Effort**: 1-2 hours per file

- [ ] `apps/web/src/components/verification/DocumentUploadCard.tsx`
- [ ] `apps/web/src/components/verification/VerificationButton.tsx`
- [ ] `apps/web/src/components/verification/VerificationDialog.tsx`
- [ ] `apps/web/src/components/verification/VerificationLevelSelector.tsx`
- [ ] `apps/web/src/components/VerificationBadge.tsx`

**Migration Notes**:
- Document upload cards need drag-and-drop animations
- Verification buttons need loading states
- Dialog needs modal animations
- Level selector needs step animations

---

### 🎮 Playdate Features (3 files)

**Priority**: Medium  
**Complexity**: Medium  
**Estimated Effort**: 2-3 hours per file

- [ ] `apps/web/src/components/playdate/LocationPicker.tsx`
- [ ] `apps/web/src/components/playdate/PlaydateMap.tsx`
- [ ] `apps/web/src/components/playdate/PlaydateScheduler.tsx`

**Migration Notes**:
- Map components need marker animations
- Location picker needs search animations
- Scheduler needs calendar animations
- Use `AnimatedView` with `withSpring` for smooth transitions

---

### 🗺️ Maps Features (3 files)

**Priority**: Medium  
**Complexity**: Medium  
**Estimated Effort**: 2-3 hours per file

- [ ] `apps/web/src/components/maps/LocationSharing.tsx`
- [ ] `apps/web/src/components/maps/LostFoundMap.tsx`
- [ ] `apps/web/src/components/maps/VenuePicker.tsx`

**Migration Notes**:
- Map markers need bounce animations
- Location sharing needs real-time position updates
- Venue picker needs search animations

---

### 🔍 Lost & Found (1 file)

**Priority**: Medium  
**Complexity**: Low  
**Estimated Effort**: 1-2 hours

- [ ] `apps/web/src/components/lost-found/LostAlertCard.tsx`

**Migration Notes**:
- Card needs hover/tap animations
- Use `useHoverLift` hook

---

### 📺 Streaming (1 file)

**Priority**: Low  
**Complexity**: High  
**Estimated Effort**: 4-5 hours

- [ ] `apps/web/src/components/streaming/LiveStreamRoom.tsx`

**Migration Notes**:
- Complex real-time animations
- Viewer count animations
- Chat overlay animations
- Use `AnimatedView` with `withTiming` for smooth updates

---

### 📱 Views (8 files)

**Priority**: High  
**Complexity**: Medium-High  
**Estimated Effort**: 3-4 hours per file

- [ ] `apps/web/src/components/views/AdoptionMarketplaceView.tsx`
- [ ] `apps/web/src/components/views/AdoptionView.tsx`
- [ ] `apps/web/src/components/views/LostFoundView.tsx`
- [ ] `apps/web/src/components/views/MapView.tsx`
- [ ] `apps/web/src/components/views/MatchesView.tsx`
- [ ] `apps/web/src/components/views/NotificationsView.tsx`
- [ ] `apps/web/src/components/views/SavedPostsView.tsx`
- [ ] `apps/web/src/components/views/UserPostsView.tsx`

**Migration Notes**:
- Views typically have list animations
- Use Layout Animations for list insertions/deletions
- Filter animations
- Empty state animations
- Loading state animations

---

### 🔔 Notifications (1 file)

**Priority**: Medium  
**Complexity**: Low-Medium  
**Estimated Effort**: 1-2 hours

- [ ] `apps/web/src/components/notifications/NotificationCenter.tsx`

**Migration Notes**:
- Notification list animations
- Badge animations
- Use `AnimatedView` with `withSpring` for smooth transitions

---

### 🎨 UI Components (2 files)

**Priority**: Medium  
**Complexity**: Low-Medium  
**Estimated Effort**: 1-2 hours per file

- [ ] `apps/web/src/components/ui/PremiumButton.tsx`
- [ ] `apps/web/src/components/ui/slider.tsx`
- [ ] `apps/web/src/components/web-only/Slider.tsx`

**Migration Notes**:
- Buttons need hover/tap animations
- Sliders need thumb animations
- Use `useHoverLift` and `useBounceOnTap` hooks

---

### 🎯 Other Components (33 files)

**Priority**: Low-Medium  
**Complexity**: Low-High  
**Estimated Effort**: 1-4 hours per file

- [ ] `apps/web/src/components/AdvancedCard.tsx`
- [ ] `apps/web/src/components/BackendDemo.tsx`
- [ ] `apps/web/src/components/CompatibilityBreakdown.tsx`
- [ ] `apps/web/src/components/CreatePetDialog.tsx` ⚠️ (High priority - core feature)
- [ ] `apps/web/src/components/DiscoverMapMode.tsx`
- [ ] `apps/web/src/components/DiscoveryFilters.tsx`
- [ ] `apps/web/src/components/DismissibleOverlay.tsx`
- [ ] `apps/web/src/components/EnhancedCard.tsx`
- [ ] `apps/web/src/components/EnhancedVisuals.tsx`
- [ ] `apps/web/src/components/GenerateProfilesButton.tsx`
- [ ] `apps/web/src/components/GlassCard.tsx`
- [ ] `apps/web/src/components/LoadingState.tsx`
- [ ] `apps/web/src/components/MatchCelebration.tsx` ⚠️ (High priority - core feature)
- [ ] `apps/web/src/components/PetDetailDialog.tsx` ⚠️ (High priority - core feature)
- [ ] `apps/web/src/components/PetPhotoAnalyzer.tsx`
- [ ] `apps/web/src/components/PetProfileTemplatesDialog.tsx`
- [ ] `apps/web/src/components/PetRatings.tsx`
- [ ] `apps/web/src/components/QuickActionsMenu.tsx`
- [ ] `apps/web/src/components/StatsCard.tsx`
- [ ] `apps/web/src/components/SyncStatusIndicator.tsx`
- [ ] `apps/web/src/components/ThemePresetSelector.tsx`
- [ ] `apps/web/src/components/TrustBadges.tsx` (Partial)
- [ ] `apps/web/src/components/VisualAnalysisDemo.tsx`
- [ ] `apps/web/src/components/WelcomeModal.tsx`
- [ ] `apps/web/src/components/WelcomeScreen.tsx`

**High Priority Files**:
- `CreatePetDialog.tsx` - Core pet creation flow
- `MatchCelebration.tsx` - Match celebration animation
- `PetDetailDialog.tsx` - Pet detail modal

---

## 📱 Native Files (5 files)

These are React Native-specific files that need separate migration:

- [ ] `apps/mobile/src/components/chat/window/ChatInputBar.native.tsx`
- [ ] `apps/mobile/src/components/enhanced/EnhancedButton.native.tsx`
- [ ] `apps/mobile/src/components/enhanced/PremiumButton.native.tsx`
- [ ] `apps/mobile/src/components/enhanced/UltraButton.native.tsx`
- [ ] `apps/mobile/src/components/enhanced/buttons/IconButton.native.tsx`
- [ ] `apps/mobile/src/components/enhanced/buttons/SplitButton.native.tsx`
- [ ] `apps/mobile/src/components/enhanced/buttons/ToggleButton.native.tsx`

**Migration Notes**:
- Native files should use React Native Reanimated directly
- Check for platform-specific animation requirements
- Ensure parity with web implementations

---

## Migration Checklist Template

For each file, complete the following:

- [ ] **Analysis**: Identify all MotionView/MotionText/Presence usage
- [ ] **Replace**: Convert MotionView → AnimatedView, MotionText → AnimatedText
- [ ] **Hooks**: Replace Framer Motion hooks with Reanimated hooks
- [ ] **Animations**: Convert animation props to Reanimated SharedValues
- [ ] **Presence**: Replace AnimatePresence with custom presence hook
- [ ] **Tests**: Update tests to use Reanimated mocks
- [ ] **Type Safety**: Ensure all types are correct (no `any`)
- [ ] **Performance**: Verify 60fps animations
- [ ] **Accessibility**: Ensure reduced motion support
- [ ] **Review**: Code review and approval

---

## Migration Priority Order

### Phase 1: Core Features (High Priority)
1. Chat components (ChatWindowNew, ChatRoomsList, ChatInputBar)
2. CreatePetDialog.tsx
3. MatchCelebration.tsx
4. PetDetailDialog.tsx
5. Enhanced components (EnhancedPetDetailView, EnhancedCarousel)

### Phase 2: User-Facing Features (High-Medium Priority)
6. Stories features (all 9 files)
7. Views (all 8 files)
8. Adoption features (all 5 files)
9. Authentication (all 4 files)

### Phase 3: Supporting Features (Medium Priority)
10. Community features (4 files)
11. Verification features (4 files)
12. Admin panel (11 files)
13. Maps & Playdate (6 files)

### Phase 4: Polish & Cleanup (Low-Medium Priority)
14. Other components (33 files)
15. Native files (5 files)
16. Partial migration cleanup (8 files)

---

## Migration Guidelines

### 1. Animation Patterns

**Fade In/Out**:
```typescript
// Before (Framer Motion)
<MotionView initial={{ opacity: 0 }} animate={{ opacity: 1 }} />

// After (Reanimated)
const opacity = useSharedValue(0)
useEffect(() => { opacity.value = withSpring(1) }, [])
const style = useAnimatedStyle(() => ({ opacity: opacity.value }))
<AnimatedView style={style} />
```

**Slide Animations**:
```typescript
// Before
<MotionView initial={{ x: -100 }} animate={{ x: 0 }} />

// After
const translateX = useSharedValue(-100)
useEffect(() => { translateX.value = withSpring(0) }, [])
const style = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }))
<AnimatedView style={style} />
```

**Scale Animations**:
```typescript
// Before
<MotionView whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} />

// After
const scale = useSharedValue(1)
const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
<AnimatedView 
  style={style}
  onMouseEnter={() => scale.value = withSpring(1.1)}
  onMouseLeave={() => scale.value = withSpring(1)}
  onClick={() => scale.value = withSequence(withSpring(0.9), withSpring(1))}
/>
```

### 2. Presence Animations

**Before (AnimatePresence)**:
```typescript
<AnimatePresence>
  {isOpen && <MotionView initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
</AnimatePresence>
```

**After (Custom Hook)**:
```typescript
import { useAnimatePresence } from '@/effects/reanimated/use-animate-presence'

const { style, isVisible } = useAnimatePresence(isOpen)
{isVisible && <AnimatedView style={style} />}
```

### 3. Gesture Animations

**Swipe Gestures**:
```typescript
import { useSwipeGesture } from '@/effects/reanimated/use-swipe-gesture'

const { gestureHandler, translateX } = useSwipeGesture({
  onSwipeLeft: () => handleSwipeLeft(),
  onSwipeRight: () => handleSwipeRight(),
})
```

**Hover/Tap**:
```typescript
import { useHoverLift } from '@/effects/reanimated/use-hover-lift'
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap'

const hover = useHoverLift()
const bounce = useBounceOnTap()
```

### 4. Performance Best Practices

- Use `useAnimatedStyle` for all animated styles
- Prefer `withSpring` over `withTiming` for natural feel
- Use `runOnUI` for heavy computations
- Avoid creating SharedValues in render
- Use `useDerivedValue` for computed values
- Clean up animations in `useEffect` cleanup

### 5. Accessibility

- Always check `prefers-reduced-motion`
- Provide instant state changes for reduced motion
- Ensure animations don't interfere with screen readers
- Test with keyboard navigation

---

## Testing Requirements

For each migrated file:

1. **Unit Tests**: Test animation hooks and utilities
2. **Component Tests**: Test component renders and interactions
3. **Visual Tests**: Screenshot tests for animation states
4. **Performance Tests**: Verify 60fps animations
5. **Accessibility Tests**: Test with reduced motion enabled

---

## Progress Tracking

### Completed (0 files)
- None yet

### In Progress (8 files)
- See "Partial Migration" section above

### Blocked (0 files)
- None

### Next Up (Priority Order)
1. `apps/web/src/components/ChatWindowNew.tsx`
2. `apps/web/src/components/CreatePetDialog.tsx`
3. `apps/web/src/components/MatchCelebration.tsx`
4. `apps/web/src/components/PetDetailDialog.tsx`
5. `apps/web/src/components/enhanced/EnhancedPetDetailView.tsx`

---

## Notes

- All migrations must maintain 60fps performance
- All animations must respect `prefers-reduced-motion`
- Type safety is mandatory (no `any` types)
- Tests must be updated alongside migrations
- Code review required for all migrations

---

## Resources

- [React Reanimated Documentation](https://docs.swmansion.com/react-native-reanimated/)
- [Migration Guide](./docs/motion-migration-guide.md)
- [Animation Hooks Reference](./apps/web/src/effects/reanimated/README.md)
- [Performance Budget](./apps/web/src/core/config/performance-budget.ts)
