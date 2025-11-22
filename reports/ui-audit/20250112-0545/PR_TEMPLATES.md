# Auto-Fix PR Templates

## PR #1: Standardize Focus Rings Across All Interactive Elements

### Title
`fix(ui): standardize focus-visible rings for accessibility (Wave 1)`

### Description
Applies consistent focus-visible styling to all interactive elements (buttons, links, inputs) to meet WCAG 2.2 AA requirements and improve keyboard navigation UX.

**Findings Addressed**: UI-0001, UI-0002, UI-0003, UI-0006, UI-0007, UI-0009, UI-0010, UI-0018, UI-0019

**Risk Level**: ✅ Low - Only affects `:focus-visible` pseudo-class, no visual changes during normal interaction

### Changes
- Apply `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--color-focus-ring)` to all buttons
- Apply focus rings to all navigation buttons
- Apply focus rings to all input fields
- Apply focus rings to all interactive cards/links
- Remove default browser `outline` where focus rings are applied

### Files Changed
- `apps/web/src/App.tsx` - Header buttons (6 buttons)
- `apps/web/src/components/navigation/NavButton.tsx` - Navigation buttons
- `apps/web/src/components/auth/SignInForm.tsx` - Form inputs
- `apps/web/src/components/auth/SignUpForm.tsx` - Form inputs
- `apps/web/src/components/views/MapView.tsx` - Map control buttons
- `apps/web/src/components/adoption/AdoptionCard.tsx` - Card interactions
- ~60 additional component files

### Testing Checklist
- [ ] Tab through all interactive elements - focus ring visible
- [ ] Focus ring color matches brand (coral with proper offset)
- [ ] No double-ring artifacts (browser outline removed)
- [ ] Focus ring visible on all background colors (light/dark)
- [ ] Keyboard navigation works as expected
- [ ] Automated axe-core scan passes

### Before/After Screenshots
See: `reports/ui-audit/20250112-0545/screens/web/*/focus-*.png`

### Definition of Done
- Zero HIGH severity focus-related accessibility violations
- 100% of interactive elements have visible focus indicators
- CI accessibility tests pass

---

## PR #2: Replace Hardcoded Spacing with Design Tokens

### Title
`refactor(ui): replace hardcoded pixel spacing with design tokens (Wave 2)`

### Description
Replaces hardcoded pixel values (e.g., `w-[300px]`, `p-[24px]`) with Tailwind spacing scale and design tokens for consistency and maintainability.

**Findings Addressed**: UI-0004, UI-0005, UI-0017, UI-0020

**Risk Level**: ⚠️ Medium - May affect layouts; requires visual regression testing

### Changes
#### Pattern 1: Arbitrary Width/Height → Tailwind Scale
```tsx
// Before
className="w-[300px] h-[200px]"

// After
className="w-80 h-52"  // 80 = 20rem = 320px (closest), 52 = 13rem = 208px
```

#### Pattern 2: Arbitrary Padding → Tailwind Scale
```tsx
// Before
className="p-[24px]"

// After
className="p-6"  // 6 = 1.5rem = 24px (exact match)
```

#### Pattern 3: Custom Values → CSS Variables
```tsx
// Before
className="w-[900px] h-[900px]"  // AnimatedBackground

// After
className="w-[var(--size-bg-gradient)] h-[var(--size-bg-gradient)]"
```

### Files Changed
- `apps/web/src/components/AnimatedBackground.tsx` - Background gradient sizing
- `apps/web/src/components/AdminConsole.tsx` - Container heights
- `apps/web/src/App.tsx` - Button sizing
- ~80 additional component files with hardcoded spacing

### Testing Checklist
- [ ] Visual regression tests pass (Percy/Chromatic)
- [ ] Layouts maintain intended spacing at all breakpoints
- [ ] No overflow or clipping issues
- [ ] Mobile layouts work correctly
- [ ] Dark mode layouts unchanged

### Verification Command
```bash
pnpm --filter spark-template test:visual
```

### Definition of Done
- Zero hardcoded pixel spacing values in arbitrary Tailwind classes
- All spacing uses either Tailwind scale or CSS variables
- Visual regression tests green

---

## PR #3: Replace Hardcoded Border Radius with Tokens

### Title
`refactor(ui): standardize border radius tokens (Wave 2)`

### Description
Replaces hardcoded border radius values with design tokens for visual consistency.

**Findings Addressed**: UI-0008, UI-0015

**Risk Level**: ⚠️ Medium - Affects visual appearance; requires careful review

### Changes
#### Radius Mapping
```tsx
// Before → After
rounded-[12px]  → rounded-xl     // 0.75rem = 12px
rounded-[16px]  → rounded-2xl    // 1rem = 16px
rounded-[24px]  → rounded-3xl    // 1.5rem = 24px
rounded-[32px]  → rounded-[var(--radius-4xl)]
```

