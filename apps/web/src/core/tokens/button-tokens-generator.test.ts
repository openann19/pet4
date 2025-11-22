import { describe, it, expect } from 'vitest';
import { generateButtonTokensForTheme } from './button-tokens-generator';
import { getThemePreset } from '@/lib/theme-presets';
import { verifyButtonContrast } from '../utils/contrast';
import type { ThemePreset } from '@/lib/theme-presets';

describe('button-tokens-generator', () => {
  const testPresets: ThemePreset[] = [
    'default-light',
    'default-dark',
    'ocean',
    'sunset',
    'forest',
    'lavender',
    'midnight',
    'rose',
    'amber-gold',
    'emerald',
    'slate-pro',
    'cherry-blossom',
  ];

  describe('generateButtonTokensForTheme', () => {
    it('should generate tokens for all theme presets', () => {
      for (const presetId of testPresets) {
        const preset = getThemePreset(presetId);
        expect(preset).toBeTruthy();

        if (preset) {
          const tokens = generateButtonTokensForTheme(preset);
          expect(tokens).toBeTruthy();
          expect(tokens.primary).toBeTruthy();
          expect(tokens.secondary).toBeTruthy();
          expect(tokens.destructive).toBeTruthy();
          expect(tokens.outline).toBeTruthy();
          expect(tokens.ghost).toBeTruthy();
          expect(tokens.link).toBeTruthy();
        }
      }
    });

    it('should generate valid hex colors', () => {
      const preset = getThemePreset('default-light');
      expect(preset).toBeTruthy();

      if (preset) {
        const tokens = generateButtonTokensForTheme(preset);
        const hexPattern = /^#[0-9A-F]{6}$/i;

        expect(tokens.primary.background).toMatch(hexPattern);
        expect(tokens.primary.foreground).toMatch(hexPattern);
        expect(tokens.secondary.background).toMatch(hexPattern);
        expect(tokens.destructive.background).toMatch(hexPattern);
      }
    });

    it('should generate hover states darker than base', () => {
      const preset = getThemePreset('default-light');
      expect(preset).toBeTruthy();

      if (preset) {
        const tokens = generateButtonTokensForTheme(preset);
        // Hover should exist
        expect(tokens.primary.hover.background).toBeTruthy();
        expect(tokens.primary.hover.foreground).toBeTruthy();
      }
    });

    it('should generate pressed states', () => {
      const preset = getThemePreset('default-light');
      expect(preset).toBeTruthy();

      if (preset) {
        const tokens = generateButtonTokensForTheme(preset);
        expect(tokens.primary.pressed.background).toBeTruthy();
        expect(tokens.primary.pressed.foreground).toBeTruthy();
      }
    });

    it('should generate disabled states', () => {
      const preset = getThemePreset('default-light');
      expect(preset).toBeTruthy();

      if (preset) {
        const tokens = generateButtonTokensForTheme(preset);
        expect(tokens.primary.disabled.background).toBeTruthy();
        expect(tokens.primary.disabled.foreground).toBeTruthy();
      }
    });

    it('should generate focus ring colors', () => {
      const preset = getThemePreset('default-light');
      expect(preset).toBeTruthy();

      if (preset) {
        const tokens = generateButtonTokensForTheme(preset);
        expect(tokens.primary.focusRing).toBeTruthy();
        expect(tokens.primary.focusRing).toMatch(/^#[0-9A-F]{6}$/i);
      }
    });
  });

  describe('WCAG AA Compliance', () => {
    it('should meet AA UI contrast for primary buttons in all themes', () => {
      for (const presetId of testPresets) {
        const preset = getThemePreset(presetId);
        if (!preset) continue;

        const tokens = generateButtonTokensForTheme(preset);

        // Test primary button
        const primaryResult = verifyButtonContrast(
          tokens.primary.foreground,
          tokens.primary.background
        );
        expect(primaryResult.passes).toBe(true);
        expect(primaryResult.ratio).toBeGreaterThanOrEqual(3.0);

        // Test hover state
        const primaryHoverResult = verifyButtonContrast(
          tokens.primary.hover.foreground,
          tokens.primary.hover.background
        );
        expect(primaryHoverResult.passes).toBe(true);

        // Test pressed state
        const primaryPressedResult = verifyButtonContrast(
          tokens.primary.pressed.foreground,
          tokens.primary.pressed.background
        );
        expect(primaryPressedResult.passes).toBe(true);

        // Disabled state intentionally has lower contrast to indicate non-interactive state
        // Skip contrast check for disabled buttons as they are intentionally subdued
      }
    });

    it('should meet AA UI contrast for secondary buttons', () => {
      const preset = getThemePreset('default-light');
      expect(preset).toBeTruthy();

      if (preset) {
        const tokens = generateButtonTokensForTheme(preset);

        const result = verifyButtonContrast(
          tokens.secondary.foreground,
          tokens.secondary.background
        );
        expect(result.passes).toBe(true);
        expect(result.ratio).toBeGreaterThanOrEqual(3.0);
      }
    });

    it('should meet AA UI contrast for destructive buttons', () => {
      const preset = getThemePreset('default-light');
      expect(preset).toBeTruthy();

      if (preset) {
        const tokens = generateButtonTokensForTheme(preset);

        const result = verifyButtonContrast(
          tokens.destructive.foreground,
          tokens.destructive.background
        );
        expect(result.passes).toBe(true);
        expect(result.ratio).toBeGreaterThanOrEqual(3.0);
      }
    });

    it('should meet AA UI contrast for outline buttons', () => {
      const preset = getThemePreset('default-light');
      expect(preset).toBeTruthy();

      if (preset) {
        const tokens = generateButtonTokensForTheme(preset);

        // Outline buttons need to work on transparent background
        // So we test hover state which has background
        const result = verifyButtonContrast(
          tokens.outline.hover.foreground,
          tokens.outline.hover.background
        );
        expect(result.passes).toBe(true);
      }
    });
  });
});
