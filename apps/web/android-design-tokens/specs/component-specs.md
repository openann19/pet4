# Component Specifications - Size & State Matrix

## Button Component

### Sizes
| Size | Height | Padding H | Padding V | Icon Size | Font Size | Radius |
|------|--------|-----------|-----------|-----------|-----------|--------|
| sm | 36dp | 12dp | 8dp | 16dp | 14sp | 8dp |
| md | 48dp | 16dp | 12dp | 20dp | 14sp | 12dp |
| lg | 56dp | 20dp | 16dp | 24dp | 16sp | 16dp |

### States
| State | Background | Text | Border | Elevation | Scale | Opacity |
|-------|------------|------|--------|-----------|-------|---------|
| default | surface.control | text.primary | none | 1dp | 1.0 | 1.0 |
| hover | surface.control.hover | text.primary | none | 2dp | 1.0 | 1.0 |
| pressed | surface.control.pressed | text.primary | none | 0dp | 0.95 | 1.0 |
| focus | surface.control | text.primary | border.focus (2dp) | 1dp | 1.0 | 1.0 |
| disabled | surface.control | text.disabled | none | 0dp | 1.0 | 0.5 |
| loading | surface.control | text.primary | none | 1dp | 1.0 | 0.7 |

### Variants
| Variant | Background | Text | Border | Usage |
|---------|------------|------|--------|-------|
| primary | primary.500 | text.onPrimary | none | Primary actions |
| outline | transparent | text.primary | border.default (1dp) | Secondary actions |
| ghost | transparent | text.primary | none | Tertiary actions |
| glass | glass.card | text.onGlass | none | Glass overlay actions |

### Token References
- Height: `Dimens.Component.Button.PaddingVertical*` + `Dimens.TypeScale.ButtonFontSize`
- Padding: `Dimens.Component.Button.Padding*`
- Radius: `Dimens.Radius.Button.*`
- Colors: `Theme.Colors.*` or `ExtendedColors.*`

---

## Chip/Badge Component

### Sizes
| Size | Height | Padding H | Padding V | Icon Size | Font Size | Radius |
|------|--------|-----------|-----------|-----------|-----------|--------|
| sm | 24dp | 8dp | 4dp | 12dp | 12sp | 8dp |
| md | 32dp | 12dp | 6dp | 16dp | 14sp | 12dp |
| lg | 40dp | 16dp | 8dp | 20dp | 14sp | 16dp |

### States
| State | Background | Text | Border | Scale |
|-------|------------|------|--------|-------|
| default | surface.control | text.secondary | none | 1.0 |
| selected | primary.500 | text.onPrimary | none | 1.0 |
| pressed | surface.control.pressed | text.secondary | none | 0.95 |
| disabled | surface.control | text.disabled | none | 1.0 |

### Token References
- Radius: `Dimens.Radius.Chip.*`
- Colors: `Theme.Colors.*`

---

## Tab Component

### Sizes
| Property | Value |
|----------|-------|
| Height | 48dp (min touch target) |
| Padding H | 16dp |
| Padding V | 12dp |
| Indicator Height | 2dp |
| Indicator Radius | 2dp |
| Font Size | 14sp |

### States
| State | Text | Indicator | Background |
|-------|------|-----------|------------|
| default | text.secondary | transparent | transparent |
| selected | text.primary | primary.500 | transparent |
| pressed | text.primary | primary.500 | surface.control.pressed |

### Token References
- Radius: `Dimens.Radius.Tab.*`
- Touch target: `Dimens.Component.TouchTargetMin`

---

## TextField Component

### Sizes
| Size | Height | Padding H | Padding V | Font Size | Radius |
|------|--------|-----------|-----------|-----------|--------|
| sm | 40dp | 12dp | 10dp | 14sp | 8dp |
| md | 48dp | 16dp | 12dp | 16sp | 12dp |
| lg | 56dp | 20dp | 14dp | 16sp | 12dp |

### States
| State | Background | Text | Border | Label |
|-------|------------|------|--------|-------|
| default | surface.card | text.primary | border.default (1dp) | text.secondary |
| focused | surface.card | text.primary | border.focus (2dp) | text.primary |
| error | surface.card | text.primary | semantic.error (2dp) | semantic.error |
| disabled | surface.control | text.disabled | border.default (1dp) | text.disabled |

### Token References
- Padding: `Dimens.Component.TextField.Padding*`
- Radius: `Dimens.Radius.TextField.*`

---

## Card Component

### Sizes
| Variant | Padding Inner | Padding Outer | Radius | Elevation |
|---------|---------------|---------------|--------|-----------|
| default | 16dp H, 12dp V | 20dp H, 16dp V | 16dp | 2dp |
| elevated | 16dp H, 12dp V | 20dp H, 16dp V | 20dp | 4dp |
| glass | 16dp H, 12dp V | 20dp H, 16dp V | 16dp | 0dp (blur) |

### States
| State | Background | Elevation | Scale |
|-------|------------|-----------|-------|
| default | surface.card | 2dp | 1.0 |
| hover | surface.card | 3dp | 1.0 |
| pressed | surface.card | 1dp | 0.98 |

### Token References
- Padding: `Dimens.Component.Card.Padding*`
- Radius: `Dimens.Radius.Card.*`
- Elevation: `Elevation.Component.Card.*`

---

## Sheet/Modal Component

### Sizes
| Variant | Padding | Radius Top | Radius Bottom | Elevation |
|---------|---------|------------|---------------|-----------|
| bottom sheet | 20dp H, 24dp V | 20dp | 20dp | 6dp |
| modal dialog | 24dp H, 24dp V | 24dp | 24dp | 12dp |

