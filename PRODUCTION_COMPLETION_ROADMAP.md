# 🎯 Production Completion Roadmap

**Purpose**: Actionable checklist to complete PetSpark for production deployment  
**Status**: Comprehensive plan covering ALL implementation gaps  
**Last Updated**: 2025-11-09

---

## 📊 Current State

### Web Application
- **Feature Completeness**: 95%
- **Build Status**: ❌ FAILING (expo-file-system)
- **TypeScript**: ❌ 126 compilation errors
- **Production Ready**: ❌ NO (2-3 weeks to fix)

### Mobile Application
- **Feature Completeness**: 60%
- **Build Status**: ✅ PASSING
- **TypeScript**: ⚠️ 8 compilation errors
- **Production Ready**: ❌ NO (5-6 weeks with Phase 1)

---

## 🚀 Week-by-Week Action Plan

### Week 1: Critical Blockers (Web)

#### Day 1: AGI UI Engine Fix (2-4 hours)
**Problem**: Import/export file naming mismatch  
**Location**: `/apps/web/src/agi_ui_engine/`

**Option A - Rename Files** (Recommended):
```bash
cd apps/web/src/agi_ui_engine/effects
mv use-ai-reply-aura.tsx useAIReplyAura.tsx
mv use-typing-trail.tsx useTypingTrail.tsx
mv use-bubble-glow.tsx useBubbleGlow.tsx
mv use-delete-burst.tsx useDeleteBurst.tsx
mv use-reaction-particle-trail.tsx useReactionParticleTrail.tsx
mv use-message-shimmer.tsx useMessageShimmer.tsx
mv use-mood-color-theme.tsx useMoodColorTheme.tsx
mv use-mood-theme.tsx useMoodTheme.tsx
mv use-glass-background.tsx useGlassBackground.tsx
mv use-3d-tilt-effect.tsx use3DTiltEffect.tsx
mv use-dynamic-background-mesh.tsx useDynamicBackgroundMesh.tsx
mv use-emoji-trail.tsx useEmojiTrail.tsx
mv use-particle-burst-on-send.tsx useParticleBurstOnSend.tsx
mv use-particle-burst-on-delete.tsx useParticleBurstOnDelete.tsx
mv use-particle-fx.tsx useParticleFX.tsx
mv use-sentiment-mood-engine.tsx useSentimentMoodEngine.tsx
mv use-adaptive-bubble-shape.tsx useAdaptiveBubbleShape.tsx
mv use-sound-feedback.tsx useSoundFeedback.tsx
```

**Option B - Fix Imports**:
Update `/apps/web/src/agi_ui_engine/index.ts` to use kebab-case imports

**Verification**:
```bash
cd apps/web
pnpm typecheck | grep agi_ui_engine
# Should return 0 errors
```

**Impact**: Fixes 36 TypeScript errors

---

#### Day 2: expo-file-system Web Polyfill (4-6 hours)

**Problem**: Web build fails importing expo-file-system  
**Location**: `/apps/web/vite.config.ts`

