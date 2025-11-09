/**
 * Focus Appearance Integration Tests
 *
 * Tests focus appearance utilities integration in components.
 *
 * Location: apps/web/src/core/a11y/__tests__/focus-appearance-integration.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/enhanced/buttons/IconButton';
import { Heart } from '@phosphor-icons/react';
import { ensureFocusAppearance, validateFocusAppearance } from '../focus-appearance';

describe('Focus Appearance Integration', () => {
  beforeEach(() => {
    // Clear any existing focus styles
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Button Component', () => {
    it('should have focus appearance applied on mount', () => {
      render(<Button>Test Button</Button>);

      const button = screen.getByRole('button', { name: 'Test Button' });
      expect(button).toBeInTheDocument();

      // Focus the button
      button.focus();

      // Check if focus ring class is applied
      expect(button.classList.contains('focus-ring')).toBe(true);

      // Validate focus appearance
      const result = validateFocusAppearance(button);
      expect(result.valid).toBe(true);
    });

    it('should have visible focus indicator on keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Button>Test Button</Button>);

      const button = screen.getByRole('button', { name: 'Test Button' });
      await user.tab();

      // Check if button is focused
      expect(button).toHaveFocus();

      // Check focus styles
      const styles = window.getComputedStyle(button, ':focus-visible');
      expect(styles.outline).not.toBe('none');
    });
  });

  describe('IconButton Component', () => {
    it('should have focus appearance applied on mount', () => {
      render(
        <IconButton icon={<Heart />} aria-label="Like">
          <Heart />
        </IconButton>
      );

      const button = screen.getByRole('button', { name: 'Like' });
      expect(button).toBeInTheDocument();

      // Focus the button
      button.focus();

      // Validate focus appearance
      const result = validateFocusAppearance(button);
      expect(result.valid).toBe(true);
    });

    it('should meet minimum focus indicator requirements', async () => {
      const user = userEvent.setup();
      render(
        <IconButton icon={<Heart />} aria-label="Like">
          <Heart />
        </IconButton>
      );

      const button = screen.getByRole('button', { name: 'Like' });
      await user.tab();

      // Check focus indicator thickness (minimum 2px)
      const styles = window.getComputedStyle(button, ':focus-visible');
      const outlineWidth = parseFloat(styles.outlineWidth || '0');
      expect(outlineWidth).toBeGreaterThanOrEqual(2);
    });
  });

  describe('ensureFocusAppearance', () => {
    it('should apply focus appearance to element', () => {
      const element = document.createElement('button');
      document.body.appendChild(element);

      ensureFocusAppearance(element);

      // Check if focus-ring class is applied
      expect(element.classList.contains('focus-ring')).toBe(true);

      // Validate focus appearance
      const result = validateFocusAppearance(element);
      expect(result.valid).toBe(true);
    });

    it('should handle disabled elements', () => {
      const element = document.createElement('button');
      element.disabled = true;
      document.body.appendChild(element);

      ensureFocusAppearance(element);

      // Disabled elements should still have focus-ring class for styling
      expect(element.classList.contains('focus-ring')).toBe(true);
    });
  });
});
