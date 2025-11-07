# Framer Motion Migration - Complete Audit & Tracking

**Last Updated**: 2024-12-19  
**Total Files Audited**: 115 files with motion usage  
**Files Needing Migration**: 95 files  
**Status**: In Progress (~17% complete)

## Quick Reference

- **Main Tracking Document**: `FRAMER_MOTION_MIGRATION_TRACKING.md` - Detailed migration guide with patterns and checklist
- **Detailed File List**: `FRAMER_MOTION_MIGRATION_DETAILED.md` - Complete categorized list with priorities and estimates
- **Categorization Script**: `scripts/categorize-motion-files.mjs` - Regenerate detailed report

## Executive Summary

### Statistics

| Metric | Count | Percentage |
|--------|-------|------------|
| Total TSX files in project | 395 | 100% |
| Files with motion usage | 115 | 29% |
| Files already migrated | ~20 | 17% |
| Files needing migration | 95 | 83% |

### Breakdown by Priority

| Priority | Count | Est. Hours | Description |
|----------|-------|------------|-------------|
| **P0 (Critical)** | 19 | ~85h | Core user-facing components, critical path |
| **P1 (High)** | 41 | ~123h | Important features, admin panels, enhanced components |
| **P2 (Low)** | 55 | ~165h | Nice-to-have features, utilities, low-traffic pages |
| **Total** | **115** | **~373h** | Complete migration estimate |

### Breakdown by Category

| Category | Count | P0 | P1 | P2 | Est. Hours |
|----------|-------|----|----|----|------------|
| Core Components | 8 | 5 | 3 | 0 | 27h |
| Views | 10 | 5 | 3 | 2 | 31h |
| Enhanced Components | 17 | 7 | 5 | 5 | 53h |
| Admin Panels | 11 | 0 | 11 | 0 | 33h |
| Stories | 10 | 0 | 6 | 4 | 29h |
| Adoption | 5 | 0 | 5 | 0 | 16h |
| Community | 6 | 0 | 2 | 4 | 16h |
| Auth | 5 | 0 | 4 | 1 | 13h |
| Verification | 4 | 0 | 0 | 4 | 10h |
| Maps | 3 | 0 | 0 | 3 | 9h |
| Playdate | 3 | 0 | 0 | 3 | 8h |
| Chat Components | 5 | 0 | 0 | 5 | 15h |
| Other Components | 25 | 1 | 2 | 22 | 74h |
| Lost & Found | 1 | 0 | 0 | 1 | 3h |
| Notifications | 1 | 1 | 0 | 0 | 3h |
| Streaming | 1 | 0 | 0 | 1 | 3h |

## Migration Phases

### Phase 1: Critical Path (P0) - 19 files, ~85 hours

**Focus**: Core user-facing components that are critical to the user experience.

**Files**:
- Core Components (5): CreatePetDialog, AuthScreen, ChatWindowNew, PetDetailDialog, MatchCelebration
- Views (5): MatchesView, AdoptionView, AdoptionMarketplaceView, LostFoundView, MapView
- Enhanced Components (7): EnhancedPetDetailView, EnhancedCarousel, EnhancedCard, EnhancedButton, UltraButton, PremiumCard, SmartSearch, NotificationCenter
- Notifications (1): NotificationCenter
- Other (1): ChatInputBar

**Timeline**: 2-3 weeks (assuming 1 developer, 40h/week)

### Phase 2: High Priority (P1) - 41 files, ~123 hours

**Focus**: Important features, admin panels, and enhanced components.

**Categories**:
- Core Components (3): WelcomeScreen, LoadingState, WelcomeModal
- Views (3): NotificationsView, SavedPostsView, UserPostsView
- Enhanced Components (5): DetailedPetAnalytics, AnimatedBadge, SmartToast, TrustBadges, ProgressiveImage
- Admin Panels (11): All admin views
- Stories (6): CreateStoryDialog, StoriesBar, HighlightsBar, StoryRing, HighlightViewer, CreateHighlightDialog
- Adoption (5): All adoption components
- Community (2): PostComposer, CommentsSheet
- Auth (4): SignInForm, SignUpForm, OAuthButtons, AgeGateModal