**Step 1**: Add plugin to vite.config.ts (after line 138):
```typescript
const stubExpoFileSystemPlugin = (): PluginOption => ({
  name: 'stub-expo-file-system',
  enforce: 'pre',
  resolveId(id) {
    if (id === 'expo-file-system' || id.includes('expo-file-system')) {
      return '\0expo-file-system-stub';
    }
    return null;
  },
  load(id) {
    if (id === '\0expo-file-system-stub') {
      return `
        // Stub for expo-file-system (web environment uses File API)
        export const documentDirectory = null;
        export const cacheDirectory = null;
        export const bundleDirectory = null;
        
        export async function getInfoAsync(fileUri, options) {
          console.warn('expo-file-system.getInfoAsync not available in web');
          return { exists: false };
        }
        
        export async function readAsStringAsync(fileUri, options) {
          console.warn('expo-file-system.readAsStringAsync not available in web');
          return '';
        }
        
        export async function writeAsStringAsync(fileUri, contents, options) {
          console.warn('expo-file-system.writeAsStringAsync not available in web');
          return;
        }
        
        export async function deleteAsync(fileUri, options) {
          console.warn('expo-file-system.deleteAsync not available in web');
          return;
        }
        
        export async function moveAsync(options) {
          console.warn('expo-file-system.moveAsync not available in web');
          return;
        }
        
        export async function copyAsync(options) {
          console.warn('expo-file-system.copyAsync not available in web');
          return;
        }
        
        export async function makeDirectoryAsync(fileUri, options) {
          console.warn('expo-file-system.makeDirectoryAsync not available in web');
          return;
        }
        
        export async function readDirectoryAsync(fileUri) {
          console.warn('expo-file-system.readDirectoryAsync not available in web');
          return [];
        }
        
        export async function downloadAsync(uri, fileUri, options) {
          console.warn('expo-file-system.downloadAsync not available in web');
          return { uri: fileUri, status: 200, headers: {}, md5: null };
        }
        
        export async function uploadAsync(url, fileUri, options) {
          console.warn('expo-file-system.uploadAsync not available in web');
          return { body: '', status: 200, headers: {} };
        }
        
        export default {};
      `;
    }
    return null;
  },
});
```

**Step 2**: Register plugin (line ~276):
```typescript
const plugins: PluginOption[] = [
  stubGestureHandlerPlugin(),
  stubExpoHapticsPlugin(),
  stubExpoFileSystemPlugin(), // ADD THIS LINE
  resolveReactNativePlugin(),
  // ... rest
];
```

**Step 3**: Alternative - Use Web File API instead
Refactor `/apps/web/src/core/services/media/image-engine.ts` to use browser File API

**Verification**:
```bash
cd apps/web
pnpm build
# Should complete without errors
```

**Impact**: Web app can build for production

---

#### Days 3-5: Fix TypeScript Errors (16-20 hours)

**Category 1: Admin Tests** (6 hours)
- Fix: Update useStorage return type to match React Query
- Files: `AdminLayout.test.tsx`, `UsersView.test.tsx`
- Error: Tuple element mismatch (2 vs 3)

**Category 2: Adoption Components** (2 hours)
- Fix: Add null checks for HTMLElement
- Files: `AdoptionFiltersSheet.test.tsx`
- Error: `HTMLElement | undefined` vs `Element`

**Category 3: Chat Components** (6 hours)
- Fix: Update ChatErrorBoundary override modifiers
- Fix: Add type guards for string | undefined
- Fix: Correct DOM type usage in LiveRegions
- Files: `ChatErrorBoundary.tsx`, `ChatHeader.tsx`, `LiveRegions.tsx`

**Category 4: Type Definitions** (4 hours)
- Fix: Align TypingUser interface
- Fix: Reaction types compatibility
- Fix: Virtualizer callback signature
- Files: `MessageList.tsx`, `VirtualMessageList.tsx`

**Category 5: Environment Variables** (1 hour)
- Replace `process.env.NODE_ENV` with `import.meta.env.MODE`
- File: `performance-budget.config.ts`

**Verification**:
```bash
cd apps/web
pnpm typecheck
# Should return 0 errors
```

---

### Week 2: Quality & Testing

#### Days 1-2: Test Coverage Analysis (8 hours)

**Step 1**: Run coverage reports
```bash
# Web
cd apps/web
pnpm test:cov

# Mobile
cd apps/mobile
pnpm test:cov

# Analyze results
# Target: ≥95% coverage
```

**Step 2**: Identify gaps
- Payment flows
- WebRTC calling  
- Media editor
- Admin functions
- Error scenarios
- Edge cases

**Step 3**: Document findings
Create `TEST_COVERAGE_REPORT.md` with:
- Current coverage %
- Files below 95%
- Critical paths without tests
- Plan to reach 95%

---

#### Days 3-5: Add Missing Tests (16 hours)

**Priority 1: Payment flows**
```typescript
// Add tests for:
- Payment processing
- Subscription upgrades
- Billing failure handling
- Payment method updates
```

**Priority 2: Critical user flows**
```typescript
// Add tests for:
- User registration
- Login/logout
- Profile updates
- Match interactions
- Chat messaging
```

