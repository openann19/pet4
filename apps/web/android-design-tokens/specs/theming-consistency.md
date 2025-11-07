# Theming Consistency (Dark-First)

## Surface Stack

### Layer Hierarchy
```
Background (elevation 0)
  ├─ Card (elevation 2)
  │   ├─ Glass Overlay (elevation 0, blur)
  │   └─ Control (elevation 1)
  │       └─ Button (elevation 1)
  └─ Sheet (elevation 6)
      └─ Modal (elevation 12)
```

### Surface Colors
| Layer | Dark Color | Light Color | Elevation |
|-------|-----------|-------------|-----------|
| Background | `surface.background` (#1A1B1E) | `surface.background` (#FCFCFD) | 0dp |
| Card | `surface.card` (#232428) | `surface.card` (#FFFFFF) | 2dp |
| Card Elevated | `surface.card.elevated` (#2C2D32) | `surface.card.elevated` (#FFFFFF) | 4dp |
| Glass | `glass.card` (#363740D9) | `glass.card` (#FCFCFDCC) | 0dp (blur) |
| Control | `surface.control` (#3A3B40) | `surface.control` (#F5F6F8) | 1dp |

### Token References
- Background: `DarkColors.SurfaceBackground` / `LightColors.SurfaceBackground`
- Card: `DarkColors.SurfaceCard` / `LightColors.SurfaceCard`
- Glass: `DarkColors.GlassCard` / `LightColors.SurfaceGlass`
- Control: `DarkColors.SurfaceControl` / `LightColors.SurfaceControl`

## Elevation System

### Material 3 Elevation
- **Surface**: Uses elevation for depth
- **Shadows**: Generated from elevation
- **Tokens**: `Elevation.Component.*`

### Elevation Mapping
| Component | Elevation | Token |
|-----------|-----------|-------|
| Background | 0dp | `Elevation.None` |
| Card | 2dp | `Elevation.Component.Card.Default` |
| Card Elevated | 4dp | `Elevation.Component.Card.Elevated` |
| Button | 1dp | `Elevation.Component.Button.Default` |
| Sheet | 6dp | `Elevation.Component.Sheet.Bottom` |
| Modal | 12dp | `Elevation.Component.Dialog` |

## Gradient & Glow System

### Gradients
| Token | Colors | Usage |
|-------|--------|-------|
| Primary | primary.500 → primary.700 | Buttons, cards |
| Match | accent.match.500 → accent.match.700 | Match badges |
| Like | accent.like.500 → accent.like.700 | Like badges |
| Glass | glass.card → surface.background | Glass overlays |
| Scrim | transparent → surface.background | Image overlays |

### Glow Effects
| Token | Color | Radius | Spread | Opacity |
|-------|-------|--------|--------|---------|
| Accent Glow | accent.match.500 | 16dp | 8dp | 0.3 |
| Primary Glow | primary.500 | 12dp | 6dp | 0.25 |

### Glow Rules
- **Respect Radius**: Glow follows border radius
- **No Clipping**: Glow never clips at corners
- **Performance**: Max glow radius 24dp

### Implementation
```kotlin
// ✅ CORRECT - Glow respects radius
Box(
    modifier = Modifier
        .clip(RoundedCornerShape(Dimens.Radius.Card.Default))
        .shadow(
            elevation = 0.dp,
            spotColor = ExtendedColors.MatchAccent.copy(alpha = 0.3f),
            ambientColor = ExtendedColors.MatchAccent.copy(alpha = 0.1f)
        )
) {
    // Content
}
```

## Theme Transitions

### System Appearance Toggle
- **Persistence**: Theme preference saved
- **Transition**: Instant (no flicker)
- **Implementation**: `MaterialTheme` with `ColorScheme`

### Implementation
```kotlin
@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) darkColorScheme() else lightColorScheme()
    
    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        content = content
    )
}
```

## Theme Layer Diagram

### Text Representation
```
┌─────────────────────────────────────┐
│ App Bar (elevation 4)                │
├─────────────────────────────────────┤
│                                     │
│  Background (elevation 0)           │
│  ┌─────────────────────────────┐   │
│  │ Card (elevation 2)          │   │
│  │ ┌───────────────────────┐   │   │
│  │ │ Glass Overlay (blur)   │   │   │
│  │ │ ┌─────────────────┐   │   │   │
│  │ │ │ Control (elev 1) │   │   │   │
│  │ │ │ ┌─────────────┐ │   │   │   │
│  │ │ │ │ Button      │ │   │   │   │
│  │ │ │ └─────────────┘ │   │   │   │
│  │ │ └─────────────────┘   │   │   │
│  │ └───────────────────────┘   │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

## Tokens Per Layer

### Background Layer
- `DarkColors.SurfaceBackground`
- `LightColors.SurfaceBackground`
- Elevation: `Elevation.None`

### Card Layer
- `DarkColors.SurfaceCard`
- `LightColors.SurfaceCard`
- Elevation: `Elevation.Component.Card.Default`

### Glass Layer
- `DarkColors.GlassCard`
- `LightColors.SurfaceGlass`
- Blur: `Blur.Component.GlassCard.radius`
- Elevation: `Elevation.None`

### Control Layer
- `DarkColors.SurfaceControl`
- `LightColors.SurfaceControl`
- Elevation: `Elevation.Component.Button.Default`

## Dark-First Design

### Principle
- Design for dark theme first
- Adapt light theme second
- Ensure contrast in both

### Implementation
```kotlin
// ✅ CORRECT - Dark-first colors
object DarkColors {
    val SurfaceBackground = Color(0xFF1A1B1E)
    val TextPrimary = Color(0xFFF5F6F7)
    // Contrast: 21:1 (AAA)
}

object LightColors {
    val SurfaceBackground = Color(0xFFFCFCFD)
    val TextPrimary = Color(0xFF1A1B1E)
    // Contrast: 21:1 (AAA)
}
```

## Implementation Checklist

### ✅ Theming
- [ ] Dark-first design approach
- [ ] Consistent surface stack
- [ ] Predictable elevations
- [ ] Gradients use tokens
- [ ] Glows respect radius
- [ ] No clipped glows
- [ ] Theme toggle persists
- [ ] Instant transition (no flicker)

### ✅ Testing
- [ ] Test dark theme
- [ ] Test light theme
- [ ] Test theme toggle
- [ ] Test contrast ratios
- [ ] Test glow effects
- [ ] Test gradient rendering
- [ ] Test elevation shadows

