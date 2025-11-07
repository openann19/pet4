/**
 * Tests for pets store
 * Location: src/__tests__/store/pets-store.test.ts
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { usePetsStore } from '../../store/pets-store'
import type { PetProfile } from '../../types/pet'

const mockPet: PetProfile = {
  id: 'pet1',
  name: 'Buddy',
  species: 'dog',
  breed: 'Golden Retriever',
  age: 3,
  photos: ['https://example.com/photo.jpg'],
  ownerId: 'user1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('usePetsStore', () => {
  beforeEach(() => {
    usePetsStore.getState().reset()
  })

  it('should initialize with empty arrays and sets', () => {
    const state = usePetsStore.getState()
    expect(state.availablePets).toEqual([])
    expect(state.swipedPets.size).toBe(0)
    expect(state.likedPets.size).toBe(0)
  })

  it('should set available pets correctly', () => {
    const pets = [mockPet]
    usePetsStore.getState().setAvailablePets(pets)
    const state = usePetsStore.getState()
    expect(state.availablePets).toEqual(pets)
    expect(state.swipedPets.size).toBe(0)
    expect(state.likedPets.size).toBe(0)
  })

  it('should add available pet correctly', () => {
    usePetsStore.getState().addAvailablePet(mockPet)
    const state = usePetsStore.getState()
    expect(state.availablePets).toHaveLength(1)
    expect(state.availablePets[0]).toEqual(mockPet)
  })

  it('should mark pet as swiped correctly', () => {
    usePetsStore.getState().markAsSwiped('pet1')
    const state = usePetsStore.getState()
    expect(state.swipedPets.has('pet1')).toBe(true)
  })

  it('should mark pet as liked correctly', () => {
    usePetsStore.getState().markAsLiked('pet1')
    const state = usePetsStore.getState()
    expect(state.likedPets.has('pet1')).toBe(true)
  })

  it('should reset store correctly', () => {
    usePetsStore.getState().setAvailablePets([mockPet])
    usePetsStore.getState().markAsSwiped('pet1')
    usePetsStore.getState().markAsLiked('pet1')
    usePetsStore.getState().reset()
    const state = usePetsStore.getState()
    expect(state.availablePets).toEqual([])
    expect(state.swipedPets.size).toBe(0)
    expect(state.likedPets.size).toBe(0)
  })
})

