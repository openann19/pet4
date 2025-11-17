import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { Announcer, useAnnouncer } from '../Announcer';
import { renderHook } from '@testing-library/react';

describe('Announcer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render announcer with message', () => {
    render(<Announcer message="Test announcement" />);

    const announcer = screen.getByRole('status');
    expect(announcer).toBeInTheDocument();
    expect(announcer).toHaveTextContent('Test announcement');
    expect(announcer).toHaveAttribute('aria-live', 'polite');
    expect(announcer).toHaveAttribute('aria-atomic', 'true');
  });

  it('should use assertive politeness when specified', () => {
    render(<Announcer message="Urgent announcement" politeness="assertive" />);

    const announcer = screen.getByRole('status');
    expect(announcer).toHaveAttribute('aria-live', 'assertive');
  });

  it('should clear message after delay', async () => {
    render(<Announcer message="Temporary message" clearDelay={1000} />);

    const announcer = screen.getByRole('status');
    expect(announcer).toHaveTextContent('Temporary message');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(announcer).toHaveTextContent('');
    });
  });

  it('should not clear message when clearDelay is 0', () => {
    render(<Announcer message="Permanent message" clearDelay={0} />);

    const announcer = screen.getByRole('status');
    expect(announcer).toHaveTextContent('Permanent message');

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(announcer).toHaveTextContent('Permanent message');
  });

  it('should update message when prop changes', () => {
    const { rerender } = render(<Announcer message="First message" />);

    const announcer = screen.getByRole('status');
    expect(announcer).toHaveTextContent('First message');

    rerender(<Announcer message="Second message" />);
    expect(announcer).toHaveTextContent('Second message');
  });

  it('should have sr-only class for screen reader only', () => {
    render(<Announcer message="Test" />);

    const announcer = screen.getByRole('status');
    expect(announcer).toHaveClass('sr-only');
  });
});

describe('useAnnouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with empty announcement', () => {
    const { result } = renderHook(() => useAnnouncer());

    expect(result.current.announcement).toBe('');
    expect(result.current.politeness).toBe('polite');
  });

  it('should announce message with polite politeness', () => {
    const { result } = renderHook(() => useAnnouncer());

    act(() => {
      result.current.announce('Test message', 'polite');
    });

    expect(result.current.announcement).toBe('Test message');
    expect(result.current.politeness).toBe('polite');
  });

  it('should announce message with assertive politeness', () => {
    const { result } = renderHook(() => useAnnouncer());

    act(() => {
      result.current.announce('Urgent message', 'assertive');
    });

    expect(result.current.announcement).toBe('Urgent message');
    expect(result.current.politeness).toBe('assertive');
  });

  it('should clear announcement after 5 seconds', async () => {
    const { result } = renderHook(() => useAnnouncer());

    act(() => {
      result.current.announce('Temporary message');
    });

    expect(result.current.announcement).toBe('Temporary message');

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(result.current.announcement).toBe('');
    });
  });

  it('should default to polite politeness', () => {
    const { result } = renderHook(() => useAnnouncer());

    act(() => {
      result.current.announce('Test message');
    });

    expect(result.current.politeness).toBe('polite');
  });
});
