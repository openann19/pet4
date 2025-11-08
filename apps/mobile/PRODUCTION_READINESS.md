# Mobile Production Readiness Checklist

**Last Updated**: 2025-11-08  
**Status**: 📋 Working Checklist - In Progress  
**Target Completion**: TBD (after P0 issues resolved)

This checklist captures the critical mobile platform steps that complement the broader readiness guidance tracked in the [canonical readiness report](../../docs/production-readiness.md).

## ⚠️ Prerequisites

Before proceeding with this checklist, ensure all TypeScript and ESLint issues are resolved:
- See [Verification Report](../FINAL_MD_VERIFICATION_REPORT.md) for list of issues
- All TypeScript errors must be fixed (currently: 25 errors)
- ESLint configuration must be corrected
- Test suite must be passing

## Related Documentation

- [Mobile Deployment Runbook](./RUNBOOK.md) - Operational procedures
- [Web Production Readiness](../web/docs/PRODUCTION_READINESS.md) - Web app checklist
- [Web Admin Runbook](../web/RUNBOOK_admin.md) - Admin operations
- [Documentation Audit](../DOCUMENTATION_AUDIT_REPORT.md) - Documentation review
- [Verification Report](../FINAL_MD_VERIFICATION_REPORT.md) - Code verification results

## 1. Build and Delivery Pipeline

### 1.1 Expo/EAS Runner Configuration

- [ ] Configure Expo EAS or CI runners with Node 18+, Java 17, and Android SDK 34.
- [ ] Install workspace dependencies with `pnpm install` (root) and `pnpm install` inside `apps/mobile` for managed caches.
- [ ] Validate TypeScript and lint checks via `pnpm --filter petspark-mobile run typecheck` and `pnpm --filter petspark-mobile run lint`.

### 1.2 Expo Prebuild Configuration

- [ ] Execute `expo prebuild` before generating native release artifacts to ensure the Sumsub KYC module and Gradle wiring are materialized.
- [ ] Install and configure `react-native-mmkv` during prebuild; ensure iOS pods are updated (`npx pod-install`) and Android `MainApplication` initializes `MMKV.initialize()` before use (Expo config plugin handles defaults, but call out manual wiring when ejecting).
- [ ] Run `expo prebuild --clean` before native release builds to ensure native modules are properly configured.
- [ ] Verify prebuild script in package.json: `"prebuild": "expo prebuild --clean"`
- [ ] Verify Sumsub KYC module (`KycModule.kt`) is properly registered in `MainApplication.kt`
- [ ] Verify Gradle dependencies for Sumsub SDK are correctly configured in `android/app/build.gradle`
- [ ] Run `npx pod-install` after prebuild on iOS to ensure native dependencies are linked
- [ ] Document prebuild requirements in CI/CD pipeline

### 1.3 Artifact Archiving

- [ ] Archive signed Android App Bundle (`.aab`) and iOS `.ipa` artifacts per release candidate and store in secure build storage.
- [ ] Document artifact naming convention: `petspark-mobile-{version}-{buildNumber}-{platform}.{aab|ipa}`
- [ ] Configure EAS build to automatically archive artifacts in secure storage:
  - EAS automatically stores build artifacts in expo.dev
  - Download artifacts: `eas build:download [BUILD_ID]`
  - List builds: `eas build:list`
- [ ] Set up CI workflow to archive artifacts per release candidate:
  - Download artifacts from EAS after build
  - Upload to secure storage (e.g., S3, Google Cloud Storage)
  - Tag artifacts with release version and build number
- [ ] Document retention policy: Keep artifacts for 90 days in active storage, then archive to long-term storage.
- [ ] Document artifact access controls: Only authorized personnel can access build artifacts.
- [ ] Create CI workflow for artifact archiving (see `.github/workflows/mobile-build.yml` if created).

## 2. Signing and Secrets

### 2.1 Android Signing Keys

- [ ] Provision Android upload and app signing keys; register the keystore fingerprints (SHA-1/SHA-256) in all third-party console integrations.
- [ ] Generate/upload Android signing keys via EAS: `eas credentials`
  - Run: `eas credentials` -> Android -> Set up production signing
  - EAS will generate and store keys securely
  - Keys are stored in EAS servers, never committed to git
- [ ] Capture SHA-1/SHA-256 fingerprints: `keytool -list -v -keystore <keystore> -alias <alias>`
  - If using EAS: Fingerprints are shown in EAS dashboard
  - If using local keystore: Run keytool command to get fingerprints
- [ ] Register fingerprints in Firebase Console, Sumsub Console, and other third-party integrations:
  - Firebase Console: Project Settings -> Your apps -> Add fingerprint
  - Sumsub Console: App settings -> Android -> Add SHA fingerprint
  - Google Play Console: App signing -> App signing key certificate
