# ✅ Production Readiness Checklist

**Purpose**: Master checklist for production deployment  
**Format**: Copy to project management tool (Jira/Asana/GitHub Issues)  
**Last Updated**: 2025-11-09

---

## 🔴 PHASE 0: Critical Blockers (Week 1)

### P0.1: AGI UI Engine Import Fix (2-4 hours)
- [ ] **Assess**: Verify file naming mismatch (kebab vs camel)
- [ ] **Decide**: Choose rename files OR update imports
- [ ] **Execute**: Rename 18 effect files to camelCase
  - [ ] use-ai-reply-aura.tsx → useAIReplyAura.tsx
  - [ ] use-typing-trail.tsx → useTypingTrail.tsx
  - [ ] use-bubble-glow.tsx → useBubbleGlow.tsx
  - [ ] use-delete-burst.tsx → useDeleteBurst.tsx
  - [ ] use-reaction-particle-trail.tsx → useReactionParticleTrail.tsx
  - [ ] use-message-shimmer.tsx → useMessageShimmer.tsx
  - [ ] use-mood-color-theme.tsx → useMoodColorTheme.tsx
  - [ ] use-mood-theme.tsx → useMoodTheme.tsx
  - [ ] use-glass-background.tsx → useGlassBackground.tsx
  - [ ] use-3d-tilt-effect.tsx → use3DTiltEffect.tsx
  - [ ] use-dynamic-background-mesh.tsx → useDynamicBackgroundMesh.tsx
  - [ ] use-emoji-trail.tsx → useEmojiTrail.tsx
  - [ ] use-particle-burst-on-send.tsx → useParticleBurstOnSend.tsx
  - [ ] use-particle-burst-on-delete.tsx → useParticleBurstOnDelete.tsx
  - [ ] use-particle-fx.tsx → useParticleFX.tsx
  - [ ] use-sentiment-mood-engine.tsx → useSentimentMoodEngine.tsx
  - [ ] use-adaptive-bubble-shape.tsx → useAdaptiveBubbleShape.tsx
  - [ ] use-sound-feedback.tsx → useSoundFeedback.tsx
- [ ] **Test**: Run typecheck, verify 0 errors from agi_ui_engine
- [ ] **Verify**: Manual test of chat animations
- [ ] **Commit**: "Fix AGI UI Engine import/export naming mismatch"

**Success Criteria**: TypeScript errors reduced by 36

---

### P0.2: expo-file-system Web Polyfill (4-6 hours)
- [ ] **Understand**: Review expo-file-system usage in image-engine.ts
- [ ] **Create**: Add stubExpoFileSystemPlugin to vite.config.ts
- [ ] **Register**: Add plugin to plugin array
- [ ] **Test**: Run build, verify success
- [ ] **Alternative**: Consider refactoring to use File API instead
- [ ] **Document**: Add comment explaining web limitation
- [ ] **Commit**: "Add expo-file-system web polyfill plugin"

**Success Criteria**: `pnpm build` completes without errors

---

### P0.3: TypeScript Error Fixes (2-3 days)

#### P0.3a: Admin Test Fixes (6 hours)
- [ ] **Analyze**: Review useStorage return type
- [ ] **Fix Option 1**: Update useStorage to return 3-element tuple
- [ ] **Fix Option 2**: Update test expectations to 2-element
- [ ] **Files**:
  - [ ] apps/web/src/components/admin/__tests__/AdminLayout.test.tsx
  - [ ] apps/web/src/components/admin/__tests__/UsersView.test.tsx
- [ ] **Test**: Run tests, verify all pass
- [ ] **Commit**: "Fix admin test tuple type mismatches"

**Success Criteria**: Admin tests pass, 0 type errors

---

#### P0.3b: Adoption Component Fixes (2 hours)
- [ ] **Pattern**: Add null checks before element operations
- [ ] **Files**:
  - [ ] apps/web/src/components/adoption/__tests__/AdoptionFiltersSheet.test.tsx
- [ ] **Fix**: Use `element!` or add null guard
- [ ] **Test**: Run tests, verify pass
- [ ] **Commit**: "Fix adoption component null safety"

**Success Criteria**: Adoption tests pass, 5 errors resolved

---

#### P0.3c: Chat Component Fixes (6 hours)
- [ ] **Fix ChatErrorBoundary**:
  - [ ] Remove incorrect override modifier from state
  - [ ] Add override to render() if needed
  - [ ] Verify extends React.Component properly
- [ ] **Fix ChatHeader**:
  - [ ] Add null check for string | undefined parameter
  - [ ] Update type signature if needed
- [ ] **Fix LiveRegions**:
  - [ ] Fix .click() on Element (use HTMLElement)
  - [ ] Fix KeyboardEvent type conversion
