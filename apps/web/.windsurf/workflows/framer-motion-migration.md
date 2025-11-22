---
description: migrate web animations from react-native-reanimated to framer motion
auto_execution_mode: 3
---

# Framer Motion Migration (Web)

## 1. Scope alignment

- Target: **`apps/web` only**. Mobile (`apps/mobile`) continues using React Native Reanimated.
- **Freeze** any new `react-native-reanimated` usage in the web codebase.
- **Freeze** any new direct `framer-motion` imports in `apps/web`.
- All new and migrated animation code in `apps/web` must use the motion façade:
  - `@petspark/motion` (aliased to `packages/motion/src/framer-api`).
- Document this in the main README and/or team channel so everyone follows the same rules.

## 2. Motion foundations

- Treat `packages/motion/src/framer-api` as the **single import surface** for:
  - motion primitives (`MotionView`, `motion`, `PageTransitionWrapper`, etc.),
  - motion hooks (`useMotionValue`, `useMotionStyle`, etc.),
  - shared animation helpers (`animate`, spring helpers, presets).
- Replace Reanimated’s `.value` pattern with Framer-style semantics:
  - Use `MotionValue<T>` instead of `{ value: T }`.
  - Components should either:
    - accept `MotionValue`s and pass them into `style`/`animate`, or
    - accept prebuilt animated style objects.
  - Use `.get()` only when you need to synchronously read the current value for derived calculations.
- Ensure bundler/TS aliases prefer web implementations:
  - `MotionView` and related primitives must resolve to the `.web.tsx` façade for `apps/web`.

## 3. Effects layer refactor (`apps/web/src/effects/reanimated/**`)

- For every file under `apps/web/src/effects/reanimated/**`:
  - Remove direct `react-native-reanimated` imports.
  - Reimplement using the motion façade from `@petspark/motion` / `framer-api`:
    - e.g. `useMotionValue`, `useMotionStyle`, `animate`, spring helpers, etc.
- Keep the **public API shape** of these hooks/components stable where possible so that consumers only need minimal changes.
- Update unit tests for these helpers to assert MotionValue-style behavior (no `.value` access).

## 4. Component layer sweep (`apps/web/src/components/**`)

- Search for usages of:
  - `react-native-reanimated`,
  - `AnimatedView`, `AnimatedBadge`, and other RN-style wrappers,
  - any direct `framer-motion` imports.
- For each occurrence:
  - Replace RN wrappers with `MotionView` / other façade components.
  - Migrate hooks that return `{ translateY: { value } }` etc. to return:
    - `MotionValue` instances, or
    - ready-to-use `style` objects compatible with `MotionView`.
  - Adjust all consumers and tests accordingly.
- Goal: after the sweep, **all** web components use only the façade (`@petspark/motion`) for animation, with no direct Reanimated or `framer-motion` imports.

## 5. Test & Storybook infrastructure cleanup

- Once no web code imports `react-native-reanimated`:
  - Remove the Reanimated mock block from `apps/web/src/test/setup.ts`.
  - Remove Reanimated-specific polyfills such as:
    - `lib/reanimated-web-polyfill.ts`
    - `lib/reanimated-web-simple.ts`
    - (or any other dead Reanimated helpers).
- Update Storybook stories:
  - Ensure components render using `MotionView` / façade primitives.
  - Remove any Reanimated-specific decorators or mocks.

## 6. Validation per migration batch

For each migration batch (e.g. “effects helpers”, “discover views”, “chat overlays”):

1. Run type/lint/tests for web:
   - `pnpm lint:web`
   - `pnpm test --filter apps/web`  _(adjust `--filter` to the actual web workspace name)_
2. Build Storybook for web:
   - `pnpm storybook:build` (or the equivalent script defined for web).
3. Manual QA (dev server):
   - Discover views: filters, cards, list transitions.
   - Chat overlays and modals.
   - Premium cards / hero sections.
   - Confirm:
     - no runtime errors,
     - animation parity (or intentional improvements),
     - no jank or layout glitches.

## 7. Final deliverables

- One or more PRs that:
  - Remove all `react-native-reanimated` imports from `apps/web`.
  - Remove all direct `framer-motion` imports from `apps/web`.
  - Adopt the `@petspark/motion` façade everywhere for web animations.
- Updated docs/README:
  - Explain the new animation stack,
  - Show canonical usage examples (`MotionView`, motion hooks, page transitions).
- QA evidence:
  - Screenshots/GIFs or short videos of flagship flows showing smooth, premium motion after the migration.
