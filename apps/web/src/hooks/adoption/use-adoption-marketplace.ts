/**
 * Hook for adoption marketplace operations
 * Extracted business logic from AdoptionMarketplaceView component
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { spark } from '@/lib/spark';
import { adoptionMarketplaceService } from '@/lib/adoption-marketplace-service';
import { createLogger } from '@/lib/logger';
import type { AdoptionListing, AdoptionListingFilters } from '@/lib/adoption-marketplace-service';

const logger = createLogger('useAdoptionMarketplace');

export interface UseAdoptionMarketplaceReturn {
  listings: AdoptionListing[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: AdoptionListingFilters;
  setFilters: (filters: AdoptionListingFilters) => void;
  currentUser: { id: string; name: string } | null;
  hasMore: boolean;
  loadListings: (reset?: boolean) => Promise<void>;
  filteredListings: AdoptionListing[];
  activeFilterCount: number;
}

export function useAdoptionMarketplace(): UseAdoptionMarketplaceReturn {
  const [listings, setListings] = useState<AdoptionListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<AdoptionListingFilters>({});
  const [hasMore, setHasMore] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);

  const loadCurrentUser = useCallback(async () => {
    try {
      const user = await spark.user();
      setCurrentUser({ id: user.id, name: user.login ?? '' });
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to load user', err, { action: 'loadUser' });
    }
  }, []);

  const loadListings = useCallback(
    async (_reset = true) => {
      try {
        setLoading(true);
        const response = await adoptionMarketplaceService.getActiveListings(filters);
        setListings(response);
        setHasMore(false);
      } catch (_error) {
        const err = _error instanceof Error ? _error : new Error(String(_error));
        logger.error('Failed to load listings', err, { action: 'loadListings' });
        toast.error('Failed to load adoption listings');
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    void loadCurrentUser();
    void loadListings();
  }, [loadCurrentUser, loadListings]);

  const filteredListings = searchQuery
    ? listings.filter(
        (listing) =>
          listing.petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.petBreed.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.location.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : listings;

  const activeFilterCount = Object.keys(filters).filter((key) => {
    const value = filters[key as keyof AdoptionListingFilters];
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null;
  }).length;

  return {
    listings,
    loading,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    currentUser,
    hasMore,
    loadListings,
    filteredListings,
    activeFilterCount,
  };
}
