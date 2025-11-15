# PETSPARK – AI / Copilot Instructions

These rules apply to **all AI-driven edits** (Copilot, Cursor, Windsurf AI, etc.) in this repository.

**Goal:** Production-grade, type-safe, visually **premium** PETSPARK apps (web + mobile + native) with:

- **Zero red squiggles** (no TypeScript errors)
- **No stubs / TODOs**
- **Stable performance & UX parity** across platforms

---

## 0. TL;DR (Golden Rules)

1. **Do not leave broken code**
   - No TypeScript errors.
   - No failing lint/tests for the scope you touched.

2. **No stubs, no fake work**
   - Do **not** add:
     - `TODO` comments
     - Dummy implementations
     - Fake data (outside of clearly marked tests/fixtures)
     - Huge commented-out blocks as “future work”

3. **Respect architecture & docs**
   - Before editing an area, scan relevant docs in that app/package:
     - `ARCHITECTURE*.md`
     - `MIGRATION_*.md`
     - `*_SUMMARY.md`, `*_REPORT.md`
     - `PRODUCTION_READINESS_*.md`, `PERFORMANCE_*`, etc.

4. **Reuse existing pieces**
   - Prefer:
     - Hooks in `apps/**/src/hooks`
     - UI primitives in `apps/web/src/components/ui`
     - Premium UI in `apps/web/src/components/enhanced`
     - Motion façade in `packages/motion` (imported as `@petspark/motion`)

5. **Keep UX consistent**
   - If you change a shared pattern (buttons, tabs, segmented controls, cards, typography, micro-interactions):
     - Apply the same pattern across **all** relevant screens (or clearly mark follow-ups).
   - Do not introduce “one-off” styles that only exist in a single corner.

6. **Never weaken quality**
   - Do not:
     - Loosen types
     - Globally disable ESLint rules
     - Bypass runtime safety, security, or telemetry helpers

7. **Respect the surface you were asked to touch**
   - “Web only” → do **not** edit `apps/mobile` or `apps/native`.
   - “Mobile only” → do **not** edit `apps/web`.
   - Cross-surface edits must be explicit and documented.

---

## 1. Monorepo Map (What Lives Where)

Understand the layout before generating code.

### Root

- Tooling & policy
  - `eslint.config.js`
  - `tsconfig.base.json`
  - `pnpm-workspace.yaml`
  - Discipline & quality:  
    `TYPE_AND_LINT_DISCIPLINE.md`, `PRODUCTION_READINESS_*.md`, `SECURITY*.md`, `TESTING_*`, etc.
- AI / process docs
  - `copilot-instructions.md` (this file)
  - Motion migration: `FRAMER_MOTION_MIGRATION.md`
  - Implementation summaries / audits:  
    `IMPLEMENTATION_SUMMARY.md`, `*_SUMMARY.md`, `*_REPORT.md`, `WHAT_IS_LEFT.md`, etc.

### apps/web – Primary Web App (Vite + React)

- `apps/web/src/components`
  - `ui/` – design-system primitives  
    (`button`, `input`, `dialog`, `sheet`, `tabs`, `segmented-control`, `badge`, `scroll-area`, `switch`, `slider`, etc.)
  - `enhanced/` – premium UI  
    (enhanced cards, premium buttons, overlays, smart skeletons, toasts, notification center, etc.)
  - `views/` – page-level screens  
    (`DiscoverView`, `AdoptionMarketplaceView`, `ChatView`, `CommunityView`, `MatchesView`, `ProfileView`, `NotificationsView`, etc.)
  - Feature folders:  
    `adoption/`, `stories/`, `community/`, `media-editor/`, `lost-found/`, `playdate/`, `health/`, `verification/`, etc.
- `apps/web/src/effects`
  - Web micro-interactions & FX.
  - `effects/reanimated/**` → **legacy** layer, being migrated to the Framer façade (see `FRAMER_MOTION_MIGRATION.md`).
- `apps/web/src/hooks`
  - App-level hooks: discovery, adoption, chat, offline, stories, media, navigation, performance, etc.
- `apps/web/src/lib`
  - Domain logic & utilities:
    - `adoption-*`, `matching`, `analytics`, `realtime`, `payments-*`, `gdpr-service`, `security`, `offline-*`, `telemetry`, `image-*`, etc.

### apps/mobile – Expo React Native App

- `apps/mobile/src/components`, `src/screens`, `src/hooks`, `src/lib`, `src/theme`, `src/navigation`, etc.
- Uses **React Native**, **Reanimated**, and Expo.
- Key docs:
  - `ARCHITECTURE.md`
  - `MOBILE_*`
  - `PERFORMANCE_VALIDATION_GUIDE.md`
  - `ULTRA_CHATFX_CI_GATES.md`
  - `RUNBOOK.md`
  - `MOBILE_RUNTIME_AUDIT_REPORT.md`

