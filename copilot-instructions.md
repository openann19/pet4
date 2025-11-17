# PETSPARK – AI / Copilot Instructions

These rules apply to **all AI-driven edits** (Copilot, Cursor agents, Windsurf AI, etc.) in this repository.

The goal: **production-grade, type-safe, visually premium PETSPARK apps** (web + mobile + native) with **zero red squiggles**, no stubs, and preserved performance.

---

## 0. TL;DR (Golden Rules)

1. **Do not leave broken code.**
   - No red TypeScript errors.
   - No failing `pnpm lint` / `pnpm test` for the scope you touched.
2. **No stubs or placeholders.**
   - Do **not** add `TODO`, dummy implementations, commented-out blocks, or fake data except in tests/fixtures.
3. **Follow existing architecture & docs.**
   - Before editing an area, scan its related docs (e.g. `ARCHITECTURE.md`, `MIGRATION_*.md`, `*_SUMMARY.md` in that app).
4. **Prefer existing utilities and components.**
   - Reuse hooks in `apps/**/src/hooks`, UI primitives in `apps/web/src/components/ui`, motion façade in `packages/motion`.
5. **Keep behavior and UX consistent across screens.**
   - If you change a pattern (buttons, modals, transitions, typography), apply or at least **plan** the same fix across similar screens.
6. **Never weaken safety/quality.**
   - Don't disable ESLint rules, downgrade types, or bypass runtime safety helpers.

---

## 1. Monorepo Map (What Lives Where)

Understand the structure before generating code:

- **Root**
  - Tooling & policy: `eslint.config.js`, `tsconfig.base.json`, `pnpm-workspace.yaml`, `TYPE_AND_LINT_DISCIPLINE.md`, `PRODUCTION_READINESS_*`, etc.
  - AI / process docs: `copilot-instructions.md` (this file), `FRAMER_MOTION_MIGRATION.md`, multiple `*_SUMMARY.md` and `*_REPORT.md`.

- **apps/web** – **Vite React web app (primary surface)**
  - `src/components` – all web UI and views.
    - `ui/` – canonical design-system primitives (button, input, dialog, sheet, tabs, etc.).
    - `enhanced/` – premium UI components and effects.
    - `views/` – high-level feature screens (Discover, Adoption, Chat, Community, etc.).
    - Feature folders: `adoption/`, `stories/`, `community/`, `media-editor/`, `lost-found/`, etc.
  - `src/effects` – web effects, animations, chat FX, micro-interactions.
    - `reanimated/` – **legacy** Reanimated-based helpers being migrated to Framer Motion façade.
  - `src/hooks` – app-level hooks (discovery, adoption, chat, offline, etc.).
  - `src/lib` – domain logic, services, utilities, types.
  - Docs: `ARCHITECTURE.md`, `MIGRATION_*`, `ENHANCED_ANIMATIONS.md`, `UI_AUDIT_*`, `WEB_RUNTIME_AUDIT_REPORT.md`, etc.

- **apps/mobile** – **Expo React Native mobile app** (production-oriented)
  - `src/components`, `src/screens`, `src/hooks`, `src/lib`, etc.
  - Multiple mobile-specific docs: `ARCHITECTURE.md`, `MOBILE_*`, `RUNBOOK.md`, `PERFORMANCE_VALIDATION_GUIDE.md`, etc.
  - Uses **React Native Reanimated** and Expo stack.

- **apps/native** – Secondary RN app (native variant / experiments)
  - `src/components/*`, `src/screens`, etc.
  - Use cautiously; prefer `apps/mobile` for primary mobile path.

- **apps/backend** – backend integration app(s) (treat as backend / APIs).