- [ ] Document key rotation process: Rotate keys every 180 days, update fingerprints in all consoles:
  - Generate new signing key
  - Update fingerprints in all third-party consoles
  - Update EAS credentials
  - Document rotation date in security change log

### 2.2 Sumsub KYC Client Keys

- [ ] Capture the Sumsub client key in the secure secret manager and update `android/app/src/main/res/values/strings.xml` during CI (never commit secrets).
- [ ] Store Sumsub client key in CI secrets vault (e.g., GitHub Secrets, EAS Secrets):
  - Secret name: `SUMSUB_CLIENT_KEY`
  - Never commit the actual key to git
  - Current placeholder in `strings.xml`: `CHANGE_ME_IN_PRODUCTION`
- [ ] Update `android/app/src/main/res/values/strings.xml` to inject Sumsub key during CI builds:
  - Use CI environment variable substitution
  - Replace `CHANGE_ME_IN_PRODUCTION` with actual key from secrets vault
  - Example: `sed -i 's/CHANGE_ME_IN_PRODUCTION/${SUMSUB_CLIENT_KEY}/g' android/app/src/main/res/values/strings.xml`
- [ ] Document Sumsub key injection process in CI workflow:
  - Add step to inject key before build
  - Verify key is injected (not placeholder) in production builds
  - Add validation script to check key is set
- [ ] Add validation to ensure Sumsub key is present in production builds:
  - Check that `strings.xml` does not contain `CHANGE_ME_IN_PRODUCTION`
  - Fail build if key is not set in production
- [ ] Verify KycModule is properly registered in `MainApplication.kt`:
  - Check `KycPackage()` is added to packages list
  - Verify `KycModule.kt` is in correct package: `com.pawfectmatch`

### 2.3 EAS Credentials and Store API Keys

- [ ] Store Expo EAS credentials (`eas credentials`), Apple App Store Connect API keys, and Google Play API service accounts in the secrets vault referenced by CI.
- [ ] Document EAS credentials storage: Store in EAS Secrets or CI secrets vault.
- [ ] Document App Store Connect API key storage: Store in CI secrets vault with key ID and issuer ID.
- [ ] Document Google Play API service account: Store JSON key file in CI secrets vault.
- [ ] Rotate credentials at least every 180 days and document key rotations in the security change log.

### 2.4 Environment Variables

- [ ] Create `.env.example` with client-safe defaults (see environment variables section below).
- [ ] Document required environment variables:
  - `EXPO_PUBLIC_API_URL` (required): Production API URL (must be HTTPS in production)
  - `EXPO_PUBLIC_EAS_PROJECT_ID` (required): EAS Project ID from expo.dev
  - `EXPO_PUBLIC_ANALYTICS_ENDPOINT` (optional): Analytics endpoint, defaults to `/api/analytics/events`
  - `EXPO_PUBLIC_BUILD_ID` (optional): Build ID for tracking, defaults to `dev`
  - `EXPO_PUBLIC_ENABLE_HOLO_BG` (optional): Enable holo background, defaults to `true`
  - `EXPO_PUBLIC_ENABLE_MESSAGE_PEEK` (optional): Enable message peek, defaults to `true`
  - `EXPO_PUBLIC_ENABLE_SMART_IMAGE` (optional): Enable smart image, defaults to `true`
  - `EXPO_PUBLIC_ERROR_ENDPOINT` (optional): Error reporting endpoint, defaults to `/api/errors`
- [ ] Ensure CI injects production URLs before release builds.
- [ ] Validate `EXPO_PUBLIC_API_URL` is set and HTTPS in production builds.

## 3. Store Readiness and Compliance

- [ ] Run through platform store checklists (content rating, privacy policy, screenshots, contact details) ahead of submission windows.
- [ ] Attach the latest moderation + KYC verification policy PDFs in both store listings; ensure references match the shared domain behavior.
- [ ] Validate push notification texts, onboarding copy, and paywall flows in both English and Bulgarian for localization parity.
- [ ] Complete the in-app privacy questionnaire and ensure permissions (camera, network, storage) match the manifest declarations.
- [ ] Review crash-free sessions and analytics dashboards 24 hours pre-launch and 48 hours post-launch.

## 4. Operational Verification

- [ ] Execute smoke tests on real hardware (Android + iOS) covering navigation, adoption workflows, community post flows, and Sumsub KYC handoff.
- [ ] Confirm feature-flag parity with the web application via the shared domain layer exports consumed inside the mobile bundle.
- [ ] Update the runbook with the latest release version, build numbers, and rollback plan prior to submission.

Align completion of this checklist with the milestones recorded in the [production readiness overview](../../docs/production-readiness.md) to preserve a single source of truth.
