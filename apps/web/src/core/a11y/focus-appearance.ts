/**
 * Focus Appearance Utilities (WCAG 2.2 AAA)
 *
 * Ensures focus indicators meet WCAG 2.2 AAA requirements:
 * - Minimum 2px thick focus indicator
 * - 3:1 contrast ratio against all adjacent colors
 * - Visible in all contexts (light/dark mode, high contrast)
 * - Does not rely on color alone
 *
 * Location: apps/web/src/core/a11y/focus-appearance.ts
 */

import { getContrastRatio } from '../utils/contrast';
import { createLogger } from '@/lib/logger';

const logger = createLogger('focus-appearance');

/**
 * Focus appearance configuration
 */
export interface FocusAppearanceConfig {
  readonly thickness: number; // Minimum 2px for WCAG 2.2 AAA
  readonly contrastRatio: number; // Minimum 3:1 for WCAG 2.2 AAA
  readonly offset: number; // Offset from element edge (default 2px)
  readonly color: string; // Focus ring color
  readonly style: 'solid' | 'dashed' | 'dotted' | 'double'; // Focus ring style
  readonly useOutline: boolean; // Use outline instead of box-shadow
}

/**
 * Default focus appearance configuration (WCAG 2.2 AAA compliant)
 */
export const DEFAULT_FOCUS_CONFIG: FocusAppearanceConfig = {
  thickness: 2,
  contrastRatio: 3.0,
  offset: 2,
  color: '#0066cc', // High contrast blue
  style: 'solid',
  useOutline: false,
};

/**
 * High contrast focus configuration
 */
export const HIGH_CONTRAST_FOCUS_CONFIG: FocusAppearanceConfig = {
  thickness: 3,
  contrastRatio: 4.5,
  offset: 3,
  color: '#ffffff', // White for high contrast
  style: 'solid',
  useOutline: true,
};

/**
 * Focus appearance validation result
 */
export interface FocusAppearanceValidationResult {
  readonly valid: boolean;
  readonly thicknessValid: boolean;
  readonly contrastValid: boolean;
  readonly visibilityValid: boolean;
  readonly issues: readonly string[];
  readonly actualContrastRatio?: number;
  readonly actualThickness?: number;
}

/**
 * Get adjacent colors for an element
 * Checks background, border, and surrounding elements
 */
function getAdjacentColors(element: HTMLElement): string[] {
  const colors: string[] = [];
  const computedStyle = window.getComputedStyle(element);

  // Get background color
  const bgColor = computedStyle.backgroundColor;
  if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
    colors.push(bgColor);
  }

  // Get border colors
  const borderTopColor = computedStyle.borderTopColor;
  const borderBottomColor = computedStyle.borderBottomColor;
  const borderLeftColor = computedStyle.borderLeftColor;
  const borderRightColor = computedStyle.borderRightColor;

  [borderTopColor, borderBottomColor, borderLeftColor, borderRightColor].forEach((color) => {
    if (
      color &&
      color !== 'rgba(0, 0, 0, 0)' &&
      color !== 'transparent' &&
      !colors.includes(color)
    ) {
      colors.push(color);
    }
  });

  // Get parent background color
  const parent = element.parentElement;
  if (parent) {
    const parentStyle = window.getComputedStyle(parent);
    const parentBgColor = parentStyle.backgroundColor;
    if (parentBgColor && parentBgColor !== 'rgba(0, 0, 0, 0)' && parentBgColor !== 'transparent') {
      colors.push(parentBgColor);
    }
  }

  return colors;
}

/**
 * Convert RGB/RGBA color to hex
 */