- [ ] **Files**:
  - [ ] apps/web/src/components/chat/window/ChatErrorBoundary.tsx
  - [ ] apps/web/src/components/chat/window/ChatHeader.tsx
  - [ ] apps/web/src/components/chat/window/LiveRegions.tsx
- [ ] **Test**: Run tests, verify pass
- [ ] **Commit**: "Fix chat component TypeScript errors"

**Success Criteria**: Chat tests pass, 15+ errors resolved

---

#### P0.3d: Type Definition Fixes (4 hours)
- [ ] **Fix TypingUser interface**:
  - [ ] Align with actual usage (userId, userName, startedAt)
  - [ ] Update all usages
- [ ] **Fix Reaction types**:
  - [ ] Make MessageReaction[] compatible with Record<>
  - [ ] Update usage in VirtualMessageList
- [ ] **Fix Virtualizer callback**:
  - [ ] Update measureElement type signature
  - [ ] Return number instead of void
- [ ] **Files**:
  - [ ] apps/web/src/components/chat/window/MessageList.tsx
  - [ ] apps/web/src/components/chat/window/VirtualMessageList.tsx
- [ ] **Test**: Run typecheck, verify pass
- [ ] **Commit**: "Fix chat type definitions"

**Success Criteria**: Message components compile without errors

---

#### P0.3e: Environment Variable Fix (1 hour)
- [ ] **Replace**: process.env.NODE_ENV with import.meta.env.MODE
- [ ] **File**: apps/web/src/core/config/performance-budget.config.ts
- [ ] **Test**: Verify env detection works
- [ ] **Commit**: "Fix environment variable usage in web"

**Success Criteria**: Consistent env handling

---

#### P0.3f: Mobile TypeScript Fixes (2 hours)
- [ ] **Fix SwipeCard typo**:
  - [ ] Change .photo to .photos
  - [ ] File: apps/mobile/src/components/swipe/SwipeCard.tsx
- [ ] **Fix UIContext index signature**:
  - [ ] Add proper index signature to AbsoluteMaxUIModeConfig
  - [ ] File: apps/mobile/src/contexts/UIContext.tsx
- [ ] **Fix useStorage test**:
  - [ ] Update to match async return type
  - [ ] File: apps/mobile/src/hooks/__tests__/use-storage.test.ts
- [ ] **Fix FeedScreen MapView**:
  - [ ] Update type conversion
  - [ ] File: apps/mobile/src/screens/FeedScreen.tsx
- [ ] **Fix motion package**:
  - [ ] Add react-native-gesture-handler stub or conditional
  - [ ] File: packages/motion/src/recipes/useMagnetic.ts
- [ ] **Test**: Run typecheck, verify pass
- [ ] **Commit**: "Fix mobile TypeScript errors"

**Success Criteria**: Mobile app compiles without errors

---

### P0.4: Verification (2 hours)
- [ ] **Build Web**: `cd apps/web && pnpm build`
- [ ] **Build Mobile**: `cd apps/mobile && pnpm build`
- [ ] **Typecheck All**: `pnpm typecheck`
- [ ] **Lint All**: `pnpm lint`
- [ ] **Test All**: `pnpm test`
- [ ] **Manual Test**: Run both apps, verify functionality
- [ ] **Document**: Update PRODUCTION_STATUS.md

**Success Criteria**: All checks pass, apps run locally

---

## 🟡 PHASE 1: Quality & Testing (Week 2)

### P1.1: Test Coverage Analysis (8 hours)
- [ ] **Run Web Coverage**: `cd apps/web && pnpm test:cov`
- [ ] **Run Mobile Coverage**: `cd apps/mobile && pnpm test:cov`
- [ ] **Analyze Results**:
  - [ ] Identify files <95% coverage
  - [ ] List untested critical paths
  - [ ] Document gap areas
- [ ] **Create Report**: TEST_COVERAGE_REPORT.md
- [ ] **Prioritize**: High-value paths first
- [ ] **Commit**: "Add test coverage analysis report"

**Success Criteria**: Know exact coverage %, have improvement plan

---

### P1.2: Add Critical Path Tests (16 hours)

#### Payment Flow Tests (4 hours)
- [ ] Test subscription signup
- [ ] Test payment processing
- [ ] Test billing failure handling
- [ ] Test subscription cancellation
- [ ] Test payment method updates

#### User Flow Tests (4 hours)
- [ ] Test user registration
- [ ] Test login/logout
- [ ] Test profile updates
- [ ] Test match interactions
- [ ] Test chat messaging

#### Error Handling Tests (4 hours)
- [ ] Test network errors
- [ ] Test API failures
- [ ] Test invalid input
- [ ] Test edge cases
- [ ] Test error boundaries