### Files Changed
- `apps/web/src/components/auth/SignInForm.tsx` - Card container
- `apps/web/src/components/community/PostComposer.tsx` - Image previews
- `apps/web/src/components/ui/dialog.tsx` - Dialog container
- ~50 additional component files

### Testing Checklist
- [ ] All rounded corners consistent with design system
- [ ] No visual regressions in component appearance
- [ ] Responsive breakpoints maintain correct radius
- [ ] Dark mode appearance correct

### Definition of Done
- Zero hardcoded pixel radius values in components
- All radius uses design tokens or Tailwind scale
- Visual consistency across all surfaces

---

## PR #4: Fix Mobile Hit Targets (44×44dp Minimum)

### Title
`fix(mobile): ensure all touch targets meet 44×44dp minimum (Wave 2)`

### Description
Increases touch target sizes on mobile to meet WCAG 2.2 AA Level requirements (Target Size minimum 44×44 CSS pixels).

**Findings Addressed**: UI-0011, UI-0012, UI-0013

**Risk Level**: ⚠️ Medium - Affects mobile layouts; requires mobile testing

### Changes
#### Pattern: Increase Minimum Size
```tsx
// Before
<Pressable className="w-9 h-9">  // 36×36dp - too small

// After
<Pressable className="min-w-11 min-h-11 p-2">  // 44×44dp minimum with padding
```

#### Specific Fixes
1. **NavBar Buttons** (HomeScreen): Add `min-h-11` to all nav buttons
2. **Reaction Buttons** (ChatScreen): Increase from 32dp to 44dp
3. **Icon-only Buttons**: Add padding to reach minimum size
4. **Floating Action Buttons**: Ensure minimum 56dp diameter

### Files Changed (Mobile)
- `apps/mobile/src/components/BottomNavBar.tsx`
- `apps/mobile/src/screens/ChatScreen.tsx`
- `apps/mobile/src/components/FloatingActionButton.tsx`
- ~20 additional mobile components

### Testing Checklist
- [ ] Test on physical devices (iOS 6.1", Android 5.5")
- [ ] Measure actual rendered sizes in dev tools
- [ ] Verify spacing doesn't break layouts
- [ ] Test with large accessibility text (200%)
- [ ] Verify safe area insets respected

### Verification Steps
1. Enable "Show Layout Bounds" on Android
2. Use iOS Accessibility Inspector
3. Measure touch targets ≥ 44dp in both dimensions

### Definition of Done
- 100% of touch targets ≥ 44×44dp on mobile
- No layout regressions
- Accessibility audit passes on real devices

---

## PR #5: Add ESLint Rules to Prevent Regressions

### Title
`chore(lint): add ESLint rules for design token enforcement`

### Description
Adds custom ESLint rules and CI checks to prevent hardcoded colors, spacing, and missing focus rings from being reintroduced.

### Changes
#### New ESLint Rules
1. **no-hardcoded-colors**: Flags hex colors outside of specific files
2. **no-hardcoded-spacing**: Flags arbitrary px values in className
3. **require-focus-visible**: Flags buttons/links without focus-visible classes
4. **require-alt-text**: Flags img tags without alt attribute

#### Configuration (`apps/web/.eslintrc.js`)
```js
module.exports = {
  rules: {
    '@pawfect/no-hardcoded-colors': ['error', {
      allowedFiles: ['**/stories/**', '**/tokens/**'],
    }],
    '@pawfect/no-hardcoded-spacing': ['warn', {
      maxPixelValue: 4,  // Allow small values like w-[1px]
    }],
    '@pawfect/require-focus-visible': ['error', {
      elements: ['button', 'a', 'input', 'select', 'textarea'],
    }],
  },
};
```

#### CI Job (`.github/workflows/ui-audit.yml`)
```yaml
name: UI Audit
on: [pull_request]
jobs:
  ui-consistency:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm --filter spark-template test:a11y
```

### Files Changed
- `packages/eslint-config-custom/` - New rules
- `.github/workflows/ui-audit.yml` - CI job
- `apps/web/.eslintrc.js` - Rule configuration

### Testing Checklist
- [ ] Lint rules catch violations in test files
- [ ] Rules don't flag false positives
- [ ] CI job fails on violations
- [ ] Documentation updated

### Definition of Done
- ESLint rules active in CI
- Zero false positives on main branch
- Developer documentation updated

---

## Implementation Order

1. **PR #1** (Focus Rings) - Ship immediately (low risk, high impact)
2. **PR #5** (ESLint Rules) - Ship to prevent regressions
3. **PR #2** (Spacing) - Ship with visual regression tests
4. **PR #3** (Radius) - Ship with visual tests
5. **PR #4** (Mobile Hit Targets) - Ship with device testing

## Merge Strategy
- Merge PRs sequentially to avoid conflicts
- Run full test suite between merges
- Deploy to staging for manual QA after each PR
- Monitor production metrics after full rollout
