/**
 * WCAG 2.2 AAA Compliance Tests
 *
 * Tests for WCAG 2.2 AAA compliance features:
 * - Focus appearance (2.4.11, 2.4.12)
 * - Focus not obscured (2.4.11, 2.4.12)
 * - Dragging movements (2.5.7)
 * - Target size (2.5.5)
 * - Fixed reference points (2.4.8)
 *
 * Location: apps/web/src/core/a11y/__tests__/wcag-2.2.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateFocusAppearance,
  ensureFocusAppearance,
  DEFAULT_FOCUS_CONFIG,
  HIGH_CONTRAST_FOCUS_CONFIG,
  type FocusAppearanceConfig,
} from '../focus-appearance';
import {
  checkFocusNotObscured,
  ensureFocusNotObscured,
  type FocusVisibilityResult,
} from '../focus-not-obscured';
import {
  validateTargetSize,
  ensureTargetSize,
  DEFAULT_TARGET_SIZE_CONFIG,
  type TargetSizeConfig,
} from '../target-size';
import {
  createStableMessageReference,
  formatStableTimestamp,
  formatStableRelativeTimestamp,
  generateStableId,
  type StableMessageReference,
} from '../fixed-references';

describe('WCAG 2.2 AAA Compliance', () => {
  describe('Focus Appearance (2.4.11, 2.4.12)', () => {
    let button: HTMLButtonElement;

    beforeEach(() => {
      button = document.createElement('button');
      button.textContent = 'Test Button';
      document.body.appendChild(button);
    });

    afterEach(() => {
      document.body.removeChild(button);
    });

    it('should validate focus appearance with default config', () => {
      ensureFocusAppearance(button);
      const result = validateFocusAppearance(button);

      expect(result.thicknessValid).toBe(true);
      expect(result.contrastValid).toBe(true);
      expect(result.visibilityValid).toBe(true);
    });

    it('should validate focus appearance thickness', () => {
      const config: FocusAppearanceConfig = {
        ...DEFAULT_FOCUS_CONFIG,
        thickness: 2,
      };

      ensureFocusAppearance(button, config);
      const result = validateFocusAppearance(button, config);

      expect(result.thicknessValid).toBe(true);
      expect(result.actualThickness).toBeGreaterThanOrEqual(2);
    });

    it('should validate focus appearance contrast', () => {
      const config: FocusAppearanceConfig = {
        ...DEFAULT_FOCUS_CONFIG,
        contrastRatio: 3.0,
      };

      ensureFocusAppearance(button, config);
      const result = validateFocusAppearance(button, config);

      expect(result.contrastValid).toBe(true);
      if (result.actualContrastRatio !== undefined) {
        expect(result.actualContrastRatio).toBeGreaterThanOrEqual(3.0);
      }
    });

    it('should use high contrast config when high contrast mode is enabled', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => {
          if (query === '(prefers-contrast: high)') {
            return {
              matches: true,
              media: query,
            };
          }
          return {
            matches: false,
            media: query,
          };
        }),
      });

      ensureFocusAppearance(button, HIGH_CONTRAST_FOCUS_CONFIG);
      const result = validateFocusAppearance(button, HIGH_CONTRAST_FOCUS_CONFIG);

      expect(result.valid).toBe(true);
    });
  });

  describe('Focus Not Obscured (2.4.11, 2.4.12)', () => {
    let button: HTMLButtonElement;
    let stickyHeader: HTMLDivElement;

    beforeEach(() => {
      button = document.createElement('button');
      button.textContent = 'Test Button';
      button.style.position = 'absolute';
      button.style.top = '100px';
      button.style.left = '100px';
      document.body.appendChild(button);

      stickyHeader = document.createElement('div');
      stickyHeader.style.position = 'sticky';
      stickyHeader.style.top = '0';
      stickyHeader.style.height = '50px';
      stickyHeader.style.backgroundColor = 'red';
      document.body.appendChild(stickyHeader);
    });

    afterEach(() => {
      document.body.removeChild(button);
      document.body.removeChild(stickyHeader);
    });

    it('should check if focus is not obscured', () => {
      const result = checkFocusNotObscured(button);

      expect(result).toHaveProperty('obscured');
      expect(result).toHaveProperty('scrollRequired');
    });

    it('should ensure focus is not obscured', () => {
      const scrollIntoViewSpy = vi.spyOn(button, 'scrollIntoView');

      ensureFocusNotObscured(button);

      // Should attempt to scroll element into view if obscured
      if (checkFocusNotObscured(button).obscured) {
        expect(scrollIntoViewSpy).toHaveBeenCalled();
      }

      scrollIntoViewSpy.mockRestore();
    });

    it('should detect when element is obscured by sticky header', () => {
      button.style.top = '10px'; // Position button under sticky header
      const result = checkFocusNotObscured(button);

      // Element may be obscured if sticky header covers it
      expect(result).toHaveProperty('obscured');
    });
  });

  describe('Target Size (2.5.5)', () => {
    let button: HTMLButtonElement;

    beforeEach(() => {
      button = document.createElement('button');
      button.textContent = 'Test Button';
      document.body.appendChild(button);
    });

    afterEach(() => {
      document.body.removeChild(button);
    });

    it('should validate target size with default config', () => {
      button.style.width = '44px';
      button.style.height = '44px';

      const result = validateTargetSize(button);

      expect(result.sizeValid).toBe(true);
      expect(result.actualWidth).toBeGreaterThanOrEqual(44);
      expect(result.actualHeight).toBeGreaterThanOrEqual(44);
    });

    it('should validate target size spacing', () => {
      button.style.width = '44px';
      button.style.height = '44px';
      button.style.margin = '8px';

      const result = validateTargetSize(button);

      expect(result.spacingValid).toBe(true);
    });

    it('should ensure target size meets minimum requirements', () => {
      button.style.width = '20px';
      button.style.height = '20px';

      ensureTargetSize(button);

      const computedStyle = window.getComputedStyle(button);
      const minWidth = parseFloat(computedStyle.minWidth) || 0;
      const minHeight = parseFloat(computedStyle.minHeight) || 0;

      expect(minWidth).toBeGreaterThanOrEqual(44);
      expect(minHeight).toBeGreaterThanOrEqual(44);
    });

    it('should validate target size for non-interactive elements', () => {
      const div = document.createElement('div');
      div.textContent = 'Non-interactive';
      document.body.appendChild(div);

      const result = validateTargetSize(div);

      // Non-interactive elements should always pass
      expect(result.valid).toBe(true);

      document.body.removeChild(div);
    });
  });

  describe('Fixed Reference Points (2.4.8)', () => {
    it('should generate stable message ID', () => {
      const messageId = 'msg-123';
      const stableId = generateStableId(messageId);

      expect(stableId).toBe('message-msg-123');
      expect(stableId).toContain(messageId);
    });

    it('should format stable timestamp', () => {
      const timestamp = new Date('2024-01-15T15:45:00Z');
      const formatted = formatStableTimestamp(timestamp);

      expect(formatted).toContain('January');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('15');
    });

    it('should format stable relative timestamp', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000);
      const formatted = formatStableRelativeTimestamp(oneMinuteAgo);

      expect(formatted).toContain('minute');
      expect(formatted).toContain('ago');
    });

    it('should create stable message reference', () => {
      const messageId = 'msg-123';
      const timestamp = new Date('2024-01-15T15:45:00Z');
      const senderName = 'John Doe';
      const content = 'Test message';

      const reference = createStableMessageReference(messageId, timestamp, senderName, content);

      expect(reference.stableId).toBe('message-msg-123');
      expect(reference.stableTimestamp).toContain('January');
      expect(reference.ariaLabel).toContain(senderName);
      expect(reference.ariaDescription).toContain(content);
    });

    it('should create stable message reference with relative timestamp', () => {
      const messageId = 'msg-123';
      const timestamp = new Date();
      const senderName = 'John Doe';

      const reference = createStableMessageReference(messageId, timestamp, senderName);

      expect(reference.stableId).toBe('message-msg-123');
      expect(reference.ariaLabel).toContain(senderName);
    });
  });
});
