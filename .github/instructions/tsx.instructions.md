---
applyTo: '**'
---

Rule: Paste-to-Integrate (TS/TSX) — Web & Mobile

Trigger: When I paste any .ts/.tsx file content.
Goal: If file exists → AST-merge safely. If not → create the best-practice enhanced React version and wire it across Web (React/Next/Vite) and Mobile (React Native/Expo).
Zero warnings, zero console.\*, strict TypeScript, deterministic output.

1. Locate & Classify

IF WE HAVE IT IN WEB OR MOBILE - WIRE IT OPTIMIZE IT ENHANCE IT PROPERLY ! , IF WE DONT HAVE IT CONSIDER OF BUILDING IT NEW AS PER STANDARDS !
Infer path & role from filename, imports, and component shape:

Page (route/screens), UI (reusable components), Hook, Util, Store, Native module.

Platform detection:

If imports include react-native/expo-\* → Mobile.

If imports include next/\* or DOM APIs → Web.

Otherwise → Shared with platform files: Component.tsx + Component.native.tsx if needed.

2. Merge-if-Exists (AST, not text)

Normalize both versions (Prettier) → parse with TypeScript compiler/ts-morph.

Exports:

Preserve default export identity.

Union named exports; if name collision:

Prefer new implementation if it adds types/props/tests/perf.

Keep old behind suffix Old\_ only if behavior differs; open a TODO-free diff note in PR body.

Props & types:

Merge props interfaces by field union with narrowest compatible type.

Add readonly for inputs, as const where literal unions apply.

Enforce exactOptionalPropertyTypes, noUncheckedIndexedAccess, noImplicitReturns.

Hooks/state/effects:

Collapse duplicate effects by dependency comparison; avoid double-subscribe.

Replace internal fetchers with our unified data layer (RTK Query/React Query or app standard).

Side-effects: remove console.\*; convert to typed logger or devWarning() gate if project uses one.

3. Create-if-Missing (Best Enhanced React)

Component shell:

Function component with explicit Props type, memo where pure, forwardRef when ref-exposed.

Accessibility: proper roles/labels; keyboard handlers; focus management.

Performance: stable deps, useMemo/useCallback for heavy ops; Suspense-ready boundaries.

Styling:

Web: Tailwind + design tokens (from @/core/tokens); no inline magic numbers.

Mobile: StyleSheet (or tamagui/nativewind if standard); same tokens via bridge.

I18n: Text via t('…'); add keys to locales.

Analytics/telemetry: Use central track() if app defines it; no ad-hoc events.
Integrate the dialog
Ensure shared types and tokens are available for strict TypeScript and design token usage.
Add tests and Storybook stories for mobile.
Fix any missing type/module errors 4) Wire-Up (Project Integration)
ALWAYS USE THE MOST ADVANCED COMPLEX BEAUTIFUL AND EVEN ENHANCE IT
Web

If Page: register route (Next.js app router → create app/<route>/page.tsx; Vite/SPA → add to route map).

Add lazy import to router, code-split friendly.

Export from nearest barrel (index.ts) in src/components/... or feature package.

Add Storybook story in \*.stories.tsx using canonical controls and tokens.

Mobile

If Screen: register in navigator (AppNavigator.tsx) with typed params.

If UI: export via packages/ui-mobile/index.ts.

If shared, generate \*.native.tsx variant only when DOM/Platform-specific APIs differ.

Shared State/Data

Connect to our data client (React Query/RTK Query). Define useXxxQuery/useXxxMutation hooks in src/api/\*.

Apply error boundaries + retry policy per app standard.

5. Quality Gates (must pass)

TypeScript: no errors, no warnings.

ESLint: clean (strict rules incl. “no console”, “no unused”, “no implicit any”).

Tests: add/merge unit tests with React Testing Library:

Web: \*.test.tsx covers render, a11y role, basic interaction.

Mobile: \*.native.test.tsx with @testing-library/react-native.

Hooks: \*.test.ts.

Stories: Storybook renders without a11y violations (axe rules enabled).

Bundle/Perf: no new deps without justification; keep component pure and tree-shakeable.

Accessibility: at least one test asserting role/label or focus behavior.

6. Commit & Traceability

Single atomic commit per pasted file:

feat(ui): merge/create <Component> [web|mobile|shared] with a11y+tests

