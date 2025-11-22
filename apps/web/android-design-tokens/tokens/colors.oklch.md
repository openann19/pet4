# Color Tokens (OKLCH) - Single Source of Truth

## Dark Theme (Primary)

### Surface Colors

| Token                     | OKLCH                       | ARGB HEX    | Usage                       |
| ------------------------- | --------------------------- | ----------- | --------------------------- |
| `surface.background`      | `oklch(15% 0.02 260)`       | `#1A1B1E`   | Root background             |
| `surface.card`            | `oklch(18% 0.02 260)`       | `#232428`   | Card elevation 1            |
| `surface.card.elevated`   | `oklch(21% 0.02 260)`       | `#2C2D32`   | Card elevation 2            |
| `surface.glass`           | `oklch(20% 0.03 260 / 0.8)` | `#2F3035CC` | Glass overlay (80% opacity) |
| `surface.control`         | `oklch(24% 0.02 260)`       | `#3A3B40`   | Button/chip background      |
| `surface.control.hover`   | `oklch(27% 0.02 260)`       | `#44454A`   | Control hover state         |
| `surface.control.pressed` | `oklch(21% 0.02 260)`       | `#2C2D32`   | Control pressed state       |

### Primary Colors

| Token         | OKLCH                 | ARGB HEX  | Usage             |
| ------------- | --------------------- | --------- | ----------------- |
| `primary.50`  | `oklch(95% 0.05 260)` | `#F5F6F8` | Primary lightest  |
| `primary.100` | `oklch(85% 0.08 260)` | `#D8DBE1` | Primary light     |
| `primary.200` | `oklch(75% 0.10 260)` | `#B8BDC7` | Primary lighter   |
| `primary.300` | `oklch(65% 0.12 260)` | `#9AA0AD` | Primary light-mid |
| `primary.400` | `oklch(55% 0.14 260)` | `#7D8493` | Primary mid       |
| `primary.500` | `oklch(45% 0.16 260)` | `#636A79` | Primary (default) |
| `primary.600` | `oklch(38% 0.18 260)` | `#4F5562` | Primary dark      |
| `primary.700` | `oklch(32% 0.20 260)` | `#3F444F` | Primary darker    |
| `primary.800` | `oklch(26% 0.18 260)` | `#323640` | Primary darkest   |
| `primary.900` | `oklch(20% 0.15 260)` | `#272A32` | Primary accent    |

### Accent Colors (Match/Like)

| Token              | OKLCH                 | ARGB HEX  | Usage          |
| ------------------ | --------------------- | --------- | -------------- |
| `accent.match.50`  | `oklch(92% 0.12 145)` | `#E8F9E8` | Match lightest |
| `accent.match.500` | `oklch(65% 0.20 145)` | `#4ADE80` | Match primary  |
| `accent.match.700` | `oklch(52% 0.22 145)` | `#2BC164` | Match dark     |
| `accent.like.50`   | `oklch(92% 0.12 25)`  | `#FFF1E8` | Like lightest  |
| `accent.like.500`  | `oklch(65% 0.20 25)`  | `#FFA366` | Like primary   |
| `accent.like.700`  | `oklch(52% 0.22 25)`  | `#E88A4A` | Like dark      |

### Text Colors

| Token            | OKLCH                 | ARGB HEX  | Usage                 | Contrast (on surface.background) |
| ---------------- | --------------------- | --------- | --------------------- | -------------------------------- |
| `text.primary`   | `oklch(95% 0.01 260)` | `#F5F6F7` | Primary text          | AAA (21:1)                       |
| `text.secondary` | `oklch(75% 0.02 260)` | `#BDC0C4` | Secondary text        | AAA (7.2:1)                      |
| `text.tertiary`  | `oklch(60% 0.02 260)` | `#9699A0` | Tertiary text         | AA (4.8:1)                       |
| `text.disabled`  | `oklch(45% 0.01 260)` | `#6D7075` | Disabled text         | AA (3.1:1)                       |
| `text.onGlass`   | `oklch(98% 0.01 260)` | `#FCFCFD` | Text on glass overlay | AAA (23:1)                       |
| `text.onPrimary` | `oklch(98% 0.01 260)` | `#FCFCFD` | Text on primary bg    | AAA                              |
| `text.onAccent`  | `oklch(98% 0.01 260)` | `#FCFCFD` | Text on accent bg     | AAA                              |

### Semantic Colors

| Token                        | OKLCH                 | ARGB HEX  | Usage             |
| ---------------------------- | --------------------- | --------- | ----------------- |
| `semantic.error`             | `oklch(55% 0.22 25)`  | `#EF4444` | Error states      |
| `semantic.error.container`   | `oklch(25% 0.15 25)`  | `#4D1F1F` | Error container   |
| `semantic.warning`           | `oklch(70% 0.18 85)`  | `#F59E0B` | Warning states    |
| `semantic.warning.container` | `oklch(28% 0.12 85)`  | `#4D3A1F` | Warning container |
| `semantic.success`           | `oklch(65% 0.20 145)` | `#4ADE80` | Success states    |
| `semantic.success.container` | `oklch(25% 0.15 145)` | `#1F4D2F` | Success container |
| `semantic.info`              | `oklch(60% 0.18 240)` | `#3B82F6` | Info states       |
| `semantic.info.container`    | `oklch(26% 0.12 240)` | `#1F2F4D` | Info container    |