**Priority 3: Error handling**
```typescript
// Add tests for:
- Network errors
- API failures
- Invalid input
- Edge cases
```

**Verification**:
```bash
pnpm test
pnpm test:cov
# Target: ≥95% coverage achieved
```

---

#### Day 6-7: Security Audit (8 hours)

**OWASP Top 10 Check**:
- [ ] Injection (SQL, NoSQL, Command)
- [ ] Broken Authentication
- [ ] Sensitive Data Exposure
- [ ] XML External Entities (XXE)
- [ ] Broken Access Control
- [ ] Security Misconfiguration
- [ ] Cross-Site Scripting (XSS)
- [ ] Insecure Deserialization
- [ ] Using Components with Known Vulnerabilities
- [ ] Insufficient Logging & Monitoring

**Tools**:
```bash
# Run dependency audit
pnpm audit

# Check for known vulnerabilities
pnpm dlx snyk test

# Static analysis
pnpm dlx eslint-plugin-security
```

**Document Findings**:
Create `SECURITY_AUDIT_REPORT.md`

---

### Week 3: Web Deployment Prep

#### Days 1-2: Performance Testing
- Load testing
- Bundle size analysis
- Core Web Vitals
- Lighthouse audit

#### Days 3-4: Deployment Setup
- Configure hosting (Vercel/Netlify/AWS)
- Set up environment variables
- Configure CDN
- SSL certificates

#### Day 5: Deployment
- Deploy to staging
- Smoke test all features
- Deploy to production
- Monitor for errors

---

### Weeks 4-6: Mobile Phase 1 (Critical Features)

#### Week 4: Payment System (40 hours)

**Day 1-2: UI Components**
```typescript
// Create mobile components:
- PricingModal.native.tsx
- SubscriptionStatusCard.native.tsx
- BillingIssueBanner.native.tsx
- PaymentMethodSelector.native.tsx
```

**Day 3-4: API Integration**
```typescript
// Port from web or create:
- payments-api.ts
- stripe-service.ts (or payment provider)
- subscription management
```

**Day 5: Testing**
- End-to-end payment flow
- Subscription upgrade/downgrade
- Error handling
- Receipt validation

**Verification**:
```typescript
// Test flows:
1. View pricing
2. Select plan
3. Enter payment
4. Complete subscription
5. Verify access to premium features
```

---

#### Week 5: Video Calling (40 hours)

**Good News**: Native app has production-ready WebRTC!

**Day 1-2: Port from Native**
```bash
# Copy from apps/native to apps/mobile:
cp -r apps/native/src/hooks/call apps/mobile/src/hooks/
cp -r apps/native/src/components/call apps/mobile/src/components/
cp apps/native/src/types/webrtc.d.ts apps/mobile/src/types/
```

**Day 3: Install Dependencies**
```bash
cd apps/mobile
npm install react-native-webrtc
# Configure native modules
```

**Day 4: UI Integration**
- Add call button to match screen
- Add incoming call notification
- Test call flow

**Day 5: Testing**
- 1-on-1 calling
- Audio/video toggle
- Camera switch
- Call quality

**Verification**:
- Make test calls
- Verify audio/video
- Test reconnection
- Check battery usage

---

#### Week 6: Stories Completion (40 hours)

**Day 1-2: Story Creation**
```typescript
// Create components:
- StoryCreator.native.tsx
- StoryEditor.native.tsx
- StoryPreview.native.tsx
```

**Day 3: Story Viewing**
```typescript
// Create components:
- StoryViewer.native.tsx
- StoryProgressBar.native.tsx
- StoryControls.native.tsx
```

**Day 4: Story Highlights**
```typescript
// Complete existing:
- SaveToHighlightDialog.tsx (exists)
- HighlightViewer.native.tsx (create)
- HighlightManager.native.tsx (create)
```

**Day 5: Backend Integration**
- 24-hour expiration logic
- Story upload/download
- Highlight persistence
- View tracking

**Verification**:
- Create story
- View story
- Save to highlight
- Story expires after 24h

---

### Week 7+: Optional Enhancements

