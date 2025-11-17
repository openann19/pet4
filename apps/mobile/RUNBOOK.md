# Mobile App Runbook

Production runbook for PetSpark Mobile app deployments, troubleshooting, and operations.

## Table of Contents

1. [Build Numbers and Versioning](#build-numbers-and-versioning)
2. [Release Process](#release-process)
3. [Rollback Plan](#rollback-plan)
4. [Smoke Test Checklist](#smoke-test-checklist)
5. [Troubleshooting Guide](#troubleshooting-guide)
6. [Monitoring and Alerts](#monitoring-and-alerts)

## Build Numbers and Versioning

### Version Format

- Format: `MAJOR.MINOR.PATCH` (e.g., `1.0.0`)
- Location: `apps/mobile/app.config.ts` -> `version` field
- EAS automatically increments build numbers for production builds

### Build Number Tracking

- iOS: Managed by App Store Connect (auto-increments)
- Android: Managed by Google Play Console (versionCode in build.gradle)
- EAS Build: Tracks build numbers per platform

### Current Version

- Version: `1.0.0` (check `app.config.ts` for current version)
- Last Build: Check EAS dashboard or CI/CD logs

## Release Process

### Pre-Release Checklist

1. **Code Quality**
   - [ ] All tests pass: `pnpm ci`
   - [ ] TypeScript checks pass: `pnpm typecheck`
   - [ ] Lint checks pass: `pnpm lint`
   - [ ] No console.\* calls in production code
   - [ ] All environment variables documented

2. **Configuration**
   - [ ] `EXPO_PUBLIC_API_URL` set to production URL
   - [ ] `EXPO_PUBLIC_EAS_PROJECT_ID` set to actual project ID
   - [ ] Bundle identifiers verified (iOS: `com.petspark.mobile`, Android: `com.petspark.mobile`)
   - [ ] Signing keys configured in EAS

3. **Build**
   - [ ] Run `expo prebuild --clean` before native builds
   - [ ] EAS build succeeds for both platforms
   - [ ] Artifacts archived in secure storage

4. **Store Submission**
   - [ ] App Store Connect submission prepared
   - [ ] Google Play Console submission prepared
   - [ ] Store listings updated (screenshots, descriptions)
   - [ ] Privacy policy and terms of service updated

### Release Steps

1. **Create Release Candidate**

   ```bash
   # Update version in app.config.ts
   # Commit and tag
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

2. **Build Release Candidates**

   ```bash
   # Build for iOS
   pnpm build:eas:ios --profile production

   # Build for Android
   pnpm build:eas:android --profile production
   ```

3. **Run Smoke Tests**
   - Follow [Smoke Test Checklist](#smoke-test-checklist)
   - Document results

4. **Submit to Stores**

   ```bash
   # Submit to iOS App Store
   pnpm submit:ios --profile production

   # Submit to Google Play
   pnpm submit:android --profile production
   ```

5. **Monitor Release**
   - Monitor crash-free sessions (target: ≥99.9%)
   - Review analytics dashboards
   - Check error logs
   - Monitor user feedback

## Rollback Plan

### Emergency Rollback

If critical issues are detected after release:

1. **Immediate Actions**
   - [ ] Identify issue severity and impact
   - [ ] Notify team and stakeholders
   - [ ] Document issue details

2. **Rollback Options**

   **Option 1: Rapid Rollback (Same Version)**
   - Pull previous build from App Store/Play Store
   - Submit previous version as emergency update
   - Estimated time: 1-2 hours (store review dependent)

   **Option 2: Hotfix Release**
   - Create hotfix branch
   - Fix critical issue
   - Build and submit hotfix (version: `1.0.1`)
   - Estimated time: 2-4 hours

   **Option 3: Disable Feature (If Applicable)**
   - Use feature flags to disable problematic feature
   - Push server-side config update
   - Estimated time: 5-10 minutes

3. **Post-Rollback**
   - [ ] Document rollback reason
   - [ ] Create incident report
   - [ ] Plan fix and re-release
   - [ ] Update runbook with lessons learned

### Rollback Contacts

- **Engineering Lead**: [Contact Info]
- **DevOps**: [Contact Info]
- **Product Manager**: [Contact Info]

## Smoke Test Checklist

### Pre-Release Smoke Tests

Perform these tests on real Android and iOS hardware before each release:

#### Navigation

- [ ] App launches successfully
- [ ] Navigation between screens works
- [ ] Bottom navigation bar functions correctly
- [ ] Deep links work (if applicable)
- [ ] Back button/gesture works on Android

#### Authentication

- [ ] Sign up flow works
- [ ] Sign in flow works
- [ ] Sign out works
- [ ] Token refresh works
- [ ] Session persistence works

#### Core Features

- [ ] Pet matching/swiping works
- [ ] Adoption application submission works
- [ ] Community post creation works
- [ ] Chat messages send/receive works
- [ ] Image uploads work

#### KYC Verification

- [ ] Sumsub KYC flow initiates
- [ ] KYC handoff to Sumsub SDK works
- [ ] KYC status updates correctly
- [ ] KYC errors handled gracefully

#### Offline Support

- [ ] App works offline (cached data)
- [ ] Offline indicator shows when disconnected
- [ ] Queued actions sync when online
- [ ] Upload queue processes when online

#### Performance

- [ ] App starts in < 2 seconds
- [ ] Screens load smoothly (60 FPS)
- [ ] No memory leaks (monitor for 5 minutes)
- [ ] Battery usage acceptable

#### Accessibility

- [ ] Screen reader works (VoiceOver/TalkBack)
- [ ] Dynamic Type scaling works
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets are ≥ 44×44pt

### Post-Release Smoke Tests

Perform these tests 24 hours after release:

- [ ] Crash-free sessions ≥ 99.9%
- [ ] No critical errors in logs
- [ ] User feedback reviewed
- [ ] Analytics data normal
- [ ] Performance metrics within targets

## Troubleshooting Guide

### Common Issues

#### App Crashes on Launch

**Symptoms**: App crashes immediately after launch

**Possible Causes**:

- Missing environment variables
- Native module not properly linked
- Signing/keychain issues

**Resolution**:

1. Check logs: `eas build:list` -> View build logs
2. Verify environment variables: Check `.env` file
3. Run prebuild: `expo prebuild --clean`
4. Check native modules: Verify all modules are properly installed

#### API Requests Failing

**Symptoms**: Network requests return errors

**Possible Causes**:

- `EXPO_PUBLIC_API_URL` not set
- API endpoint incorrect
- Authentication token expired
- Network connectivity issues

**Resolution**:

1. Verify `EXPO_PUBLIC_API_URL` is set correctly
2. Check API client logs: `apps/mobile/src/utils/api-client.ts`
3. Verify authentication token: Check SecureStore
4. Test API endpoint directly: Use curl or Postman

#### Upload Queue Not Processing

**Symptoms**: Uploads stuck in queue

**Possible Causes**:

- Network connectivity issues
- Upload endpoint incorrect
- Max retries exceeded
- Storage issues

**Resolution**:

1. Check upload queue status: `getUploadQueueStatus()`
2. Verify network connectivity
3. Check upload endpoint: Verify endpoint URL
4. Clear failed uploads: `clearFailedUploads()`

#### KYC Flow Not Working

**Symptoms**: Sumsub KYC SDK not launching

**Possible Causes**:

- Sumsub client key not set
- KYC module not properly linked
- SDK initialization failed

**Resolution**:

1. Verify Sumsub key: Check `strings.xml` (Android) or `Info.plist` (iOS)
2. Check KYC module: Verify `KycModule.kt` is properly registered
3. Check logs: Look for KYC SDK errors
4. Verify SDK initialization: Check `configure()` call

### Debug Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]

# Check EAS credentials
eas credentials

# View app config
cat apps/mobile/app.config.ts

# Check environment variables
cat apps/mobile/.env

# Run prebuild
pnpm prebuild

# Check TypeScript
pnpm typecheck

# Run linter
pnpm lint

# Run tests
pnpm test:run
```

## Monitoring and Alerts

### Key Metrics

- **Crash-free Sessions**: Target ≥ 99.9%
- **API Error Rate**: Target < 1%
- **Upload Success Rate**: Target ≥ 95%
- **App Start Time**: Target < 2 seconds
- **Memory Usage**: Monitor for leaks

### Monitoring Tools

- **Crash Reporting**: Sentry (if configured)
- **Analytics**: Custom analytics endpoint
- **Performance**: EAS Build logs, device logs
- **Error Tracking**: Remote logging endpoint

### Alert Thresholds

- **Crash Rate**: Alert if > 1% of sessions
- **API Error Rate**: Alert if > 5% of requests
- **Upload Failure Rate**: Alert if > 10% of uploads
- **Memory Leaks**: Alert if memory usage > 500MB

### Review Schedule

- **T-24h Pre-Launch**: Review all metrics
- **T+24h Post-Launch**: Review crash-free sessions, errors
- **T+48h Post-Launch**: Review user feedback, analytics
- **Weekly**: Review performance metrics, error trends

## Emergency Contacts

- **Engineering Lead**: [Contact Info]
- **DevOps**: [Contact Info]
- **Product Manager**: [Contact Info]
- **QA Lead**: [Contact Info]

## Changelog

- **2025-11-08**: Updated with current status and cross-references
- **2024-01-XX**: Initial runbook created
- Update this section with each release

---

## Important References

For related operational documentation, see:

- [Mobile Production Readiness Checklist](./PRODUCTION_READINESS.md)
- [Web Admin Runbook](../web/RUNBOOK_admin.md)
- [Web Production Readiness](../web/docs/PRODUCTION_READINESS.md)
- [Verification Report](../FINAL_MD_VERIFICATION_REPORT.md)
- [Documentation Audit](../DOCUMENTATION_AUDIT_REPORT.md)

---

## Notes on Current Status

**As of 2025-11-08**:

- Pre-release checklist items need to be completed before production deployment
- TypeScript and ESLint issues identified in verification report must be resolved
- Contact information placeholders must be filled in
- Refer to `FINAL_MD_VERIFICATION_REPORT.md` for list of issues to fix

**Target Production Date**: TBD (after P0 issues resolved)
