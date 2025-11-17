# Accessibility Fix Guide - WCAG 2.2 AA Compliance

This guide provides patterns and examples for fixing the 713 accessibility violations identified in the audit.

## Quick Reference

- **Web Violations**: 607 errors
- **Mobile Violations**: 106 errors
- **Total**: 713 errors
- **Target**: Zero WCAG 2.2 AA violations

## Fix Patterns

### Pattern 1: Icon Buttons (Web) - Most Common Issue

**Problem**: Icon-only buttons missing `aria-label`

**Fix Pattern**:
```tsx
// ❌ Before
<Button size="icon" onClick={handleClick}>
  <Icon size={20} />
</Button>

// ✅ After
<Button
  size="icon"
  onClick={handleClick}
  aria-label="Descriptive action name"
>
  <Icon size={20} />
</Button>
```

**Examples**:
- Close button: `aria-label="Close dialog"`
- Send button: `aria-label="Send message"`
- Record button: `aria-label="Record voice message"`
- Navigation: `aria-label="Previous slide"` / `aria-label="Next slide"`
- Notifications: `aria-label="Notifications, 5 unread"` (include count if relevant)

**Files to Fix**:
- `ChatInputBar.tsx` ✅ (Fixed)
- `EnhancedCarousel.tsx` ✅ (Fixed)
- `EnhancedPetDetailView.tsx` ✅ (Fixed)
- `AdvancedFilterPanel.tsx` ✅ (Fixed)
- `NotificationCenter.tsx` ✅ (Fixed)
- `ChatWindowNew.tsx` (Line 576)
- `DiscoverMapMode.tsx` (Lines 205, 255)
- Many admin components
- Many enhanced components

### Pattern 2: Form Inputs (Web)

**Problem**: Inputs missing labels or `aria-label`

**Fix Pattern**:
```tsx
// ❌ Before
<Input
  id="email"
  placeholder="Email"
/>

// ✅ After - Option 1: Label association
<label htmlFor="email">Email</label>
<Input
  id="email"
  placeholder="Email"
  aria-labelledby="email-label"
/>

// ✅ After - Option 2: aria-label
<Input
  id="email"
  placeholder="Email"
  aria-label="Email address"
/>

// ✅ After - Option 3: PremiumInput with label prop (already fixed)
<PremiumInput
  label="Email"
  placeholder="Enter your email"
  // Component handles label association internally
/>
```

**Files to Fix**:
- `PremiumInput.tsx` ✅ (Fixed - now handles labels properly)
- `PremiumSelect.tsx` (Lines 136, 153, 195, 218)
- `SmartSearch.tsx` (Line 147)
- `ChatInputBar.tsx` ✅ (Fixed)
- Admin form components
- `PetPhotoAnalyzer.tsx` (Lines 301, 313, 326)

### Pattern 3: Modals/Dialogs (Web)

**Problem**: Custom modals missing ARIA attributes

**Fix Pattern**:
```tsx
// ❌ Before
<div className="modal">
  <div className="modal-content">
    <h2>Title</h2>
    {children}
  </div>
</div>

// ✅ After
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <div className="modal-content">
    <h2 id="modal-title">Title</h2>
    <p id="modal-description">Description</p>
    {children}
  </div>
</div>
```

**Note**: Radix UI Dialog components (`DialogPrimitive.Content`) handle ARIA automatically. Only custom modals need fixes.

**Files to Fix**:
- `PetDetailDialog.tsx` (Lines 118, 119) - Verify if using Radix UI
- `CreatePetDialog.tsx` (Lines 953-956) - Verify if using Radix UI
- `PetProfileTemplatesDialog.tsx` (Multiple lines) - Verify if using Radix UI
- `WelcomeModal.tsx` (Lines 136, 137) - Verify if using Radix UI
- `PremiumModal.tsx` (Multiple lines) - Verify if using Radix UI

### Pattern 4: Touchable Components (Mobile)

