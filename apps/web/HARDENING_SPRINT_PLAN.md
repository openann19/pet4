# Hardening & Wiring Sprint — Implementation Plan

**Status**: 🚀 IN PROGRESS  
**Date**: 2025-01-27  
**Goal**: Complete the final 10% to reach 100% production readiness

---

## Current State Assessment

### ✅ Already Implemented

- Basic i18n (EN/BG) with length check script
- SwipeEngine foundation with basic physics
- DismissibleOverlay component
- Maps placeholder components
- Partial backend services (PhotoService, ModerationService, KYCService)
- Push notification infrastructure
- Admin console components

### ❌ Critical Gaps

- TypeScript errors in chat components
- Incomplete i18n length guard (needs CSV output)
- Theme contrast issues (WCAG AA compliance)
- SwipeEngine needs hardening (thresholds, velocity, haptics)
- Maps need real provider integration (Mapbox/Google)
- Backend API endpoints not fully wired
- Media pipeline incomplete (EXIF, variants, CDN)
- Push notifications not fully integrated
- Test coverage insufficient
- Store readiness polish incomplete

---

## Implementation Order

### Phase 1: Foundation Fixes (Priority 1) ✅ IN PROGRESS

1. ✅ Fix TypeScript errors in chat-types.ts
2. ⏳ Fix remaining TypeScript errors in chat components
3. ⏳ Implement fluid typography with tokenized lineClamp
4. ⏳ Create i18n length guard script with CSV output
5. ⏳ Theme contrast audit and fixes

### Phase 2: Mobile UX Hardening (Priority 2)

1. ⏳ Replace ad-hoc overlays with DismissibleOverlay
2. ⏳ Harden SwipeEngine (thresholds, velocity, haptics)
3. ⏳ Ensure all overlays support tap-outside/Esc/Android back

### Phase 3: Maps Integration (Priority 3)

1. ⏳ Integrate Mapbox provider
2. ⏳ Implement geocoding/reverse geocoding
3. ⏳ Distance calculation and privacy grid
4. ⏳ Map chips on cards

### Phase 4: Backend Wiring (Priority 4)

1. ⏳ Finalize v1 API endpoints
2. ⏳ JWT + refresh token auth
3. ⏳ Rate limiting
4. ⏳ OpenAPI spec
5. ⏳ Structured error responses

### Phase 5: Admin & KYC (Priority 5)

1. ⏳ Complete queue system
2. ⏳ Approve/reject actions
3. ⏳ KYC verification flow
4. ⏳ Notifications

### Phase 6: Media Pipeline (Priority 6)

1. ⏳ EXIF strip and orientation fix
2. ⏳ WebP variants (320/960/1920)
3. ⏳ S3 signed URLs
4. ⏳ Video HLS processing

### Phase 7: Push & Deep Links (Priority 7)

1. ⏳ APNs/FCM setup
2. ⏳ Per-type toggles and quiet hours
3. ⏳ Deep link routing (pawf:// and HTTPS)

### Phase 8: Observability (Priority 8)

1. ⏳ Event schema
2. ⏳ Sentry setup
3. ⏳ PII redaction
4. ⏳ Security headers (CORS/CSP/helmet)

### Phase 9: Tests & CI (Priority 9)

1. ⏳ Unit tests
2. ⏳ Integration tests
3. ⏳ E2E tests (Playwright/Detox)
4. ⏳ CI pipeline with coverage gates

### Phase 10: Store Readiness (Priority 10)

1. ⏳ App icons/splash
2. ⏳ Permission copy (EN/BG)
3. ⏳ In-app review prompt
4. ⏳ Privacy policy screens
5. ⏳ Data deletion flow

---

## Acceptance Criteria

### UI Foundations

- ✅ No clipping in BG text
- ✅ No hidden buttons
- ✅ WCAG AA contrast compliance
- ✅ i18n length guard script outputs CSV

### Mobile Swipe

- ✅ p95 frame time ≤16ms during swipe
- ✅ No "stuck" states
- ✅ LIKE/PASS labels never overlap
- ✅ Proper haptics at thresholds

### Maps

- ✅ Distance filter works
- ✅ Map renders on devices
- ✅ No location crash when denied
- ✅ Privacy grid snapping

### Backend

- ✅ Frontend uses only live endpoints
- ✅ Local + staging envs seeded
- ✅ OpenAPI validates
- ✅ 429s on abuse

### Admin/KYC

- ✅ Submit → appears in queue
- ✅ Admin acts → user status updates
- ✅ Feed respects status

### Media

- ✅ Upload → variants exist
- ✅ Fast loads, correct orientation
- ✅ Deletion cleans up

### Push

- ✅ Test device receives pushes
- ✅ Tapping opens correct screen
- ✅ Respects quiet hours

### Tests

- ✅ CI green
- ✅ Flake rate <1%
- ✅ Coverage ≥80%
- ✅ Artifacts uploaded

### Store

- ✅ Checklists complete
- ✅ Builds pass store pre-checks

---

## Next Steps

1. Complete TypeScript error fixes
2. Implement fluid typography system
3. Create i18n length guard with CSV
4. Audit and fix theme contrast
5. Harden SwipeEngine
6. Integrate Mapbox
7. Wire backend endpoints
8. Complete admin/KYC flows
9. Implement media pipeline
10. Complete push notifications
11. Add observability
12. Write tests
13. Store readiness polish

---

## Progress Tracking

See WORKLOG.md for detailed progress and metrics.
