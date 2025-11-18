# Strict ESLint Baseline (7 Nov 2025)

We re-ran the repository-wide lint suite immediately after dropping in the new zero-tolerance ESLint configuration. All diagnostics were captured to `logs/lint-baseline.log` via the command below so the findings are reproducible:

```bash
pnpm lint > logs/lint-baseline.log 2>&1 || true
```

The strict run surfaced **28,287 diagnostics** across **81 unique rules**. **515 parsing errors** stem from files that are not yet wired into any `tsconfig.json`, so type-aware linting cannot resolve them. The remaining **27,772 rule violations** fall into the categories shown in the table.

## Category Breakdown

| Category | Violations | Representative rules | Notes |
| --- | ---: | --- | --- |
| Unsafe types & any | 9,939 | `@typescript-eslint/no-unsafe-member-access`, `no-unsafe-assignment`, `no-unsafe-call`, `no-unsafe-return`, `no-unsafe-argument`, `no-explicit-any`, `restrict-template-expressions`, `no-non-null-assertion` | Error-handling paths pass raw `unknown/error` through controllers/services; chat/mobile UI also leans on implicit `any` payloads and template strings. |
| Strict booleans & conditionals | 9,437 | `@typescript-eslint/strict-boolean-expressions`, `no-unnecessary-condition`, `no-confusing-void-expression`, `no-unnecessary-type-conversion` | Most backend controllers and screening flows still rely on loose truthiness checks for nullable ids, strings, and objects. |
| Baseline JS correctness | 4,020 | `no-undef`, `no-prototype-builtins`, `no-cond-assign`, `no-empty`, `no-useless-escape` | Global scripts (`.dangerfile.ts`, GH scripts) and several React Native modules reference globals that the stricter parser now bans. |
| Unused or dead code | 1,329 | `@typescript-eslint/no-unused-vars`, `no-unused-vars` | Error handlers and analytics adapters frequently capture unused parameters; strict config now treats them as hard failures. |
| Legacy / deprecated APIs | 1,494 | `@typescript-eslint/no-deprecated` | Prisma/React Native deprecated APIs remain in matchmaking, telephony, and animation helpers. |
| Async & promises | 406 | `@typescript-eslint/require-await`, `no-floating-promises`, `no-misused-promises` | Backend controllers, chat hooks, and Expo effects launch promises without awaits or error funnels. |
| React hooks | 286 | `react-hooks/exhaustive-deps`, `react-hooks/rules-of-hooks` | Chat composer, adoption filters, and video call hooks miss stable dependencies or call hooks conditionally. |
| General / other | 861 | Long tail of 73 additional rules | Includes `@typescript-eslint/no-unnecessary-type-constraint`, `@typescript-eslint/prefer-nullish-coalescing`, accessibility rules, and stylistic guards not yet triaged. |
| Parser / project wiring | 515 | N/A | Files such as `.dangerfile.ts`, `.github/scripts/spec-pr-comment.ts`, `MEDIA_EDITOR_EXAMPLES.tsx`, and other root utilities are not referenced by any TS project, so the parser cannot build type information. |

## Top Violations

1. `@typescript-eslint/strict-boolean-expressions` – 6,094 occurrences
2. `@typescript-eslint/no-unsafe-member-access` – 3,509
3. `no-undef` – 3,478
4. `@typescript-eslint/no-unsafe-assignment` – 3,052
5. `@typescript-eslint/no-unnecessary-condition` – 2,269
6. `@typescript-eslint/no-unsafe-call` – 1,522
7. `@typescript-eslint/no-deprecated` – 1,494
8. `@typescript-eslint/restrict-template-expressions` – 1,033
9. `no-unused-vars` (ESLint core) – 810
10. `@typescript-eslint/no-confusing-void-expression` – 712
11. `@typescript-eslint/no-unused-vars` – 519
12. `@typescript-eslint/no-unsafe-return` – 417
13. `@typescript-eslint/no-unnecessary-type-conversion` – 362
14. `@typescript-eslint/no-unsafe-argument` – 175
15. `@typescript-eslint/no-floating-promises` – 145