#### Integration Tests (4 hours)
- [ ] Test E2E user journey
- [ ] Test critical business flows
- [ ] Test data consistency
- [ ] Test concurrent operations

**Success Criteria**: Coverage ≥95%

---

### P1.3: Security Audit (8 hours)

#### OWASP Top 10 Review
- [ ] **Injection**: Check SQL/NoSQL/Command injection
- [ ] **Authentication**: Verify auth flows secure
- [ ] **Sensitive Data**: Check data exposure risks
- [ ] **XXE**: Review XML parsing (if any)
- [ ] **Access Control**: Verify authorization
- [ ] **Security Config**: Review headers, CORS, CSP
- [ ] **XSS**: Check input sanitization
- [ ] **Deserialization**: Review data parsing
- [ ] **Components**: Check dependency vulnerabilities
- [ ] **Logging**: Verify no sensitive data logged

#### Tools & Scans
- [ ] Run `pnpm audit`
- [ ] Run Snyk scan
- [ ] Run eslint-plugin-security
- [ ] Manual code review
- [ ] Penetration testing (if budget allows)

#### Documentation
- [ ] Create SECURITY_AUDIT_REPORT.md
- [ ] Document findings
- [ ] Create remediation plan
- [ ] Track critical fixes

**Success Criteria**: No critical vulnerabilities, documented report

---

## 🟢 PHASE 2: Web Deployment (Week 3)

### P2.1: Performance Testing (8 hours)
- [ ] **Lighthouse Audit**: Score ≥90 on all metrics
- [ ] **Core Web Vitals**:
  - [ ] LCP <2.5s
  - [ ] FID <100ms
  - [ ] CLS <0.1
- [ ] **Bundle Analysis**:
  - [ ] Main bundle <500KB
  - [ ] Code splitting effective
  - [ ] Tree shaking working
- [ ] **Load Testing**:
  - [ ] 100 concurrent users
  - [ ] 1000 requests/min
  - [ ] <2s response time
- [ ] **Document**: PERFORMANCE_REPORT.md

**Success Criteria**: All benchmarks met

---

### P2.2: Deployment Setup (8 hours)
- [ ] **Choose Hosting**: Vercel/Netlify/AWS/Custom
- [ ] **Configure Domains**: DNS, SSL
- [ ] **Environment Variables**: All secrets configured
- [ ] **CDN Setup**: Static assets cached
- [ ] **Database**: Verify production DB ready
- [ ] **API Endpoints**: Verify production URLs
- [ ] **Monitoring**:
  - [ ] Error tracking (Sentry)
  - [ ] Analytics (Google/Mixpanel)
  - [ ] Uptime monitoring
  - [ ] Performance monitoring
- [ ] **CI/CD**: Automated deployments
- [ ] **Rollback Plan**: Document procedure

**Success Criteria**: Infrastructure ready

---

### P2.3: Staging Deployment (4 hours)
- [ ] **Deploy to Staging**
- [ ] **Smoke Test**:
  - [ ] User registration
  - [ ] Login/logout
  - [ ] Create profile
  - [ ] Browse matches
  - [ ] Send message
  - [ ] Payment flow
  - [ ] Admin panel
- [ ] **Load Test**: Verify performance
- [ ] **Security Test**: Verify SSL, headers
- [ ] **Bug Fixes**: Fix any issues found
- [ ] **Team Review**: Get approval

**Success Criteria**: Staging fully functional

---

### P2.4: Production Deployment (4 hours)
- [ ] **Final Checklist Review**
- [ ] **Backup Database**: Before deployment
- [ ] **Deploy to Production**
- [ ] **Verify Deployment**:
  - [ ] Health check passes
  - [ ] All pages load
  - [ ] API responding
  - [ ] Monitoring active
- [ ] **Smoke Test Production**:
  - [ ] Test critical paths
  - [ ] Verify payments work
  - [ ] Check analytics tracking
- [ ] **Monitor Closely**: First 24 hours
- [ ] **Document**: Update PRODUCTION_STATUS.md

**Success Criteria**: Production live and stable

---

## 🔵 PHASE 3: Mobile Phase 1 (Weeks 4-6)

### P3.1: Payment System (Week 4, 40 hours)

#### Day 1-2: UI Components (16 hours)
- [ ] Create PricingModal.native.tsx
- [ ] Create SubscriptionStatusCard.native.tsx
- [ ] Create BillingIssueBanner.native.tsx
- [ ] Create PaymentMethodSelector.native.tsx
- [ ] Style components (match web design)
- [ ] Add navigation integration
- [ ] Test UI responsiveness

