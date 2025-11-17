import { useState, useEffect, useMemo } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { calculateDistance } from '@/lib/maps/utils';
import type { Location, Place } from '@/lib/maps/types';
import { useMapConfig } from '@/lib/maps/useMapConfig';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import { isTruthy } from '@petspark/shared';

export interface UseMapPlacesReturn {
  nearbyPlaces: Place[];
  savedPlaces: string[];
  filteredPlaces: Place[];
  searchQuery: string;
  selectedCategory: string | null;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  handleCategoryFilter: (categoryId: string) => void;
  handleSavePlace: (placeId: string) => void;
  generateDemoPlaces: (center: Location) => void;
}

export function useMapPlaces(
  userLocation: Location | null,
  radiusKm: number
): UseMapPlacesReturn {
  const { t } = useApp();
  const { PLACE_CATEGORIES } = useMapConfig();
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [savedPlaces, setSavedPlaces] = useStorage<string[]>('saved-places', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (isTruthy(userLocation)) {
      generateDemoPlaces(userLocation);
    }
  }, [userLocation, radiusKm]);

  const generateDemoPlaces = (center: Location): void => {
    const places: Place[] = [];
    const categories = PLACE_CATEGORIES;

    for (let i = 0; i < 20; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      if (!category) continue;
      const angle = (Math.PI * 2 * i) / 20;
      const dist = Math.random() * radiusKm;
      const deltaLat = (dist / 111) * Math.cos(angle);
      const deltaLng = (dist / (111 * Math.cos((center.lat * Math.PI) / 180))) * Math.sin(angle);

      const location: Location = {
        lat: center.lat + deltaLat,
        lng: center.lng + deltaLng,
      };

      places.push({
        id: `place-${String(i)}`,
        name: `${String(category.name)} ${String(i + 1)}`,
        description: `Great ${String(category.name.toLowerCase())} in your area`,
        category: category.id,
        location,
        address: `${String(Math.floor(Math.random() * 999))} Main St, City`,
        phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        hours: '9:00 AM - 6:00 PM',
        photos: [`https://images.unsplash.com/photo-${String(1560807700000 + i * 1000000 ?? '')}?w=400&q=80`],
        verified: Math.random() > 0.3,
        petFriendly: true,
        rating: 3.5 + Math.random() * 1.5,
        reviewCount: Math.floor(Math.random() * 200),
        amenities: ['Water Bowl', 'Outdoor Space', 'Pet-Friendly Staff'],
        distance: calculateDistance(center, location),
        isOpen: Math.random() > 0.2,
        moderationStatus: 'approved',
      });
    }

    setNearbyPlaces(places.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0)));
  };

  const handleCategoryFilter = (categoryId: string): void => {
    haptics.trigger('selection');
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const handleSavePlace = (placeId: string): void => {
    haptics.trigger('medium');
    setSavedPlaces((current) => {
      const currentPlaces = current ?? [];
      if (currentPlaces.includes(placeId)) {
        toast.info(t.map?.placeRemoved ?? 'Place removed from saved');
        return currentPlaces.filter((id) => id !== placeId);
      } else {
        toast.success(t.map?.placeSaved ?? 'Place saved');
        return [...currentPlaces, placeId];
      }
    });
  };

  const filteredPlaces = useMemo(() => {
    let filtered = nearbyPlaces;

    if (selectedCategory) {
      filtered = filtered.filter((place) => place.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (place) =>
          place.name.toLowerCase().includes(query) ||
          place.description?.toLowerCase().includes(query) ||
          place.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [nearbyPlaces, selectedCategory, searchQuery]);

  return {
    nearbyPlaces,
    savedPlaces: savedPlaces ?? [],
    filteredPlaces,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
    handleCategoryFilter,
    handleSavePlace,
    generateDemoPlaces,
  };
}

