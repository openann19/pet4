import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewMode } from '../useViewMode';
import { haptics } from '@/lib/haptics';

vi.mock('@/lib/haptics', () => ({
  haptics: {
    trigger: vi.fn(),
  },
}));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    warn: vi.fn(),
  }),
}));

const mockHaptics = vi.mocked(haptics);

describe('useViewMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default mode', () => {
    const { result } = renderHook(() => useViewMode());

    expect(result.current.viewMode).toBe('cards');
  });

  it('initializes with custom mode', () => {
    const { result } = renderHook(() => useViewMode({ initialMode: 'map' }));

    expect(result.current.viewMode).toBe('map');
  });

  it('sets view mode', () => {
    const { result } = renderHook(() => useViewMode());

    act(() => {
      result.current.setMode('map');
    });

    expect(result.current.viewMode).toBe('map');
    expect(mockHaptics.trigger).toHaveBeenCalledWith('selection');
  });

  it('calls onModeChange callback', () => {
    const mockOnModeChange = vi.fn();
    const { result } = renderHook(() => useViewMode({ onModeChange: mockOnModeChange }));

    act(() => {
      result.current.setMode('map');
    });

    expect(mockOnModeChange).toHaveBeenCalledWith('map');
  });

  it('does not set unavailable mode', () => {
    const { result } = renderHook(() => useViewMode({ availableModes: ['cards', 'map'] }));

    act(() => {
      result.current.setMode('list');
    });

    expect(result.current.viewMode).toBe('cards');
  });

  it('toggles between available modes', () => {
    const { result } = renderHook(() => useViewMode({ availableModes: ['cards', 'map'] }));

    act(() => {
      result.current.toggleMode();
    });

    expect(result.current.viewMode).toBe('map');

    act(() => {
      result.current.toggleMode();
    });

    expect(result.current.viewMode).toBe('cards');
  });

  it('cycles through all available modes', () => {
    const { result } = renderHook(() => useViewMode({ availableModes: ['cards', 'map', 'list'] }));

    act(() => {
      result.current.toggleMode();
    });
    expect(result.current.viewMode).toBe('map');

    act(() => {
      result.current.toggleMode();
    });
    expect(result.current.viewMode).toBe('list');

    act(() => {
      result.current.toggleMode();
    });
    expect(result.current.viewMode).toBe('cards');
  });

  it('checks if current mode matches', () => {
    const { result } = renderHook(() => useViewMode({ initialMode: 'map' }));

    expect(result.current.isMode('map')).toBe(true);
    expect(result.current.isMode('cards')).toBe(false);
  });

  it('checks if mode can be switched to', () => {
    const { result } = renderHook(() => useViewMode({ availableModes: ['cards', 'map'] }));

    expect(result.current.canSwitchTo('cards')).toBe(true);
    expect(result.current.canSwitchTo('map')).toBe(true);
    expect(result.current.canSwitchTo('list')).toBe(false);
  });

  it('returns available modes', () => {
    const { result } = renderHook(() => useViewMode({ availableModes: ['cards', 'map', 'list'] }));

    expect(result.current.availableModes).toEqual(['cards', 'map', 'list']);
  });

  it('handles single available mode', () => {
    const { result } = renderHook(() => useViewMode({ availableModes: ['cards'] }));

    act(() => {
      result.current.toggleMode();
    });

    expect(result.current.viewMode).toBe('cards');
  });

  it('maintains state across re-renders', () => {
    const { result, rerender } = renderHook(() => useViewMode());

    act(() => {
      result.current.setMode('map');
    });

    expect(result.current.viewMode).toBe('map');

    rerender();

    expect(result.current.viewMode).toBe('map');
  });
});