#### Day 3-4: API Integration (16 hours)
- [ ] Port payments-api.ts to mobile
- [ ] Integrate Stripe/payment SDK
- [ ] Implement subscription flow
- [ ] Add receipt validation (iOS/Android)
- [ ] Error handling
- [ ] Offline queue
- [ ] Test API calls

#### Day 5: Testing (8 hours)
- [ ] E2E payment flow test
- [ ] Test upgrade/downgrade
- [ ] Test cancellation
- [ ] Test restore purchases
- [ ] Test error scenarios
- [ ] App Store receipt validation
- [ ] Play Store billing verification

**Success Criteria**: Payments functional, revenue enabled

---

### P3.2: Video Calling (Week 5, 40 hours)

#### Day 1-2: Port from Native (16 hours)
- [ ] Copy useWebRTC.ts from native to mobile
- [ ] Copy CallInterface.tsx
- [ ] Copy VideoQualitySettings.tsx
- [ ] Copy type definitions
- [ ] Update imports/paths
- [ ] Resolve dependency differences
- [ ] Test compilation

#### Day 3: Dependencies (8 hours)
- [ ] Install react-native-webrtc
- [ ] Configure iOS native modules
- [ ] Configure Android native modules
- [ ] Test camera/mic permissions
- [ ] Verify WebRTC works
- [ ] Test STUN/TURN servers

#### Day 4: UI Integration (8 hours)
- [ ] Add call button to match screen
- [ ] Add incoming call notification
- [ ] Add call history
- [ ] Add call controls UI
- [ ] Test navigation flow
- [ ] Polish animations

#### Day 5: Testing (8 hours)
- [ ] Test 1-on-1 calling
- [ ] Test audio/video toggle
- [ ] Test camera switch
- [ ] Test reconnection
- [ ] Test different network conditions
- [ ] Test battery usage
- [ ] Performance optimization

**Success Criteria**: Video calling works reliably

---

### P3.3: Stories Completion (Week 6, 40 hours)

#### Day 1-2: Story Creation (16 hours)
- [ ] Create StoryCreator.native.tsx
- [ ] Create StoryEditor.native.tsx
- [ ] Add camera integration
- [ ] Add filters/stickers
- [ ] Add text overlay
- [ ] Create StoryPreview.native.tsx
- [ ] Test creation flow

#### Day 3: Story Viewing (8 hours)
- [ ] Create StoryViewer.native.tsx
- [ ] Add swipe navigation
- [ ] Create StoryProgressBar.native.tsx
- [ ] Create StoryControls.native.tsx
- [ ] Add tap zones (prev/next/pause)
- [ ] Test viewing flow

#### Day 4: Highlights & Backend (8 hours)
- [ ] Complete SaveToHighlightDialog.tsx
- [ ] Create HighlightViewer.native.tsx
- [ ] Create HighlightManager.native.tsx
- [ ] Integrate 24h expiration
- [ ] Add upload/download
- [ ] Add view tracking
- [ ] Test persistence

#### Day 5: Testing & Polish (8 hours)
- [ ] Test full story lifecycle
- [ ] Test expiration logic
- [ ] Test highlights
- [ ] Performance optimization
- [ ] Animation polish
- [ ] Bug fixes

**Success Criteria**: Stories feature complete

---

## ✅ Final Verification

### Pre-Launch Checklist
- [ ] All P0 issues resolved
- [ ] All P1 issues resolved
- [ ] All P2 issues resolved
- [ ] All P3 issues resolved (if doing mobile)
- [ ] Test coverage ≥95%
- [ ] Security audit clean
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Monitoring configured
- [ ] Team trained
- [ ] Support ready

### Launch Day Checklist
- [ ] Backup all data
- [ ] Deploy to production
- [ ] Smoke test critical paths
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] Monitor user feedback
- [ ] Ready for hotfixes
- [ ] Team on standby

### Post-Launch (24 hours)
- [ ] Monitor dashboards
- [ ] Address critical issues
- [ ] User feedback review
- [ ] Performance analysis
- [ ] Error rate analysis
- [ ] Revenue tracking
- [ ] Document learnings

---

## 📊 Success Metrics

### Technical Metrics
- [ ] Build time <2 minutes
- [ ] TypeScript errors = 0
- [ ] Test coverage ≥95%
- [ ] Lighthouse score ≥90
- [ ] Bundle size <500KB
- [ ] API response time <500ms

### Business Metrics
- [ ] Web uptime ≥99.9%
- [ ] Mobile uptime ≥99.5%
- [ ] Error rate <1%
- [ ] User satisfaction ≥4.5 stars
- [ ] Revenue tracking active
- [ ] Conversion rate tracked

---

**Document Owner**: Engineering Lead  
**Last Review**: 2025-11-09  
**Next Review**: After Phase 0 completion  
**Status**: Ready to execute
