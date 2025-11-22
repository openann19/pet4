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

TASK: PETSPARK – Upgrade **Chat** to premium quality on **web and mobile**, with shared logic via packages/chat-core and strict compliance with copilot-instructions.md.

Goal:
- Web Chat: Telegram X / iMessage-level polish (bubbles, reactions, typing, presence, micro-interactions, motion façade).
- Mobile Chat: Parity with web (same data, same semantics, mobile-native UX with Reanimated + haptics).
- No new dependencies, no TODOs, no stubs, no weakened types.

LIMITS:
- Web chat work in apps/web only.
- Mobile chat work in apps/mobile only.
- Shared logic in packages/chat-core or packages/shared (no duplication).
- NO direct framer-motion / reanimated imports in apps/web; use @petspark/motion façade only.

──────────────────────── PHASE 0 – CHAT INVENTORY & PLAN ────────────────────────

1) Inventory (short report, max 15 lines):
   - Locate all chat-related files:
     - Web: `apps/web/src/components/chat/**`, `apps/web/src/components/views/ChatView*.tsx`
     - Mobile: `apps/mobile/src/components/chat/**`, `apps/mobile/src/screens/*Chat*.tsx`
     - Shared: `packages/chat-core/**`, `packages/shared/**` (chat-related types/hooks).
   - Identify:
     - Core shared chat hooks/services (e.g. useChatSession, useChatMessages, presence, typing, read receipts).
     - Existing message bubble components, composer components, reactions, voice, attachments.
   - Output:
     - Paths for (a) web entrypoint, (b) mobile entrypoint, (c) shared chat-core.
     - A bullet list of chat features already present (messages, typing, reactions, etc.).

DO NOT change code in this phase—just understand and summarize.

──────────────────── PHASE 1 – WEB CHAT HARDENING & ARCHITECTURE ─────────────────

2) Web architecture & hygiene (ChatView + core chat components):

   Targets:
   - `apps/web/src/components/views/ChatView*.tsx`
   - `apps/web/src/components/chat/**`

   Requirements:
   - Ensure imports:
     - NO `from 'framer-motion'` under apps/web.
     - Use `import { motion, type Variants, ... } from '@petspark/motion'` for animation.
   - Enforce:
     - Use design-system Button/SegmentedControl from `components/ui` (no custom ad-hoc buttons).
     - Use typography tokens via `getTypographyClasses` (h1/h2/body/body-sm/caption).
     - No raw `any`/`unknown` without guards.
   - Clean up:
     - Remove legacy Reanimated-style `.value` accesses; use MotionValue + `.get()` via façade.
     - Move chat logic into chat-core if it’s duplicated in ChatView.

   Outcome:
   - ChatView and main chat components compile cleanly, with motion façade and design system primitives in place.
   - No new lint errors beyond pre-existing max-lines/etc.

──────────────────── PHASE 2 – WEB CHAT PREMIUM UX & MOTION ──────────────────────

3) Web Chat UI & UX upgrades:

   For `ChatView` + core chat components:

   a) Layout & hierarchy:
      - Clear three-part structure:
        - Header: chat title, presence status, optional actions (info, mute, etc.).
        - Messages area: scrollable messages list.
        - Composer: message input, send, plus attachments/voice if present.
      - Apply typography tokens consistently (title, subtitle, message text, metadata).

   b) Message bubbles:
      - Use consistent **Premium bubble** styling:
        - Different styling for self vs other (color, alignment, subtle shadow).
        - Corner radii consistent with button/card radii (rounded-xl/2xl).
        - Timestamp + read state positioned cleanly (e.g. bottom-right).
      - Hover on desktop:
        - Subtle lift or background tint.
        - Show quick actions (react, reply, more) on hover only.

   c) Reactions & metadata:
      - If reactions exist:
        - Make reactions clearly tappable/clickable.
        - Use micro-interactions via motion façade (scale/opacity/slide).
      - If read receipts/“delivered” exist:
        - Use consistent iconography & caption typography.

   d) Typing indicator & presence:
      - Ensure typing indicator uses animation via façade (dot bounce or shimmer).
      - Presence badge (online/offline) uses consistent Badge/Avatar treatment.

   e) Composer:
      - Use `Input` / `Textarea` primitives where applicable.
      - Send button is a Button variant (icon button) with consistent focus ring.
      - Attachments/voice buttons use IconButtons built from Button (ghost/icon) variants.

