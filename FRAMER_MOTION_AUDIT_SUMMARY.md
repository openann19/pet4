# Framer Motion Migration Audit Summary

**Date**: 2024-12-19  
**Total Files Audited**: 105  
**Status**: Comprehensive audit complete

## Quick Stats

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Files** | 105 | 100% |
| **Needs Migration** | 92 | 87.6% |
| **Partial Migration** | 8 | 7.6% |
| **Native Files** | 5 | 4.8% |
| **Migrated** | 0 | 0% |

## Files by Category

### High Priority (Core Features)
- **Chat**: 5 files (18 hours)
- **Enhanced Components**: 8 files (32 hours)
- **Stories**: 9 files (36 hours)
- **Views**: 8 files (28 hours)
- **Adoption**: 5 files (12 hours)
- **Auth**: 4 files (6 hours)

### Medium Priority (Supporting Features)
- **Admin**: 11 files (25 hours)
- **Community**: 4 files (10 hours)
- **Verification**: 4 files (6 hours)
- **Maps**: 3 files (8 hours)
- **Playdate**: 3 files (8 hours)
- **UI Components**: 2 files (4 hours)
- **Notifications**: 1 file (2 hours)
- **Lost & Found**: 1 file (2 hours)

### Low Priority (Polish)
- **Other Components**: 33 files (66 hours)
- **Streaming**: 1 file (5 hours)
- **Native**: 5 files (varies)

## Migration Phases

### Phase 1: Core Features (80 hours)
**Priority**: High  
**Files**: 8  
**Focus**: Chat, dialogs, enhanced components

### Phase 2: User-Facing Features (120 hours)
**Priority**: High-Medium  
**Files**: 27  
**Focus**: Stories, views, adoption, auth

### Phase 3: Supporting Features (80 hours)
**Priority**: Medium  
**Files**: 25  
**Focus**: Admin, community, verification, maps

### Phase 4: Polish & Cleanup (75 hours)
**Priority**: Low-Medium  
**Files**: 25+  
**Focus**: Other components, native files, cleanup

## Top 10 Priority Files

1. `apps/web/src/components/ChatWindowNew.tsx`
2. `apps/web/src/components/CreatePetDialog.tsx`
3. `apps/web/src/components/MatchCelebration.tsx`
4. `apps/web/src/components/PetDetailDialog.tsx`
5. `apps/web/src/components/enhanced/EnhancedPetDetailView.tsx`
6. `apps/web/src/components/enhanced/EnhancedCarousel.tsx`
7. `apps/web/src/components/stories/StoriesBar.tsx`
8. `apps/web/src/components/views/MatchesView.tsx`
9. `apps/web/src/components/views/DiscoverView.tsx` (Partial - needs cleanup)
10. `apps/web/src/components/stories/StoryViewer.tsx` (Partial - needs cleanup)

## Partial Migration Files (Needs Cleanup)

These files use React Reanimated but still have MotionView imports:

1. `apps/web/src/components/chat/AdvancedChatWindow.tsx`
2. `apps/web/src/components/chat/components/ChatFooter.tsx`
3. `apps/web/src/components/enhanced/ProgressiveImage.tsx`
4. `apps/web/src/components/enhanced/SmartSearch.tsx`
5. `apps/web/src/components/enhanced/NotificationCenter.tsx`
6. `apps/web/src/components/views/DiscoverView.tsx`
7. `apps/web/src/components/stories/StoryViewer.tsx`
8. `apps/web/src/components/TrustBadges.tsx`

**Action**: Remove remaining MotionView/MotionText imports and replace with AnimatedView.

## Estimated Total Effort

- **Total Hours**: ~355 hours
- **At 8 hours/day**: ~44 days
- **At 4 hours/day**: ~89 days
- **With 2 developers**: ~22 days

## Next Steps

1. **Immediate**: Clean up 8 partial migration files
2. **Phase 1**: Migrate core chat and dialog components
3. **Phase 2**: Migrate user-facing features (stories, views)
4. **Phase 3**: Migrate supporting features (admin, community)
5. **Phase 4**: Polish and cleanup remaining files

## Tracking Documents

- **Main Tracking**: `FRAMER_MOTION_MIGRATION_TRACKING.md`
- **Detailed JSON**: `FRAMER_MOTION_TRACKING_DETAILED.json`
- **Audit Report**: `FRAMER_MOTION_AUDIT_REPORT.json`
- **Feature Breakdown**: `FRAMER_MOTION_BY_FEATURE.json`

## Migration Guidelines

See `FRAMER_MOTION_MIGRATION_TRACKING.md` for:
- Animation pattern examples
- Code conversion templates
- Performance best practices
- Testing requirements
- Accessibility guidelines

## Notes

- All migrations must maintain 60fps performance
- All animations must respect `prefers-reduced-motion`
- Type safety is mandatory (no `any` types)
- Tests must be updated alongside migrations
- Code review required for all migrations
