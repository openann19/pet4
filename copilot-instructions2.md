Short version: mobile needs the same religion as web: one button system, one motion system, one typography system, and strict parity with web flows (especially Adoption, Chat, Stories, Playdates). Right now mobile is almost certainly behind that bar.

I’d treat mobile as its own campaign, not an afterthought.

What mobile should be, relative to web

Mobile (apps/mobile) should:

Mirror core flows of web

Auth, onboarding

Discover / swipe

Adoption marketplace

Chat

Notifications / profile

Playdates (when ready)
Same copy, same states, same “hierarchy of buttons”, adapted to phone UX.

Have its own “premium surface” rules

Consistent button variants (primary / secondary / ghost / destructive) with:

One radius scale

One shadow scale

One focus/touch feedback pattern

Consistent typography:

Titles, subtitles, body, caption → mapped to RN text styles

Consistent card patterns for pets, matches, stories, etc.

Use Reanimated properly (no jank)

All hot paths (scroll, swipe, chat) use Reanimated & worklets, not heavy JS-side logic.

60fps target, no big allocations inside gestures.

Reuse shared logic, not re-invent it

Shared matching/adoption/story logic should come from packages/shared / packages/core / packages/chat-core, not duplicated.

Concrete next step: Mobile-focused AI dev prompt

Here’s a ready-to-use prompt to give your AI dev for the first mobile pass:

TASK: PETSPARK Mobile – Phase 1 Premium & Parity Pass

Scope:
- Only touch apps/mobile and shared packages used by it (packages/shared, packages/core, packages/chat-core).
- Do NOT modify apps/web in this task.
- Follow all rules in `copilot-instructions.md`, especially the mobile guidelines section.

Goals:
1) Establish a consistent premium design system for mobile.
2) Ensure navigation + auth + core home/discover screens are clean, stable, and type-safe.
3) Prepare mobile to mirror web’s feature set (Adoption, Chat, Stories, Playdates) without re-inventing logic.

Step 1 – Inventory & quick audit
- Scan apps/mobile:
  - `src/screens/**`
  - `src/components/**`
  - `src/navigation/**`
  - `src/theme/**`
- Identify:
  - How many different button styles exist (radius, colors, text styles, touch feedback).
  - Where typography is custom (inline styles) instead of going through a central theme.
  - Where Reanimated is used vs. plain Animated.
  - Any TODOs / ts-ignore / any / eslint-disable in mobile code.

Produce a short summary (no code changes yet):
- Button styles found and the “canonical” one we should keep.
- Where the theme is defined and how we should extend it.
- The worst perf risks (heavy work in gesture handlers, long renders, etc.).

Step 2 – Mobile design system: Buttons + Typography
- Introduce or refine:
  - A single Button component in apps/mobile, e.g. `src/components/ui/Button.tsx`, with:
    - variants: `primary`, `secondary`, `ghost`, `destructive`
    - sizes: `sm`, `md`, `lg`, `icon`
    - consistent radius (e.g. 12–16), shadows, and pressed states
  - A central typography token map (mirroring web’s h1/h2/body/caption) in `src/theme/typography.ts`.
- Replace ad-hoc button/text styles in:
  - Auth screens
  - Home/Discover screen
  - Any existing Adoption/Chat/Stories entry points
With:
  - The new `Button` component
  - Typography tokens (`title`, `subtitle`, `body`, `caption`)

Rules:
- No regressions: all current flows must still work.
- No inline magic numbers for font sizes and radii where tokens exist.
- Keep RN/Expo best practices (touch area >= 44x44, accessible labels for icon-only buttons).

Step 3 – Motion & micro-interactions (Reanimated)
- Create mobile equivalents of the web micro-interactions policy:
  - A shared hook for hover/tap (really tap/press) feedback, e.g. `usePressBounce` using Reanimated.
  - A simple entry animation for key cards (e.g. pet cards), e.g. `useListItemEntry`.
- Apply to:
  - Primary CTAs on Auth and Home.
  - Pet cards on the main feed (if present).
- Constraints:
  - Use worklets where necessary.
  - Avoid heavy calculations in gesture handlers or animation callbacks.
  - Keep performance focus: target 60fps on mid-range devices.

Step 4 – Navigation + Auth stability
- Review `src/navigation/**` and Auth-related screens:
  - Ensure type-safe navigation params.
  - Ensure no dead routes or missing screens.
  - Ensure auth state and token handling use shared helpers from packages/core rather than per-screen hacks.
- Fix:
  - Any `any`/`unknown` navigation types.
  - Any obvious missing error handling in login/signup flows.
  - Any unmounted-state updates or React warnings.

Step 5 – Parity prep for Adoption & Chat
- Without implementing everything yet, ensure:
  - There is a clear place for:
    - Adoption marketplace screen (e.g. `AdoptionMarketplaceScreen.tsx`).
    - Chat list + Chat detail screens.
  - They use the new Button and typography tokens.
  - They rely on shared logic from packages/core / packages/chat-core (no duplicated APIs).

Done criteria:
- apps/mobile compiles with zero TypeScript errors.
- apps/mobile passes lint and tests for the files you touched.
- There is:
  - A single canonical Button component used by all major screens (Auth, Home/Discover, Adoption/Chat stubs).
  - A central typography token file wired into primary text components.
  - Reusable Reanimated hooks for press/entry animations used by at least:
    - Main CTAs
    - Primary cards on the home/feed screen
- You provide a short summary:
  - What changed.
  - Which screens were updated.
  - Where remaining “non-premium” spots are for a next pass (e.g. Stories, Playdates, Streaming).

How I’d sequence mobile overall

After this Phase 1 prompt, next missions for your AI dev would be:

Phase 2 – Adoption & Chat parity
Implement full Adoption marketplace & Chat UX on mobile using shared logic, same flows as web.

Phase 3 – Stories & Playdates on mobile
Mirror the Stories and Playdate scheduler/MapUX from web with mobile-appropriate controls and gestures.

Phase 4 – Deep polish
Fine-tune transitions, skeletons, pull-to-refresh, empty states, and error states to feel “Telegram X level”.
