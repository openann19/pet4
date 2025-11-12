import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDialog } from '../useDialog';
import { haptics } from '@/lib/haptics';

vi.mock('@/lib/haptics', () => ({
  haptics: {
    trigger: vi.fn(),
  },
}));

const mockHaptics = vi.mocked(haptics);

describe('useDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns closed state by default', () => {
    const { result } = renderHook(() => useDialog());

    expect(result.current.isOpen).toBe(false);
  });

  it('returns open state when initialOpen is true', () => {
    const { result } = renderHook(() => useDialog({ initialOpen: true }));

    expect(result.current.isOpen).toBe(true);
  });

  it('opens dialog', () => {
    const { result } = renderHook(() => useDialog());

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
    expect(mockHaptics.trigger).toHaveBeenCalledWith('light');
  });

  it('closes dialog', () => {
    const { result } = renderHook(() => useDialog({ initialOpen: true }));

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
    expect(mockHaptics.trigger).toHaveBeenCalledWith('light');
  });

  it('toggles dialog from closed to open', () => {
    const { result } = renderHook(() => useDialog());

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('toggles dialog from open to closed', () => {
    const { result } = renderHook(() => useDialog({ initialOpen: true }));

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('sets dialog to open', () => {
    const { result } = renderHook(() => useDialog());

    act(() => {
      result.current.setOpen(true);
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('sets dialog to closed', () => {
    const { result } = renderHook(() => useDialog({ initialOpen: true }));

    act(() => {
      result.current.setOpen(false);
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('calls onOpenChange when opening', () => {
    const mockOnOpenChange = vi.fn();
    const { result } = renderHook(() => useDialog({ onOpenChange: mockOnOpenChange }));

    act(() => {
      result.current.open();
    });

    expect(mockOnOpenChange).toHaveBeenCalledWith(true);
  });

  it('calls onOpenChange when closing', () => {
    const mockOnOpenChange = vi.fn();
    const { result } = renderHook(() =>
      useDialog({ initialOpen: true, onOpenChange: mockOnOpenChange })
    );

    act(() => {
      result.current.close();
    });

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange when toggling', () => {
    const mockOnOpenChange = vi.fn();
    const { result } = renderHook(() => useDialog({ onOpenChange: mockOnOpenChange }));

    act(() => {
      result.current.toggle();
    });

    expect(mockOnOpenChange).toHaveBeenCalledWith(true);
  });

  it('calls onOpenChange when setting open', () => {
    const mockOnOpenChange = vi.fn();
    const { result } = renderHook(() => useDialog({ onOpenChange: mockOnOpenChange }));

    act(() => {
      result.current.setOpen(true);
    });

    expect(mockOnOpenChange).toHaveBeenCalledWith(true);
  });

  it('does not trigger haptics when hapticFeedback is false', () => {
    const { result } = renderHook(() => useDialog({ hapticFeedback: false }));

    act(() => {
      result.current.open();
    });

    expect(mockHaptics.trigger).not.toHaveBeenCalled();
  });

  it('triggers haptics when hapticFeedback is true', () => {
    const { result } = renderHook(() => useDialog({ hapticFeedback: true }));

    act(() => {
      result.current.open();
    });

    expect(mockHaptics.trigger).toHaveBeenCalledWith('light');
  });

  it('handles multiple rapid toggles', () => {
    const { result } = renderHook(() => useDialog());

    act(() => {
      result.current.toggle();
      result.current.toggle();
      result.current.toggle();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('handles setOpen with same value', () => {
    const { result } = renderHook(() => useDialog());

    act(() => {
      result.current.setOpen(false);
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('maintains state across re-renders', () => {
    const { result, rerender } = renderHook(() => useDialog());

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);

    rerender();

    expect(result.current.isOpen).toBe(true);
  });
});