These top rules align directly with the strictness goals: tighten nullish handling, eradicate unsafe error propagation, and guarantee deterministic async pipelines.

## Suppression Inventory

### `eslint-disable`

Source files currently relying on lint suppressions that must be removed during remediation:

- `apps/mobile/src/lib/iap-service.ts` – 39 suppressions for unsafe type usage around IAP bridge payloads.
- `apps/web/src/components/chat/MessageBubble.tsx` – file-level `max-lines-per-function` disable to keep the monolithic bubble renderer alive.
- `apps/web/src/components/chat/hooks/useMessageBubble.ts` – similar `max-lines-per-function` disable for the hook.
- `apps/web/src/components/chat/window/hooks/useAdvancedChatWindowProps.ts` – disables `@typescript-eslint/no-floating-promises`.
- `apps/web/src/pages/ChatDemoPage.tsx` – file-level `max-lines-per-function`.
- `apps/web/src/contexts/__tests__/ThemeContext.test.tsx` and `apps/web/src/lib/__tests__/design-tokens.test.ts` – targeted suppressions for unsafe test fixtures.

More than 60 additional `eslint-disable` comments live only in log or documentation artifacts (e.g., historical progress reports) and can be ignored for remediation purposes.

### `@ts-ignore`

The search returned matches exclusively in documentation (`apps/web/REFACTORING_VERIFICATION.md`, `PROJECT_TEMPLATE.md`, etc.). **No production TypeScript file under `apps/*` or `packages/*` uses `@ts-ignore`**, which means we must keep it that way while fixing the strict errors.

### `@ts-expect-error`

Two real code paths still rely on `@ts-expect-error`:

- `apps/mobile/src/effects/reanimated/use-swipe-reply.ts` – gesture bridge dealing with non-typed Reanimated internals.
- `apps/web/src/lib/monitoring/__tests__/performance-monitor.test.ts` – forcing timer mocks.

The remaining matches are in documentation, TODO trackers, or log archives.

## God Components (>200 LOC)

### Screens (`apps/mobile/src/screens`)

| Lines | File |
| ---: | --- |
| 497 | `apps/mobile/src/screens/AdoptionMarketplaceScreen.tsx`
| 427 | `apps/mobile/src/screens/FeedScreen.tsx`
| 348 | `apps/mobile/src/screens/EffectsPlaygroundScreen.tsx`
| 285 | `apps/mobile/src/screens/HomeScreen.tsx`
| 278 | `apps/mobile/src/screens/ChatScreen.tsx`
| 246 | `apps/mobile/src/screens/AdoptionScreen.tsx`
| 241 | `apps/mobile/src/screens/WelcomeScreen.tsx`
| 240 | `apps/mobile/src/screens/MatchesScreen.tsx`
| 225 | `apps/mobile/src/screens/LiveStreamScreen.tsx`
| 221 | `apps/mobile/src/screens/CallScreen.tsx`
| 215 | `apps/mobile/src/screens/MatchingScreen.tsx`

Each of these screens mixes data fetching, business logic, and rendering; they need to be decomposed into hooks plus presentational subcomponents during Phase 2.

### Components (`apps/mobile/src/components`)