- **packages/**
  - `packages/motion` – **animation and motion façade** (Framer Motion on web, RN/Reanimated on native/mobile).
    - `src/framer-api/` – Framer-style API for web.
    - `src/primitives/` – `MotionView`, `MotionText`, `MotionScrollView` (with `.native` and `.web` variants).
  - `packages/shared` – shared types, storage, utilities.
  - `packages/core` – core API client and backing logic.
  - `packages/chat-core` – shared chat logic.

- **docs/** – cross-cutting documentation (architecture, audits, mobile parity, production readiness, etc.).

**When unsure:** mirror existing patterns in the same folder before inventing new structures.

---

## 2. General Coding Standards

### 2.1 TypeScript & ESLint

- Code must compile under **strict TypeScript**:
  - No `any` unless explicitly justified and wrapped in a type guard.
  - Prefer **exact types** and **discriminated unions** over loose records.
- Respect existing ESLint config:
  - Do **not** add `// eslint-disable` unless absolutely necessary and local.
  - If you must, add a comment explaining why and keep the scope tiny.
- Do not increase file complexity:
  - The web app has rules like **max 300 lines per file** for components.
  - If a component crosses the limit, **split it** into smaller components/hooks rather than disabling the rule.

### 2.2 Promises & Async

- **No unhandled promises**:
  - Either `await` inside `async` functions, or call as `void someAsync().catch(...)`.
  - For callbacks (e.g. event handlers), always handle failure with toast/logging or error boundaries.
- Prefer **typed API clients** (`apps/web/src/lib/api-*`, `packages/core`) rather than ad-hoc `fetch`.

### 2.3 UI & Design System

- Use primitives from `apps/web/src/components/ui`:
  - `Button`, `Input`, `Dialog`, `Sheet`, `Tabs`, `Card`, `Badge`, `ScrollArea`, `Switch`, etc.
- Do **not** create new raw HTML button/input styles unless:
  - The existing component cannot express the needed behavior, and
  - You add a reusable variant or prop instead of bespoke CSS.
- Respect the design tokens:
  - Colors, typography and spacing should come from Tailwind classes + existing token utilities.
  - Do not introduce hard-coded color hex values or random font sizes if a token exists.

### 2.4 Accessibility & ARIA

- Follow `apps/web/src/lib/accessibility.ts` and ARIA guidance in docs:
  - Provide `aria-label` or descriptive text for icon-only buttons.
  - Maintain focus outlines and keyboard navigation.
  - Use semantic elements (`<button>`, `<nav>`, `<main>`, etc.) wrapped by UI primitives where appropriate.
- When updating modals/dialogs:
  - Keep focus-trap behavior, escape-to-close, and screen-reader labelling intact.

---

## 3. Animation & Motion Rules

### 3.1 Web (apps/web)

- **Do not import `react-native-reanimated` directly in web code.**
- **Do not import `framer-motion` directly in `apps/web` either.**
- All web animation should go through:
  - `@petspark/motion` (aliased to `packages/motion`), or
  - Existing helpers in `apps/web/src/effects/**` that already wrap the façade.

Read `FRAMER_MOTION_MIGRATION.md` for timelines and details.

**Migration state:**

- `apps/web/src/effects/reanimated/**` is the legacy layer being migrated to the motion façade.
- New work:
  - Prefer `MotionView` / façade hooks (`useMotionValue`, `useMotionStyle`, shared transitions).
  - Do **not** add new Reanimated-specific utilities under `effects/reanimated/**`.
- When touching older views (e.g. `DiscoverView`, `AdoptionMarketplaceView`, `DiscoveryFilters*`):
  - Use the motion façade where possible.
  - If a helper like `useEntryAnimation` exists, prefer updating that helper to the façade rather than adding a parallel one.

### 3.2 Mobile / Native (apps/mobile, apps/native)

- Mobile and native continue using **React Native Reanimated**.
- Maintain 60fps and low jank:
  - Heavy work goes to JS threads / workers, not layout effects.
  - Avoid long synchronous reducers or deep object cloning in hot paths.
- Respect mobile docs:
  - `MOBILE_ANIMATION_PARITY_COMPLETE.md`
  - `PERFORMANCE_VALIDATION_GUIDE.md`
  - `ULTRA_CHATFX_CI_GATES.md`

---

## 4. Feature-Level Guidelines (Web)

### 4.1 Views (apps/web/src/components/views)

- Views like `DiscoverView`, `AdoptionMarketplaceView`, `ChatView`, `CommunityView` should:
  - Be **compositional** (wire hooks + component hierarchy).
  - Keep logic inside hooks (e.g. `useAdoptionMarketplace`, `usePetDiscovery`) or `lib/` services.
  - Avoid exceeding 300 lines:
    - Break out subcomponents: `*BasicTab.tsx`, `*MediaTab.tsx`, `*AdvancedTab.tsx`, `*Header.tsx`, etc.
- When adding animations in views:
  - Use `PageTransitionWrapper` from `components/ui/page-transition-wrapper.tsx` or motion façade utilities.
  - For list entries, reuse list animation hooks (`useEntryAnimation` / migrated variants) instead of bespoke inline framer code.

### 4.2 Adoption Marketplace

Relevant files:

- `apps/web/src/components/views/AdoptionMarketplaceView.tsx`
- `apps/web/src/components/adoption/*`
- `apps/web/src/hooks/adoption/use-adoption-filters.ts`
- `apps/web/src/lib/adoption-marketplace-*`

Rules:

- UI state and filtering logic should live in hooks/services:
  - `useAdoptionMarketplace` handles data loading and derived filters.
  - The view handles **layout, wiring and interactions**.
- Use existing cards/dialogs:
  - `AdoptionListingCard`, `AdoptionListingDetailDialog`, `AdoptionFiltersSheet`, `CreateAdoptionListingDialog`.
- For animations of listing cards:
  - Use a dedicated animated item (e.g. `AdoptionListingItem`) that uses the shared motion helpers.
  - Do not duplicate animation logic inline in every map call.
- When adding/removing filters:
  - Update `use-adoption-filters.ts`, filter types in `lib/adoption-marketplace-types.ts`, and corresponding tests in `hooks/__tests__/use-adoption-filters.test.ts`.

### 4.3 Discovery Filters

Relevant files:

- `DiscoveryFilters.tsx`
- `DiscoveryFiltersBasicTab.tsx`
- `DiscoveryFiltersMediaTab.tsx`
- `DiscoveryFiltersAdvancedTab.tsx`
- `discovery-preferences.ts`
- `hooks/use-storage.ts`

Rules:

- `DiscoveryFilters.tsx` should be a **thin orchestrator**:
  - Handles Sheet open/close state.
  - Owns `DiscoveryPreferences` state and persists via `useStorage`.
  - Delegates tabs to separate components for Basic, Media, Advanced.
- Each tab (`*Tab.tsx`) manages only its subset of fields via props:
  - Receive `preferences` slice and `onChange` handlers.
  - No direct local persistence.
- Keep `DiscoveryPreferences` type and `DEFAULT_PREFERENCES` in a single canonical file (`discovery-preferences.ts`) and reuse them on web/mobile where appropriate.
- Respect file size / complexity limits by pushing repeated UI patterns into small subcomponents (e.g. `ToggleBadgeList`, `LabeledSlider`, `FilterCard` components).

### 4.4 Chat & Community

- Use `packages/chat-core` hooks where possible instead of duplicating chat logic in `apps/web`.
- Community components (`components/community/**`) must:
  - Use consistent animation and presence patterns (see `PlaydateScheduler`, `PostComposer`, `NotificationCenter`).
  - Maintain keyboard and screen-reader accessibility in sheet/modal flows.

---

## 5. Mobile Guidelines (apps/mobile)

When you are explicitly asked to touch mobile:

- Read `apps/mobile/ARCHITECTURE.md`, `MOBILE_*` docs, and `PRODUCTION_READINESS.md` first.
- Keep navigation and auth flows in sync with web where appropriate:
  - Terminology (labels, error texts).
  - Button hierarchy and states (primary/secondary/ghost).
- Reuse shared logic from `packages/shared` and `packages/core` instead of duplicating in `apps/mobile`.

---

## 6. Testing & Commands

### 6.1 Web

For any changes under `apps/web`:

1. **Typecheck & lint** (at minimum):
   - `pnpm -C apps/web test --runTestsByPath src/components/views/ChatView.test.tsx` (if touching chat)
   - or use the project's existing scripts:
     - `pnpm lint:web`
     - `pnpm test --filter apps/web` (or the correct workspace filter name)
2. **Optional but recommended:**
   - `pnpm -C apps/web test` (Jest/Vitest unit tests).
   - `pnpm -C apps/web playwright test` or `pnpm -C apps/web test:e2e` if you touched critical flows.
3. **CI parity:**
   - Do not add tests that rely on timers or random values without seeding (`seeded-rng` already exists for chat effects).

### 6.2 Mobile

For changes under `apps/mobile`:

- Run the configured scripts (check `apps/mobile/package.json`):
  - `pnpm -C apps/mobile lint`
  - `pnpm -C apps/mobile test`
  - `pnpm -C apps/mobile test:e2e` / Detox if relevant.

### 6.3 Shared Packages

For `packages/*`:

- Use the package-local scripts:
  - `pnpm -C packages/motion test`
  - `pnpm -C packages/shared test`
  - `pnpm -C packages/core test`

---

## 7. Process for AI-Driven Changes

Whenever an AI/agent is asked to modify something, follow this loop:

1. **Locate & read context**
   - Find the relevant files: component, hook, service, and any `*_SUMMARY.md` or `*_GUIDE.md` in the same app.
   - Understand existing patterns (naming, file layout, design tokens, motion usage).

2. **Plan minimal, high-quality changes**
   - Prefer **surgical edits** that fix issues or add features without rewriting large subsystems.
   - If refactor is necessary (e.g. file too long, duplicated logic), define clear boundaries:
     - New subcomponents.
     - New hooks in `apps/**/src/hooks`.
     - Shared utilities in `apps/**/src/lib` or `packages/*`.

3. **Implement with safety**
   - Keep types tight; do not introduce `any` / `unknown` unless guarded.
   - Avoid regressions across pages (navigation, shared state).
   - Preserve analytics, telemetry, and haptics hooks where present.

4. **Run checks**
   - Run the relevant `pnpm` scripts for the app/package you touched.
   - Fix all lints and type errors produced by your changes.

5. **Document if behavior changed**
   - If you alter a major flow or pattern (auth, matching, adoption marketplace, media editor, motion stack):
     - Update or add a short note to the nearest `*_SUMMARY.md` / `*_GUIDE.md`.
     - Keep docs accurate; do not leave outdated guidance.

6. **Summarize**
   - Summarize what changed, why, and any follow-ups needed (e.g. "apply same button fix to SavedPostsView later").

---

## 8. Things You Must Not Do

- Do **not**:
  - Introduce new libraries or heavy dependencies without explicit instruction.
  - Disable important tooling (`eslint`, `tsc`, `vitest`, `playwright`) to "make it pass".
  - Remove analytics, telemetry, or haptics calls silently.
  - Downgrade security or privacy checks (`gdpr-service`, `rate-limit`, `security` docs).
  - Bypass motion façade by importing `framer-motion` / `react-native-reanimated` directly in web code.

---

Following these instructions, an AI assistant should be able to safely:

- Fix type errors and lint violations.
- Modularize oversized view files (e.g. Discovery/Adoption views) without breaking behavior.
- Migrate animations on web toward the Framer Motion façade.
- Maintain parity between web and mobile UX.
- Keep PETSPARK production-ready and visually premium.