**Timeline**: 3-4 weeks

### Phase 3: Low Priority (P2) - 55 files, ~165 hours

**Focus**: Nice-to-have features, utilities, and low-traffic pages.

**Categories**:
- Views (2): DiscoverView (native), DiscoverView
- Enhanced Components (5): AdvancedCard, etc.
- Stories (4): SaveToHighlightDialog, StoryFilterSelector, StoryTemplateSelector, StoryViewer
- Community (4): ReportDialog, RankingSkeleton
- Verification (4): All verification components
- Maps (3): All map components
- Playdate (3): All playdate components
- Chat Components (5): Various chat utilities
- Other Components (22): Various utilities and demos
- Lost & Found (1): LostAlertCard
- Streaming (1): LiveStreamRoom

**Timeline**: 4-5 weeks

## Migration Patterns

### Common Replacements

1. **MotionView → AnimatedView**
   ```typescript
   // Before
   <MotionView initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
   
   // After
   const opacity = useSharedValue(0)
   useEffect(() => { opacity.value = withSpring(1) }, [])
   <AnimatedView style={useAnimatedStyle(() => ({ opacity: opacity.value }))}>
   ```

2. **MotionText → AnimatedText**
   ```typescript
   // Before
   <MotionText animate={{ opacity: 1 }}>
   
   // After
   <AnimatedText style={animatedStyle}>
   ```

3. **Presence → Conditional Rendering**
   ```typescript
   // Before
   <Presence visible={isVisible}>
   
   // After
   {isVisible && <AnimatedView style={animatedStyle}>}
   ```

4. **usePressBounce → useBounceOnTap**
   ```typescript
   // Before
   import { usePressBounce } from '@petspark/motion'
   
   // After
   import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap'
   ```

5. **Haptic → haptics.trigger**
   ```typescript
   // Before
   import { haptic } from '@petspark/motion'
   haptic('light')
   
   // After
   import { haptics } from '@/effects/chat/core/haptic-manager'
   haptics.trigger('light')
   ```

## Migration Checklist

For each file migration:

- [ ] Replace MotionView with AnimatedView
- [ ] Replace MotionText with AnimatedText
- [ ] Replace Presence with conditional rendering + AnimatedView
- [ ] Convert animation props to useSharedValue + useAnimatedStyle
- [ ] Replace usePressBounce with useBounceOnTap
- [ ] Replace haptic() with haptics.trigger()
- [ ] Update imports to use @/effects/reanimated
- [ ] Test animations match original behavior
- [ ] Verify reduced motion support
- [ ] Run typecheck: `pnpm tsc --noEmit`
- [ ] Run lint: `pnpm lint`
- [ ] Run tests: `pnpm test`
- [ ] Update tracking document

## Quality Gates

All migrations must pass:

- ✅ TypeScript strict mode: `pnpm tsc --noEmit`
- ✅ ESLint: `pnpm lint` (zero warnings)
- ✅ Tests: `pnpm test` (all passing)
- ✅ Visual regression: Animations match original behavior
- ✅ Reduced motion: Respects user preferences
- ✅ Performance: No frame drops, 60fps maintained

## Next Steps

1. **Review Phase 1 files** - Identify dependencies and blockers
2. **Set up migration branch** - Create feature branch for Phase 1
3. **Establish patterns** - Document common migration patterns
4. **Create utilities** - Build helper functions for common conversions
5. **Start Phase 1** - Begin with CreatePetDialog (highest complexity)

## Notes

- Some files may use both Framer Motion and Reanimated (transitional state)
- Test files are excluded from migration count
- Native files (.native.tsx) are tracked separately
- Migration should maintain exact animation behavior
- All migrations must pass strict type checking and linting
- Reduced motion support must be maintained

## Related Documents

- `FRAMER_MOTION_MIGRATION_TRACKING.md` - Detailed migration guide
- `FRAMER_MOTION_MIGRATION_DETAILED.md` - Complete file list with priorities
- `scripts/categorize-motion-files.mjs` - Regenerate detailed report
- `FRAMER_MOTION_MIGRATION_PROGRESS.md` - Previous migration status

