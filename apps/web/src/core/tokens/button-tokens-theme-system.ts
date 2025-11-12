/**
 * Button Tokens Theme System
 *
 * Dynamically applies button tokens when theme presets change
 */

import type { ThemePreset } from '@/lib/theme-presets';
import { getThemePreset } from '@/lib/theme-presets';
import { generateButtonTokensForTheme } from './button-tokens-generator';

/**
 * Apply button tokens to CSS variables for a theme preset
 */
export function applyButtonTokensForTheme(presetId: ThemePreset): void {
  const preset = getThemePreset(presetId);
  if (!preset) return;

  const tokens = generateButtonTokensForTheme(preset);
  const root = document.documentElement;

  // Primary button
  root.style.setProperty('--btn-primary-bg', tokens.primary.background);
  root.style.setProperty('--btn-primary-fg', tokens.primary.foreground);
  root.style.setProperty('--btn-primary-hover-bg', tokens.primary.hover.background);
  root.style.setProperty('--btn-primary-hover-fg', tokens.primary.hover.foreground);
  root.style.setProperty('--btn-primary-press-bg', tokens.primary.pressed.background);
  root.style.setProperty('--btn-primary-press-fg', tokens.primary.pressed.foreground);
  root.style.setProperty('--btn-primary-disabled-bg', tokens.primary.disabled.background);
  root.style.setProperty('--btn-primary-disabled-fg', tokens.primary.disabled.foreground);
  root.style.setProperty('--btn-primary-focus-ring', tokens.primary.focusRing);

  // Secondary button
  root.style.setProperty('--btn-secondary-bg', tokens.secondary.background);
  root.style.setProperty('--btn-secondary-fg', tokens.secondary.foreground);
  root.style.setProperty('--btn-secondary-hover-bg', tokens.secondary.hover.background);
  root.style.setProperty('--btn-secondary-hover-fg', tokens.secondary.hover.foreground);
  root.style.setProperty('--btn-secondary-press-bg', tokens.secondary.pressed.background);
  root.style.setProperty('--btn-secondary-press-fg', tokens.secondary.pressed.foreground);
  root.style.setProperty('--btn-secondary-disabled-bg', tokens.secondary.disabled.background);
  root.style.setProperty('--btn-secondary-disabled-fg', tokens.secondary.disabled.foreground);
  root.style.setProperty('--btn-secondary-focus-ring', tokens.secondary.focusRing);

  // Destructive button
  root.style.setProperty('--btn-destructive-bg', tokens.destructive.background);
  root.style.setProperty('--btn-destructive-fg', tokens.destructive.foreground);
  root.style.setProperty('--btn-destructive-hover-bg', tokens.destructive.hover.background);
  root.style.setProperty('--btn-destructive-hover-fg', tokens.destructive.hover.foreground);
  root.style.setProperty('--btn-destructive-press-bg', tokens.destructive.pressed.background);
  root.style.setProperty('--btn-destructive-press-fg', tokens.destructive.pressed.foreground);
  root.style.setProperty('--btn-destructive-disabled-bg', tokens.destructive.disabled.background);
  root.style.setProperty('--btn-destructive-disabled-fg', tokens.destructive.disabled.foreground);
  root.style.setProperty('--btn-destructive-focus-ring', tokens.destructive.focusRing);

  // Outline button
  root.style.setProperty('--btn-outline-border', tokens.outline.border);
  root.style.setProperty('--btn-outline-bg', tokens.outline.background);
  root.style.setProperty('--btn-outline-fg', tokens.outline.foreground);
  root.style.setProperty('--btn-outline-hover-border', tokens.outline.hover.border);
  root.style.setProperty('--btn-outline-hover-bg', tokens.outline.hover.background);
  root.style.setProperty('--btn-outline-hover-fg', tokens.outline.hover.foreground);
  root.style.setProperty('--btn-outline-press-border', tokens.outline.pressed.border);
  root.style.setProperty('--btn-outline-press-bg', tokens.outline.pressed.background);
  root.style.setProperty('--btn-outline-press-fg', tokens.outline.pressed.foreground);
  root.style.setProperty('--btn-outline-disabled-border', tokens.outline.disabled.border);
  root.style.setProperty('--btn-outline-disabled-bg', tokens.outline.disabled.background);
  root.style.setProperty('--btn-outline-disabled-fg', tokens.outline.disabled.foreground);
  root.style.setProperty('--btn-outline-focus-ring', tokens.outline.focusRing);

  // Ghost button
  root.style.setProperty('--btn-ghost-bg', tokens.ghost.background);
  root.style.setProperty('--btn-ghost-fg', tokens.ghost.foreground);
  root.style.setProperty('--btn-ghost-hover-bg', tokens.ghost.hover.background);
  root.style.setProperty('--btn-ghost-hover-fg', tokens.ghost.hover.foreground);
  root.style.setProperty('--btn-ghost-press-bg', tokens.ghost.pressed.background);
  root.style.setProperty('--btn-ghost-press-fg', tokens.ghost.pressed.foreground);
  root.style.setProperty('--btn-ghost-disabled-bg', tokens.ghost.disabled.background);
  root.style.setProperty('--btn-ghost-disabled-fg', tokens.ghost.disabled.foreground);
  root.style.setProperty('--btn-ghost-focus-ring', tokens.ghost.focusRing);

  // Link button
  root.style.setProperty('--btn-link-fg', tokens.link.foreground);
  root.style.setProperty('--btn-link-hover-fg', tokens.link.hover.foreground);
  root.style.setProperty('--btn-link-disabled-fg', tokens.link.disabled.foreground);
  root.style.setProperty('--btn-link-focus-ring', tokens.link.focusRing);
}
