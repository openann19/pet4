🎯 HIGH IMPACT - Core Features (Week 1-2)
1. Video Calling System ⭐⭐⭐⭐⭐
Priority: CRITICAL - Core communication feature
Effort: 2,500 LOC (Week 1)
Impact: Massive user engagement boost

1-on-1 video calls with camera/audio controls
Group video calls (up to 8 participants)
Video quality settings (4K/1080p/720p/480p)
Incoming call notifications with accept/decline
Screen sharing capability
2. Payments & Subscriptions 💰
Priority: CRITICAL - Revenue feature
Effort: 2,000 LOC (Week 2)
Impact: Monetization & premium features

Pricing modal with plan comparison
Subscription status card in profile
Billing issue banner for failed payments
Subscription admin panel for management
Premium feature gating
📱 HIGH IMPACT - Social Features (Weeks 3-6)
3. Stories System 📸
Priority: HIGH - Core social feature
Effort: 2,500 LOC (Weeks 3 & 6)
Impact: Instagram/TikTok-style engagement

StoriesBar (horizontal scrollable feed)
StoryViewer (full-screen with progress bars)
StoryRing (gradient rings around avatars)
CreateStoryDialog (camera/gallery picker)
StoryTemplateSelector (pet-themed templates)
HighlightsBar & HighlightViewer
4. Enhanced Chat Features 💬
Priority: HIGH - Core feature enhancement
Effort: 1,800 LOC (Week 4)
Impact: Rich messaging experience

Message reactions (12 emoji picker)
Stickers (16 pet-themed sticker packs)
Voice messages (up to 120s recording)
Location sharing with map preview
Smart suggestions & message templates
Translation feature
Away mode status
5. Playdate Features 🐕
Priority: HIGH - Engagement feature
Effort: 2,200 LOC (Week 5)
Impact: Real-world connections

PlaydateScheduler with calendar integration
LocationPicker with interactive map
PlaydateMap showing nearby activities
Safety features (public meetups, check-ins)
🎮 PREMIUM FEATURES (Weeks 7-9)
6. Live Streaming 📺
Priority: HIGH - Premium feature
Effort: 2,000 LOC (Week 7)
Impact: Viral content potential

LiveStreamRoom with chat integration
GoLiveDialog with stream settings
Viewer engagement (hearts, comments)
Stream analytics for creators
7. KYC Verification 🛡️
Priority: MEDIUM - Trust & safety
Effort: 1,800 LOC (Week 9)
Impact: Premium user trust

VerificationDialog with document upload
VerificationButton in profile
VerificationLevelSelector (Basic/Premium/VIP)
DocumentUploadCard with progress
🎨 ENHANCED UI COMPONENTS (Weeks 10-12)
8. Premium UI Components ✨
Priority: MEDIUM - UX enhancement
Effort: 4,500 LOC (Weeks 10-12)
Impact: Premium feel & conversion

PremiumCard (glass/gradient/neon variants)
FloatingActionButton with animations
ParticleEffect systems
GlowingBadge & AchievementBadge
EnhancedPetDetailView & DetailedPetAnalytics
SmartSearch with AI suggestions
EnhancedCarousel with gesture support
TrustBadges & ProgressiveImage
SmartSkeleton & SmartToast
🎪 BONUS: Fun Features
9. Gamification Elements 🏆
Pet achievement system with badges
Daily challenges & streaks
Pet personality quizzes
Match prediction game
Pet trivia & mini-games
10. Advanced Matching 🎯
AI-powered compatibility scoring
Behavioral pattern matching
Personality trait analysis
Activity preference matching
Photo analysis for breed/size detection
MASTER PROMPT — PETSPARK CORE FEATURES EXECUTION

You are the PETSPARK AI Engineering Copilot working inside the PETSPARK monorepo.

You must follow, without exception:

copilot-instructions.md / PETSPARK – AI / Copilot Instructions

