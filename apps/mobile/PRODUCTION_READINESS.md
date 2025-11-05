# Mobile Production Readiness Checklist

This checklist captures the critical mobile platform steps that complement the broader readiness guidance tracked in the [canonical readiness report](../../docs/production-readiness.md).

## 1. Build and Delivery Pipeline

- [ ] Configure Expo EAS or CI runners with Node 18+, Java 17, and Android SDK 34.
- [ ] Install workspace dependencies with `pnpm install` (root) and `pnpm install` inside `apps/mobile` for managed caches.
- [ ] Validate TypeScript and lint checks via `pnpm --filter petspark-mobile run typecheck` and `pnpm --filter petspark-mobile run lint`.
- [ ] Execute `expo prebuild` before generating native release artifacts to ensure the Sumsub KYC module and Gradle wiring are materialized.
- [ ] Archive signed Android App Bundle (`.aab`) and iOS `.ipa` artifacts per release candidate and store in secure build storage.

## 2. Signing and Secrets

- [ ] Provision Android upload and app signing keys; register the keystore fingerprints (SHA-1/SHA-256) in all third-party console integrations.
- [ ] Capture the Sumsub client key in the secure secret manager and update `android/app/src/main/res/values/strings.xml` during CI (never commit secrets).
- [ ] Store Expo EAS credentials (`eas credentials`), Apple App Store Connect API keys, and Google Play API service accounts in the secrets vault referenced by CI.
- [ ] Rotate credentials at least every 180 days and document key rotations in the security change log.

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
