import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { Badge } from './badge';

describe('Badge', () => {
  it('should render badge with text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('should apply default variant', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge).toHaveClass('bg-primary');
  });

  it('should apply secondary variant', () => {
    render(<Badge variant="secondary">Secondary</Badge>);
    const badge = screen.getByText('Secondary');
    expect(badge).toHaveClass('bg-secondary');
  });

  it('should apply destructive variant', () => {
    render(<Badge variant="destructive">Destructive</Badge>);
    const badge = screen.getByText('Destructive');
    expect(badge).toHaveClass('bg-destructive');
  });

  it('should apply outline variant', () => {
    render(<Badge variant="outline">Outline</Badge>);
    const badge = screen.getByText('Outline');
    expect(badge).toHaveClass('text-foreground');
  });

  it('should merge custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('custom-class');
  });

  it('should have data-slot attribute', () => {
    render(<Badge>Badge</Badge>);
    const badge = screen.getByText('Badge');
    expect(badge).toHaveAttribute('data-slot', 'badge');
  });

  it('should render as span by default', () => {
    render(<Badge>Span Badge</Badge>);
    const badge = screen.getByText('Span Badge');
    expect(badge.tagName).toBe('SPAN');
  });
});
