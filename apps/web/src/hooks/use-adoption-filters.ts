/**
 * Hook for managing adoption listing filters
 * Extracts business logic from UI components for better testability
 */

import { useState, useEffect, useCallback } from 'react';
import type { AdoptionListingFilters, AdoptionListingStatus } from '@/lib/adoption-marketplace-types';
import { haptics } from '@/lib/haptics';

interface UseAdoptionFiltersOptions {
  initialFilters: AdoptionListingFilters;
  onFiltersChange?: (filters: AdoptionListingFilters) => void;
}

interface UseAdoptionFiltersReturn {
  localFilters: AdoptionListingFilters;
  updateFilters: (updates: Partial<AdoptionListingFilters>) => void;
  toggleArrayFilter: <T extends string>(
    key: keyof AdoptionListingFilters,
    value: T
  ) => void;
  toggleBooleanFilter: (key: keyof AdoptionListingFilters, value: boolean) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  applyFilters: () => void;
}

/**
 * Hook for managing adoption listing filters
 * Provides clean API for filter operations with haptic feedback
 */
export function useAdoptionFilters({
  initialFilters,
  onFiltersChange,
}: UseAdoptionFiltersOptions): UseAdoptionFiltersReturn {
  const [localFilters, setLocalFilters] = useState<AdoptionListingFilters>(initialFilters);

  useEffect(() => {
    setLocalFilters(initialFilters);
  }, [initialFilters]);

  const updateFilters = useCallback((updates: Partial<AdoptionListingFilters>) => {
    setLocalFilters((prev) => {
      const newFilters = { ...prev };

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === null || value === '' ||
            (Array.isArray(value) && value.length === 0)) {
          delete newFilters[key as keyof AdoptionListingFilters];
        } else {
          (newFilters as Record<string, unknown>)[key] = value;
        }
      }

      return newFilters;
    });
    haptics.impact('light');
  }, []);

  const toggleArrayFilter = useCallback(<T extends string>(
    key: keyof AdoptionListingFilters,
    value: T
  ) => {
    setLocalFilters((prev) => {
      const current = (prev[key] as T[] | undefined) ?? [];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      const newFilters = { ...prev };
      if (updated.length > 0) {
        (newFilters as Record<string, unknown>)[key] = updated;
      } else {
        delete newFilters[key];
      }

      return newFilters;
    });
    haptics.impact('light');
  }, []);

  const toggleBooleanFilter = useCallback((key: keyof AdoptionListingFilters, value: boolean) => {
    setLocalFilters((prev) => {
      const newFilters = { ...prev };
      if (value) {
        (newFilters as Record<string, unknown>)[key] = true;
      } else {
        delete newFilters[key];
      }
      return newFilters;
    });
    haptics.impact('light');
  }, []);

  const clearFilters = useCallback(() => {
    setLocalFilters({});
    haptics.trigger('light');
  }, []);

  const hasActiveFilters = useCallback(() => {
    return !!(
      (localFilters.species?.length ?? 0) ||
      (localFilters.size?.length ?? 0) ||
      localFilters.ageMin ||
      localFilters.ageMax ||
      localFilters.location ||
      localFilters.maxDistance ||
      localFilters.goodWithKids !== undefined ||
      localFilters.goodWithPets !== undefined ||
      localFilters.vaccinated !== undefined ||
      localFilters.spayedNeutered !== undefined ||
      (localFilters.energyLevel?.length ?? 0) ||
      localFilters.feeMax ||
      (localFilters.status?.length ?? 0) ||
      localFilters.featured !== undefined ||
      localFilters.sortBy
    );
  }, [localFilters]);

  const applyFilters = useCallback(() => {
    if (onFiltersChange) {
      onFiltersChange(localFilters);
    }
    if (typeof haptics.success === 'function') {
      haptics.success();
    }
  }, [localFilters, onFiltersChange]);

  return {
    localFilters,
    updateFilters,
    toggleArrayFilter,
    toggleBooleanFilter,
    clearFilters,
    hasActiveFilters: hasActiveFilters(),
    applyFilters,
  };
}