### apps/native

- Alternate RN/native variant for experiments.
- For core mobile flows, **prefer `apps/mobile`**.

### apps/backend

- Backend / API integration.
- Don’t sneak UI logic into backend apps.

### packages

- `packages/motion`
  - Motion façade for all platforms.
  - `src/primitives/` – `MotionView`, `MotionText`, `MotionScrollView` with `.web` / `.native` variants.
  - `src/framer-api/` – Framer-style API for web under the hood.
  - **Rule:** web code imports **only** `@petspark/motion`, not raw `framer-motion`.
- `packages/shared`
  - Shared types, guards, storage, logging, utilities.
- `packages/core`
  - Core API client, HTTP glue, schemas.
- `packages/chat-core`
  - Shared chat domain logic / hooks.

### docs/

- Cross-cutting docs:
  - Architecture
  - UX audits
  - Production readiness checklists
  - Runtime audit reports
  - Web/mobile parity guides

When unsure: **copy the closest existing pattern in the same folder** instead of creating a new pattern.

---

## 2. Core Coding Standards

### 2.1 TypeScript & ESLint

- **Strict TS only**
  - No `any` unless:
    - Very tightly scoped
    - Immediately wrapped in a type guard
- ESLint:
  - Do **not** add global `eslint-disable`.
  - If you must disable:
    - Do it on a **single line**
    - For **one rule**
    - With a short justification comment

- File size / complexity:
  - Long view components must be split into:
    - Subcomponents (`*Header`, `*BasicTab`, `*MediaTab`, `*AdvancedTab`, etc.)
    - Hooks in `apps/**/src/hooks`
  - Never relax complexity/length rules; refactor instead.

### 2.2 Async & Promises

- No unhandled promises:
  - Use `await`, or `void someAsync().catch(...)`.
- Event handlers:
  - On failure, surface via:
    - Toasts
    - Logging
    - Error boundaries
- Prefer typed API clients:
  - `apps/web/src/lib/api-*`, `packages/core`, etc.
  - Avoid ad-hoc `fetch` unless it’s clearly justified.

---

## 3. Premium UI System – Global Rules (Web)

This is what separates “student project” from **Telegram X / iMessage-level** polish.

### 3.1 Buttons – Single Source of Truth

**All buttons must go through** `apps/web/src/components/ui/button.tsx` (or `PremiumButton` where explicitly needed).

Rules:

- Variants:
  - `primary`, `secondary`, `outline`, `ghost`, `destructive`, `link`
- Radii:
  - Use a **single radius token** (e.g. `rounded-xl`) for main CTAs.
- Focus:
  - Consistent focus ring:
    - `focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2`
- Typography:
  - CTAs use a shared typography scale:
    - `font-medium text-sm` or `text-base` via typography tokens.

**Do not:**

- Hand-roll random `<button>` styles with their own borders/shadows.
- Create mini button variants per-screen.

If an existing variant is slightly off for a use case → **extend the variant system**, don’t bypass it.

### 3.2 SegmentedControl – Top-Level Mode Switching

All **top-level mode switches** in web views must use:

- `apps/web/src/components/ui/segmented-control.tsx`

Examples:

- Adoption view mode toggles
- Notifications filter (All / Unread)
- Top-level view mode switches in Discover, Community, Lost & Found, etc.

Rules:

- SegmentedControl is for **primary mode switching**.
- Deep **configuration tabs inside sheets/dialogs** (like Discovery filter subtabs) still use `Tabs`.

When adding a new top-level mode toggle → use `SegmentedControl`, not raw tabs.

### 3.3 Typography – Shared Scale, No Freelancing

Typography is a **central premium signal**.

Use a shared typography token file (e.g. `packages/core/src/tokens/typography.ts`), something like:

```ts
export const typography = {
  display: 'text-4xl font-bold tracking-tight',
  h1: 'text-3xl font-bold',
  h2: 'text-2xl font-semibold',
  h3: 'text-xl font-semibold',
  body: 'text-base font-normal',
  bodyMuted: 'text-base text-muted-foreground',
  caption: 'text-sm text-muted-foreground',
} as const;
Mapping guidelines:

View titles → h2

Section headings → h3

Body text → body

Explanatory text → bodyMuted

Metadata, captions → caption

Vertical rhythm (defaults):

Title → subtitle: mt-1

Subtitle → controls: mt-4

Section spacing: consistent mt-6 / mt-8 for bigger blocks.

Do not randomly pick text-[15px], mt-3.5, etc. if the design system already has a proper token/utility.

3.4 Cards – Premium Treatment, Not Flat Admin

Use premium card patterns in:

Adoption cards

Match cards

Story cards

Community / feed cards

Rules:

Use a premium card component (e.g. PremiumCard in components/enhanced):

rounded-2xl

Soft gradient / glass surface

Consistent image aspect ratio (3:4 or 4:3)

Clear hierarchy: title → key attributes → tags → CTA

Motion:

Hover lift (scale(1.02), subtle shadow)

Staggered entry for grids via shared motion utilities.

If a grid of cards looks flat / “admin panel”, you’ve broken the rule.

3.5 Micro-Interaction Policy – “If It’s Clickable, It Moves”

Every interactive element must react.

Baseline rules:

Element	Required Interaction
Primary buttons	Press animation (tap scale)
Secondary buttons	Hover + focus feedback
Cards	Hover lift + subtle glow/shadow
Tabs	Animated indicator / underline
Icon buttons	Hover scale ~1.05 + focus ring
Images in cards	Smooth fade/scale on hover/entry

Implementation:

Use hooks and components from @petspark/motion and apps/web/src/effects/**.

Respect prefers-reduced-motion (usePrefersReducedMotion) and disable heavy motion when requested.

No dead, static CTAs.

4. Animation & Motion Rules
4.1 Web (apps/web)

Imports:

❌ Do NOT import react-native-reanimated in apps/web.

❌ Do NOT import framer-motion directly in apps/web.

✅ All web motion goes through @petspark/motion.

Patterns:

Motion-enabled components

Use MotionView (from @petspark/motion) / motion wrappers.

Their style prop may contain MotionValues.

Plain DOM elements

Must receive plain CSSProperties, not MotionValues.

Use façade helpers like useAnimatedStyle which convert motion values to CSSProperties.

Strict invariants:

No .value usage in web components.

No direct Reanimated APIs on web.

If you see style={{ transform: ..., something: motionValue }} on a plain <div> → fix it:

Either wrap with MotionView, or

Use façade to map motion values → plain style.

4.2 Legacy effects/reanimated/**

This folder is a compatibility layer.

Do not add new Reanimated-specific helpers.

When you touch it:

Incrementally migrate logic to the façade (@petspark/motion).

Keep its public API stable for existing consumers until the migration doc says otherwise.

4.3 Mobile / Native (apps/mobile, apps/native)

Continue using React Native Reanimated where appropriate.

Performance constraints:

60fps target on scrolls, swipes, chat.

Keep heavy work off the UI thread.

Respect:

MOBILE_ANIMATION_PARITY_COMPLETE.md

PERFORMANCE_VALIDATION_GUIDE.md

ULTRA_CHATFX_CI_GATES.md

Web and mobile animation should feel like the same design language, not different universes.

5. Feature-Level Guidelines (Web)
5.1 Views (apps/web/src/components/views)

Examples: DiscoverView, AdoptionMarketplaceView, ChatView, CommunityView, ProfileView, NotificationsView, etc.

Responsibilities:

Orchestrate hooks + services.

Compose feature components.

Keep view files small and readable.

Patterns:

Extract:

Headers

Tabs (*BasicTab, *AdvancedTab, *MediaTab)

List items / cards

Use:

PageTransitionWrapper for full-page transitions.

Shared motion hooks for list/card animations.

5.2 Adoption Marketplace

Key files:

apps/web/src/components/views/AdoptionMarketplaceView.tsx

apps/web/src/components/adoption/*

apps/web/src/hooks/adoption/use-adoption-filters.ts

apps/web/src/lib/adoption-marketplace-*

Rules:

View:

Uses SegmentedControl for top-level mode switching.

Uses a glassy control bar for search + filters (not a raw form).

Uses premium cards (image-first, consistent aspect ratios).

Logic:

Data loading & filters live in hooks/services:

useAdoptionMarketplace, use-adoption-filters, adoption-marketplace-service.

View is responsible for composition, not business rules.

Filters:

Changes to filters must update:

Filter types in lib/adoption-marketplace-types.ts

use-adoption-filters.ts

Tests in hooks/__tests__/use-adoption-filters.test.ts

5.3 Discovery Filters

Key files:

DiscoveryFilters.tsx

DiscoveryFiltersBasicTab.tsx

DiscoveryFiltersMediaTab.tsx

DiscoveryFiltersAdvancedTab.tsx

discovery-preferences.ts

hooks/use-storage.ts

Rules:

DiscoveryFilters.tsx:

Owns DiscoveryPreferences state.

Persists to storage via useStorage.

Controls the Sheet open/close state.

Tab components:

Receive slices of preferences + onChange handlers.

No direct persistence, no direct global reads.

Types:

DiscoveryPreferences & DEFAULT_PREFERENCES live in a single canonical location.

Reuse between web and mobile where possible.

5.4 Chat & Community

Locations:

Chat:

apps/web/src/components/chat/**

apps/web/src/components/views/ChatView.tsx

packages/chat-core

Community:

apps/web/src/components/community/**

CommunityView.tsx

Rules:

Use packages/chat-core:

Do not reimplement chat logic in apps/web if it exists in chat-core.

Community & chat visuals:

Use shared micro-interactions (presence, typing indicators, bubble entry, etc.).

Keep overlays (modals, sheets) fully accessible.

6. Mobile Guidelines (apps/mobile)

When you’re explicitly modifying mobile:

Read:

apps/mobile/ARCHITECTURE.md

MOBILE_* docs

RUNBOOK.md

PERFORMANCE_VALIDATION_GUIDE.md

MOBILE_RUNTIME_AUDIT_REPORT.md

Align with web where sensible:

Use same wording for auth errors, helper texts.

Align button variants (primary vs secondary).

Match key layout hierarchy (title → content → CTA).

Reuse code:

packages/shared and packages/core instead of duplicating logic.

Performance:

Use Reanimated idioms and existing motion hooks.

Avoid heavy synchronous work in render or gesture handlers.

7. Testing & Commands

Use the actual scripts defined in each package.json. The examples below are typical, adjust to match the repo.

7.1 Web (apps/web)

For any change under apps/web:

Minimum:

pnpm -C apps/web lint

pnpm -C apps/web test

Feature-specific tests:

If they exist (e.g. for adoption, discovery, chat), run those explicitly.

Critical flows (auth, onboarding, payments, adoption applications):

Run configured E2E (e.g. Playwright):

pnpm -C apps/web test:e2e or equivalent.

7.2 Mobile (apps/mobile)

pnpm -C apps/mobile lint

pnpm -C apps/mobile test

Detox / E2E scripts when you modify navigation or core flows.

7.3 Shared Packages (packages/*)

pnpm -C packages/motion test

pnpm -C packages/shared test

pnpm -C packages/core test

Do not break existing tests without either:

Fixing them, or

Updating docs to reflect an intentional, agreed behavior change.

8. Process for AI-Driven Changes

Any AI agent (including Copilot-like tools) must follow this loop:

Locate & read context

Find all relevant files:

Components, hooks, services, types.

Read local docs:

ARCHITECTURE*.md, *_SUMMARY.md, *_GUIDE.md, *_REPORT.md, relevant MIGRATION_*.md.

Plan minimal, high-quality edits

Prioritize small, tightly scoped changes:

Fix type errors, runtime bugs, layout glitches.

Extract subcomponents/hooks to reduce complexity.

Avoid large rewrites unless explicitly asked in docs/tasks.

Implement safely

Keep types strict.

Preserve:

Haptics

Analytics

Telemetry

Feature flags

Security/privacy checks

Do not break cross-page flows (auth, navigation, shared filters, chat sessions, etc.).

Run checks

Run the correct pnpm scripts for whatever you touched.

Fix all lint/type/test failures before considering work “done”.

Document behavior changes

If you change:

Auth

Matching

Adoption marketplace

Media editor

Motion stack

Payments, verification, trust & safety

Then:

Add a short note to the closest *_SUMMARY.md / *_GUIDE.md / MIGRATION_*.md.

Summarize & capture visuals

Summarize:

What changed

Why

Follow-ups needed (e.g. “Apply this button style to X and Y views next”)

For UI changes:

Capture updated screenshots for the affected screens and attach to PR / summary.

9. Hard “No” List

Do not:

Introduce new libraries / heavy dependencies without explicit instruction.

Disable:

ESLint

TypeScript checks

Unit tests

E2E tests

Remove or “forget”:

Analytics

Telemetry

Haptics

Downgrade:

Security checks

Privacy / GDPR helpers

Rate limiting

Verification / KYC flows

Bypass the motion façade on web:

No direct framer-motion imports under apps/web.

No react-native-reanimated in web.

By following this document, an AI assistant (or human dev in “AI assist” mode) can:

Fix type and lint issues without collateral damage.

Upgrade and modularize oversized views while keeping UX intact.

Migrate animations to the motion façade cleanly.

Maintain button / typography / interaction consistency across the entire product.

Keep PETSPARK stable, fast, and visually premium across web, mobile, and native.