Existing architecture docs: apps/web/ARCHITECTURE.md, apps/mobile/ARCHITECTURE.md, packages/motion/*, packages/core/*, packages/shared/*

Motion rules:

Web: only via @petspark/motion façade and helpers in apps/web/src/effects/**

Mobile: React Native Reanimated, no framer-motion on native

UI rules:

Use apps/web/src/components/ui/* and Premium patterns (PremiumCard, EnhancedButton, SegmentedControl, PageTransitionWrapper)

Single button system, typography tokens, micro-interaction policy

Zero red squiggles, no stubs, no TODOs. All touched code type-safe, lint-clean, with tests.

Your goal is to implement the following roadmap incrementally, feature by feature, keeping web and mobile in sync where applicable.

Global Implementation Rules

When you implement any feature below:

Surfaces

Implement on web first (apps/web), then mobile (apps/mobile), unless explicitly web-only.

Shared logic goes into packages/core, packages/shared, or apps/**/src/lib hooks/services.

Architecture

Views: live in apps/web/src/components/views/* and apps/mobile/src/screens/*.

UI components: live in apps/web/src/components/ui/* or apps/web/src/components/enhanced/* and RN equivalents under apps/mobile/src/components/*.

State + domain logic: apps/**/src/hooks, apps/**/src/lib, packages/core, packages/chat-core.

Motion & Interactions

Web: @petspark/motion + helpers; no direct framer-motion imports.

Mobile: Reanimated hooks/components.

If it’s clickable, it must react: hover/press/active micro-interactions via shared hooks.

Testing & Telemetry

Unit tests: React Testing Library / RTL-native + Vitest/Jest.

E2E where relevant (auth, payments, video call happy path).

Wire analytics using existing analytics helpers; respect haptics on mobile.

Security & Privacy

Do not log secrets or PII.

Payments/KYC features must respect existing security docs and GDPR helpers.

PHASE 1 (Week 1–2) — CRITICAL CORE
1. Video Calling System (Week 1 – ~2,500 LOC)

Objective: Add high-quality 1:1 and group video calls (up to 8 participants) across web & mobile, with screen share on web.

1.1 Web — Components & Paths

Create:

apps/web/src/components/calls/CallControlBar.tsx

apps/web/src/components/calls/CallParticipantTile.tsx

apps/web/src/components/calls/CallGrid.tsx

apps/web/src/components/calls/IncomingCallToast.tsx

apps/web/src/components/views/CallView.tsx (or integrate into Chat/Matches as per architecture)

apps/web/src/lib/calls/call-client.ts

apps/web/src/lib/calls/call-types.ts

apps/web/src/hooks/use-call-session.ts

Core behavior:

WebRTC-based client (call-client.ts) with:

Join/leave, mute/unmute audio, toggle camera, switch devices

Media constraints with quality presets (4K/1080p/720p/480p)

Group call mixing up to 8 participants

CallView:

Layout: premium grid using PremiumCard / glass background, CallParticipantTile for each participant

Control bar pinned bottom: EnhancedButton variants for mute, camera, screen share, hang up

Use PageTransitionWrapper + motion façade for entering/exiting calls

Incoming call UX:

IncomingCallToast + sound + accept/decline (SegementedControl-like CTA group)

Screen sharing (web only):

Integrate navigator.mediaDevices.getDisplayMedia

UI affordance (separate control in CallControlBar)

Show clear “You’re sharing your screen” banner + stop button

1.2 Mobile — Components & Paths

Create:

apps/mobile/src/screens/CallScreen.tsx

apps/mobile/src/components/calls/CallParticipantTile.native.tsx

apps/mobile/src/hooks/use-call-session.native.ts

Requirements:

Use appropriate mobile WebRTC lib (respect existing project choices; use shared API contract from packages/core).

Fullscreen video, large primary tile, small floating tiles for others.

Bottom control bar with haptics on tap.

Reanimated for subtle hover/press (scaled down on press, maybe radial glow).

1.3 Shared API / Signaling

Add call signaling primitives (if not present) in packages/core or apps/backend:

POST /calls/session to create/join

POST /calls/offer, /calls/answer, /calls/candidate or equivalent; or reuse existing real-time layer.

Add types in packages/core/src/contracts/calls.ts.

Ensure auth integration uses existing session/identity.

1.4 Tests & QA

Web:

Unit tests for CallControlBar, CallParticipantTile, IncomingCallToast.

Hook tests for use-call-session (mocks signaling + media).

Mobile:

