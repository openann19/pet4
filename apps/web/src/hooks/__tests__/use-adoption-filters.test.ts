/**
 * Tests for useAdoptionFilters hook
 * Verifies filter state management, toggles, and haptic feedback
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdoptionFilters } from '../use-adoption-filters';
import type { AdoptionListingFilters } from '@/lib/adoption-marketplace-types';

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
    trigger: vi.fn(),
    success: vi.fn(),
  },
}));

describe('useAdoptionFilters', () => {
  const mockOnFiltersChange = vi.fn();
  const initialFilters: AdoptionListingFilters = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with provided filters', () => {
    const { result } = renderHook(() =>
      useAdoptionFilters({
        initialFilters: { species: ['dog'], size: ['medium'] },
        onFiltersChange: mockOnFiltersChange,
      })
    );

    expect(result.current.localFilters).toEqual({
      species: ['dog'],
      size: ['medium'],
    });
  });

  it('should update filters when initialFilters change', () => {
    const { result, rerender } = renderHook(
      ({ filters }) =>
        useAdoptionFilters({
          initialFilters: filters,
          onFiltersChange: mockOnFiltersChange,
        }),
      {
        initialProps: { filters: { species: ['dog'] } },
      }
    );

    expect(result.current.localFilters.species).toEqual(['dog']);

    rerender({ filters: { species: ['cat'] } });

    expect(result.current.localFilters.species).toEqual(['cat']);
  });

  it('should toggle array filter values', () => {
    const { result } = renderHook(() =>
      useAdoptionFilters({
        initialFilters,
        onFiltersChange: mockOnFiltersChange,
      })
    );

    act(() => {
      result.current.toggleArrayFilter('species', 'dog');
    });

    expect(result.current.localFilters.species).toEqual(['dog']);

    act(() => {
      result.current.toggleArrayFilter('species', 'cat');
    });

    expect(result.current.localFilters.species).toEqual(['dog', 'cat']);

    act(() => {
      result.current.toggleArrayFilter('species', 'dog');
    });

    expect(result.current.localFilters.species).toEqual(['cat']);
  });

  it('should remove array filter when empty', () => {
    const { result } = renderHook(() =>
      useAdoptionFilters({
        initialFilters: { species: ['dog'] },
        onFiltersChange: mockOnFiltersChange,
      })
    );

    act(() => {
      result.current.toggleArrayFilter('species', 'dog');
    });

    expect(result.current.localFilters.species).toBeUndefined();
  });

  it('should toggle boolean filter values', () => {
    const { result } = renderHook(() =>
      useAdoptionFilters({
        initialFilters,
        onFiltersChange: mockOnFiltersChange,
      })
    );

    act(() => {
      result.current.toggleBooleanFilter('goodWithKids', true);
    });

    expect(result.current.localFilters.goodWithKids).toBe(true);

    act(() => {
      result.current.toggleBooleanFilter('goodWithKids', false);
    });

    expect(result.current.localFilters.goodWithKids).toBeUndefined();
  });

  it('should update multiple filters at once', () => {
    const { result } = renderHook(() =>
      useAdoptionFilters({
        initialFilters,
        onFiltersChange: mockOnFiltersChange,
      })
    );

    act(() => {
      result.current.updateFilters({
        ageMin: 1,
        ageMax: 5,
        location: 'New York',
      });
    });

    expect(result.current.localFilters.ageMin).toBe(1);
    expect(result.current.localFilters.ageMax).toBe(5);
    expect(result.current.localFilters.location).toBe('New York');
  });

  it('should remove filters when set to undefined', () => {
    const { result } = renderHook(() =>
      useAdoptionFilters({
        initialFilters: { ageMin: 1, ageMax: 5, location: 'New York' },
        onFiltersChange: mockOnFiltersChange,
      })
    );

    act(() => {
      result.current.updateFilters({
        ageMin: undefined,
        ageMax: undefined,
        location: undefined,
      });
    });

    expect(result.current.localFilters.ageMin).toBeUndefined();
    expect(result.current.localFilters.ageMax).toBeUndefined();
    expect(result.current.localFilters.location).toBeUndefined();
  });

  it('should clear all filters', () => {
    const { result } = renderHook(() =>
      useAdoptionFilters({
        initialFilters: {
          species: ['dog'],
          size: ['medium'],
          ageMin: 1,
        },
        onFiltersChange: mockOnFiltersChange,
      })
    );

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.localFilters).toEqual({});
  });

  it('should detect active filters correctly', () => {
    const { result } = renderHook(() =>
      useAdoptionFilters({
        initialFilters,
        onFiltersChange: mockOnFiltersChange,
      })
    );

    expect(result.current.hasActiveFilters).toBe(false);

    act(() => {
      result.current.toggleArrayFilter('species', 'dog');
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should call onFiltersChange when applying filters', () => {
    const { result } = renderHook(() =>
      useAdoptionFilters({
        initialFilters: { species: ['dog'] },
        onFiltersChange: mockOnFiltersChange,
      })
    );

    act(() => {
      result.current.applyFilters();
    });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      species: ['dog'],
    });
  });

  it('should handle edge case: empty string location', () => {
    const { result } = renderHook(() =>
      useAdoptionFilters({
        initialFilters: { location: 'New York' },
        onFiltersChange: mockOnFiltersChange,
      })
    );

    act(() => {
      result.current.updateFilters({ location: '' });
    });

    expect(result.current.localFilters.location).toBeUndefined();
  });

  it('should handle edge case: zero values', () => {
    const { result } = renderHook(() =>
      useAdoptionFilters({
        initialFilters,
        onFiltersChange: mockOnFiltersChange,
      })
    );

    act(() => {
      result.current.updateFilters({ ageMin: 0, feeMax: 0 });
    });

    expect(result.current.localFilters.ageMin).toBe(0);
    expect(result.current.localFilters.feeMax).toBe(0);
  });

  it('should handle multiple array filters independently', () => {
    const { result } = renderHook(() =>
      useAdoptionFilters({
        initialFilters,
        onFiltersChange: mockOnFiltersChange,
      })
    );

    act(() => {
      result.current.toggleArrayFilter('species', 'dog');
      result.current.toggleArrayFilter('size', 'medium');
      result.current.toggleArrayFilter('energyLevel', 'high');
    });

    expect(result.current.localFilters.species).toEqual(['dog']);
    expect(result.current.localFilters.size).toEqual(['medium']);
    expect(result.current.localFilters.energyLevel).toEqual(['high']);
  });
});