### States
| State | Backdrop | Content | Behavior |
|-------|----------|---------|----------|
| default | glass.overlay (90%) | surface.card | visible |
| dismissing | glass.overlay (60%) | surface.card | animating out |
| dismissed | transparent | transparent | removed |

### Behaviors
- Tap outside: dismiss
- Swipe down: dismiss (bottom sheet only)
- Back button: dismiss top overlay first
- Focus trap: enabled inside sheet
- Scroll lock: background scroll disabled

### Token References
- Padding: `Dimens.Component.Sheet.Padding*`
- Radius: `Dimens.Radius.Sheet.*`
- Elevation: `Elevation.Component.Sheet.*`

---

## Toast Component

### Sizes
| Property | Value |
|----------|-------|
| Min Height | 48dp |
| Padding H | 16dp |
| Padding V | 12dp |
| Radius | 12dp |
| Elevation | 8dp |
| Max Width | 90% screen width |

### States
| State | Background | Text | Icon | Duration |
|-------|------------|------|------|----------|
| success | semantic.success.container | text.primary | semantic.success | 3000ms |
| error | semantic.error.container | text.primary | semantic.error | 4000ms |
| info | semantic.info.container | text.primary | semantic.info | 3000ms |
| warning | semantic.warning.container | text.primary | semantic.warning | 3500ms |

### Token References
- Colors: `Theme.Colors.Semantic.*`

---

## Bottom Navigation Component

### Sizes
| Property | Value |
|----------|-------|
| Height | 64dp |
| Icon Size | 24dp |
| Label Font Size | 12sp |
| Item Min Width | 48dp (touch target) |

### States
| State | Icon | Label | Background |
|-------|------|-------|------------|
| default | text.secondary | text.secondary | transparent |
| selected | primary.500 | primary.500 | transparent |
| pressed | primary.500 | primary.500 | surface.control.pressed |

### Token References
- Touch target: `Dimens.Component.TouchTargetMin`
- Colors: `Theme.Colors.*`

---

## ListItem Component

### Sizes
| Property | Value |
|----------|-------|
| Min Height | 56dp |
| Padding H | 20dp |
| Padding V | 16dp |
| Icon Size | 24dp |
| Avatar Size | 40dp |

### States
| State | Background | Text | Ripple |
|-------|------------|------|--------|
| default | transparent | text.primary | surface.control.pressed |
| pressed | surface.control.pressed | text.primary | none |

### Token References
- Padding: `Dimens.Component.ListItem.Padding*`

---

## Avatar Component

### Sizes
| Size | Diameter | Radius |
|------|----------|--------|
| sm | 32dp | 16dp |
| md | 40dp | 20dp |
| lg | 48dp | 24dp |
| xl | 64dp | 32dp |

### Variants
| Variant | Border | Glow |
|---------|--------|------|
| default | none | none |
| online | accent.match.500 (2dp) | accent.match.500 glow |
| verified | primary.500 (2dp) | primary.500 glow |

### Token References
- Radius: `Dimens.Radius.Avatar.*`

---

## Discovery Card Stack Component

### Sizes
| Property | Value |
|----------|-------|
| Card Width | 90% screen width (max 400dp) |
| Card Height | 16:9 aspect ratio |
| Image Aspect Ratio | 16:9 (fixed) |
| Action Bar Height | 64dp |
| Badge Size | 80dp diameter |

### States
| State | LIKE Badge | PASS Badge | Card |
|-------|------------|------------|------|
| default | opacity 0 | opacity 0 | scale 1.0 |
| drag left (PASS) | opacity 0 | opacity 0-1 (distance) | scale 0.95-1.0 |
| drag right (LIKE) | opacity 0-1 (distance) | opacity 0 | scale 0.95-1.0 |
| pressed | - | - | scale 0.98 |

### Behaviors
- Image: fixed aspect ratio, ContentScale.Crop, smart focal point
- Gradient scrim: protects text overlay
- Badges: scale/opacity with drag distance, never cover controls
- Long names/locations: wrap/clamp, zero clipping
- Action bar: consistent heights, spacing, icon sizes

### Token References
- Spacing: `Dimens.Component.*`
- Colors: `ExtendedColors.MatchAccent`, `ExtendedColors.LikeAccent`

---

## AI Visual Analysis Panel Component

### Sizes
| Property | Value |
|----------|-------|
| Panel Padding | 16dp |
| Image Section Width | 40% |
| Results Section Width | 60% |
| Result Chip Min Width | 80dp |
| Result Chip Padding | 8dp H, 6dp V |
| Row Gap | 12dp |
| Column Gap | 8dp |

### States
| State | Image | Results | Analyze Button |
|-------|-------|--------|----------------|
| default | visible | visible | enabled |
| analyzing | skeleton | loading | disabled |
| error | error placeholder | error message | enabled |

### Behaviors
- Equal padding/radius/elevation left vs right
- Result chips wrap without overflow
- Stable row gaps
- Consistent radii
- "Confidence" pill grid-aligned, min width
- Analyze button label in BG never truncates (allow 2 lines)

### Token References
- Padding: `Dimens.Component.Card.PaddingInner*`
- Radius: `Dimens.Radius.Chip.*`

---

## Component Contract Summary

### Common Requirements
1. **Touch Target**: Minimum 48dp × 48dp
2. **States**: default, hover, pressed, focus, disabled, loading
3. **Focus Ring**: 2dp border, border.focus color
4. **Pressed**: Scale only (0.95-0.98), no layout shift
5. **Tokens**: All values reference design tokens, no magic numbers

### Size Naming Convention
- `sm`: Small (compact spaces)
- `md`: Medium (default)
- `lg`: Large (prominent actions)

### State Priority
1. Disabled (highest priority)
2. Loading
3. Pressed
4. Focus
5. Hover
6. Default (lowest priority)