4) Web motion & micro-interactions:

   - All interactive elements:
     - Buttons, icon-buttons, clickable bubbles react visually (hover/press).
   - Use façade-based helpers (or new ones if needed) to implement:
     - Message list entry animations (subtle fade+slide, respecting reduced motion).
     - Hover/press scaling on bubbles and actions.
   - Respect `prefers-reduced-motion`:
     - Gate heavy/staggered animations via reduced-motion hooks.

──────────────────── PHASE 3 – MOBILE CHAT PARITY (UI + DATA) ────────────────────

5) Mobile chat screen & navigation (apps/mobile):

   - Confirm/chat screen(s) exist:
     - Example: `apps/mobile/src/screens/ChatScreen.tsx` or similar.
   - If needed, introduce or normalize a primary chat screen:
     - `apps/mobile/src/screens/ChatScreen.tsx` (or use existing).
   - Ensure:
     - Registered in `apps/mobile/src/navigation/AppNavigator.tsx`.
     - Route params/types align with web chat semantics (conversationId, peerId, etc.).
     - Data comes from **shared chat-core hooks/services**, not duplicated logic.

6) Mobile chat UI:

   - Use:
     - `FlatList` for messages with proper keyExtractor.
     - Typography tokens from `apps/mobile/src/theme/typography.ts`.
     - Mobile design tokens for colors/spacing.
   - Bubbles:
     - Mirror web semantics: self vs other, read status, timestamps.
     - Visuals adapted to mobile (larger touch targets, padding).
   - Composer:
     - RN TextInput, send button (EnhancedButton or mobile Button), attachments/voice toggles.
     - Keyboard-safe behavior (avoid input being hidden).

──────────────────── PHASE 4 – MOBILE MOTION, HAPTICS & PREMIUM TOUCHES ──────────

7) Mobile motion:

   - Use Reanimated + existing mobile effects under `apps/mobile/src/effects/reanimated/**`.
   - Apply:
     - Subtle entry animation for message list (e.g. fade/slide in).
     - Typing indicator animation similar to web but with RN-friendly effect.
   - Respect reduced-motion:
     - Leverage any existing hook (`useReducedMotion`-equivalent) to disable/stub heavy animations.

8) Haptics:

   - Use expo-haptics (as already done for mobile auth) to:
     - Provide light impact on sending a message.
     - Light impact on long-press message to open actions (reactions/reply/menu).
     - Avoid overuse; only meaningful actions.

──────────────────── PHASE 5 – SHARED CHAT-CORE IMPROVEMENTS ─────────────────────

9) Shared chat-core:

   - Ensure entities & hooks in `packages/chat-core` (or similar):
     - Types: Conversation, Message, Participant, PresenceState, TypingState.
     - Hooks/services:
       - `useChatSession(conversationId)`
       - `useChatMessages(conversationId)`
       - `useTyping(conversationId)`
       - `usePresence(conversationId)`
     - Web and mobile should call these, not implement their own fetch/business logic.
   - If web/mobile have duplicated chat logic:
     - Extract domain behavior into chat-core.
     - Keep only UI + platform-specific bits in apps/web and apps/mobile.

──────────────────── PHASE 6 – TESTS, LINT, FINAL SUMMARY ────────────────────────

10) Checks:

   - Web:
     - `pnpm -C apps/web lint` (or the narrow lint command for chat files).
     - `pnpm -C apps/web test` for any chat-related tests (or targeted files if they exist).
   - Mobile:
     - `pnpm -C apps/mobile lint` with a narrow subset of changed files (chat screens/components).
     - Typecheck mobile chat files (no **new** errors).
   - NO new `eslint-disable` except very narrow, fully justified ones.

