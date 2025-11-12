# Button Visibility & Theme Coverage Audit

## 1. Root-Cause Audit Complete

### Button Variants In Use

- ✅ **default** (primary) - Uses `bg-primary` + `text-primary-foreground`
- ✅ **destructive** - Uses `bg-destructive` + `text-destructive-foreground`
- ✅ **outline** - Uses `border-input` + `bg-background` + hover accent
- ✅ **secondary** - Uses `bg-secondary` + `text-secondary-foreground`
- ✅ **ghost** - Transparent background with hover accent
- ✅ **link** - Text-only with underline
- ✅ **icon** - Square icon-only buttons (size-9 = 36px, needs 44px for mobile)

### Issues Identified

#### Critical Issues (Visibility Blockers)

1. **Ghost buttons on dark backgrounds** - Low contrast in dark mode, especially in WelcomeScreen
2. **Icon buttons insufficient hit area** - 36px < 44px minimum requirement
3. **Disabled state opacity too low** - 0.5 opacity may reduce text contrast below 3:1
4. **Gradient buttons lack solid text color guarantee** - Welcome/Auth screens use gradients with no contrast validation

#### Medium Priority Issues

5. **No explicit button token variables** - All buttons use generic theme tokens, not button-specific ones
6. **Focus ring contrast not validated** - Need to ensure 2px ring meets AA on dark
7. **Hover states may reduce contrast** - Some hover states use opacity without validation
8. **No explicit disabled color tokens** - Uses opacity instead of color change

#### Low Priority Issues

9. **Icon size not responsive to button size** - Fixed 4 size for all button variants
10. **No explicit state documentation** - Missing visual state matrix

### Components Using Risky Styles

- ✅ **WelcomeScreen.tsx** - Gradient buttons, ghost buttons on potentially dark surfaces
- ✅ **AuthScreen.tsx** - Ghost icon button for back navigation
- ✅ **SignInForm.tsx** - Gradient primary button, ghost toggle buttons
- ✅ **SignUpForm.tsx** - Gradient primary button
- ✅ **App.tsx** - Multiple ghost icon buttons in header

### Hardcoded Colors/Opacity Found

- WelcomeScreen: `hover:bg-primary/10` (line 121, 241, 250)
- SignInForm: `from-primary to-accent` gradient (line 197)
- SignUpForm: `from-primary to-accent` gradient (line 317)
- Button component: Uses semantic tokens (✅ GOOD)

## 2. Contrast Validation

### Current Theme Colors (OKLCH)

#### Light Mode

- Background: `oklch(0.98 0.005 85)` - Very light cream
- Foreground: `oklch(0.25 0.015 25)` - Dark charcoal
- Primary: `oklch(0.72 0.15 25)` - Warm coral
- Primary-foreground: `oklch(1 0 0)` - White
- Secondary: `oklch(0.65 0.12 200)` - Soft teal
- Secondary-foreground: `oklch(1 0 0)` - White
- Accent: `oklch(0.68 0.18 45)` - Vibrant orange
- Accent-foreground: `oklch(0.25 0.02 25)` - Dark charcoal

#### Dark Mode

- Background: `oklch(0.12 0.015 265)` - Deep blue-black
- Foreground: `oklch(0.98 0.005 85)` - Bright cream
- Primary: `oklch(0.75 0.18 25)` - Brighter coral
- Primary-foreground: `oklch(0.10 0.02 265)` - Deep background
- Secondary: `oklch(0.68 0.15 200)` - Vivid teal
- Secondary-foreground: `oklch(0.10 0.02 265)` - Deep background
- Accent: `oklch(0.72 0.20 45)` - Bright orange
- Accent-foreground: `oklch(0.10 0.02 265)` - Deep background

### Contrast Ratios (Need to Validate)

- Primary button text: ✅ Should be > 4.5:1
- Secondary button text: ✅ Should be > 4.5:1
- Ghost button on background: ⚠️ Needs validation in hover state
- Disabled buttons: ⚠️ Need to maintain 3:1 minimum
- Focus rings: ⚠️ Need 3:1 against background

## 3. Fixes Required

### Phase 1: Button Component Updates

- [ ] Add explicit button color tokens to index.css
- [ ] Increase icon button size to 44px minimum (size-11)
- [ ] Replace disabled opacity with color-based disabled state
- [ ] Add explicit focus ring with validated contrast
- [ ] Document all button states in component

### Phase 2: Component Updates

- [ ] Update WelcomeScreen gradient buttons with solid text fallback
- [ ] Fix ghost button contrast in WelcomeScreen
- [ ] Ensure all icon buttons meet 44px minimum
- [ ] Add proper hover states that maintain contrast

### Phase 3: Theme Token System

- [ ] Create button-specific tokens in :root
- [ ] Map tokens for light and dark modes
- [ ] Update all button variants to use new tokens
- [ ] Add disabled state tokens (not opacity)

### Phase 4: Testing & Documentation

- [ ] Create state matrix documentation
- [ ] Test EN/BG text expansion
- [ ] Validate all contrast ratios with automated tool
- [ ] Test on mobile devices for hit targets

## 4. Acceptance Criteria

- [ ] All buttons visible in light and dark modes
- [ ] Zero contrast violations (axe/a11y audit)
- [ ] All button variants tokenized
- [ ] Icon buttons ≥ 44×44px
- [ ] Disabled state maintains ≥ 3:1 contrast
- [ ] Focus rings ≥ 3:1 contrast on all surfaces
- [ ] State matrix documented
- [ ] No text clipping in EN/BG
- [ ] Welcome/Login CTAs fully visible and readable
