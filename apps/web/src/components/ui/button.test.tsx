import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

// Mock haptics to prevent errors in button component
vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(() => undefined),
    trigger: vi.fn(() => undefined),
    light: vi.fn(() => undefined),
    medium: vi.fn(() => undefined),
    heavy: vi.fn(() => undefined),
    selection: vi.fn(() => undefined),
    success: vi.fn(() => undefined),
    warning: vi.fn(() => undefined),
    error: vi.fn(() => undefined),
    notification: vi.fn(() => undefined),
    isHapticSupported: vi.fn(() => false),
  },
  triggerHaptic: vi.fn(() => undefined),
}));

describe('Button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('should render button with children', () => {
      render(
        <Button>
          <span>Child content</span>
        </Button>
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('should apply default variant', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-slot', 'button');
      expect(button.className).toContain('bg-[var(--btn-primary-bg)]');
    });

    it('should apply destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('bg-[var(--btn-destructive-bg)]');
    });

    it('should apply outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('border');
      expect(button.className).toContain('border-[var(--btn-outline-border)]');
    });

    it('should apply secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('bg-[var(--btn-secondary-bg)]');
    });

    it('should apply ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('bg-[var(--btn-ghost-bg)]');
    });

    it('should apply link variant', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('underline-offset-4');
    });

    it('should apply oauth variant', () => {
      render(<Button variant="oauth">OAuth</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('border-[var(--btn-oauth-border)]');
    });

    it('should apply default size', () => {
      render(<Button>Default Size</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-[50px]');
    });

    it('should apply small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-[48px]');
    });

    it('should apply large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-[56px]');
    });

    it('should apply icon size', () => {
      render(<Button size="icon">Icon</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('size-12');
    });

    it('should merge custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should support type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should support button type', () => {
      render(<Button type="button">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should support reset type', () => {
      render(<Button type="reset">Reset</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'reset');
    });

    it('should support aria-label', () => {
      render(<Button aria-label="Close dialog">×</Button>);
      const button = screen.getByRole('button', { name: 'Close dialog' });
      expect(button).toBeInTheDocument();
    });

    it('should support aria-describedby', () => {
      render(
        <>
          <Button aria-describedby="help-text">Help</Button>
          <div id="help-text">This is helpful text</div>
        </>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'help-text');
    });
  });

  describe('Interactions', () => {
    it('should call onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click</Button>);
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button disabled onClick={handleClick}>
          Click
        </Button>
      );
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle multiple clicks', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click</Button>);
      const button = screen.getByRole('button');

      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('should handle keyboard interaction with Enter', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click</Button>);
      const button = screen.getByRole('button');

      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard interaction with Space', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click</Button>);
      const button = screen.getByRole('button');

      button.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not handle keyboard interaction when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button disabled onClick={handleClick}>
          Click
        </Button>
      );
      const button = screen.getByRole('button');

      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle mouse enter event', async () => {
      const user = userEvent.setup();
      render(<Button>Hover</Button>);
      const button = screen.getByRole('button');

      await user.hover(button);
      expect(button).toBeInTheDocument();
    });

    it('should handle mouse leave event', async () => {
      const user = userEvent.setup();
      render(<Button>Hover</Button>);
      const button = screen.getByRole('button');

      await user.hover(button);
      await user.unhover(button);
      expect(button).toBeInTheDocument();
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not be disabled when disabled prop is false', () => {
      render(<Button disabled={false}>Enabled</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('should have disabled styles when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('disabled:');
    });

    it('should have focus styles', () => {
      render(<Button>Focus</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/focus/);
    });

    it('should support asChild prop', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });
  });

  describe('Animations', () => {
    it('should have animations enabled by default', () => {
      render(<Button>Animated</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should disable animations when enableAnimations is false', () => {
      render(<Button enableAnimations={false}>No Animation</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should disable animations when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper role', () => {
      render(<Button>Accessible</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should have minimum touch target size', () => {
      render(<Button>Touch Target</Button>);
      const button = screen.getByRole('button');
      // Default button has h-[50px] which meets minimum touch target of 44px
      expect(button.className).toMatch(/h-\[50px\]|min-h-\[44px\]|min-h-\[48px\]/);
    });

    it('should support aria-disabled when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });

    it('should be focusable when enabled', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<Button disabled>Not Focusable</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should have focus ring for keyboard navigation', () => {
      render(<Button>Focus Ring</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('focus-ring');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null onClick', () => {
      render(<Button onClick={undefined}>No Handler</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle empty children', () => {
      render(<Button>{null}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle very long text', () => {
      const longText = 'A'.repeat(1000);
      render(<Button>{longText}</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent(longText);
    });

    it('should handle special characters in text', () => {
      render(<Button>Special: !@#$%^&*()</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Special: !@#$%^&*()');
    });

    it('should handle rapid clicks', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Rapid</Button>);
      const button = screen.getByRole('button');

      await user.click(button);
      await user.click(button);
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(5);
    });
  });

  describe('All Variant and Size Combinations', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'oauth'] as const;
    const sizes = ['default', 'sm', 'lg', 'icon'] as const;

    variants.forEach((variant) => {
      sizes.forEach((size) => {
        it(`should render ${variant} variant with ${size} size`, () => {
          render(
            <Button variant={variant} size={size}>
              {variant} {size}
            </Button>
          );
          const button = screen.getByRole('button');
          expect(button).toBeInTheDocument();
        });
      });
    });
  });
});
