import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { matchingAPI } from '@/lib/api-services'
import type { Pet, Match } from '@/lib/types'
import { generateMatchReasoning } from '@/lib/matching'
import { useUserPets } from '@/hooks/api/use-user'

export function useMatches(petId?: string) {
  const { data: userPets } = useUserPets()
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [matchReasoning, setMatchReasoning] = useState<string[]>([])

  const petsArray = Array.isArray(userPets) ? userPets : []
  const activePetId = petId || (petsArray.length > 0 ? petsArray[0]?.id : undefined)

  const { data: matches = [], isLoading } = useQuery({
    queryKey: activePetId ? [...queryKeys.matches.list, activePetId] : queryKeys.matches.list,
    queryFn: () => {
      if (!activePetId) {
        return Promise.resolve([])
      }
      return matchingAPI.getMatches(activePetId)
    },
    enabled: !!activePetId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  const userPet = useMemo(() => {
    return petsArray.length > 0 ? petsArray[0] : undefined
  }, [petsArray])

  const matchedPets = useMemo(() => {
    if (!Array.isArray(matches)) return []
    return matches
      .filter(m => m.status === 'active')
      .map(match => {
        // Note: This assumes matches contain pet data or we need to fetch pets separately
        // For now, returning match data structure
        return { match, petId: match.matchedPetId || match.petId }
      })
      .filter((p): p is { match: Match; petId: string } => p.petId !== undefined)
  }, [matches])

  useEffect(() => {
    if (selectedPet && userPet && selectedMatch) {
      generateMatchReasoning(userPet, selectedPet).then(setMatchReasoning)
    } else {
      setMatchReasoning([])
    }
  }, [selectedPet?.id, userPet?.id, selectedMatch])

  const selectPet = (pet: Pet | null, match: Match | null) => {
    setSelectedPet(pet)
    setSelectedMatch(match)
  }

  const clearSelection = () => {
    setSelectedPet(null)
    setSelectedMatch(null)
  }

  return {
    matches,
    userPets,
    userPet,
    matchedPets,
    selectedPet,
    selectedMatch,
    matchReasoning,
    isLoading,
    selectPet,
    clearSelection,
  }
}