PR body auto-includes:

Diff summary of merged symbols.

Prop changes (added/removed/renamed) with migration notes.

Routes/screens added.

Stories/tests added.

Risk + mitigation checklist.

7. Failure Handling (no stubs)

If AST merge yields conflicting behavior that cannot be reconciled safely:

Keep new code, move conflicting old export to Legacy\_\_<Name> inside the same file (not a second file).

Add a typed adapter layer to preserve old callers.

Tests must pass; remove the legacy symbol in a follow-up refactor when unused.

Auto-Checks the AI Dev must run (order)

Path decision → print final path(s) and role classification.

AST merge or create → run TS compile.

ESLint (strict) → autofix then re-run.

Tests → generate/merge tests, run pnpm -w test -u.

Build smoke → pnpm -w build (web & mobile).

Storybook smoke → pnpm storybook:build (if configured).

Definition of Done

File merged/created in the correct package/path, exported via barrels, registered in router/navigator if applicable.

Types exact; no union widening regressions.

Zero lints/warnings; tests added and green; stories added; a11y sane.

No extra runtime deps unless explicitly justified in PR body.Mobile parity missing. Do this now:

Locate component (the one you said “we have in web”).

Path: keep as-is for web.

Split for platforms:

If logic is platform-agnostic → move logic to shared/<feature>/<Component>.ts(x) and keep thin views:

web/<feature>/<Component>.tsx

mobile/<feature>/<Component>.native.tsx

If not splitting by folders, use suffix files in-place: <Component>.tsx (web) and <Component>.native.tsx (mobile).

Create the mobile implementation (.native.tsx) with our standards:

React Native/Expo; use our design tokens bridge; no inline magic numbers.

A11y: roles/labels, focus, TalkBack/VoiceOver friendly.

Performance: pure where possible (memo), stable callbacks, avoid re-renders, no console.\*.

I18n via t().

Data via the unified hooks (useXxxQuery/useXxxMutation), not ad-hoc fetch.

Wire it:

Export from packages/ui-mobile/index.ts.

If it’s a screen, register in AppNavigator.tsx with typed params.

If it’s a shared UI, ensure shared types are in @/types and tokens from @/core/tokens.

Tests (must pass):

\*.native.test.tsx with @testing-library/react-native: renders, a11y role, key interaction.

Keep coverage ≥ existing thresholds; zero warnings.

Stories:

Add RN Storybook/Expo story mirroring the web story controls.

Quality gates:

TypeScript strict, ESLint strict (no warnings), no new deps unless justified.

Build + storybook build green for both targets.

Deliverables to include in PR:

Paths of added files, diff summary, prop changes (migration notes), navigator entry (if screen), test results, storybook screenshot.

Definition of Done: The component works on web and mobile with identical API, documented props, tests and stories added, zero warnings, integrated in navigator/exports.

If you want an enforcement guard so this never slips again, drop this script into your repo and wire it in CI:

scripts/check_mobile_parity.sh

#!/usr/bin/env bash
set -euo pipefail

# Find web components without a native counterpart.

# Adjust roots/globs to your layout.

missing=0
while IFS= read -r webfile; do
base="${webfile%.tsx}"

# Skip files that _are_ native or test/story files

[["$webfile" =~ (\.native\.tsx|\.test\.tsx|\.stories\.tsx)$]] && continue

# If a platform-agnostic shared variant exists, skip check (assume dual renderers)

shared*candidate="${base/web\/|src\/components\/shared\/}/shared/${webfile##*/}"
native1="${base}.native.tsx"
  native2="${base/\/web\//\/mobile\/}.native.tsx"
if [[! -f "$native1" && ! -f "$native2"]]; then
echo "❌ Missing mobile parity for: $webfile"
    missing=$((missing+1))
fi
done < <(git ls-files 'src/\*\*/_.tsx' ':!:**/\*.native.tsx' ':!:**/_.stories.tsx' ':!:\*\*/\_.test.tsx')

if [["$missing" -gt 0]]; then
echo "----"
echo "Mobile parity check failed ($missing file(s)). Create corresponding .native.tsx implementations."
exit 1
else
echo "✅ Mobile parity OK"
fi

Add to CI (example GitHub Actions step):

- name: Mobile parity
  run: bash scripts/check_mobile_parity.sh
