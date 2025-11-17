# Global UI Audit System

Comprehensive automated UI audit system that discovers, tests, and reports on all web routes, mobile screens, and shared UI modules.

## Overview

The UI audit system automatically:
- Discovers all UI surfaces (web routes, mobile screens, shared modules)
- Runs quality gates (code quality, performance, accessibility, security, error handling, testing)
- Generates reports and artifacts
- Integrates with CI/CD to prevent regressions

## Quick Start

```bash
# Generate inventory (discovers all routes/screens/modules)
pnpm audit:inventory

# Run full audit
pnpm audit:all

# Or run individual steps
pnpm audit:web        # Web audits only
pnpm audit:mobile     # Mobile audits only (requires Detox)
pnpm audit:aggregate  # Generate reports
pnpm audit:reports    # Generate per-item reports
```

## Directory Structure

```
audit/
├── inventory/          # Auto-generated inventories
│   ├── pages.json     # Web routes
│   ├── screens.json    # Mobile screens
│   └── modules.json   # Shared modules
├── reports/            # Generated reports
│   ├── global/         # Global summary report
│   ├── web/            # Per-route reports
│   ├── mobile/         # Per-screen reports
│   └── pkg/            # Per-module reports
├── artifacts/          # Test artifacts
│   ├── web/
│   │   ├── axe/        # Accessibility results
│   │   ├── lighthouse/ # Performance metrics
│   │   ├── snapshots/  # Visual regression screenshots
│   │   └── bundles/    # Bundle analysis
│   └── mobile/
│       ├── snapshots/  # Screen screenshots
│       └── a11y/       # Accessibility results
└── ci/
    └── summary.json    # CI summary (used by CI gate)
```

## Quality Gates

### 1. Code Quality & Rules

**Banned Patterns** (enforced via ESLint):
- `console.log` (use `console.warn`/`console.error` only)
- `@ts-ignore`, `@ts-expect-error`
- `eslint-disable` comments
- `any` types (must use proper types)
- `framer-motion` (use Reanimated only)
- `dangerouslySetInnerHTML`

**Rules**:
- `react-hooks/exhaustive-deps`: error
- `max-lines`: 300 per file
- `max-lines-per-function`: 60
- `sonarjs/no-duplicate-string`: warn
- TypeScript strict mode everywhere

### 2. Performance

**Web per-route budgets** (gzip):
- JS: ≤ 500KB
- LCP: ≤ 2.5s
- CLS: ≤ 0.1
- TBT: ≤ 200ms

**Mobile per-screen**:
- Initial render time ≤ target on mid device
- List virtualization for > 50 items
- Image lazy-loading
- Effect cleanup

### 3. Accessibility (WCAG 2.1 AA)

**Web**:
- `eslint-plugin-jsx-a11y` + `axe-core` in Playwright
- Roles, labels, focus management
- Color contrast
- Keyboard navigation

**Mobile**:
- A11y queries/labels
- Dynamic Type support
- Reduced motion
- Focusable controls

### 4. Security

- Input sanitization where user content appears
- Links hardened: `rel="noopener noreferrer"`
- Analytics: no PII; graceful failure
- No secrets shipped client-side

### 5. Error Handling & Resilience

- Error boundaries: per route/layout (web); per navigator (mobile)
- Typed errors + user-friendly messages
- Offline/Retry flows (web SW; RN NetInfo + queued mutations)

### 6. Testing (Thresholds)

- Coverage ≥ 95% for changed items
- A11y tests present per route/screen
- E2E happy + error + offline paths
- Visual regression snapshots green

## Scripts

### `audit:inventory`

Generates inventories of all UI surfaces:

```bash
pnpm audit:inventory
```

Outputs:
- `audit/inventory/pages.json` - Web routes
- `audit/inventory/screens.json` - Mobile screens
- `audit/inventory/modules.json` - Shared modules

### `audit:web`

Runs web audits (Playwright):
- Accessibility tests (axe-core)
- Visual regression snapshots
- Performance metrics
- Bundle analysis

```bash
pnpm audit:web
```

### `audit:mobile`

Runs mobile audits (Detox):
- Screen navigation tests
- Screenshot capture
- Accessibility checks

```bash
pnpm audit:mobile
```

