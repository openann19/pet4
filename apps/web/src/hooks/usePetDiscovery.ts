import { useState, useEffect, useMemo, useCallback } from 'react'
import { useStorage } from '@/hooks/useStorage'
import type { Pet, SwipeAction } from '@/lib/types'
import { calculateCompatibility } from '@/lib/matching'
import { calculateDistance } from '@/lib/distance'
import { isTruthy, isDefined } from '@/core/guards';

interface DiscoveryPreferences {
  minAge?: number
  maxAge?: number
  sizes?: string[]
  personalities?: string[]
  interests?: string[]
  lookingFor?: string[]
  minCompatibility?: number
  maxDistance?: number
}

interface UsePetDiscoveryOptions {
  userPet?: Pet
  preferences?: DiscoveryPreferences
  showAdoptableOnly?: boolean
  swipedPetIds?: Set<string>
}

export function usePetDiscovery({ userPet, preferences = {}, showAdoptableOnly = false, swipedPetIds }: UsePetDiscoveryOptions = {}) {
  const [allPets] = useStorage<Pet[]>('all-pets', [])
  const [swipeHistory, setSwipeHistory] = useStorage<SwipeAction[]>('swipe-history', [])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [adoptablePetIds] = useStorage<Set<string>>('adoptable-pet-ids', new Set())

  // Get swiped pet IDs from swipe history or provided set
  const swipedIds = useMemo(() => {
    if (isTruthy(swipedPetIds)) return swipedPetIds
    return new Set(Array.isArray(swipeHistory) ? swipeHistory.map(s => s.targetPetId) : [])
  }, [swipeHistory, swipedPetIds])

  const availablePets = useMemo(() => {
    if (!Array.isArray(allPets)) return []

    return allPets
      .map(pet => {
        // Calculate distance if user pet has location
        if (userPet?.location && pet.location) {
          const userCoords = userPet.location.split(',').map(Number)
          const petCoords = pet.location.split(',').map(Number)
          if (userCoords[0] !== undefined && userCoords[1] !== undefined && 
              petCoords[0] !== undefined && petCoords[1] !== undefined) {
            const distance = calculateDistance(
              { latitude: userCoords[0], longitude: userCoords[1] },
              { latitude: petCoords[0], longitude: petCoords[1] }
            )
            return { ...pet, distance }
          }
        }
        return pet
      })
      .filter(pet => {
        // Filter out user's own pet
        if (pet.id === userPet?.id) return false
        
        // Filter out already swiped pets
        if (swipedIds.has(pet.id)) return false
        
        // Filter by age
        if (preferences.minAge && pet.age < preferences.minAge) return false
        if (preferences.maxAge && pet.age > preferences.maxAge) return false
        
        // Filter by size
        if (preferences.sizes && preferences.sizes.length > 0) {
          if (!preferences.sizes.includes(pet.size)) return false
        }
        
        // Filter by personality
        if (preferences.personalities && preferences.personalities.length > 0) {
          const hasMatchingPersonality = pet.personality?.some(trait =>
            preferences.personalities?.includes(trait)
          )
          if (!hasMatchingPersonality) return false
        }
        
        // Filter by interests
        if (preferences.interests && preferences.interests.length > 0) {
          const hasMatchingInterest = pet.interests?.some(interest =>
            preferences.interests?.some(pref => interest.toLowerCase().includes(pref.toLowerCase()))
          )
          if (!hasMatchingInterest) return false
        }
        
        // Filter by looking for
        if (preferences.lookingFor && preferences.lookingFor.length > 0) {
          const hasMatchingGoal = pet.lookingFor?.some(goal =>
            preferences.lookingFor?.some(pref => goal.toLowerCase().includes(pref.toLowerCase()))
          )
          if (!hasMatchingGoal) return false
        }
        
        // Filter by compatibility score
        if (preferences.minCompatibility && preferences.minCompatibility > 0 && userPet) {
          const compatibility = calculateCompatibility(userPet, pet)
          if (compatibility < preferences.minCompatibility) return false
        }
        
        // Filter by adoptable if enabled
        if (showAdoptableOnly && !adoptablePetIds?.has(pet.id)) {
          return false
        }
        
        return true
      })
      .sort((a, b) => {
        // Sort by distance if available
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance
        }
        if (a.distance !== undefined) return -1
        if (b.distance !== undefined) return 1
        return 0
      })
  }, [
    allPets,
    userPet?.id,
    userPet?.location,
    swipedIds,
    preferences,
    showAdoptableOnly,
    adoptablePetIds,
  ])

  const currentPet = availablePets[currentIndex]

  const nextPet = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, availablePets.length - 1))
  }, [availablePets.length])

  const prevPet = useCallback(() => {
    setCurrentIndex(prev => Math.max(prev - 1, 0))
  }, [])

  const goToPet = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, availablePets.length - 1)))
  }, [availablePets.length])

  const markAsSwiped = useCallback((petId: string) => {
    if (!userPet) return
    const newSwipe: SwipeAction = {
      petId: userPet.id,
      targetPetId: petId,
      action: 'pass',
      timestamp: new Date().toISOString(),
    }
    setSwipeHistory((prev) => [...(prev || []), newSwipe])
  }, [userPet, setSwipeHistory])

  const resetDiscovery = useCallback(() => {
    setCurrentIndex(0)
  }, [])

  // Reset to first pet when available pets change
  useEffect(() => {
    if (availablePets.length > 0 && currentIndex >= availablePets.length) {
      setCurrentIndex(0)
    }
  }, [availablePets.length, currentIndex])

  return {
    availablePets,
    currentPet,
    currentIndex,
    totalPets: availablePets.length,
    nextPet,
    prevPet,
    goToPet,
    markAsSwiped,
    resetDiscovery,
    hasMore: currentIndex < availablePets.length - 1,
    hasPrevious: currentIndex > 0,
  }
}

