import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TypingDots } from './TypingDots';

describe('TypingDots', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders three dots', () => {
    const { container } = render(<TypingDots />);
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots).toHaveLength(3);
  });

  it('applies custom dot size', () => {
    const { container } = render(<TypingDots dotSize={8} />);
    const dots = container.querySelectorAll('.rounded-full');
    dots.forEach((dot) => {
      expect(dot.parentElement).toHaveStyle({ width: '8px', height: '8px' });
    });
  });

  it('applies custom dot color', () => {
    const { container } = render(<TypingDots dotColor="#ff0000" />);
    const dots = container.querySelectorAll('.rounded-full');
    dots.forEach((dot) => {
      expect(dot.parentElement).toHaveStyle({ backgroundColor: '#ff0000' });
    });
  });

  it('applies custom gap', () => {
    const { container } = render(<TypingDots gap={8} />);
    const flexContainer = container.firstChild as HTMLElement;
    expect(flexContainer).toHaveStyle({ gap: '8px' });
  });

  it('applies custom className', () => {
    const { container } = render(<TypingDots className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('uses default values when props are not provided', () => {
    const { container } = render(<TypingDots />);
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots).toHaveLength(3);
    dots.forEach((dot) => {
      expect(dot.parentElement).toHaveStyle({ width: '6px', height: '6px' });
    });
  });
});
