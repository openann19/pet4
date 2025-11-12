/**
 * Target Size Integration Tests
 *
 * Tests target size validation integration in components.
 *
 * Location: apps/web/src/core/a11y/__tests__/target-size-integration.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/enhanced/buttons/IconButton';
import { ReactionButton } from '@/components/chat/components/ReactionButton';
import { StickerButton } from '@/components/chat/components/StickerButton';
import { Heart } from '@phosphor-icons/react';
import { validateTargetSize } from '../target-size';

describe('Target Size Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Cleanup
  });

  describe('Button Component', () => {
    it('should meet minimum target size requirements', () => {
      render(<Button>Test Button</Button>);

      const button = screen.getByRole('button', { name: 'Test Button' });
      const rect = button.getBoundingClientRect();

      // Check minimum 44x44px target size
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);

      // Validate target size
      const result = validateTargetSize(button);
      expect(result.valid).toBe(true);
    });

    it('should validate target size programmatically', () => {
      render(<Button size="sm">Small Button</Button>);

      const button = screen.getByRole('button', { name: 'Small Button' });
      const result = validateTargetSize(button);

      // Small buttons should still meet 44x44px minimum
      expect(result.valid).toBe(true);
      expect(result.width).toBeGreaterThanOrEqual(44);
      expect(result.height).toBeGreaterThanOrEqual(44);
    });
  });

  describe('IconButton Component', () => {
    it('should meet minimum target size requirements', () => {
      render(
        <IconButton icon={<Heart />} aria-label="Like">
          <Heart />
        </IconButton>
      );

      const button = screen.getByRole('button', { name: 'Like' });
      const rect = button.getBoundingClientRect();

      // Check minimum 44x44px target size
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);

      // Validate target size
      const result = validateTargetSize(button);
      expect(result.valid).toBe(true);
    });

    it('should validate different sizes', () => {
      const { rerender } = render(
        <IconButton icon={<Heart />} aria-label="Like" size="sm">
          <Heart />
        </IconButton>
      );

      let button = screen.getByRole('button', { name: 'Like' });
      let result = validateTargetSize(button);
      expect(result.valid).toBe(true);

      rerender(
        <IconButton icon={<Heart />} aria-label="Like" size="md">
          <Heart />
        </IconButton>
      );

      button = screen.getByRole('button', { name: 'Like' });
      result = validateTargetSize(button);
      expect(result.valid).toBe(true);

      rerender(
        <IconButton icon={<Heart />} aria-label="Like" size="lg">
          <Heart />
        </IconButton>
      );

      button = screen.getByRole('button', { name: 'Like' });
      result = validateTargetSize(button);
      expect(result.valid).toBe(true);
    });
  });

  describe('Chat Button Components', () => {
    it('should validate ReactionButton target size', () => {
      render(<ReactionButton emoji="❤️" onClick={() => {}} />);

      const button = screen.getByRole('button');
      const result = validateTargetSize(button);

      expect(result.valid).toBe(true);
      expect(result.width).toBeGreaterThanOrEqual(44);
      expect(result.height).toBeGreaterThanOrEqual(44);
    });

    it('should validate StickerButton target size', () => {
      render(
        <StickerButton
          sticker={{ id: '1', emoji: '😀' }}
          onSelect={() => {}}
        />
      );

      const button = screen.getByRole('button');
      const result = validateTargetSize(button);

      expect(result.valid).toBe(true);
      expect(result.width).toBeGreaterThanOrEqual(44);
      expect(result.height).toBeGreaterThanOrEqual(44);
    });
  });

  describe('validateTargetSize', () => {
    it('should validate element target size', () => {
      const element = document.createElement('button');
      element.style.width = '44px';
      element.style.height = '44px';
      document.body.appendChild(element);

      const result = validateTargetSize(element);
      expect(result.valid).toBe(true);
      expect(result.width).toBe(44);
      expect(result.height).toBe(44);
    });

    it('should fail validation for elements smaller than 44x44px', () => {
      const element = document.createElement('button');
      element.style.width = '30px';
      element.style.height = '30px';
      document.body.appendChild(element);

      const result = validateTargetSize(element);
      expect(result.valid).toBe(false);
      expect(result.width).toBeLessThan(44);
      expect(result.height).toBeLessThan(44);
    });
  });
});