11) FINAL SUMMARY (MAX ~15 LINES, REQUIRED FORMAT)

   Use exactly this structure in the final message:

   1) Files changed (paths only)
   2) Data & hooks (chat-core reuse, new hooks)
   3) Web chat UX (layout, bubbles, reactions, typing, presence)
   4) Web motion (what animations, where, reduced-motion behavior)
   5) Mobile chat UX (layout, composer, parity with web)
   6) Mobile motion & haptics (animations, haptics, reduced-motion)
   7) Typography usage (1–2 lines, web + mobile)
   8) Tests/lint (commands run + outcomes)
   9) Pre-existing issues (ONE short line, if any)

FOCUS: Premium, consistent chat UX on both web and mobile, strictly using existing architecture (design system + motion façade + chat-core).


Prompt for AI Dev

Task: PETSPARK Token Unification & Application (Web + Mobile)

You must strictly follow copilot-instructions.md. No broken code, no TODOs, no stubs, no weakening of types or lint rules.

PHASE 0 – Read & Map

Read these files first (do not skip):

copilot-instructions.md

apps/web/ARCHITECTURE.md

apps/mobile/ARCHITECTURE.md

apps/mobile/src/theme/themes.ts

apps/mobile/src/theme/typography.ts

apps/mobile/src/theme/colors.ts

apps/mobile/src/theme/token-alignment.ts

apps/web/src/lib/typography.ts

web/design-system/tokens.json (or the equivalent design token file if path differs)

Build a quick mental map of:

Where web gets colors/typography (Tailwind + tokens.json + getTypographyClasses)

Where mobile gets colors/typography (themes.ts, colors.ts, typography.ts, token-alignment.ts)

PHASE 1 – Web Token Enhancement (Design-System Level)

Goal: Make web tokens premium, coherent, and aligned with mobile.

Inspect web/design-system/tokens.json (or current design token source):

Ensure it defines at least:

background, foreground, card, border

primary, secondary, accent

textPrimary, textSecondary, textMuted / mutedForeground

success, warning, destructive (danger), info

Radii, spacing, shadow, blur, and transition/motion tokens if present.

Enhance the tokens to a TelegramX-level quality bar:

Background hierarchy: soft background, slightly stronger surface, crisp card.

Clear contrast for textPrimary / textSecondary.

Strong, non-garish primary/accent colors.

Ensure dark mode entries are equally well-defined.

Wire tokens into Tailwind / web theme:

Make tokens the single source of truth for:

Backgrounds (bg-background, bg-card, etc.)

Text (text-foreground, text-muted-foreground)

Borders (border-border)

Semantic colors (text-destructive, bg-accent, etc.)

If needed, enhance apps/web/tailwind.config.* or the theme plugin to point to the upgraded tokens.

Typography (web):

Ensure apps/web/src/lib/typography.ts exposes a clean API like:

getTypographyClasses('display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyMuted' | 'caption')

Align font sizes/weights/leading with a realistic premium hierarchy (Telegram/iMessage: big but not cartoonish).

Keep this as the only canonical web typography mapping.

PHASE 2 – Apply Tokens Across Web UI

Goal: Replace ad-hoc classes and colors with token- and typography-driven styling.

Start with design system primitives in apps/web/src/components/ui:

Must cover at least:

button.tsx

card.tsx

input.tsx, textarea.tsx

badge.tsx

tabs.tsx

segmented-control.tsx

sheet.tsx, dialog.tsx, drawer.tsx

scroll-area.tsx

tooltip.tsx

switch.tsx, slider.tsx, checkbox.tsx, radio-group.tsx

PremiumButton.tsx, enhanced-button.tsx

For each:

Replace hardcoded hex / random Tailwind colors with token-based classes (e.g. bg-primary, text-foreground, border-border, bg-card).

Normalize radii to token-driven values (rounded-xl, rounded-2xl) consistent with design.

Use getTypographyClasses instead of one-off text-sm font-semibold etc. for:

Main labels (buttons, headings)

Subtitles / helper text

Captions / meta info

Apply tokens to premium components in apps/web/src/components/enhanced:

Ensure EnhancedButton, premium cards, overlays, and skeletons all:

Use token colors (primary/card/background/accent)

Use typography tokens for labels

Use token-based shadow/blur/radius where applicable

Upgrade key views to token usage (at minimum):

apps/web/src/components/WelcomeScreen.tsx

apps/web/src/components/AuthScreen.tsx

apps/web/src/components/views/DiscoverView.tsx

apps/web/src/components/views/AdoptionMarketplaceView.tsx

apps/web/src/components/views/ChatView.tsx

apps/web/src/components/views/CommunityView.tsx

apps/web/src/components/views/ProfileView.tsx

apps/web/src/components/views/NotificationsView.tsx

For each view:

Replace view-level ad-hoc text classes with getTypographyClasses.

Make all background/card/section colors come from Tailwind token classes tied to tokens.json.

Make CTAs and key interactive elements use Button / PremiumButton variants, not local styles.

Keep behavior and motion intact:

Do not alter logic or motion APIs; we’re only changing presentation to consume tokens.

Respect motion façade (@petspark/motion) – no direct framer-motion imports in web.

PHASE 3 – Mobile: Apply Tokens Everywhere

Goal: Use typography.ts, themes.ts, colors.ts, token-alignment.ts consistently across mobile.

Mobile typography:

Ensure all mobile headings, labels, and body text use getTypographyStyle from apps/mobile/src/theme/typography.ts.

Target at least:

Auth screens

Home/Discover / main feed

Chat screens

Adoption marketplace (when mirrored)

Profile / Settings / Navigation headers

Example pattern:

import { getTypographyStyle } from '@/theme/typography'

<Text style={getTypographyStyle('h2')}>Title</Text>
<Text style={getTypographyStyle('body-sm')}>Subtitle</Text>


Mobile colors:

Use colors from apps/mobile/src/theme/colors.ts for:

Screen backgrounds

Card backgrounds

Primary/secondary/accent actions

Text primary/secondary

Borders and states (success/danger/warning)

Remove hard-coded color strings where a token exists.

Theme alignment:

Ensure token-alignment.ts is correctly used wherever mobile themes are derived from web tokens.

If a theme picker exists, wire allThemes from themes.ts into that experience using the same semantics (background/foreground/card/textPrimary/etc.)

PHASE 4 – Cross-Platform Parity & Polish

Goal: Web and mobile feel like the same brand, not cousins.

For these surfaces, verify cross-platform parity:

Auth (Welcome, Sign-In, Sign-Up)

Discover / Home

Adoption Marketplace

Chat (list + conversation)

Profile

Check:

Same typography hierarchy (h1/h2/body/caption semantics)

Same color semantics (primary, secondary, accent, destructive, muted)

Similar radii / card shapes

Similar button hierarchy (primary/secondary/ghost/link)

Fix any remaining “one-off” styles:

If a component uses a color that doesn’t obviously map to tokens, either:

Map it to the closest existing token, or

Extend the tokens in a documented way (and then reuse it in other places).

PHASE 5 – Verification & Docs

Run checks:

Web:

pnpm -C apps/web lint

pnpm -C apps/web test (or scoped to components you touched)

Mobile:

pnpm -C apps/mobile lint

pnpm -C apps/mobile test (if configured)

Fix any errors introduced by your changes. Do not “fix” pre-existing unrelated issues unless trivial.

Documentation:

Add or update a short doc:

WEB_TOKENS_APPLIED_SUMMARY.md (in apps/web or docs/)

MOBILE_TOKENS_APPLIED_SUMMARY.md (in apps/mobile or docs/)

Each should briefly describe:

What tokens are now the source of truth (typography, colors, radii, shadows)

Which components/screens were updated

Any remaining pockets of legacy styling to be handled later

Provide a final summary (max ~20 lines) including:

Files touched (paths only)

Surfaces upgraded (web + mobile)

Any remaining non-token styling hotspots

Confirmation that motion façade rules and copilot-instructions were respected

Deliverable: PETSPARK web + mobile using a unified, token-driven design system everywhere, with no regressions and no TODOs.