**Problem**: TouchableOpacity, Pressable missing `accessibilityRole` and `accessibilityLabel`

**Fix Pattern**:
```tsx
// ❌ Before
<TouchableOpacity onPress={handlePress}>
  <Icon name="close" />
</TouchableOpacity>

// ✅ After
<TouchableOpacity
  onPress={handlePress}
  accessibilityRole="button"
  accessibilityLabel="Close dialog"
  accessibilityHint="Closes the current dialog"
>
  <Icon name="close" />
</TouchableOpacity>
```

**Files to Fix**:
- `PremiumInput.tsx` ✅ (Fixed - clear and password toggle buttons)
- `ErrorBoundary.tsx` (Line 114)
- `BottomNavBar.tsx` (Line 233) - Verify if already has props
- `BottomSheet.tsx` (Line 83)
- `EnhancedButton.tsx` (Lines 35, 195)
- `SmartToast.tsx` (Lines 96, 108)
- `EnhancedPetDetailView.tsx` (Lines 121, 123, 210)
- `SmartSearch.tsx` (Lines 136, 144, 151, 157)
- `AdvancedFilterPanel.tsx` (Lines 84, 102, 121, 136, 155, 158)
- `NotificationCenter.tsx` (Lines 155, 174, 192, 222, 236)

### Pattern 5: TextInputs (Mobile)

**Problem**: TextInput missing `accessibilityLabel` or `placeholder`

**Fix Pattern**:
```tsx
// ❌ Before
<TextInput
  value={value}
  onChangeText={onChangeText}
/>

// ✅ After - Option 1: accessibilityLabel
<TextInput
  value={value}
  onChangeText={onChangeText}
  accessibilityLabel="Email address"
  placeholder="Enter your email"
/>

// ✅ After - Option 2: PremiumInput (already fixed)
<PremiumInput
  label="Email"
  value={value}
  onChangeText={onChangeText}
  // Component handles accessibility internally
/>
```

**Files to Fix**:
- `PremiumInput.tsx` ✅ (Fixed)
- `SmartSearch.tsx` (Line 165)

### Pattern 6: Images (Mobile)

**Problem**: Image components missing `accessibilityLabel` or decorative marking

**Fix Pattern**:
```tsx
// ❌ Before
<Image source={imageSource} />

// ✅ After - Option 1: Descriptive label
<Image
  source={imageSource}
  accessibilityLabel="Photo of golden retriever"
/>

// ✅ After - Option 2: Decorative image
<Image
  source={imageSource}
  accessibilityRole="none"
  accessibilityIgnoresInvertColors
/>
```

**Files to Fix**:
- `ProgressiveImage.tsx` (Lines 84, 93)

## Systematic Fix Process

### Step 1: Fix Icon Buttons (Web)
1. Search for all `size="icon"` buttons
2. Add `aria-label` prop with descriptive text
3. Use context-appropriate labels (e.g., "Close dialog", "Send message")

### Step 2: Fix Form Inputs (Web)
1. Use `PremiumInput` component (already fixed)
2. For other inputs, add `aria-label` or associate with `<label>`
3. Use `htmlFor`/`id` relationship for proper label association

### Step 3: Fix Modals/Dialogs (Web)
1. Verify if using Radix UI Dialog (handles ARIA automatically)
2. For custom modals, add `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
3. Ensure modal title has `id` matching `aria-labelledby`

### Step 4: Fix Touchable Components (Mobile)
1. Add `accessibilityRole="button"` to all TouchableOpacity/Pressable
2. Add `accessibilityLabel` with descriptive text
3. Add `accessibilityHint` when helpful

### Step 5: Fix TextInputs (Mobile)
1. Use `PremiumInput` component (already fixed)
2. For other TextInputs, add `accessibilityLabel` or `placeholder`

### Step 6: Fix Images (Mobile)
1. Add `accessibilityLabel` for informative images
2. Mark decorative images with `accessibilityRole="none"`

## Automated Fix Scripts

### Web Icon Buttons Fix
```bash
# Find all icon buttons missing aria-label
grep -r 'size="icon"' apps/web/src/components --include="*.tsx" | \
  grep -v 'aria-label' | \
  grep -v 'test' | \
  grep -v 'stories'
