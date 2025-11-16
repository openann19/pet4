import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
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
  const mockSetSavedPlaces = vi.fn();
  const mockLocation = { lat: 10, lng: 20 };

  beforeEach(() => {
    vi.clearAllMocks();
    (useApp as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      t: { map: { placeSaved: 'Place saved', placeRemoved: 'Place removed' } },
    });
    (useStorage as unknown as ReturnType<typeof vi.fn>).mockReturnValue([[], mockSetSavedPlaces]);
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

    await waitFor(() => {
      expect(result.current.nearbyPlaces.length).toBeGreaterThan(0);
    });

    expect(result.current.nearbyPlaces.length).toBe(20);
  });

  it('should filter places by category', async () => {
    const { result } = renderHook(() => useMapPlaces(mockLocation, 5));

    await waitFor(() => {
      expect(result.current.nearbyPlaces.length).toBe(20);
    });

    result.current.handleCategoryFilter('park');

    expect(haptics.trigger).toHaveBeenCalledWith('selection');
    expect(result.current.selectedCategory).toBe('park');
    expect(result.current.filteredPlaces.every((p) => p.category === 'park')).toBe(true);
  });

  it('should filter places by search query', async () => {
    const { result } = renderHook(() => useMapPlaces(mockLocation, 5));

    await waitFor(() => {
      expect(result.current.nearbyPlaces.length).toBe(20);
    });

    result.current.setSearchQuery('Park');

    await waitFor(() => {
      expect(result.current.filteredPlaces.length).toBeLessThanOrEqual(20);
    });
  });

  it('should save and unsave places', () => {
    const { result } = renderHook(() => useMapPlaces(mockLocation, 5));

    result.current.handleSavePlace('place-1');

    expect(haptics.trigger).toHaveBeenCalledWith('medium');
    expect(mockSetSavedPlaces).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it('should toggle category filter off when same category is selected', () => {
    const { result } = renderHook(() => useMapPlaces(mockLocation, 5));

    result.current.handleCategoryFilter('park');
    expect(result.current.selectedCategory).toBe('park');

    result.current.handleCategoryFilter('park');
    expect(result.current.selectedCategory).toBe(null);
  });
});