**Note**: Requires Detox to be configured. Will skip gracefully if not available.

### `audit:aggregate`

Aggregates findings from all sources and generates global report:

```bash
pnpm audit:aggregate
```

Outputs:
- `audit/reports/global/ALL_UI_AUDIT.md` - Global summary
- `ci/summary.json` - CI summary JSON

### `audit:reports`

Generates per-item reports for each route/screen/module:

```bash
pnpm audit:reports
```

Outputs:
- `audit/reports/web/<route-slug>.md` - Per-route reports
- `audit/reports/mobile/<screen-slug>.md` - Per-screen reports
- `audit/reports/pkg/<module-slug>.md` - Per-module reports

### `audit:all`

Runs complete audit pipeline:

```bash
pnpm audit:all
```

Equivalent to:
```bash
pnpm audit:inventory && \
pnpm audit:web && \
pnpm audit:mobile && \
pnpm audit:aggregate && \
pnpm audit:reports
```

## CI Integration

The system integrates with GitHub Actions via `.github/workflows/ui-audit.yml`.

**On push/PR**:
1. Generates inventory
2. Runs web Playwright tests
3. Runs mobile Detox tests (if available)
4. Aggregates findings
5. Generates reports
6. **Fails CI if Critical findings exist**

**Artifacts**:
- All audit artifacts uploaded to GitHub Actions
- Reports available in PR comments (if configured)

## Per-Item Checklist

Each route/screen/module report includes:

### Quality
- [ ] No banned patterns
- [ ] Hooks stable
- [ ] No duplication
- [ ] File ≤ 300 lines, function ≤ 60 lines

### Performance
- [ ] Render count ≤ target
- [ ] Memoization applied
- [ ] Images optimized
- [ ] Bundle size within budget

### Accessibility
- [ ] Roles/labels present
- [ ] Tab/focus management
- [ ] Contrast ratios meet WCAG 2.1 AA
- [ ] Reduced motion variants

### Security
- [ ] User input sanitized
- [ ] Links hardened
- [ ] Analytics minimal
- [ ] No secrets in client code

### Error Handling
- [ ] Error boundary present
- [ ] Typed errors
- [ ] Retry UX implemented
- [ ] Offline handling

### i18n
- [ ] No hardcoded strings
- [ ] Keys for en + bg

### Tests
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] A11y tests present
- [ ] E2E tests passing
- [ ] Visual regression snapshots green

### Documentation
- [ ] Props table documented
- [ ] Usage examples
- [ ] A11y notes

## Troubleshooting

### Inventory not generating

```bash
# Check if App.tsx exists
ls apps/web/src/App.tsx

# Check if navigation files exist
ls apps/mobile/src/navigation/*.tsx
```

### Web tests failing

```bash
# Ensure dev server is running
cd apps/web && pnpm dev

# In another terminal, run tests
pnpm audit:web
```

### Mobile tests not running

Detox requires:
1. Android emulator or iOS simulator running
2. Detox configured in `apps/mobile/detox.config.js`
3. App built for testing

```bash
# Build app for testing
cd apps/mobile
pnpm exec detox build --configuration android.emu.debug

# Run tests
pnpm audit:mobile
```

### Reports not generating

Ensure aggregate step ran successfully:

```bash
# Check if summary exists
ls ci/summary.json

# Re-run aggregate
pnpm audit:aggregate
```

## Success Criteria

All gates must pass:
- ✅ No banned patterns
- ✅ No duplication
- ✅ TypeScript strict everywhere
- ✅ WCAG 2.1 AA compliant
- ✅ Offline/resilience implemented
- ✅ ≥95% coverage where applicable
- ✅ CI blocking prevents regressions

## Files

- `inventory.ts` - Discovers routes/screens/modules
- `aggregate.ts` - Collects findings and generates reports
- `generate-per-item-reports.ts` - Creates per-item reports
- `fail-if-red.js` - CI gate (fails on Critical findings)

## Related Documentation

- [Production Readiness Checklist](../../PRODUCTION_READINESS_CHECKLIST.md)
- [ESLint Configuration](../../eslint.config.js)
- [Playwright Configuration](../../apps/web/playwright.config.ts)
- [Detox Configuration](../../apps/mobile/detox.config.js)

