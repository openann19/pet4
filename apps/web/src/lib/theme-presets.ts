 
export type ThemePreset =
  | 'default-light'
  | 'default-dark'
  | 'ocean'
  | 'sunset'
  | 'forest'
  | 'lavender'
  | 'midnight'
  | 'rose'
  | 'amber-gold'
  | 'emerald'
  | 'slate-pro'
  | 'cherry-blossom'
  | 'neon-cyber'
  | 'autumn-harvest'
  | 'arctic-frost'
  | 'tropical-paradise'
  | 'volcanic-ember'
  | 'cosmic-purple';

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  lavender?: string;
}

export interface ThemePresetConfig {
  id: ThemePreset;
  name: string;
  description: string;
  mode: 'light' | 'dark';
  colors: ThemeColors;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const themePresets: ThemePresetConfig[] = [
  {
    id: 'default-light',
    name: 'Light',
    description: 'Clean and bright default theme with warm coral accents',
    mode: 'light',
    colors: {
      background: 'oklch(0.98 0.01 90)',
      foreground: 'oklch(0.20 0 0)',
      card: 'oklch(1 0 0)',
      cardForeground: 'oklch(0.20 0 0)',
      popover: 'oklch(1 0 0)',
      popoverForeground: 'oklch(0.20 0 0)',
      primary: 'oklch(0.65 0.15 25)',
      primaryForeground: 'oklch(1 0 0)',
      secondary: 'oklch(0.92 0.05 75)',
      secondaryForeground: 'oklch(0.20 0 0)',
      muted: 'oklch(0.95 0.008 90)',
      mutedForeground: 'oklch(0.45 0 0)',
      accent: 'oklch(0.88 0.08 80)',
      accentForeground: 'oklch(0.20 0 0)',
      destructive: 'oklch(0.65 0.15 25)',
      destructiveForeground: 'oklch(1 0 0)',
      border: 'oklch(0.90 0 0)',
      input: 'oklch(0.90 0 0)',
      ring: 'oklch(0.65 0.15 25)',
      lavender: 'oklch(0.72 0.12 295)',
    },
    preview: {
      primary: '#FF715B',
      secondary: '#FFE4B2',
      accent: '#FFD580',
    },
  },
  {
    id: 'default-dark',
    name: 'Dark',
    description: 'Elegant dark theme with enhanced contrast and vibrant accents',
    mode: 'dark',
    colors: {
      background: 'oklch(0.12 0.018 270)',
      foreground: 'oklch(0.97 0.006 90)',
      card: 'oklch(0.16 0.022 270)',
      cardForeground: 'oklch(0.97 0.006 90)',
      popover: 'oklch(0.16 0.022 270)',
      popoverForeground: 'oklch(0.97 0.006 90)',
      primary: 'oklch(0.80 0.20 28)',
      primaryForeground: 'oklch(0.10 0.018 270)',
      secondary: 'oklch(0.72 0.16 210)',
      secondaryForeground: 'oklch(0.10 0.018 270)',
      muted: 'oklch(0.22 0.022 270)',
      mutedForeground: 'oklch(0.72 0.015 90)',
      accent: 'oklch(0.78 0.22 52)',
      accentForeground: 'oklch(0.10 0.018 270)',
      destructive: 'oklch(0.68 0.26 28)',
      destructiveForeground: 'oklch(0.97 0.006 90)',
      border: 'oklch(0.30 0.028 270)',
      input: 'oklch(0.30 0.028 270)',
      ring: 'oklch(0.80 0.20 28)',
      lavender: 'oklch(0.78 0.14 295)',
    },
    preview: {
      primary: '#F5A86B',
      secondary: '#7EA8E0',
      accent: '#F5C76B',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool and calming ocean blues with aquatic depth',
    mode: 'light',
    colors: {
      background: 'oklch(0.975 0.012 225)',
      foreground: 'oklch(0.18 0.035 235)',
      card: 'oklch(0.99 0.008 225)',
      cardForeground: 'oklch(0.18 0.035 235)',
      popover: 'oklch(0.99 0.008 225)',
      popoverForeground: 'oklch(0.18 0.035 235)',
      primary: 'oklch(0.58 0.20 235)',
      primaryForeground: 'oklch(0.99 0.008 225)',
      secondary: 'oklch(0.68 0.16 215)',
      secondaryForeground: 'oklch(0.99 0.008 225)',
      muted: 'oklch(0.94 0.025 225)',
      mutedForeground: 'oklch(0.46 0.06 235)',
      accent: 'oklch(0.72 0.18 195)',
      accentForeground: 'oklch(0.12 0.035 235)',
      destructive: 'oklch(0.62 0.24 28)',
      destructiveForeground: 'oklch(0.99 0.008 225)',
      border: 'oklch(0.89 0.025 225)',
      input: 'oklch(0.89 0.025 225)',
      ring: 'oklch(0.58 0.20 235)',
      lavender: 'oklch(0.70 0.14 285)',
    },
    preview: {
      primary: '#3B82C8',
      secondary: '#60A5D1',
      accent: '#5DB5DC',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm sunset oranges and pinks with golden glow',
    mode: 'light',
    colors: {
      background: 'oklch(0.985 0.015 50)',
      foreground: 'oklch(0.20 0.045 25)',
      card: 'oklch(0.99 0.008 50)',
      cardForeground: 'oklch(0.20 0.045 25)',
      popover: 'oklch(0.99 0.008 50)',
      popoverForeground: 'oklch(0.20 0.045 25)',
      primary: 'oklch(0.68 0.22 38)',
      primaryForeground: 'oklch(0.99 0.008 50)',
      secondary: 'oklch(0.75 0.20 355)',
      secondaryForeground: 'oklch(0.99 0.008 50)',
      muted: 'oklch(0.95 0.018 50)',
      mutedForeground: 'oklch(0.48 0.07 25)',
      accent: 'oklch(0.72 0.24 30)',
      accentForeground: 'oklch(0.12 0.045 25)',
      destructive: 'oklch(0.62 0.26 18)',
      destructiveForeground: 'oklch(0.99 0.008 50)',
      border: 'oklch(0.90 0.025 50)',
      input: 'oklch(0.90 0.025 50)',
      ring: 'oklch(0.68 0.22 38)',
      lavender: 'oklch(0.72 0.16 340)',
    },
    preview: {
      primary: '#E87344',
      secondary: '#E86B94',
      accent: '#F0A04A',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural greens and earth tones with organic warmth',
    mode: 'light',
    colors: {
      background: 'oklch(0.975 0.015 148)',
      foreground: 'oklch(0.20 0.045 155)',
      card: 'oklch(0.99 0.008 148)',
      cardForeground: 'oklch(0.20 0.045 155)',
      popover: 'oklch(0.99 0.008 148)',
      popoverForeground: 'oklch(0.20 0.045 155)',
      primary: 'oklch(0.60 0.18 158)',
      primaryForeground: 'oklch(0.99 0.008 148)',
      secondary: 'oklch(0.68 0.14 138)',
      secondaryForeground: 'oklch(0.99 0.008 148)',
      muted: 'oklch(0.94 0.025 148)',
      mutedForeground: 'oklch(0.46 0.06 155)',
      accent: 'oklch(0.75 0.16 52)',
      accentForeground: 'oklch(0.12 0.045 155)',
      destructive: 'oklch(0.60 0.26 28)',
      destructiveForeground: 'oklch(0.99 0.008 148)',
      border: 'oklch(0.89 0.025 148)',
      input: 'oklch(0.89 0.025 148)',
      ring: 'oklch(0.60 0.18 158)',
      lavender: 'oklch(0.70 0.12 285)',
    },
    preview: {
      primary: '#4A9B5E',
      secondary: '#6BAF73',
      accent: '#C8B364',
    },
  },
  {
    id: 'lavender',
    name: 'Lavender Dreams',
    description: 'Soft purples and gentle tones with dreamy elegance',
    mode: 'light',
    colors: {
      background: 'oklch(0.985 0.015 292)',
      foreground: 'oklch(0.22 0.035 282)',
      card: 'oklch(0.99 0.008 292)',
      cardForeground: 'oklch(0.22 0.035 282)',
      popover: 'oklch(0.99 0.008 292)',
      popoverForeground: 'oklch(0.22 0.035 282)',
      primary: 'oklch(0.68 0.18 288)',
      primaryForeground: 'oklch(0.99 0.008 292)',
      secondary: 'oklch(0.72 0.16 312)',
      secondaryForeground: 'oklch(0.99 0.008 292)',
      muted: 'oklch(0.95 0.025 292)',
      mutedForeground: 'oklch(0.48 0.06 282)',
      accent: 'oklch(0.78 0.20 332)',
      accentForeground: 'oklch(0.12 0.035 282)',
      destructive: 'oklch(0.62 0.24 18)',
      destructiveForeground: 'oklch(0.99 0.008 292)',
      border: 'oklch(0.90 0.025 292)',
      input: 'oklch(0.90 0.025 292)',
      ring: 'oklch(0.68 0.18 288)',
      lavender: 'oklch(0.72 0.16 288)',
    },
    preview: {
      primary: '#9B7AC8',
      secondary: '#B88ACF',
      accent: '#D78FCE',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    description: 'Deep blues with rich contrast and oceanic depth',
    mode: 'dark',
    colors: {
      background: 'oklch(0.13 0.045 252)',
      foreground: 'oklch(0.97 0.012 225)',
      card: 'oklch(0.17 0.055 252)',
      cardForeground: 'oklch(0.97 0.012 225)',
      popover: 'oklch(0.17 0.055 252)',
      popoverForeground: 'oklch(0.97 0.012 225)',
      primary: 'oklch(0.72 0.22 242)',
      primaryForeground: 'oklch(0.10 0.045 252)',
      secondary: 'oklch(0.68 0.20 215)',
      secondaryForeground: 'oklch(0.10 0.045 252)',
      muted: 'oklch(0.23 0.05 252)',
      mutedForeground: 'oklch(0.72 0.035 225)',
      accent: 'oklch(0.78 0.24 193)',
      accentForeground: 'oklch(0.10 0.045 252)',
      destructive: 'oklch(0.65 0.28 28)',
      destructiveForeground: 'oklch(0.97 0.012 225)',
      border: 'oklch(0.30 0.06 252)',
      input: 'oklch(0.30 0.06 252)',
      ring: 'oklch(0.72 0.22 242)',
      lavender: 'oklch(0.75 0.16 295)',
    },
    preview: {
      primary: '#6B9FE8',
      secondary: '#5D9FD6',
      accent: '#6BB5E8',
    },
  },
  {
    id: 'rose',
    name: 'Rose Garden',
    description: 'Romantic pinks and warm tones with floral elegance',
    mode: 'light',
    colors: {
      background: 'oklch(0.985 0.015 356)',
      foreground: 'oklch(0.22 0.035 346)',
      card: 'oklch(0.99 0.008 356)',
      cardForeground: 'oklch(0.22 0.035 346)',
      popover: 'oklch(0.99 0.008 356)',
      popoverForeground: 'oklch(0.22 0.035 346)',
      primary: 'oklch(0.68 0.20 352)',
      primaryForeground: 'oklch(0.99 0.008 356)',
      secondary: 'oklch(0.72 0.18 12)',
      secondaryForeground: 'oklch(0.99 0.008 356)',
      muted: 'oklch(0.95 0.018 356)',
      mutedForeground: 'oklch(0.48 0.06 346)',
      accent: 'oklch(0.75 0.22 342)',
      accentForeground: 'oklch(0.12 0.035 346)',
      destructive: 'oklch(0.60 0.26 22)',
      destructiveForeground: 'oklch(0.99 0.008 356)',
      border: 'oklch(0.90 0.025 356)',
      input: 'oklch(0.90 0.025 356)',
      ring: 'oklch(0.68 0.20 352)',
      lavender: 'oklch(0.72 0.16 345)',
    },
    preview: {
      primary: '#E86B8A',
      secondary: '#E88073',
      accent: '#E86BA8',
    },
  },
  {
    id: 'amber-gold',
    name: 'Amber Gold',
    description: 'Warm amber and golden tones with luxurious shine',
    mode: 'light',
    colors: {
      background: 'oklch(0.985 0.015 68)',
      foreground: 'oklch(0.20 0.045 48)',
      card: 'oklch(0.99 0.008 68)',
      cardForeground: 'oklch(0.20 0.045 48)',
      popover: 'oklch(0.99 0.008 68)',
      popoverForeground: 'oklch(0.20 0.045 48)',
      primary: 'oklch(0.70 0.20 78)',
      primaryForeground: 'oklch(0.99 0.008 68)',
      secondary: 'oklch(0.75 0.18 55)',
      secondaryForeground: 'oklch(0.99 0.008 68)',
      muted: 'oklch(0.95 0.025 68)',
      mutedForeground: 'oklch(0.48 0.07 48)',
      accent: 'oklch(0.78 0.22 85)',
      accentForeground: 'oklch(0.12 0.045 48)',
      destructive: 'oklch(0.60 0.26 28)',
      destructiveForeground: 'oklch(0.99 0.008 68)',
      border: 'oklch(0.90 0.025 68)',
      input: 'oklch(0.90 0.025 68)',
      ring: 'oklch(0.70 0.20 78)',
      lavender: 'oklch(0.72 0.14 290)',
    },
    preview: {
      primary: '#E8AF5C',
      secondary: '#E89B54',
      accent: '#F0C05A',
    },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    description: 'Rich emerald greens with depth and natural vibrancy',
    mode: 'dark',
    colors: {
      background: 'oklch(0.12 0.035 162)',
      foreground: 'oklch(0.97 0.012 152)',
      card: 'oklch(0.16 0.045 162)',
      cardForeground: 'oklch(0.97 0.012 152)',
      popover: 'oklch(0.16 0.045 162)',
      popoverForeground: 'oklch(0.97 0.012 152)',
      primary: 'oklch(0.70 0.22 157)',
      primaryForeground: 'oklch(0.10 0.035 162)',
      secondary: 'oklch(0.65 0.18 172)',
      secondaryForeground: 'oklch(0.10 0.035 162)',
      muted: 'oklch(0.22 0.045 162)',
      mutedForeground: 'oklch(0.70 0.035 152)',
      accent: 'oklch(0.75 0.24 147)',
      accentForeground: 'oklch(0.10 0.035 162)',
      destructive: 'oklch(0.65 0.28 28)',
      destructiveForeground: 'oklch(0.97 0.012 152)',
      border: 'oklch(0.28 0.06 162)',
      input: 'oklch(0.28 0.06 162)',
      ring: 'oklch(0.70 0.22 157)',
      lavender: 'oklch(0.75 0.16 295)',
    },
    preview: {
      primary: '#5DB57E',
      secondary: '#4FA588',
      accent: '#6FC978',
    },
  },
  {
    id: 'slate-pro',
    name: 'Slate Professional',
    description: 'Professional slate with subtle accents and refined elegance',
    mode: 'dark',
    colors: {
      background: 'oklch(0.14 0.012 242)',
      foreground: 'oklch(0.97 0.008 242)',
      card: 'oklch(0.18 0.018 242)',
      cardForeground: 'oklch(0.97 0.008 242)',
      popover: 'oklch(0.18 0.018 242)',
      popoverForeground: 'oklch(0.97 0.008 242)',
      primary: 'oklch(0.72 0.14 247)',
      primaryForeground: 'oklch(0.12 0.012 242)',
      secondary: 'oklch(0.68 0.12 262)',
      secondaryForeground: 'oklch(0.12 0.012 242)',
      muted: 'oklch(0.24 0.022 242)',
      mutedForeground: 'oklch(0.70 0.025 242)',
      accent: 'oklch(0.70 0.16 222)',
      accentForeground: 'oklch(0.12 0.012 242)',
      destructive: 'oklch(0.65 0.26 28)',
      destructiveForeground: 'oklch(0.97 0.008 242)',
      border: 'oklch(0.30 0.025 242)',
      input: 'oklch(0.30 0.025 242)',
      ring: 'oklch(0.72 0.14 247)',
      lavender: 'oklch(0.75 0.14 295)',
    },
    preview: {
      primary: '#7A9CC6',
      secondary: '#8592D4',
      accent: '#6AA3D1',
    },
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    description: 'Delicate cherry blossom pinks with springtime freshness',
    mode: 'light',
    colors: {
      background: 'oklch(0.985 0.015 342)',
      foreground: 'oklch(0.22 0.035 332)',
      card: 'oklch(0.99 0.008 342)',
      cardForeground: 'oklch(0.22 0.035 332)',
      popover: 'oklch(0.99 0.008 342)',
      popoverForeground: 'oklch(0.22 0.035 332)',
      primary: 'oklch(0.70 0.18 347)',
      primaryForeground: 'oklch(0.99 0.008 342)',
      secondary: 'oklch(0.75 0.16 332)',
      secondaryForeground: 'oklch(0.99 0.008 342)',
      muted: 'oklch(0.95 0.025 342)',
      mutedForeground: 'oklch(0.48 0.06 332)',
      accent: 'oklch(0.78 0.20 357)',
      accentForeground: 'oklch(0.12 0.035 332)',
      destructive: 'oklch(0.60 0.26 22)',
      destructiveForeground: 'oklch(0.99 0.008 342)',
      border: 'oklch(0.90 0.025 342)',
      input: 'oklch(0.90 0.025 342)',
      ring: 'oklch(0.70 0.18 347)',
      lavender: 'oklch(0.72 0.16 345)',
    },
    preview: {
      primary: '#E891AC',
      secondary: '#E8A1B8',
      accent: '#E87F9D',
    },
  },
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    description: 'Futuristic neon colors with high-tech cyberpunk vibes',
    mode: 'dark',
    colors: {
      background: 'oklch(0.10 0.04 280)',
      foreground: 'oklch(0.98 0.02 180)',
      card: 'oklch(0.14 0.05 280)',
      cardForeground: 'oklch(0.98 0.02 180)',
      popover: 'oklch(0.14 0.05 280)',
      popoverForeground: 'oklch(0.98 0.02 180)',
      primary: 'oklch(0.75 0.30 320)',
      primaryForeground: 'oklch(0.10 0.04 280)',
      secondary: 'oklch(0.70 0.28 190)',
      secondaryForeground: 'oklch(0.10 0.04 280)',
      muted: 'oklch(0.20 0.06 280)',
      mutedForeground: 'oklch(0.75 0.04 180)',
      accent: 'oklch(0.78 0.32 160)',
      accentForeground: 'oklch(0.10 0.04 280)',
      destructive: 'oklch(0.70 0.32 10)',
      destructiveForeground: 'oklch(0.98 0.02 180)',
      border: 'oklch(0.28 0.08 280)',
      input: 'oklch(0.28 0.08 280)',
      ring: 'oklch(0.75 0.30 320)',
      lavender: 'oklch(0.78 0.18 295)',
    },
    preview: {
      primary: '#E059D8',
      secondary: '#00E5D5',
      accent: '#00FFB3',
    },
  },
  {
    id: 'autumn-harvest',
    name: 'Autumn Harvest',
    description: 'Rich autumn colors with harvest warmth and golden tones',
    mode: 'light',
    colors: {
      background: 'oklch(0.98 0.018 60)',
      foreground: 'oklch(0.20 0.048 35)',
      card: 'oklch(0.99 0.010 60)',
      cardForeground: 'oklch(0.20 0.048 35)',
      popover: 'oklch(0.99 0.010 60)',
      popoverForeground: 'oklch(0.20 0.048 35)',
      primary: 'oklch(0.62 0.24 45)',
      primaryForeground: 'oklch(0.99 0.010 60)',
      secondary: 'oklch(0.68 0.20 28)',
      secondaryForeground: 'oklch(0.99 0.010 60)',
      muted: 'oklch(0.94 0.028 60)',
      mutedForeground: 'oklch(0.46 0.08 35)',
      accent: 'oklch(0.72 0.22 65)',
      accentForeground: 'oklch(0.12 0.048 35)',
      destructive: 'oklch(0.58 0.28 25)',
      destructiveForeground: 'oklch(0.99 0.010 60)',
      border: 'oklch(0.88 0.030 60)',
      input: 'oklch(0.88 0.030 60)',
      ring: 'oklch(0.62 0.24 45)',
      lavender: 'oklch(0.70 0.14 285)',
    },
    preview: {
      primary: '#D87244',
      secondary: '#C85A30',
      accent: '#E8A850',
    },
  },
  {
    id: 'arctic-frost',
    name: 'Arctic Frost',
    description: 'Cool icy blues and whites with pristine clarity',
    mode: 'light',
    colors: {
      background: 'oklch(0.985 0.015 220)',
      foreground: 'oklch(0.18 0.040 230)',
      card: 'oklch(0.995 0.008 220)',
      cardForeground: 'oklch(0.18 0.040 230)',
      popover: 'oklch(0.995 0.008 220)',
      popoverForeground: 'oklch(0.18 0.040 230)',
      primary: 'oklch(0.62 0.22 230)',
      primaryForeground: 'oklch(0.995 0.008 220)',
      secondary: 'oklch(0.70 0.18 215)',
      secondaryForeground: 'oklch(0.995 0.008 220)',
      muted: 'oklch(0.96 0.020 220)',
      mutedForeground: 'oklch(0.48 0.065 230)',
      accent: 'oklch(0.75 0.20 200)',
      accentForeground: 'oklch(0.12 0.040 230)',
      destructive: 'oklch(0.58 0.26 18)',
      destructiveForeground: 'oklch(0.995 0.008 220)',
      border: 'oklch(0.92 0.022 220)',
      input: 'oklch(0.92 0.022 220)',
      ring: 'oklch(0.62 0.22 230)',
      lavender: 'oklch(0.72 0.14 250)',
    },
    preview: {
      primary: '#4888D0',
      secondary: '#5FA5E0',
      accent: '#68C0E8',
    },
  },
  {
    id: 'tropical-paradise',
    name: 'Tropical Paradise',
    description: 'Vibrant tropical colors with island energy',
    mode: 'light',
    colors: {
      background: 'oklch(0.985 0.020 172)',
      foreground: 'oklch(0.18 0.045 168)',
      card: 'oklch(0.99 0.012 172)',
      cardForeground: 'oklch(0.18 0.045 168)',
      popover: 'oklch(0.99 0.012 172)',
      popoverForeground: 'oklch(0.18 0.045 168)',
      primary: 'oklch(0.65 0.24 165)',
      primaryForeground: 'oklch(0.99 0.012 172)',
      secondary: 'oklch(0.72 0.22 50)',
      secondaryForeground: 'oklch(0.99 0.012 172)',
      muted: 'oklch(0.94 0.028 172)',
      mutedForeground: 'oklch(0.46 0.075 168)',
      accent: 'oklch(0.75 0.26 190)',
      accentForeground: 'oklch(0.12 0.045 168)',
      destructive: 'oklch(0.62 0.28 28)',
      destructiveForeground: 'oklch(0.99 0.012 172)',
      border: 'oklch(0.90 0.030 172)',
      input: 'oklch(0.90 0.030 172)',
      ring: 'oklch(0.65 0.24 165)',
      lavender: 'oklch(0.72 0.16 285)',
    },
    preview: {
      primary: '#3FAA82',
      secondary: '#E8A050',
      accent: '#50C8E8',
    },
  },
  {
    id: 'volcanic-ember',
    name: 'Volcanic Ember',
    description: 'Intense reds and oranges with molten lava energy',
    mode: 'dark',
    colors: {
      background: 'oklch(0.12 0.045 28)',
      foreground: 'oklch(0.97 0.015 30)',
      card: 'oklch(0.16 0.055 28)',
      cardForeground: 'oklch(0.97 0.015 30)',
      popover: 'oklch(0.16 0.055 28)',
      popoverForeground: 'oklch(0.97 0.015 30)',
      primary: 'oklch(0.68 0.28 32)',
      primaryForeground: 'oklch(0.10 0.045 28)',
      secondary: 'oklch(0.70 0.26 18)',
      secondaryForeground: 'oklch(0.10 0.045 28)',
      muted: 'oklch(0.22 0.055 28)',
      mutedForeground: 'oklch(0.72 0.040 30)',
      accent: 'oklch(0.75 0.30 42)',
      accentForeground: 'oklch(0.10 0.045 28)',
      destructive: 'oklch(0.65 0.32 15)',
      destructiveForeground: 'oklch(0.97 0.015 30)',
      border: 'oklch(0.28 0.070 28)',
      input: 'oklch(0.28 0.070 28)',
      ring: 'oklch(0.68 0.28 32)',
      lavender: 'oklch(0.75 0.16 310)',
    },
    preview: {
      primary: '#E8623C',
      secondary: '#D8422C',
      accent: '#F08850',
    },
  },
  {
    id: 'cosmic-purple',
    name: 'Cosmic Purple',
    description: 'Deep space purples with cosmic mystique',
    mode: 'dark',
    colors: {
      background: 'oklch(0.11 0.050 295)',
      foreground: 'oklch(0.97 0.015 280)',
      card: 'oklch(0.15 0.060 295)',
      cardForeground: 'oklch(0.97 0.015 280)',
      popover: 'oklch(0.15 0.060 295)',
      popoverForeground: 'oklch(0.97 0.015 280)',
      primary: 'oklch(0.70 0.26 290)',
      primaryForeground: 'oklch(0.10 0.050 295)',
      secondary: 'oklch(0.68 0.24 310)',
      secondaryForeground: 'oklch(0.10 0.050 295)',
      muted: 'oklch(0.21 0.065 295)',
      mutedForeground: 'oklch(0.72 0.040 280)',
      accent: 'oklch(0.75 0.28 275)',
      accentForeground: 'oklch(0.10 0.050 295)',
      destructive: 'oklch(0.65 0.30 20)',
      destructiveForeground: 'oklch(0.97 0.015 280)',
      border: 'oklch(0.27 0.075 295)',
      input: 'oklch(0.27 0.075 295)',
      ring: 'oklch(0.70 0.26 290)',
      lavender: 'oklch(0.75 0.20 290)',
    },
    preview: {
      primary: '#A85BE8',
      secondary: '#C068E8',
      accent: '#9850E8',
    },
  },
];

export function getThemePreset(id: ThemePreset): ThemePresetConfig | undefined {
  return themePresets.find((preset) => preset.id === id);
}

export function applyThemePreset(preset: ThemePresetConfig) {
  const root = document.documentElement;
  const colors = preset.colors;

  root.style.setProperty('--background', colors.background);
  root.style.setProperty('--foreground', colors.foreground);
  root.style.setProperty('--card', colors.card);
  root.style.setProperty('--card-foreground', colors.cardForeground);
  root.style.setProperty('--popover', colors.popover);
  root.style.setProperty('--popover-foreground', colors.popoverForeground);
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-foreground', colors.primaryForeground);
  root.style.setProperty('--secondary', colors.secondary);
  root.style.setProperty('--secondary-foreground', colors.secondaryForeground);
  root.style.setProperty('--muted', colors.muted);
  root.style.setProperty('--muted-foreground', colors.mutedForeground);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-foreground', colors.accentForeground);
  root.style.setProperty('--destructive', colors.destructive);
  root.style.setProperty('--destructive-foreground', colors.destructiveForeground);
  root.style.setProperty('--border', colors.border);
  root.style.setProperty('--input', colors.input);
  root.style.setProperty('--ring', colors.ring);

  if (colors.lavender) {
    root.style.setProperty('--lavender', colors.lavender);
  }

  if (preset.mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Inject design tokens for the preset mode
  // This ensures design token CSS variables are available alongside theme-preset variables
  if (typeof window !== 'undefined') {
    try {
      // Dynamic import to avoid circular dependencies
      void import('./design-tokens').then(({ injectTokenCSSVariables }) => {
        injectTokenCSSVariables(preset.mode);
      });
    } catch {
      // Silently fail if design tokens can't be imported
    }
  }

  // Apply button tokens for this theme (dynamic import for code splitting)
  if (typeof window !== 'undefined') {
    // Use dynamic import to avoid blocking initial render
    void import('@/core/tokens/button-tokens-theme-system')
      .then(({ applyButtonTokensForTheme }) => {
        applyButtonTokensForTheme(preset.id);
      })
      .catch(() => {
        // Silently fail if module not loaded yet
      });
  }
}
