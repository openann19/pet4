# UI Audit - Hardcoded Values to Design Token Mapping

**Generated**: 2025-01-XX
**Purpose**: Map all hardcoded color, spacing, radius, and font size values to design tokens

## Color Mappings

### Primary Colors
| Hardcoded Value | Token Path | Notes |
|----------------|------------|-------|
| `#FF715B` | `colors.light.accent` | Coral primary (PremiumInput, useMoodColorTheme) |
| `#FF8B7B` | `colors.light.accent` | Coral primary variant |
| `#1F2937` | `colors.light.foreground` | Gray-900 text (WelcomeScreen) |
| `#6B7280` | `colors.light.mutedForeground` | Gray-600 text (WelcomeScreen) |
| `#9CA3AF` | `colors.light.mutedForeground` | Gray-400 placeholder |
| `#E5E5E5` / `#E5E7EB` | `colors.light.border` | Border light (PremiumInput) |
| `#FFFFFF` | `colors.light.card` | White surface |
| `#F5F5F0` | `colors.light.background` | Cream background |

### Accent Colors
| Hardcoded Value | Token Path | Notes |
|----------------|------------|-------|
| `rgba(59, 130, 246, 1)` | `colors.light.primary` | Blue primary (use-bubble-theme) |
| `rgba(139, 92, 246, 1)` | `colors.light.secondary` | Purple secondary (use-bubble-theme) |
| `rgba(96, 165, 250, 1)` | `colors.dark.primary` | Blue dark variant |
| `rgba(167, 139, 250, 1)` | `colors.dark.secondary` | Purple dark variant |
| `rgba(255, 0, 255, 1)` | Custom (cyberpunk theme) | Cyberpunk primary |
| `rgba(0, 255, 255, 1)` | Custom (cyberpunk theme) | Cyberpunk secondary |

### Mood Colors (useMoodColorTheme)
| Hardcoded Value | Token Path | Notes |
|----------------|------------|-------|
| `rgba(34, 197, 94, 0.2)` | `colors.light.success` + opacity | Positive primary |
| `rgba(16, 185, 129, 0.15)` | `colors.light.success` + opacity | Positive secondary |
| `rgba(110, 231, 183, 0.3)` | `colors.light.success` + opacity | Positive accent |
| `rgba(239, 68, 68, 0.2)` | `colors.light.destructive` + opacity | Negative primary |
| `rgba(220, 38, 38, 0.15)` | `colors.light.destructive` + opacity | Negative secondary |
| `rgba(251, 146, 60, 0.3)` | `colors.light.accent` + opacity | Negative accent |
| `rgba(148, 163, 184, 0.15)` | `colors.light.muted` + opacity | Neutral primary |
| `rgba(203, 213, 225, 0.1)` | `colors.light.muted` + opacity | Neutral secondary |
| `rgba(100, 116, 139, 0.2)` | `colors.light.muted` + opacity | Neutral accent |

### Shadow Colors
| Hardcoded Value | Token Path | Notes |
|----------------|------------|-------|
| `rgba(0, 0, 0, 0.1)` | `shadows.sm` | Light shadow |
| `rgba(0, 0, 0, 0.2)` | `shadows.md` | Medium shadow |
| `rgba(0, 0, 0, 0.3)` | `shadows.lg` | Dark shadow |
| `rgba(0, 0, 0, 0.5)` | `shadows.xl` | Very dark shadow |

### OAuth Button Colors (OAuthButtons.tsx)
| Hardcoded Value | Token Path | Notes |
|----------------|------------|-------|
| `#4285F4` | Custom (Google Blue) | Google brand color - keep as is |
| `#34A853` | Custom (Google Green) | Google brand color - keep as is |
| `#FBBC05` | Custom (Google Yellow) | Google brand color - keep as is |
| `#EA4335` | Custom (Google Red) | Google brand color - keep as is |

## Spacing Mappings

### Common Spacing Values
| Hardcoded Value | Token Path | Notes |
|----------------|------------|-------|
| `4px` | `spacing.1` | Extra small spacing |
| `8px` | `spacing.2` | Small spacing |
| `12px` | `spacing.3` | Medium-small spacing |
| `16px` | `spacing.4` | Medium spacing (most common) |
| `20px` | `spacing.5` | Medium-large spacing |
| `24px` | `spacing.6` | Large spacing |
| `32px` | `spacing.8` | Extra large spacing |
| `48px` | `spacing.12` | 2XL spacing |
| `64px` | `spacing.16` | 3XL spacing |

