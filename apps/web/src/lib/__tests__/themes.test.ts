/**
 * Theme Utilities Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { applyTheme, initializeTheme, type ThemeMode } from '../themes';

describe('themes', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.cssText = '';
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.cssText = '';
  });

  describe('applyTheme', () => {
    it('applies dark theme by adding dark class', () => {
      applyTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('applies light theme by removing dark class', () => {
      document.documentElement.classList.add('dark');
      applyTheme('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('handles multiple calls correctly', () => {
      applyTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      applyTheme('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      applyTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('injects CSS variables for light theme', () => {
      applyTheme('light');
      const background = document.documentElement.style.getPropertyValue('--color-background');
      expect(background).toBeTruthy();
      expect(background).toContain('oklch');
    });

    it('injects CSS variables for dark theme', () => {
      applyTheme('dark');
      const background = document.documentElement.style.getPropertyValue('--color-background');
      expect(background).toBeTruthy();
      expect(background).toContain('oklch');
    });

    it('injects spacing tokens as CSS variables', () => {
      applyTheme('light');
      const spacing = document.documentElement.style.getPropertyValue('--spacing-4');
      expect(spacing).toBe('16px');
    });

    it('injects radius tokens as CSS variables', () => {
      applyTheme('light');
      const radius = document.documentElement.style.getPropertyValue('--radius-md');
      expect(radius).toBe('8px');
    });

    it('injects shadow tokens as CSS variables', () => {
      applyTheme('light');
      const shadow = document.documentElement.style.getPropertyValue('--shadow-sm');
      expect(shadow).toBeTruthy();
    });

    it('injects typography tokens as CSS variables', () => {
      applyTheme('light');
      const fontSize = document.documentElement.style.getPropertyValue('--font-size-base');
      expect(fontSize).toBe('16px');
    });

    it('handles SSR scenario gracefully', () => {
      expect(() => applyTheme('dark')).not.toThrow();
      expect(() => applyTheme('light')).not.toThrow();
    });
  });

  describe('initializeTheme', () => {
    it('initializes theme with default light mode', () => {
      initializeTheme();
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      const background = document.documentElement.style.getPropertyValue('--color-background');
      expect(background).toBeTruthy();
    });

    it('initializes theme with specified mode', () => {
      initializeTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      const background = document.documentElement.style.getPropertyValue('--color-background');
      expect(background).toBeTruthy();
    });
  });

  describe('ThemeMode type', () => {
    it('accepts valid theme modes', () => {
      const lightMode: ThemeMode = 'light';
      const darkMode: ThemeMode = 'dark';

      expect(lightMode).toBe('light');
      expect(darkMode).toBe('dark');
    });
  });
});