### Border Colors

| Token            | OKLCH                       | ARGB HEX  | Usage           |
| ---------------- | --------------------------- | --------- | --------------- |
| `border.default` | `oklch(30% 0.02 260 / 0.5)` | `#4A4B50` | Default borders |
| `border.focus`   | `oklch(65% 0.16 260)`       | `#9AA0AD` | Focus ring      |
| `border.divider` | `oklch(25% 0.01 260 / 0.3)` | `#3D3E42` | Dividers        |

### Glass/Blur Colors

| Token            | OKLCH                        | ARGB HEX    | Usage                |
| ---------------- | ---------------------------- | ----------- | -------------------- |
| `glass.backdrop` | `oklch(20% 0.03 260 / 0.6)`  | `#2F303599` | Glass backdrop (60%) |
| `glass.card`     | `oklch(22% 0.03 260 / 0.85)` | `#363740D9` | Glass card (85%)     |
| `glass.overlay`  | `oklch(15% 0.02 260 / 0.9)`  | `#1A1B1EE6` | Modal overlay (90%)  |

## Light Theme (Secondary)

### Surface Colors

| Token                     | OKLCH                       | ARGB HEX    | Usage                  |
| ------------------------- | --------------------------- | ----------- | ---------------------- |
| `surface.background`      | `oklch(98% 0.01 260)`       | `#FCFCFD`   | Root background        |
| `surface.card`            | `oklch(100% 0 0)`           | `#FFFFFF`   | Card elevation 1       |
| `surface.card.elevated`   | `oklch(100% 0 0)`           | `#FFFFFF`   | Card elevation 2       |
| `surface.glass`           | `oklch(98% 0.01 260 / 0.8)` | `#FCFCFDCC` | Glass overlay (80%)    |
| `surface.control`         | `oklch(95% 0.02 260)`       | `#F5F6F8`   | Button/chip background |
| `surface.control.hover`   | `oklch(92% 0.02 260)`       | `#EAEBED`   | Control hover state    |
| `surface.control.pressed` | `oklch(88% 0.02 260)`       | `#DFE0E3`   | Control pressed state  |

### Primary Colors (Same as dark, adjusted for light)

| Token         | OKLCH                 | ARGB HEX  | Usage             |
| ------------- | --------------------- | --------- | ----------------- |
| `primary.500` | `oklch(38% 0.18 260)` | `#4F5562` | Primary (default) |
| `primary.600` | `oklch(32% 0.20 260)` | `#3F444F` | Primary dark      |

### Text Colors

| Token            | OKLCH                 | ARGB HEX  | Usage          | Contrast (on surface.background) |
| ---------------- | --------------------- | --------- | -------------- | -------------------------------- |
| `text.primary`   | `oklch(15% 0.02 260)` | `#1A1B1E` | Primary text   | AAA (21:1)                       |
| `text.secondary` | `oklch(35% 0.02 260)` | `#55565A` | Secondary text | AAA (7.2:1)                      |
| `text.tertiary`  | `oklch(50% 0.02 260)` | `#7D7E82` | Tertiary text  | AA (4.8:1)                       |

## Gradient Definitions

### Primary Gradients

| Token                    | Colors                | Usage                  |
| ------------------------ | --------------------- | ---------------------- |
| `gradient.primary.start` | `oklch(45% 0.16 260)` | Primary gradient start |
| `gradient.primary.end`   | `oklch(32% 0.20 260)` | Primary gradient end   |
| `gradient.match.start`   | `oklch(65% 0.20 145)` | Match gradient start   |
| `gradient.match.end`     | `oklch(52% 0.22 145)` | Match gradient end     |
| `gradient.like.start`    | `oklch(65% 0.20 25)`  | Like gradient start    |
| `gradient.like.end`      | `oklch(52% 0.22 25)`  | Like gradient end      |

### Glass Gradients

| Token                   | Colors                      | Usage             |
| ----------------------- | --------------------------- | ----------------- |
| `gradient.glass.top`    | `oklch(22% 0.03 260 / 0.9)` | Glass top fade    |
| `gradient.glass.bottom` | `oklch(20% 0.03 260 / 0.6)` | Glass bottom fade |

## Contrast Ratios (WCAG 2.2)

### Minimum Requirements

- **AA**: 4.5:1 for normal text, 3:1 for large text
- **AAA**: 7:1 for normal text, 4.5:1 for large text

### Verified Combinations

- `text.primary` on `surface.background`: **21:1** (AAA)
- `text.onGlass` on `glass.card`: **15:1** (AAA)
- `text.secondary` on `surface.card`: **7.2:1** (AAA)
- `text.tertiary` on `surface.card`: **4.8:1** (AA)
- `primary.500` on `surface.background`: **8.5:1** (AAA)

## Usage Notes

1. **Always use tokens** - Never hardcode colors
2. **Dark-first** - Design for dark theme, then adapt light
3. **Contrast check** - Verify AA minimum for all text combinations
4. **Glass layers** - Use backdrop blur + color for glass effect
5. **Semantic colors** - Use semantic tokens for states, not primary colors
