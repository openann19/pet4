import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { matchingAPI, petAPI } from '@/lib/api-services';
import type { Match as APIMatch, Pet as APIPet } from '@/lib/api-schemas';
import type { Pet, Match } from '@/lib/types';
import { generateMatchReasoning } from '@/lib/matching';
import { usePets } from '@/hooks/api/use-pets';

// Convert API Match to internal Match format
function convertAPIMatchToMatch(apiMatch: APIMatch, userPetId: string): Match {
  const matchedPetId = apiMatch.petAId === userPetId ? apiMatch.petBId : apiMatch.petAId;
  return {
    id: apiMatch.id,
    petId: userPetId,
    matchedPetId,
    compatibilityScore: apiMatch.compatibilityScore,
    reasoning: [], // Will be populated when needed
    matchedAt: apiMatch.createdAt,
    status: apiMatch.status,
  };
}

// Convert API Pet to internal Pet format
function convertAPIPetToPet(apiPet: APIPet): Pet {
  return {
    id: apiPet.id,
    name: apiPet.name,
    breed: apiPet.breed,
    age: apiPet.age,
    gender: apiPet.gender,
    size: apiPet.size,
    photo: apiPet.photos[0]?.url ?? '',
    photos: apiPet.photos.map((p) => p.url),
    bio: apiPet.bio,
    personality: apiPet.personality,
    interests: [], // API doesn't have this
    lookingFor: [], // API doesn't have this
    location: apiPet.location.city ?? '',
    coordinates: {
      latitude: apiPet.location.latitude,
      longitude: apiPet.location.longitude,
    },
    ownerId: apiPet.ownerId,
    ownerName: '', // Will need to fetch separately if needed
    verified: apiPet.verified,
    createdAt: apiPet.createdAt,
  };
}

export function useMatches(petId?: string): {
  matches: Match[];
  userPets: Pet[] | undefined;
  userPet: Pet | undefined;
  matchedPets: (Pet & { match: Match })[];
  selectedPet: Pet | null;
  selectedMatch: Match | null;
  matchReasoning: string[];
  isLoading: boolean;
  selectPet: (pet: Pet | null, match: Match | null) => void;
  clearSelection: () => void;
} {
  const { data: userPets } = usePets();
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchReasoning, setMatchReasoning] = useState<string[]>([]);

  const petsArray = Array.isArray(userPets) ? userPets : [];
  const activePetId = petId ?? (petsArray.length > 0 ? petsArray[0]?.id : undefined);

  const { data: apiMatches = [], isLoading: matchesLoading } = useQuery({
    queryKey: activePetId ? [...queryKeys.matches.list, activePetId] : queryKeys.matches.list,
    queryFn: () => {
      if (!activePetId) {
        return Promise.resolve([]);
      }
      return matchingAPI.getMatches(activePetId);
    },
    enabled: !!activePetId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Convert API matches to internal Match format
  const matches = useMemo(() => {
    if (!activePetId || !Array.isArray(apiMatches)) return [];
    return apiMatches.map((apiMatch) => convertAPIMatchToMatch(apiMatch, activePetId));
  }, [apiMatches, activePetId]);

  // Convert userPets to internal Pet format
  const convertedUserPets = useMemo(() => {
    return userPets?.map((pet) => convertAPIPetToPet(pet));
  }, [userPets]);

  const userPet = useMemo(() => {
    if (!convertedUserPets?.length) return undefined;
    return convertedUserPets.find((p) => p.id === activePetId) ?? convertedUserPets[0];
  }, [convertedUserPets, activePetId]);

  // Get unique matched pet IDs
  const matchedPetIds = useMemo(() => {
    if (!Array.isArray(matches) || !activePetId) return [];
    return Array.from(
      new Set(
        matches
          .filter((m) => m.status === 'active')
          .map((match) => {
            return match.petId === activePetId ? match.matchedPetId : match.petId;
          })
          .filter((id): id is string => id !== undefined && id !== '')
      )
    );
  }, [matches, activePetId]);

  // Fetch Pet data for all matched pet IDs
  const petQueries = useQueries({
    queries: matchedPetIds.map((petId) => ({
      queryKey: queryKeys.pets.detail(petId),
      queryFn: async () => {
        const response = await petAPI.getById(petId);
        return convertAPIPetToPet(response);
      },
      enabled: !!petId,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    })),
  });

  // Map matches to pets with match data
  const matchedPets = useMemo(() => {
    if (!Array.isArray(matches) || !activePetId) return [];

    const petsById = new Map<string, Pet>();
    petQueries.forEach((query) => {
      if (query.data) {
        petsById.set(query.data.id, query.data);
      }
    });

    return matches
      .filter((m) => m.status === 'active')
      .map((match) => {
        const matchedPetId = match.petId === activePetId ? match.matchedPetId : match.petId;
        const pet = matchedPetId ? petsById.get(matchedPetId) : undefined;
        if (pet) {
          return { ...pet, match } as Pet & { match: Match };
        }
        return null;
      })
      .filter((p): p is Pet & { match: Match } => p !== null);
  }, [matches, activePetId, petQueries]);

  const isLoading = matchesLoading || petQueries.some((q) => q.isLoading);

  useEffect(() => {
    if (selectedPet && userPet && selectedMatch) {
      // Only generate reasoning if both pets have the required fields
      if (
        userPet.breed &&
        userPet.age &&
        userPet.size &&
        selectedPet.breed &&
        selectedPet.age &&
        selectedPet.size
      ) {
        void generateMatchReasoning(userPet, selectedPet)
          .then(setMatchReasoning)
          .catch((_error: unknown) => {
            // Silently fail match reasoning generation - it's not critical
            // Error is intentionally swallowed as reasoning is non-essential
            setMatchReasoning([]);
          });
      } else {
        setMatchReasoning([]);
      }
    } else {
      setMatchReasoning([]);
    }
  }, [selectedPet?.id, userPet?.id, selectedMatch]);

  const selectPet = (pet: Pet | null, match: Match | null) => {
    setSelectedPet(pet);
    setSelectedMatch(match);
  };

  const clearSelection = () => {
    setSelectedPet(null);
    setSelectedMatch(null);
  };

  return {
    matches,
    userPets: convertedUserPets,
    userPet,
    matchedPets,
    selectedPet,
    selectedMatch,
    matchReasoning,
    isLoading,
    selectPet,
    clearSelection,
  };
}
