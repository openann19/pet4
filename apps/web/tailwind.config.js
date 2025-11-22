import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
const DEFAULT_THEME = {
  container: {
    center: true,
    padding: '2rem',
  },
  extend: {
    screens: {
      coarse: { raw: '(pointer: coarse)' },
      fine: { raw: '(pointer: fine)' },
      pwa: { raw: '(display-mode: standalone)' },
    },
    colors: {
      neutral: {
        1: 'var(--color-neutral-1)',
        2: 'var(--color-neutral-2)',
        3: 'var(--color-neutral-3)',
        4: 'var(--color-neutral-4)',
        5: 'var(--color-neutral-5)',
        6: 'var(--color-neutral-6)',
        7: 'var(--color-neutral-7)',
        8: 'var(--color-neutral-8)',
        9: 'var(--color-neutral-9)',
        10: 'var(--color-neutral-10)',
        11: 'var(--color-neutral-11)',
        12: 'var(--color-neutral-12)',
        a1: 'var(--color-neutral-a1)',
        a2: 'var(--color-neutral-a2)',
        a3: 'var(--color-neutral-a3)',
        a4: 'var(--color-neutral-a4)',
        a5: 'var(--color-neutral-a5)',
        a6: 'var(--color-neutral-a6)',
        a7: 'var(--color-neutral-a7)',
        a8: 'var(--color-neutral-a8)',
        a9: 'var(--color-neutral-a9)',
        a10: 'var(--color-neutral-a10)',
        a11: 'var(--color-neutral-a11)',
        a12: 'var(--color-neutral-a12)',
        contrast: 'var(--color-neutral-contrast)',
      },
      accent: {
        1: 'var(--color-accent-1)',
        2: 'var(--color-accent-2)',
        3: 'var(--color-accent-3)',
        4: 'var(--color-accent-4)',
        5: 'var(--color-accent-5)',
        6: 'var(--color-accent-6)',
        7: 'var(--color-accent-7)',
        8: 'var(--color-accent-8)',
        9: 'var(--color-accent-9)',
        10: 'var(--color-accent-10)',
        11: 'var(--color-accent-11)',
        12: 'var(--color-accent-12)',
        contrast: 'var(--color-accent-contrast)',
      },
      'accent-secondary': {
        1: 'var(--color-accent-secondary-1)',
        2: 'var(--color-accent-secondary-2)',
        3: 'var(--color-accent-secondary-3)',
        4: 'var(--color-accent-secondary-4)',
        5: 'var(--color-accent-secondary-5)',
        6: 'var(--color-accent-secondary-6)',
        7: 'var(--color-accent-secondary-7)',
        8: 'var(--color-accent-secondary-8)',
        9: 'var(--color-accent-secondary-9)',
        10: 'var(--color-accent-secondary-10)',
        11: 'var(--color-accent-secondary-11)',
        12: 'var(--color-accent-secondary-12)',
        contrast: 'var(--color-accent-secondary-contrast)',
      },
      background: 'var(--color-background)',
      foreground: 'var(--color-foreground)',
      card: {
        DEFAULT: 'var(--color-card)',
        foreground: 'var(--color-card-foreground)',
      },
      popover: {
        DEFAULT: 'var(--color-popover)',
        foreground: 'var(--color-popover-foreground)',
      },
      primary: {
        DEFAULT: 'var(--color-primary)',
        foreground: 'var(--color-primary-foreground)',
      },
      secondary: {
        DEFAULT: 'var(--color-secondary)',
        foreground: 'var(--color-secondary-foreground)',
      },
      muted: {
        DEFAULT: 'var(--color-muted)',
        foreground: 'var(--color-muted-foreground)',
      },
      accent: {
        DEFAULT: 'var(--color-accent)',
        foreground: 'var(--color-accent-foreground)',
        1: 'var(--color-accent-1)',
        2: 'var(--color-accent-2)',
        3: 'var(--color-accent-3)',
        4: 'var(--color-accent-4)',
        5: 'var(--color-accent-5)',
        6: 'var(--color-accent-6)',
        7: 'var(--color-accent-7)',
        8: 'var(--color-accent-8)',
        9: 'var(--color-accent-9)',
        10: 'var(--color-accent-10)',
        11: 'var(--color-accent-11)',
        12: 'var(--color-accent-12)',
        contrast: 'var(--color-accent-contrast)',
      },
      info: {
        DEFAULT: 'var(--color-info)',
        foreground: 'var(--color-info-foreground)',
      },
      success: {
        DEFAULT: 'var(--color-success)',
        foreground: 'var(--color-success-foreground)',
      },
      warning: {
        DEFAULT: 'var(--color-warning)',
        foreground: 'var(--color-warning-foreground)',
      },
      destructive: {
        DEFAULT: 'var(--color-destructive)',
        foreground: 'var(--color-destructive-foreground)',
      },
      fg: {
        DEFAULT: 'var(--color-foreground)',
        secondary: 'var(--color-text-secondary)',
      },
      bg: {
        DEFAULT: 'var(--color-background)',
        inset: 'var(--color-surface)',
        overlay: 'var(--color-card)',
      },
      'focus-ring': 'var(--color-focus-ring)',
      border: 'var(--color-border)',
      input: 'var(--color-input)',
      ring: 'var(--color-ring)',
      brand: '#3B82F6',
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
    borderRadius: {
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      xl: 'var(--radius-xl)',
      '2xl': 'var(--radius-2xl)',
      full: 'var(--radius-full)',
    },
    keyframes: {
      shimmer: {
        '0%': { transform: 'translateX(-100%)' },
        '100%': { transform: 'translateX(100%)' },
      },
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      fadeOut: {
        '0%': { opacity: '1' },
        '100%': { opacity: '0' },
      },
      slideIn: {
        '0%': { transform: 'translateX(-100%)', opacity: '0' },
        '100%': { transform: 'translateX(0)', opacity: '1' },
      },
      slideOut: {
        '0%': { transform: 'translateX(0)', opacity: '1' },
        '100%': { transform: 'translateX(100%)', opacity: '0' },
      },
      slideInUp: {
        '0%': { transform: 'translateY(100%)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      slideInDown: {
        '0%': { transform: 'translateY(-100%)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      scaleIn: {
        '0%': { transform: 'scale(0.95)', opacity: '0' },
        '100%': { transform: 'scale(1)', opacity: '1' },
      },
      scaleOut: {
        '0%': { transform: 'scale(1)', opacity: '1' },
        '100%': { transform: 'scale(0.95)', opacity: '0' },
      },
      bounce: {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-25%)' },
      },
      pulse: {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.5' },
      },
    },
    animation: {
      shimmer: 'shimmer 2s infinite',
      fadeIn: 'fadeIn 0.3s ease-in forwards',
      fadeOut: 'fadeOut 0.3s ease-out forwards',
      slideIn: 'slideIn 0.5s ease-out forwards',
      slideOut: 'slideOut 0.5s ease-in forwards',
      slideInUp: 'slideInUp 0.5s ease-out forwards',
      slideInDown: 'slideInDown 0.5s ease-out forwards',
      scaleIn: 'scaleIn 0.3s ease-out forwards',
      scaleOut: 'scaleOut 0.3s ease-in forwards',
      bounce: 'bounce 1s infinite',
      pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
  },
  spacing: {
    px: 'var(--size-px)',
    0: 'var(--size-0)',
    0.5: 'var(--size-0-5)',
    1: 'var(--size-1)',
    1.5: 'var(--size-1-5)',
    2: 'var(--size-2)',
    2.5: 'var(--size-2-5)',
    3: 'var(--size-3)',
    3.5: 'var(--size-3-5)',
    4: 'var(--size-4)',
    5: 'var(--size-5)',
    6: 'var(--size-6)',
    7: 'var(--size-7)',
    8: 'var(--size-8)',
    9: 'var(--size-9)',
    10: 'var(--size-10)',
    11: 'var(--size-11)',
    12: 'var(--size-12)',
    14: 'var(--size-14)',
    16: 'var(--size-16)',
    20: 'var(--size-20)',
    24: 'var(--size-24)',
    28: 'var(--size-28)',
    32: 'var(--size-32)',
    36: 'var(--size-36)',
    40: 'var(--size-40)',
    44: 'var(--size-44)',
    48: 'var(--size-48)',
    52: 'var(--size-52)',
    56: 'var(--size-56)',
    60: 'var(--size-60)',
    64: 'var(--size-64)',
    72: 'var(--size-72)',
    80: 'var(--size-80)',
    96: 'var(--size-96)',
  },
  darkMode: ['selector', '[data-appearance="dark"]'],
};

const themePath = path.join(__dirname, 'theme.json');

const loadCustomTheme = () => {
  if (!fs.existsSync(themePath)) {
    return {};
  }

  try {
    const contents = fs.readFileSync(themePath, 'utf-8');
    return JSON.parse(contents);
  } catch (error) {
    // Invalid theme file - return empty object to use defaults
    // Errors are handled silently as theme.json is optional
    return {};
  }
};

// Note: Using shallow merge. For nested theme overrides, consider using a deep merge utility.
const theme = Object.freeze({ ...DEFAULT_THEME, ...loadCustomTheme() });

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme,
  plugins: [
    require('./tailwind-plugin-linear-gradient'),
  ],
};
