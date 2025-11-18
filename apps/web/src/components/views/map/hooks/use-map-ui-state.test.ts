import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMapUIState } from './use-map-ui-state';
import { useSharedValue, usewithSpring } from '@petspark/motion';

vi.mock('@petspark/motion', () => ({
  useSharedValue: vi.fn((initial: number) => ({ value: initial })),
  useAnimatedStyle: vi.fn((fn: () => unknown) => fn()),
  withSpring: vi.fn((value: number) => value),
}));

describe('useMapUIState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useMapUIState());

    expect(result.current.showList).toBe(false);
    expect(result.current.selectedMarker).toBe(null);
  });

  it('should toggle list visibility', () => {
    const { result } = renderHook(() => useMapUIState());

    act(() => {
      result.current.setShowList(true);
    });

    expect(result.current.showList).toBe(true);

    act(() => {
      result.current.setShowList(false);
    });

    expect(result.current.showList).toBe(false);
  });

  it('should set selected marker', () => {
    const { result } = renderHook(() => useMapUIState());
    const mockMarker = {
      id: 'place-1',
      type: 'place' as const,
      location: { lat: 10, lng: 20 },
      data: {},
    };

    act(() => {
      result.current.setSelectedMarker(mockMarker);
    });

    expect(result.current.selectedMarker).toEqual(mockMarker);

    act(() => {
      result.current.setSelectedMarker(null);
    });

    expect(result.current.selectedMarker).toBe(null);
  });

  it('should return animated styles', () => {
    const { result } = renderHook(() => useMapUIState());

    expect(result.current.sidebarStyle).toBeDefined();
    expect(result.current.detailSheetStyle).toBeDefined();
  });
});