**If time/budget allows**:
- Enhanced chat features (reactions, stickers, voice)
- Playdates scheduling
- Live streaming
- KYC verification
- Advanced animations
- Full parity per `MOBILE_PARITY_IMPLEMENTATION_PLAN.md`

---

## 🎯 Success Criteria

### Web Application Ready ✅
- [ ] Builds without errors
- [ ] Zero TypeScript compilation errors
- [ ] ≥95% test coverage
- [ ] All tests passing
- [ ] Security audit complete (no critical issues)
- [ ] Performance benchmarks met
- [ ] Deployed to production
- [ ] Monitoring configured

### Mobile Application Ready (Phase 1) ✅
- [ ] Payment system functional
- [ ] Video calling working
- [ ] Stories complete (create/view/highlight)
- [ ] All tests passing
- [ ] ≥95% coverage for new features
- [ ] App Store / Play Store builds
- [ ] Revenue generation confirmed

---

## 📋 Daily Checklist Template

```markdown
### Day X: [Task Name]

**Planned** (8 hours):
- [ ] Subtask 1 (2h)
- [ ] Subtask 2 (3h)
- [ ] Subtask 3 (2h)
- [ ] Testing (1h)

**Completed**:
- List actual completions

**Blockers**:
- List any blockers

**Tomorrow**:
- Plan for next day
```

---

## 🚨 Risk Management

### High Risk Items
1. **Payment Integration**
   - Risk: Third-party API issues
   - Mitigation: Test in sandbox thoroughly, have rollback plan

2. **WebRTC Porting**
   - Risk: Platform differences between native/mobile
   - Mitigation: Native code is production-ready, should port cleanly

3. **Timeline Slippage**
   - Risk: Underestimated complexity
   - Mitigation: Build buffer time, prioritize ruthlessly

### Mitigation Strategies
- Daily standup to track progress
- Blockers escalated immediately
- Weekly demo to stakeholders
- Automated testing to catch regressions

---

## 📊 Progress Tracking

### Week 1 Progress
| Day | Task | Status | Hours | Notes |
|-----|------|--------|-------|-------|
| Mon | AGI Engine | ⏳ | 0/2 | |
| Tue | expo-file-system | ⏳ | 0/6 | |
| Wed | TS Errors (admin) | ⏳ | 0/6 | |
| Thu | TS Errors (chat) | ⏳ | 0/6 | |
| Fri | TS Errors (types) | ⏳ | 0/4 | |

### Week 2 Progress
| Day | Task | Status | Hours | Notes |
|-----|------|--------|-------|-------|
| Mon-Tue | Coverage Analysis | ⏳ | 0/8 | |
| Wed-Fri | Add Tests | ⏳ | 0/16 | |

---

## 📞 Support & Resources

### Documentation
- Full audit: `PRODUCTION_READINESS_DEEP_AUDIT.md`
- Mobile parity: `MOBILE_PARITY_IMPLEMENTATION_PLAN.md`
- Web vs Mobile: `WEB_VS_MOBILE_ANALYSIS.md`
- Architecture: `PROJECT_STRUCTURE.md`

### Key Files to Reference
- Web Vite config: `apps/web/vite.config.ts`
- AGI UI Engine: `apps/web/src/agi_ui_engine/`
- Native WebRTC: `apps/native/src/hooks/call/useWebRTC.ts`
- Payment system: `apps/web/src/components/payments/`

### Team Contacts
- Lead Developer: [Name]
- DevOps: [Name]
- QA: [Name]
- Product: [Name]

---

## ✅ Definition of Done

### Feature Complete
- Code written and reviewed
- Tests added (≥95% coverage)
- TypeScript errors: 0
- Linting warnings: 0
- Documentation updated
- Security reviewed
- Performance tested

### Deployment Ready
- All tests passing
- Build succeeds
- Staging tested
- Rollback plan ready
- Monitoring configured
- Team notified

---

**Start Date**: TBD  
**Target Web Launch**: Week 3  
**Target Mobile Launch**: Week 7  
**Document Owner**: Engineering Lead  
**Last Updated**: 2025-11-09