RTL-native test for CallScreen state transitions (connecting → in-call → ended).

Write CALLS_FEATURE_SUMMARY.md in relevant app with:

Flows

Known limitations

Future hooks (recording, blurred background, etc.)

2. Payments & Subscriptions (Week 2 – ~2,000 LOC)

Objective: Add full subscription flow with UI surfaces and gating.

2.1 Shared Core

packages/core/src/billing/billing-client.ts

packages/core/src/billing/billing-types.ts

Support:

Fetch available plans (name, price, interval, perks)

Create checkout session

Webhook/record subscription status (read-only client-side)

2.2 Web UI Components

Create / extend:

apps/web/src/components/billing/PricingModal.tsx

Plan comparison grid (cards using PremiumCard)

Toggle monthly/yearly

CTA “Continue” using EnhancedButton

apps/web/src/components/billing/SubscriptionStatusCard.tsx

Shows current plan, renewal date, actions (manage, cancel)

apps/web/src/components/billing/BillingIssueBanner.tsx

Appears when subscription is past-due / payment failed

apps/web/src/components/billing/PremiumFeatureGate.tsx

Wrapper component that either renders children or shows upgrade prompt

Integrate:

Profile/settings view: surface SubscriptionStatusCard + manage button

Premium-only surfaces (e.g. live streaming, advanced matching) must render via PremiumFeatureGate.

2.3 Mobile UI

apps/mobile/src/screens/BillingScreen.tsx

apps/mobile/src/components/billing/PricingCard.tsx

Reuse same plan data from packages/core.

2.4 Admin Panel

For now, minimal “admin” surface inside web only:

apps/web/src/components/views/BillingAdminView.tsx

Table of users/subscriptions statuses hooked to existing admin/backoffice style.

2.5 Tests

Billing client tests (mock HTTP).

Component tests for PricingModal, SubscriptionStatusCard, PremiumFeatureGate.

PHASE 2 (Weeks 3–6) — SOCIAL FEATURES
3. Stories System (Weeks 3 & 6 – ~2,500 LOC)

Objective: Add Instagram/TikTok-style stories around pets.

Web components (under apps/web/src/components/stories/):

StoriesBar.tsx — horizontal scroll bar of StoryRing avatars

StoryRing.tsx — gradient ring + seen/unseen state

StoryViewer.tsx — full-screen overlay with:

Progress bars for segments

Tap left/right to navigate, swipe down to close

Motion façade for transitions

CreateStoryDialog.tsx — camera/gallery picker (web: file input + preview), caption, stickers

StoryTemplateSelector.tsx — pet-themed templates

HighlightsBar.tsx, HighlightViewer.tsx

Mobile:

