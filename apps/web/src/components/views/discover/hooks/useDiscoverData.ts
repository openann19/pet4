/**
 * Discover Data Hook
 *
 * Manages data fetching and state for discover view
 */

import { useState, useEffect, useMemo } from 'react';
import { usePetDiscovery } from '@/hooks/usePetDiscovery';
import type { Pet, SwipeAction } from '@/lib/types';
import type { DiscoveryPreferences } from '@/components/discovery-preferences';

export interface UseDiscoverDataOptions {
  preferences: DiscoveryPreferences;
  userPets: Pet[];
  swipeHistory: SwipeAction[];
  showAdoptableOnly?: boolean;
}

export interface UseDiscoverDataReturn {
  pets: Pet[];
  currentPet: Pet | undefined;
  currentIndex: number;
  isLoading: boolean;
  hasMore: boolean;
  setCurrentIndex: (index: number) => void;
  nextPet: () => void;
  prevPet: () => void;
  resetDiscovery: () => void;
}

export function useDiscoverData(options: UseDiscoverDataOptions): UseDiscoverDataReturn {
  const { preferences, userPets, swipeHistory, showAdoptableOnly = false } = options;

  const [isLoading, setIsLoading] = useState(true);

  const swipedPetIds = useMemo(
    () => new Set(swipeHistory.map((s) => s.targetPetId)),
    [swipeHistory]
  );

  const userPet = useMemo(
    () => (Array.isArray(userPets) && userPets.length > 0 ? userPets[0] : undefined),
    [userPets]
  );

  const discoveryOptions: {
    userPet?: Pet;
    preferences?: DiscoveryPreferences;
    showAdoptableOnly?: boolean;
    swipedPetIds?: Set<string>;
  } = {
    ...(userPet && { userPet }),
    ...(preferences && { preferences }),
    ...(showAdoptableOnly !== undefined && { showAdoptableOnly }),
    ...(swipedPetIds && { swipedPetIds }),
  };

  const {
    availablePets: pets,
    currentPet,
    currentIndex,
    hasMore,
    nextPet,
    prevPet,
    goToPet,
    resetDiscovery,
  } = usePetDiscovery(discoveryOptions);

  useEffect(() => {
    if (userPets !== undefined) {
      setIsLoading(false);
    }
  }, [userPets]);

  const setCurrentIndex = useMemo(() => {
    return (index: number) => {
      goToPet(index);
    };
  }, [goToPet]);

  return {
    pets,
    currentPet,
    currentIndex,
    isLoading,
    hasMore,
    setCurrentIndex,
    nextPet,
    prevPet,
    resetDiscovery,
  };
}
