/**
 * Discover View Types
 */

import type { Pet } from '@/lib/types';
import type { DiscoveryPreferences } from '@/components/DiscoveryFilters';

export interface DiscoverViewState {
  currentIndex: number;
  matchedPetName: string;
  showSwipeHint: boolean;
  isLoading: boolean;
  showAdoptableOnly: boolean;
}

export interface DiscoverViewProps {
  userPets?: Pet[];
  preferences?: DiscoveryPreferences;
}

export interface SwipeCardProps {
  pet: Pet;
  index: number;
  onSwipe: (action: 'like' | 'pass') => void;
  onViewDetails: () => void;
}

export interface DiscoverFiltersProps {
  preferences: DiscoveryPreferences;
  onPreferencesChange: (prefs: DiscoveryPreferences) => void;
}