### Component-Specific Spacing
| Component | Hardcoded Value | Token Path | Notes |
|-----------|----------------|------------|-------|
| Button padding | `12px`, `16px`, `20px` | `Dimens.component.button.paddingHorizontal.{sm,md,lg}` | Use dimens tokens |
| Card padding | `16px`, `20px` | `Dimens.component.card.paddingInner/Outer` | Use dimens tokens |
| Section spacing | `24px` | `Dimens.layout.verticalRhythm.section` | Use dimens tokens |
| Page gutter | `20px` | `Dimens.component.pageGutter` | Use dimens tokens |

## Border Radius Mappings

### Common Radius Values
| Hardcoded Value | Token Path | Notes |
|----------------|------------|-------|
| `0` | `radii.none` | No radius |
| `4px` | `radii.xs` | Extra small radius |
| `6px` | `radii.sm` | Small radius |
| `8px` | `radii.md` | Medium radius (most common) |
| `12px` | `radii.lg` | Large radius |
| `16px` | `radii.xl` | Extra large radius |
| `20px` | `radii.2xl` | 2XL radius |
| `24px` | `radii.3xl` | 3XL radius |
| `9999px` | `radii.full` | Full/pill radius |

### Component-Specific Radius
| Component | Hardcoded Value | Token Path | Notes |
|-----------|----------------|------------|-------|
| Button | `8px`, `12px`, `16px` | `Dimens.radius.button.{sm,md,lg}` | Use dimens tokens |
| Card | `16px`, `20px` | `Dimens.radius.card.{default,elevated}` | Use dimens tokens |
| TextField | `12px` | `Dimens.radius.textField.default` | Use dimens tokens |
| Badge | `8px` | `Dimens.radius.badge` | Use dimens tokens |

## Font Size Mappings

### Common Font Sizes
| Hardcoded Value | Token Path | Notes |
|----------------|------------|-------|
| `12px` | `typography.fontSize.xs` | Extra small text |
| `13px` | `typography.fontSize.sm` | Small text (form labels) |
| `14px` | `typography.fontSize.sm` | Small text (body) |
| `15px` | `typography.fontSize.base` | Base text (inputs) |
| `16px` | `typography.fontSize.base` | Base text |
| `18px` | `typography.fontSize.lg` | Large text (subheadings) |
| `20px` | `typography.fontSize.xl` | Extra large text |
| `24px` | `typography.fontSize.2xl` | 2XL text (section titles) |
| `30px` | `typography.fontSize.3xl` | 3XL text |
| `32px` | `typography.fontSize.4xl` | 4XL text (page headings) |
| `36px` | `typography.fontSize.4xl` | 4XL text |
| `48px` | `typography.fontSize.5xl` | 5XL text |
| `60px` | `typography.fontSize.6xl` | 6XL text |
| `72px` | `typography.fontSize.7xl` | 7XL text |

## Priority Files for Refactoring

### High Priority (Known Hardcoded Values)
1. **PremiumInput.tsx** (lines 144-146)
   - `#FF715B` → `colors.light.accent`
   - `#E5E5E5` → `colors.light.border`

2. **WelcomeScreen.tsx** (lines 301, 305, 317, 328, 379)
   - `#1F2937` → `colors.light.foreground`
   - `#6B7280` → `colors.light.mutedForeground`

3. **MapView.tsx** (line 271)
   - `#ec4899` → `colors.light.accent` (or category-specific color)

4. **useMoodColorTheme.tsx** (lines 23-39)
   - All rgba colors → Use token colors with opacity utilities

5. **use-bubble-theme.ts** (lines 32-53)
   - All rgba colors → Use token colors

6. **OAuthButtons.tsx** (lines 25, 29, 33, 37)
   - Keep brand colors (Google) but document as intentional

### Medium Priority (Pattern-Based)
- All components using `rgba()` with opacity
- All components using hex colors directly
- All components using hardcoded spacing in styles
- All components using hardcoded border-radius

## Implementation Strategy

1. **Create token utility functions**:
   - `getColorToken(color: string): string` - Maps hex/rgba to token
   - `getSpacingToken(px: number): string` - Maps px to spacing token
   - `getRadiusToken(px: number): string` - Maps px to radius token
   - `getFontSizeToken(px: number): string` - Maps px to fontSize token

2. **Update components incrementally**:
   - Start with high-priority files
   - Use CSS variables where possible
   - Use token imports for inline styles

3. **Add missing tokens**:
   - Success colors (for positive mood)
   - Additional accent variants if needed
   - Component-specific spacing/radius tokens

## Notes

- **Brand colors** (OAuth buttons): Keep as-is, document as intentional
- **Theme-specific colors** (cyberpunk): May need custom token category
- **Opacity values**: Create utility to apply opacity to token colors
- **Dynamic colors**: Some colors are computed (e.g., category colors) - may need runtime token resolution