function rgbToHex(rgb: string): string {
  const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/.exec(rgb);
  if (!match) {
    return rgb; // Already hex or invalid
  }

  const r = parseInt(match[1] ?? '0', 10);
  const g = parseInt(match[2] ?? '0', 10);
  const b = parseInt(match[3] ?? '0', 10);

  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Check if focus indicator has sufficient contrast against all adjacent colors
 */
function checkContrastAgainstAdjacentColors(
  focusColor: string,
  adjacentColors: string[],
  minContrast: number
): { valid: boolean; minRatio: number; failingColors: string[] } {
  const focusHex = rgbToHex(focusColor);
  let minRatio = Infinity;
  const failingColors: string[] = [];

  for (const adjacentColor of adjacentColors) {
    const adjacentHex = rgbToHex(adjacentColor);
    try {
      const ratio = getContrastRatio(focusHex, adjacentHex);
      minRatio = Math.min(minRatio, ratio);

      if (ratio < minContrast) {
        failingColors.push(adjacentColor);
      }
    } catch (error) {
      // Invalid color, skip
      logger.warn(
        'Invalid color for contrast check',
        error instanceof Error ? error : new Error(String(error)),
        {
          color: adjacentColor,
        }
      );
    }
  }

  return {
    valid: failingColors.length === 0,
    minRatio: minRatio === Infinity ? 0 : minRatio,
    failingColors,
  };
}

/**
 * Get computed focus indicator thickness
 */
function getComputedFocusThickness(element: HTMLElement): number {
  const computedStyle = window.getComputedStyle(element, ':focus');

  // Check outline width
  const outlineWidth = computedStyle.outlineWidth;
  if (outlineWidth) {
    const width = parseFloat(outlineWidth);
    if (!Number.isNaN(width) && width > 0) {
      return width;
    }
  }

  // Check box-shadow (common for focus rings)
  const boxShadow = computedStyle.boxShadow;
  if (boxShadow && boxShadow !== 'none') {
    // Box shadow format: offset-x offset-y blur-radius spread-radius color
    const parts = boxShadow.split(' ');
    if (parts.length >= 4) {
      const spread = parseFloat(parts[3] ?? '0');
      if (!Number.isNaN(spread) && spread > 0) {
        return spread;
      }
    }
  }

  return 0;
}

/**
 * Validate focus appearance for an element
 */
export function validateFocusAppearance(
  element: HTMLElement,
  config: FocusAppearanceConfig = DEFAULT_FOCUS_CONFIG
): FocusAppearanceValidationResult {
  const issues: string[] = [];

  // Check if element is focusable
  if (
    !element.hasAttribute('tabindex') &&
    element.tagName !== 'BUTTON' &&
    element.tagName !== 'A' &&
    element.tagName !== 'INPUT' &&
    element.tagName !== 'TEXTAREA' &&
    element.tagName !== 'SELECT'
  ) {
    issues.push('Element is not focusable');
    return {
      valid: false,
      thicknessValid: false,
      contrastValid: false,
      visibilityValid: false,
      issues,
    };
  }

  // Focus the element temporarily to check styles
  const wasFocused = document.activeElement === element;
  if (!wasFocused) {
    element.focus();
  }

  try {
    // Check thickness
    const computedThickness = getComputedFocusThickness(element);
    const thicknessValid = computedThickness >= config.thickness;
    if (!thicknessValid) {
      issues.push(
        `Focus indicator thickness (${computedThickness}px) is less than required (${config.thickness}px)`
      );
    }

    // Check contrast against adjacent colors
    const adjacentColors = getAdjacentColors(element);
    const focusColor = config.color;
    const contrastCheck = checkContrastAgainstAdjacentColors(
      focusColor,
      adjacentColors,
      config.contrastRatio
    );

    const contrastValid = contrastCheck.valid;
    if (!contrastValid) {
      issues.push(
        `Focus indicator does not meet ${config.contrastRatio}:1 contrast ratio against adjacent colors. Minimum ratio: ${contrastCheck.minRatio.toFixed(2)}:1`
      );
      if (contrastCheck.failingColors.length > 0) {
        issues.push(`Failing colors: ${contrastCheck.failingColors.join(', ')}`);
      }
    }

    // Check visibility (focus indicator must be visible)
    const computedStyle = window.getComputedStyle(element, ':focus');
    const outline = computedStyle.outline;
    const boxShadow = computedStyle.boxShadow;

    const hasOutline = Boolean(outline && outline !== 'none' && outline !== '0px');
    const hasBoxShadow = Boolean(boxShadow && boxShadow !== 'none');

    const visibilityValid = hasOutline || hasBoxShadow;
    if (!visibilityValid) {
      issues.push('Focus indicator is not visible (no outline or box-shadow)');
    }

    return {
      valid: thicknessValid && contrastValid && visibilityValid,
      thicknessValid,
      contrastValid,
      visibilityValid,
      issues,
      actualContrastRatio: contrastCheck.minRatio,
      actualThickness: computedThickness,
    };
  } finally {
    // Restore focus state
    if (!wasFocused && document.activeElement === element) {
      element.blur();
    }
  }
}

/**
 * Ensure focus appearance meets WCAG 2.2 AAA requirements
 */
export function ensureFocusAppearance(
  element: HTMLElement,
  config: FocusAppearanceConfig = DEFAULT_FOCUS_CONFIG
): void {
  // Check if high contrast mode is enabled
  const isHighContrast =
    window.matchMedia('(prefers-contrast: high)').matches ??
    window.matchMedia('(-ms-high-contrast: active)').matches;
  const activeConfig = isHighContrast ? HIGH_CONTRAST_FOCUS_CONFIG : config;

  // Apply focus styles
  const style = element.style;

  // Remove existing focus styles
  element.classList.remove('focus-ring', 'focus-visible-ring');

  // Add focus ring class
  element.classList.add('focus-ring');

  // Apply inline styles if needed
  if (activeConfig.useOutline) {
    style.outline = `${activeConfig.thickness}px ${activeConfig.style} ${activeConfig.color}`;
    style.outlineOffset = `${activeConfig.offset}px`;
  } else {
    // Use box-shadow for focus ring (doesn't affect layout)
    const shadowBlur = activeConfig.thickness * 2;
    const shadowSpread = activeConfig.thickness;
    style.boxShadow = `0 0 0 ${shadowSpread}px ${activeConfig.color}, 0 0 ${shadowBlur}px ${shadowBlur}px rgba(0, 0, 0, 0.1)`;
  }

  logger?.debug?.('Applied focus appearance', {
    element: element.tagName,
    config: activeConfig,
  });
}

/**
 * Get focus appearance CSS for a given configuration
 */
export function getFocusAppearanceCSS(
  config: FocusAppearanceConfig = DEFAULT_FOCUS_CONFIG
): string {
  if (config.useOutline) {
    return `
      outline: ${config.thickness}px ${config.style} ${config.color};
      outline-offset: ${config.offset}px;
    `;
  }

  const shadowBlur = config.thickness * 2;
  const shadowSpread = config.thickness;
  return `
    box-shadow: 0 0 0 ${shadowSpread}px ${config.color}, 0 0 ${shadowBlur}px ${shadowBlur}px rgba(0, 0, 0, 0.1);
  `;
}

/**
 * Batch validate focus appearance for multiple elements
 */
export function validateFocusAppearanceBatch(
  elements: readonly HTMLElement[],
  config: FocusAppearanceConfig = DEFAULT_FOCUS_CONFIG
): readonly FocusAppearanceValidationResult[] {
  return elements.map((element) => validateFocusAppearance(element, config));
}
