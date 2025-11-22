import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMapPlaces } from './use-map-places';
import { useStorage } from '@/hooks/use-storage';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import { useMapConfig } from '@/lib/maps/useMapConfig';

vi.mock('@/hooks/use-storage');
vi.mock('sonner');
vi.mock('@/contexts/AppContext');
vi.mock('@/lib/haptics');
vi.mock('@/lib/maps/useMapConfig');

describe('useMapPlaces', () => {
  const storageMock = useStorage as unknown as vi.Mock;
  let mockSavedPlaces: string[];
  const mockSetSavedPlaces = vi.fn((updater: string[] | ((current: string[]) => string[])) => {
    const nextValue = typeof updater === 'function' ? updater(mockSavedPlaces) : updater;
    mockSavedPlaces = nextValue ?? [];
    return Promise.resolve();
  });
  const mockLocation = { lat: 10, lng: 20 };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSavedPlaces = [];
    const randomSequence = [0, 0.25, 0.5, 0.75];
    let sequenceIndex = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      const value = randomSequence[sequenceIndex % randomSequence.length];
      sequenceIndex += 1;
      return value;
    });
    (useApp as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      t: { map: { placeSaved: 'Place saved', placeRemoved: 'Place removed' } },
    });
    storageMock.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'saved-places') {
        return [mockSavedPlaces, mockSetSavedPlaces];
      }
      return [defaultValue, vi.fn()];
    });
    (useMapConfig as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      PLACE_CATEGORIES: [
        { id: 'park', name: 'Park', icon: '🌳', color: '#green' },
        { id: 'vet', name: 'Vet', icon: '🏥', color: '#blue' },
      ],
    });
  });

  it('should initialize with empty places', () => {
    const { result } = renderHook(() => useMapPlaces(null, 5));

    expect(result.current.nearbyPlaces).toEqual([]);
    expect(result.current.filteredPlaces).toEqual([]);
    expect(result.current.searchQuery).toBe('');
    expect(result.current.selectedCategory).toBe(null);
  });

  it('should generate demo places when location is provided', async () => {
    const { result } = renderHook(() => useMapPlaces(mockLocation, 5));
    await act(async () => {
      result.current.generateDemoPlaces(mockLocation);
    });

    expect(result.current.nearbyPlaces.length).toBeGreaterThan(0);
  });

  it('should filter places by category', async () => {
    const { result } = renderHook(() => useMapPlaces(mockLocation, 5));
    await act(async () => {
      result.current.generateDemoPlaces(mockLocation);
    });

    await act(async () => {
      result.current.handleCategoryFilter('park');
    });

    expect(haptics.trigger).toHaveBeenCalledWith('selection');
    expect(result.current.selectedCategory).toBe('park');
    expect(result.current.filteredPlaces.every((p) => p.category === 'park')).toBe(true);
  });

  it('should filter places by search query', async () => {
    const { result } = renderHook(() => useMapPlaces(mockLocation, 5));
    await act(async () => {
      result.current.generateDemoPlaces(mockLocation);
    });

    expect(result.current.nearbyPlaces.length).toBeGreaterThan(0);

    await act(async () => {
      result.current.setSearchQuery('Park');
    });

    expect(result.current.filteredPlaces.length).toBeGreaterThan(0);
    expect(
      result.current.filteredPlaces.every((place) => place.name.toLowerCase().includes('park'))
    ).toBe(true);
  });

  it('should save and unsave places', async () => {
    const { result } = renderHook(() => useMapPlaces(mockLocation, 5));
    await act(async () => {
      result.current.handleSavePlace('place-1');
    });

    expect(haptics.trigger).toHaveBeenCalledWith('medium');
    expect(mockSetSavedPlaces).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it('should toggle category filter off when same category is selected', async () => {
    const { result } = renderHook(() => useMapPlaces(mockLocation, 5));
    await act(async () => {
      result.current.generateDemoPlaces(mockLocation);
    });

    await act(async () => {
      result.current.handleCategoryFilter('park');
    });
    expect(result.current.selectedCategory).toBe('park');

    await act(async () => {
      result.current.handleCategoryFilter('park');
    });
    expect(result.current.selectedCategory).toBe(null);
  });
});
