/**
 * Hook for managing adoption listing filters
 * Extracts business logic from UI components for better testability
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { AdoptionListingFilters } from '@/lib/adoption-marketplace-types';
import { haptics } from '@/lib/haptics';

interface UseAdoptionFiltersOptions {
  initialFilters: AdoptionListingFilters;
  onFiltersChange?: (filters: AdoptionListingFilters) => void;
}

function areFiltersEqual(
  nextFilters: AdoptionListingFilters,
  prevFilters: AdoptionListingFilters | null
): boolean {
  if (prevFilters === nextFilters) {
    return true;
  }

  if (!prevFilters) {
    return false;
  }

  const nextKeys = Object.keys(nextFilters);
  const prevKeys = Object.keys(prevFilters);

  if (nextKeys.length !== prevKeys.length) {
    return false;
  }

  for (const key of nextKeys) {
    const nextValue = (nextFilters as Record<string, unknown>)[key];
    const prevValue = (prevFilters as Record<string, unknown>)[key];

    if (Array.isArray(nextValue) && Array.isArray(prevValue)) {
      if (nextValue.length !== prevValue.length) {
        return false;
      }
      for (let index = 0; index < nextValue.length; index += 1) {
        if (nextValue[index] !== prevValue[index]) {
          return false;
        }
      }
      continue;
    }

    if (nextValue !== prevValue) {
      return false;
    }
  }

  return true;
}

interface UseAdoptionFiltersReturn {
  localFilters: AdoptionListingFilters;
  updateFilters: (updates: Partial<AdoptionListingFilters>) => void;
  toggleArrayFilter: <T extends string>(key: keyof AdoptionListingFilters, value: T) => void;
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
  const previousInitialFiltersRef = useRef<AdoptionListingFilters | null>(initialFilters);

  useEffect(() => {
    if (!areFiltersEqual(initialFilters, previousInitialFiltersRef.current)) {
      previousInitialFiltersRef.current = initialFilters;
      setLocalFilters(initialFilters);
    }
  }, [initialFilters]);

  const updateFilters = useCallback((updates: Partial<AdoptionListingFilters>) => {
    setLocalFilters((prev) => {
      const newFilters = { ...prev };

      for (const [key, value] of Object.entries(updates)) {
        if (
          value === undefined ||
          value === null ||
          value === '' ||
          (Array.isArray(value) && value.length === 0)
        ) {
          delete newFilters[key as keyof AdoptionListingFilters];
        } else {
          (newFilters as Record<string, unknown>)[key] = value;
        }
      }

      return newFilters;
    });
    haptics.impact('light');
  }, []);

  const toggleArrayFilter = useCallback(
    <T extends string>(key: keyof AdoptionListingFilters, value: T) => {
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
    },
    []
  );

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

  const hasActiveFilters = useMemo(() => {
    const filters = localFilters;

    if ((filters.species?.length ?? 0) > 0) return true;
    if ((filters.size?.length ?? 0) > 0) return true;
    if (filters.ageMin !== undefined && filters.ageMin !== null) return true;
    if (filters.ageMax !== undefined && filters.ageMax !== null) return true;
    if (filters.location !== undefined && filters.location !== '') return true;
    if (filters.maxDistance !== undefined && filters.maxDistance !== null) return true;
    if (filters.goodWithKids !== undefined) return true;
    if (filters.goodWithPets !== undefined) return true;
    if (filters.vaccinated !== undefined) return true;
    if (filters.spayedNeutered !== undefined) return true;
    if ((filters.energyLevel?.length ?? 0) > 0) return true;
    if (filters.feeMax !== undefined && filters.feeMax !== null) return true;
    if ((filters.status?.length ?? 0) > 0) return true;
    if (filters.featured !== undefined) return true;
    if (filters.sortBy !== undefined && filters.sortBy !== null) return true;

    return false;
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
    hasActiveFilters,
    applyFilters,
  };
}
