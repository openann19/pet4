# Spacing & Alignment Grid System

## 4/8 Spacing Grid

### Base Unit
- **Base**: 4dp
- **Scale**: 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96dp

### Token Mapping
| Token | Value | Usage |
|-------|-------|-------|
| xs | 2dp | Micro spacing |
| sm | 4dp | Tight spacing |
| md | 8dp | Standard spacing |
| lg | 12dp | Comfortable spacing |
| xl | 16dp | Section spacing |
| 2xl | 20dp | Page gutters |
| 3xl | 24dp | Section vertical rhythm |
| 4xl | 32dp | Large gaps |
| 5xl | 40dp | Extra large gaps |
| 6xl | 48dp | Touch target minimum |
| 7xl | 56dp | Component height |
| 8xl | 64dp | Large component height |
| 9xl | 80dp | Extra large component |
| 10xl | 96dp | Maximum spacing |

## Vertical Rhythm

### Section Spacing
| Level | Spacing | Usage |
|-------|---------|-------|
| Section | 24dp | Between major sections |
| Card | 16dp | Between cards |
| Element | 12dp | Between elements within card |

### Implementation
```kotlin
// Section spacing
Spacer(modifier = Modifier.height(Dimens.Layout.VerticalRhythm.Section))

// Card spacing
Spacer(modifier = Modifier.height(Dimens.Layout.VerticalRhythm.Card))

// Element spacing
Spacer(modifier = Modifier.height(Dimens.Layout.VerticalRhythm.Element))
```

## Baseline Alignment

### Text Baseline
- **Base Unit**: 4dp
- **Alignment**: All text aligns to 4dp grid
- **Implementation**: Use `Modifier.alignByBaseline()`

### Icon/Text Alignment
```kotlin
Row(
    verticalAlignment = Alignment.CenterVertically,
    modifier = Modifier.alignByBaseline()
) {
    Icon(...)
    Spacer(modifier = Modifier.width(Dimens.Component.Icon.SpacingMD))
    Text(...)
}
```

## Page Gutters

### Standard Gutters
- **Horizontal**: 20dp (page gutter)
- **Vertical**: 24dp (section spacing)

### Implementation
```kotlin
Column(
    modifier = Modifier
        .fillMaxWidth()
        .padding(horizontal = Dimens.Component.PageGutter)
) {
    // Content
}
```

## Component Spacing Table

### Before → After Tokenization

| Component | Before | After | Token |
|-----------|--------|-------|-------|
| Button Padding H | 16dp | 16dp | `Dimens.Component.Button.PaddingHorizontalMD` |
| Button Padding V | 12dp | 12dp | `Dimens.Component.Button.PaddingVerticalMD` |
| Card Padding H | 16dp | 16dp | `Dimens.Component.Card.PaddingInnerHorizontal` |
| Card Padding V | 12dp | 12dp | `Dimens.Component.Card.PaddingInnerVertical` |
| Section Spacing | 24dp | 24dp | `Dimens.Layout.VerticalRhythm.Section` |
| Page Gutter | 20dp | 20dp | `Dimens.Component.PageGutter` |
| List Item Padding H | 20dp | 20dp | `Dimens.Component.ListItem.PaddingHorizontal` |
| List Item Padding V | 16dp | 16dp | `Dimens.Component.ListItem.PaddingVertical` |
| Icon Spacing | 12dp | 12dp | `Dimens.Component.Icon.SpacingMD` |
| Text Field Padding H | 16dp | 16dp | `Dimens.Component.TextField.PaddingHorizontal` |
| Text Field Padding V | 12dp | 12dp | `Dimens.Component.TextField.PaddingVertical` |

## Grid Alignment

### Grid Gutter
- **Gutter**: 16dp between grid items
- **Margin**: 20dp page margin

### Implementation
```kotlin
LazyVerticalGrid(
    columns = GridCells.Fixed(2),
    horizontalArrangement = Arrangement.spacedBy(Dimens.Layout.GridGutter),
    verticalArrangement = Arrangement.spacedBy(Dimens.Layout.GridGutter),
    contentPadding = PaddingValues(Dimens.Layout.GridMargin)
) {
    // Grid items
}
```

## Off-by-1dp Drift Elimination

### Common Issues
1. **Cards**: 1dp misalignment
2. **Sheets**: 1dp border misalignment
3. **Tabs**: 1dp indicator misalignment
4. **Bottom Nav**: 1dp icon misalignment

### Solutions
1. **Use Tokens**: All spacing from tokens
2. **Baseline Alignment**: Use `alignByBaseline()`
3. **Grid System**: Stick to 4/8 grid
4. **Visual Debugging**: Enable layout bounds

### Verification Checklist
- [ ] All spacing uses tokens
- [ ] No hardcoded values
- [ ] Baseline alignment correct
- [ ] Grid alignment correct
- [ ] No 1dp drift in cards
- [ ] No 1dp drift in sheets
- [ ] No 1dp drift in tabs
- [ ] No 1dp drift in bottom nav

## Spacing Audit Report

### Components Verified
- ✅ Button: All padding tokenized
- ✅ Card: All padding tokenized
- ✅ TextField: All padding tokenized
- ✅ ListItem: All padding tokenized
- ✅ Sheet: All padding tokenized
- ✅ Page: All gutters tokenized
- ✅ Section: All spacing tokenized

### Hardcoded Values Removed
- ✅ Removed: `16.dp` → `Dimens.Component.Card.PaddingInnerHorizontal`
- ✅ Removed: `12.dp` → `Dimens.Component.Card.PaddingInnerVertical`
- ✅ Removed: `20.dp` → `Dimens.Component.PageGutter`
- ✅ Removed: `24.dp` → `Dimens.Layout.VerticalRhythm.Section`

### Alignment Fixed
- ✅ Text baseline alignment
- ✅ Icon/text alignment
- ✅ Card alignment
- ✅ Grid alignment

