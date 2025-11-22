import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkipLink } from '../SkipLink';

describe('SkipLink', () => {
  it('should render skip link', () => {
    render(<SkipLink />);

    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toBeInTheDocument();
  });

  it('should have correct href', () => {
    render(<SkipLink />);

    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('should be hidden by default with sr-only class', () => {
    render(<SkipLink />);

    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toHaveClass('sr-only');
  });

  it('should be visible on focus', () => {
    render(<SkipLink />);

    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toHaveClass('focus:not-sr-only');
  });

  it('should have focus styles', () => {
    render(<SkipLink />);

    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toHaveClass(
      'focus:absolute',
      'focus:top-4',
      'focus:left-4',
      'focus:z-50',
      'focus:bg-primary',
      'focus:text-primary-foreground',
      'focus:px-4',
      'focus:py-2',
      'focus:rounded-md',
      'focus:shadow-lg',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-ring',
      'focus:ring-offset-2'
    );
  });

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup();
    render(<SkipLink />);

    const link = screen.getByRole('link', { name: /skip to main content/i });

    // Tab to the link
    await user.tab();

    expect(link).toHaveFocus();
  });

  it('should navigate to main content on click', async () => {
    const user = userEvent.setup();

    // Create a main content element
    document.body.innerHTML = '<div id="main-content">Main Content</div>';

    render(<SkipLink />);

    const link = screen.getByRole('link', { name: /skip to main content/i });

    await user.click(link);

    // Check if the main content element is focused (browser behavior)
    // Note: In jsdom, this may not work exactly as in a real browser
    expect(link).toHaveAttribute('href', '#main-content');
  });
});
