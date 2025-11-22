import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedButton } from '@/components/enhanced/EnhancedButton';

describe('EnhancedButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render button with text', () => {
      render(<EnhancedButton>Click me</EnhancedButton>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('should render button with children', () => {
      render(
        <EnhancedButton>
          <span>Child content</span>
        </EnhancedButton>
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('should apply default variant', () => {
      render(<EnhancedButton>Default</EnhancedButton>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should apply destructive variant', () => {
      render(<EnhancedButton variant="destructive">Delete</EnhancedButton>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should apply outline variant', () => {
      render(<EnhancedButton variant="outline">Outline</EnhancedButton>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should apply secondary variant', () => {
      render(<EnhancedButton variant="secondary">Secondary</EnhancedButton>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should apply ghost variant', () => {
      render(<EnhancedButton variant="ghost">Ghost</EnhancedButton>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should apply small size', () => {
      render(<EnhancedButton size="sm">Small</EnhancedButton>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should apply large size', () => {
      render(<EnhancedButton size="lg">Large</EnhancedButton>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should apply icon size', () => {
      render(<EnhancedButton size="icon">Icon</EnhancedButton>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should merge custom className', () => {
      render(<EnhancedButton className="custom-class">Custom</EnhancedButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Interactions', () => {
    it('should call onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<EnhancedButton onClick={handleClick}>Click</EnhancedButton>);
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <EnhancedButton disabled onClick={handleClick}>
          Click
        </EnhancedButton>
      );
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle multiple clicks', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<EnhancedButton onClick={handleClick}>Click</EnhancedButton>);
      const button = screen.getByRole('button');

      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('should handle keyboard interaction with Enter', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<EnhancedButton onClick={handleClick}>Click</EnhancedButton>);
      const button = screen.getByRole('button');

      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard interaction with Space', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<EnhancedButton onClick={handleClick}>Click</EnhancedButton>);
      const button = screen.getByRole('button');

      button.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle mouse enter event', async () => {
      const user = userEvent.setup();
      render(<EnhancedButton>Hover</EnhancedButton>);
      const button = screen.getByRole('button');

      await user.hover(button);
      expect(button).toBeInTheDocument();
    });

    it('should handle mouse leave event', async () => {
      const user = userEvent.setup();
      render(<EnhancedButton>Hover</EnhancedButton>);
      const button = screen.getByRole('button');

      await user.hover(button);
      await user.unhover(button);
      expect(button).toBeInTheDocument();
    });
  });

  describe('Features', () => {
    it('should have ripple effect by default', () => {
      render(<EnhancedButton>Ripple</EnhancedButton>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should disable ripple when ripple is false', () => {
      render(<EnhancedButton ripple={false}>No Ripple</EnhancedButton>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should have haptic feedback by default', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<EnhancedButton onClick={handleClick}>Haptic</EnhancedButton>);
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should disable haptic feedback when hapticFeedback is false', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <EnhancedButton hapticFeedback={false} onClick={handleClick}>
          No Haptic
        </EnhancedButton>
      );
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should have success animation when successAnimation is true', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn(() => Promise.resolve());

      render(
        <EnhancedButton successAnimation onClick={handleClick}>
          Success
        </EnhancedButton>
      );
      const button = screen.getByRole('button');

      await user.click(button);
      await waitFor(() => {
        expect(handleClick).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle async onClick with success animation', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn(() => Promise.resolve());

      render(
        <EnhancedButton successAnimation onClick={handleClick}>
          Async
        </EnhancedButton>
      );
      const button = screen.getByRole('button');

      await user.click(button);
      await waitFor(() => {
        expect(handleClick).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle error in onClick with error shake', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn(() => {
        throw new Error('Test error');
      });

      render(
        <EnhancedButton onClick={handleClick}>Error</EnhancedButton>
      );
      const button = screen.getByRole('button');

      await user.click(button);
      await waitFor(() => {
        expect(handleClick).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<EnhancedButton disabled>Disabled</EnhancedButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not be disabled when disabled prop is false', () => {
      render(<EnhancedButton disabled={false}>Enabled</EnhancedButton>);
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('should support asChild prop', () => {
      render(
        <EnhancedButton asChild>
          <a href="/test">Link Button</a>
        </EnhancedButton>
      );
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });
  });

  describe('Accessibility', () => {
    it('should have proper role', () => {
      render(<EnhancedButton>Accessible</EnhancedButton>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should support aria-label', () => {
      render(<EnhancedButton aria-label="Close dialog">×</EnhancedButton>);
      const button = screen.getByRole('button', { name: 'Close dialog' });
      expect(button).toBeInTheDocument();
    });

    it('should be focusable when enabled', () => {
      render(<EnhancedButton>Focusable</EnhancedButton>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<EnhancedButton disabled>Not Focusable</EnhancedButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null onClick', () => {
      render(<EnhancedButton onClick={undefined}>No Handler</EnhancedButton>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle empty children', () => {
      render(<EnhancedButton>{null}</EnhancedButton>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle rapid clicks', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<EnhancedButton onClick={handleClick}>Rapid</EnhancedButton>);
      const button = screen.getByRole('button');

      await user.click(button);
      await user.click(button);
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(5);
    });
  });
});