```

### Mobile Touchable Fix
```bash
# Find all TouchableOpacity missing accessibilityRole
grep -r 'TouchableOpacity' apps/mobile/src/components --include="*.tsx" | \
  grep -v 'accessibilityRole' | \
  grep -v 'test'
```

## Testing Checklist

After fixing violations:

1. **Run Audit Scripts**:
   ```bash
   python3 scripts/audit-web-aria.py
   python3 scripts/audit-mobile-accessibility.py
   ```

2. **Run E2E Tests**:
   ```bash
   pnpm --filter ./apps/web e2e:smoke
   ```

3. **Manual Testing**:
   - Test with NVDA (Windows)
   - Test with JAWS (Windows)
   - Test with VoiceOver (macOS/iOS)
   - Test with TalkBack (Android)
   - Test keyboard navigation
   - Test with screen reader

4. **Verify Zero Violations**:
   - Web: 0 ARIA violations
   - Mobile: 0 accessibility prop violations
   - E2E: 0 WCAG 2.2 AA violations

## Priority Order

1. **P0 (Critical)** - Fix first:
   - Icon buttons (affects ~200+ components)
   - Form inputs (affects ~150+ components)
   - Touchable components (affects ~50+ components)
   - TextInputs (affects ~30+ components)

2. **P1 (High)** - Fix next:
   - Modals/dialogs (affects custom modals only)
   - Images (affects ~20+ components)
   - Interactive views (affects ~15+ components)

3. **P2 (Medium)** - Fix after P0/P1:
   - Focus management improvements
   - Live regions for dynamic content
   - Enhanced screen reader announcements

## Examples of Fixed Components

### ChatInputBar.tsx ✅
- Added `aria-label` to stickers button
- Added `aria-label` to input
- Added `aria-label` to record button
- Added `aria-label` to send button

### PremiumInput.tsx ✅
- Added proper label association with `htmlFor`/`id`
- Added `aria-labelledby` to input
- Added `aria-describedby` for helper text and errors
- Added `aria-invalid` for error states
- Added `aria-label` fallback when no label provided

### EnhancedCarousel.tsx ✅
- Added `aria-label="Previous slide"` to prev button
- Added `aria-label="Next slide"` to next button

### EnhancedPetDetailView.tsx ✅
- Added `aria-label="Close pet detail view"` to close button
- Added `aria-label="Navigate to next photo"` to photo nav button

### AdvancedFilterPanel.tsx ✅
- Added `aria-label="Close filter panel"` to close button

### NotificationCenter.tsx ✅
- Added dynamic `aria-label` to notifications button (includes unread count)
- Added `aria-label="Mark as read"` to mark as read button
- Added `aria-label="Delete notification"` to delete button
- Added `aria-hidden="true"` to badge (redundant with aria-label)

### Mobile PremiumInput.tsx ✅
- Added `accessibilityLabel` to TextInput
- Added `accessibilityHint` for helper text/errors
- Added `accessibilityState` for disabled state
- Added `accessibilityRole="button"` and `accessibilityLabel` to clear button
- Added `accessibilityRole="button"` and `accessibilityLabel` to password toggle button

## Next Steps

1. **Continue fixing remaining violations** using the patterns above
2. **Run audit scripts** after each batch of fixes
3. **Update E2E tests** to verify fixes
4. **Manual testing** with screen readers
5. **Generate final compliance report**

## Resources

- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
- [Web ARIA Audit Report](./web-aria-audit-report.md)
- [Mobile Accessibility Audit Report](./mobile-accessibility-audit-report.md)