| Lines | File |
| ---: | --- |
| 918 | `components/PetDetailDialog.native.tsx`
| 674 | `components/call/CallInterface.tsx`
| 622 | `components/stories/SaveToHighlightDialog.tsx`
| 588 | `components/chat/MessageBubble.tsx`
| 588 | `components/adoption/AdoptionListingCard.tsx`
| 528 | `components/payments/PricingModal.tsx`
| 527 | `components/stories/StoryFilterSelector.tsx`
| 522 | `components/chat/window/ChatInputBar.tsx`
| 482 | `components/enhanced/SmartSkeleton.tsx`
| 461 | `components/auth/SignUpForm.native.tsx`
| 436 | `components/enhanced/NotificationCenter.tsx`
| 405 | `components/search/PremiumControlStrip.tsx`
| 391 | `components/camera/camera-view.tsx`
| 388 | `components/enhanced/DetailedPetAnalytics.tsx`
| 384 | `components/payments/PaymentMethodSelector.tsx`
| 382 | `components/auth/SignInForm.tsx`
| 382 | `components/ui/Dialog.tsx`
| 373 | `components/chat/MessageAttachments.tsx`
| 371 | `components/enhanced/EnhancedPetDetailView.tsx`
| 369 | `components/adoption/PremiumControlStrip.tsx`
| 366 | `components/enhanced/forms/PremiumSelect.tsx`
| 345 | `components/enhanced/forms/PremiumInput.tsx`
| 334 | `components/enhanced/EnhancedButton.tsx`
| 327 | `components/call/VideoQualitySettings.tsx`
| 316 | `components/chat/ChatList.tsx`
| 315 | `components/call/IncomingCallNotification.tsx`
| 311 | `components/search/FilterChips.tsx`
| 309 | `components/stories/StoryViewer.native.tsx`
| 305 | `components/enhanced/navigation/Stepper.tsx`
| 302 | `components/enhanced/AdvancedFilterPanel.tsx`
| 298 | `components/enhanced/SmartSearch.tsx`
| 294 | `components/adoption/FilterChips.tsx`
| 285 | `components/BottomNavBar.tsx`
| 275 | `components/enhanced/navigation/PremiumTabs.tsx`
| 273 | `components/payments/BillingIssueBanner.tsx`
| 263 | `components/gdpr/DataRightsScreen.tsx`
| 260 | `components/swipe/SwipeCard.tsx`
| 259 | `components/enhanced/buttons/SplitButton.tsx`
| 254 | `components/enhanced/display/PremiumAvatar.tsx`
| 253 | `components/media-editor/UploadAndEditScreen.tsx`
| 249 | `components/stories/StoriesBar.native.tsx`
| 247 | `components/enhanced/EnhancedCarousel.tsx`
| 246 | `components/adoption/SearchBar.tsx`
| 245 | `components/chat/AdvancedChatWindow.tsx`
| 239 | `components/playdates/PlaydateCard.native.tsx`
| 237 | `components/verification/DocumentUploadCard.native.tsx`
| 231 | `components/enhanced/navigation/PremiumToast.tsx`
| 230 | `components/chat/ConfettiBurst.tsx`
| 228 | `components/enhanced/buttons/SegmentedControl.tsx`
| 226 | `components/enhanced/FloatingActionButton.tsx`
| 224 | `components/chat/TypingIndicator.tsx`
| 223 | `components/billing/SubscriptionStatusCard.native.tsx`
| 222 | `components/compliance/AgeVerification.tsx`
| 216 | `components/enhanced/forms/PremiumSlider.tsx`
| 206 | `components/visuals/PresenceAuroraRing.native.tsx`
| 204 | `components/enhanced/overlays/PremiumModal.tsx`

These files should be decomposed into data hooks, shared primitives, and design-token-driven presentational units as part of the "god component" remediation track.

## Immediate Next Steps

- Update the root `tsconfig.json` references (and per-app configs) so the parser can find `.dangerfile.ts`, `MEDIA_EDITOR_EXAMPLES.tsx`, and other root scripts; this will remove 515 parsing errors.
- Prioritize unsafe type remediation within backend controllers and mobile chat services—fixing those modules alone will burn down roughly 60% of the violations.
- Remove the high-impact `eslint-disable` directives (IAP service, chat MessageBubble stack) by decomposing the modules and adding focused tests.
- Re-run `pnpm lint --max-warnings 0` after each cluster of fixes and keep this document updated until the violation count reaches zero.