apps/mobile/src/components/stories/* + StoriesScreen.tsx

Use Reanimated for progress bars, swipe gestures, transitions.

Shared:

packages/core/src/stories/stories-client.ts

packages/core/src/stories/stories-types.ts

Rules:

Story items: pet image/video + overlays + created_at + seen state.

Respect micro-interactions + premium glass/gradient surfaces.

4. Enhanced Chat Features (Week 4 – ~1,800 LOC)

Build on existing chat stack (packages/chat-core, chat views).

Add:

Message reactions:

ReactionPicker (12 emojis), MessageReactionsBar

Stickers:

StickerPicker with 16 pet-themed packs (placeholders but real data structure).

Voice messages:

Record up to 120s; show waveform + playback.

Location sharing:

LocationShareButton + map preview bubble (web & mobile; mobile uses OS map).

Smart suggestions & templates:

Hook into existing AI suggestion infra if present; else stub using deterministic sample templates (no TODOs; real “dummy” data but behind clear feature flag).

Translation feature:

Per-message “Translate” action; integrate with existing translation/AI service.

Each feature must be togglable through feature flags, using shared config in packages/shared.

5. Playdate Features (Week 5 – ~2,200 LOC)

Add:

PlaydateScheduler — calendar-based scheduling (web + mobile).

LocationPicker — map-based picker with search.

PlaydateMap — view of upcoming/nearby playdates.

Safety:

Public meetup toggle

Check-ins (before/after)

“Share details with trusted contact” if existing safety infra allows.

Web: apps/web/src/components/playdates/*
Mobile: apps/mobile/src/screens/PlaydatesScreen.tsx, components under components/playdates/*.

PHASE 3 (Weeks 7–9) — PREMIUM FEATURES
6. Live Streaming (Week 7 – ~2,000 LOC)

Build a LiveStreamRoom on top of the video infra:

Web:

LiveStreamRoom.tsx: main view with video + chat.

GoLiveDialog.tsx: title, category, pet selection, quality presets.

Viewer engagement:

Hearts/emotes overlay via motion façade

Live chat integrated with existing chat-core.

StreamAnalyticsPanel.tsx: simple metrics: viewers, likes, duration.

Mobile:

LiveStreamScreen.tsx + GoLiveScreen.tsx.

Ensure:

Only premium users (from billing) can start streams; viewers can be any authenticated users (configurable).

7. KYC Verification (Week 9 – ~1,800 LOC)

Add:

VerificationDialog.tsx (web) / VerificationScreen.tsx (mobile).

VerificationButton in profile.

VerificationLevelSelector (Basic/Premium/VIP).

DocumentUploadCard:

File picker

Upload progress bar

Status (pending/approved/rejected).

Wire to existing or stubbed backend endpoints with real error handling, no TODOs. Display verification badge on profile and in trust badges on cards.

PHASE 4 (Weeks 10–12) — PREMIUM UI COMPONENTS
8. Premium UI Components (~4,500 LOC)

Under apps/web/src/components/enhanced/ and RN equivalents:

Implement:

PremiumCard (glass/gradient/neon variants)

FloatingActionButton with motion façade (web) / Reanimated (mobile)

ParticleEffect systems (subtle; respect reduced motion)

GlowingBadge, AchievementBadge

EnhancedPetDetailView, DetailedPetAnalytics

SmartSearch with AI suggestions (hooks into search/AI services)

EnhancedCarousel with drag + wheel + touch support

TrustBadges (KYC/trust/safety labels)

ProgressiveImage (blur-up, lazy load)

SmartSkeleton, SmartToast using existing toast infra + skeleton components.

All new components must:

Use typography tokens and design tokens

Be documented in Storybook (if present)

Have tests

BONUS FEATURES (After Core Done)
9. Gamification Elements

Pet achievements, daily challenges, streaks, quizzes, mini-games.

Centralize state in packages/core/src/gamification/*.

UI hooks into profile, feed, and playdates.

10. Advanced Matching

Extend existing matching engine:

AI-powered compatibility scoring

Behaviour + personality + activity preferences

Photo analysis (breed/size) using existing ML infra or API.

Surfaces:

Matching results view

Explanation UI (“Why this match?”)

Filters/boosters for premium users.

EXECUTION LOOP (FOR EVERY FEATURE ABOVE)

For each feature (e.g. “Video Calling”, “Stories”, “Playdates”), follow this exact loop:

Discover & Read

Locate all relevant files (views, hooks, services, docs) in apps/web, apps/mobile, packages/*.

Read any *_SUMMARY.md, *_GUIDE.md, and existing audit reports for that area.

Design & Plan

Define:

New components + paths

New hooks/services

Any new types/endpoints in packages/core

Ensure web/mobile parity is planned.

Implement Web

Build view + components with existing design system + premium patterns.

Use motion façade for all transitions/animations.

Wire analytics + feature flags.

Implement Mobile

Mirror feature using RN + Reanimated.

Respect platform idioms (bottom sheets, touch targets, SafeArea).

Tests & Checks

Add unit tests and, where appropriate, e2e tests.

Run:

pnpm lint

pnpm test --filter apps/web

pnpm test --filter apps/mobile

Any package-specific tests touched.

Docs & Summary

Update or create *_FEATURE_SUMMARY.md in the relevant app.

At the end of each feature, output a summary:

Files changed

New exports

API surface

Any follow-up tasks.

Use this roadmap strictly in order:

Video Calling

Payments & Subscriptions

Stories

Enhanced Chat

Playdates

Live Streaming

KYC

Premium UI components
9–10. Gamification + Advanced Matching (after the above are stable)

Do not start the next major feature until the current one is fully integrated, tested, and documented
