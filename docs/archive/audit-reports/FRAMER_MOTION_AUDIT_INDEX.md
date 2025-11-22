# Framer Motion Migration Audit - Document Index

**Created**: 2024-12-19  
**Total Files Audited**: 105

## Documents Created

### 1. FRAMER_MOTION_AUDIT_SUMMARY.md

**Purpose**: Quick reference summary  
**Contents**:

- Quick stats table
- Files by category
- Migration phases
- Top 10 priority files
- Estimated effort
- Next steps

**Use When**: You need a quick overview of the migration status

---

### 2. FRAMER_MOTION_MIGRATION_TRACKING.md

**Purpose**: Comprehensive tracking document  
**Contents**:

- Detailed file listings by category
- Migration status for each file
- Migration guidelines and patterns
- Code examples (Before/After)
- Testing requirements
- Performance best practices
- Accessibility guidelines

**Use When**: You're migrating a specific file and need detailed guidance

---

### 3. FRAMER_MOTION_TRACKING_DETAILED.json

**Purpose**: Machine-readable tracking data  
**Contents**:

- Complete file listings organized by category
- Priority, complexity, and estimated hours per category
- Migration phases with file assignments
- Partial migration file details
- Native file listings

**Use When**: You need programmatic access to migration data (scripts, dashboards, etc.)

---

### 4. FRAMER_MOTION_AUDIT_REPORT.json

**Purpose**: Raw audit results  
**Contents**:

- Complete list of all files with MotionView/MotionText usage
- Files grouped by migration status
- Files grouped by feature area

**Use When**: You need the raw audit data for analysis

---

### 5. FRAMER_MOTION_BY_FEATURE.json

**Purpose**: Feature-based breakdown  
**Contents**:

- Files organized by feature area (auth, adoption, admin, etc.)
- Counts per feature
- File paths per feature

**Use When**: You want to see migration status by feature area

---

## Quick Reference

### Files Needing Migration: 92

### Partial Migration (Needs Cleanup): 8

### Native Files: 5

### Total Estimated Hours: ~355

### Priority Order:

1. **Phase 1**: Core features (Chat, Dialogs, Enhanced Components) - 80 hours
2. **Phase 2**: User-facing features (Stories, Views, Adoption, Auth) - 120 hours
3. **Phase 3**: Supporting features (Admin, Community, Verification, Maps) - 80 hours
4. **Phase 4**: Polish & cleanup (Other components, Native files) - 75 hours

### Top 5 Files to Migrate First:

1. `apps/web/src/components/ChatWindowNew.tsx`
2. `apps/web/src/components/CreatePetDialog.tsx`
3. `apps/web/src/components/MatchCelebration.tsx`
4. `apps/web/src/components/PetDetailDialog.tsx`
5. `apps/web/src/components/enhanced/EnhancedPetDetailView.tsx`

### Files to Clean Up First (Partial Migration):

1. `apps/web/src/components/chat/AdvancedChatWindow.tsx`
2. `apps/web/src/components/chat/components/ChatFooter.tsx`
3. `apps/web/src/components/views/DiscoverView.tsx`
4. `apps/web/src/components/stories/StoryViewer.tsx`
5. `apps/web/src/components/enhanced/ProgressiveImage.tsx`

---

## Usage Guide

### For Project Managers

- Read: `FRAMER_MOTION_AUDIT_SUMMARY.md`
- Check: `FRAMER_MOTION_TRACKING_DETAILED.json` for estimates

### For Developers

- Read: `FRAMER_MOTION_MIGRATION_TRACKING.md` for guidelines
- Reference: Code examples in the tracking document
- Check: `FRAMER_MOTION_AUDIT_REPORT.json` for file status

### For Automation/Scripts

- Use: `FRAMER_MOTION_TRACKING_DETAILED.json` (structured data)
- Parse: `FRAMER_MOTION_AUDIT_REPORT.json` (raw audit results)

---

## Maintenance

These documents should be updated as files are migrated:

1. Mark files as "migrated" in the tracking documents
2. Update progress counters
3. Move files from "needsMigration" to "migrated"
4. Update estimated hours remaining

---

## Related Files

- `scripts/audit-motion-files.mjs` - Script used to generate audit
- `apps/web/src/effects/reanimated/` - Reanimated hooks and utilities
- `FRAMER_MOTION_MIGRATION_PROGRESS.md` - Previous progress tracking (if exists)

---

**Last Updated**: 2024-12-19
