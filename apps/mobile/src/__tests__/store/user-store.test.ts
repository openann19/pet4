/**
 * Tests for user store
 * Location: src/__tests__/store/user-store.test.ts
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { useUserStore, type User } from '../../store/user-store'
import type { Match, PetProfile } from '../../types/pet'

const mockUser: User = {
  id: 'user1',
  email: 'test@example.com',
  name: 'Test User',
  pets: [],
  matches: [],
  createdAt: '2024-01-01T00:00:00Z',
}

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

const mockMatch: Match = {
  id: 'match1',
  petId: 'pet1',
  matchedPetId: 'pet2',
  matchedAt: '2024-01-01T00:00:00Z',
  status: 'pending',
}

describe('useUserStore', () => {
  beforeEach(() => {
    useUserStore.getState().clearUser()
  })

  it('should initialize with null user', () => {
    const state = useUserStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should set user correctly', () => {
    useUserStore.getState().setUser(mockUser)
    const state = useUserStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
  })

  it('should clear user correctly', () => {
    useUserStore.getState().setUser(mockUser)
    useUserStore.getState().clearUser()
    const state = useUserStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should add pet correctly', () => {
    useUserStore.getState().setUser(mockUser)
    useUserStore.getState().addPet(mockPet)
    const state = useUserStore.getState()
    expect(state.user?.pets).toHaveLength(1)
    expect(state.user?.pets[0]).toEqual(mockPet)
  })

  it('should update pet correctly', () => {
    useUserStore.getState().setUser({ ...mockUser, pets: [mockPet] })
    useUserStore.getState().updatePet('pet1', { name: 'Updated Name' })
    const state = useUserStore.getState()
    const pet = state.user?.pets[0]
    expect(pet).toBeDefined()
    expect(pet?.name).toBe('Updated Name')
  })

  it('should remove pet correctly', () => {
    useUserStore.getState().setUser({ ...mockUser, pets: [mockPet] })
    useUserStore.getState().removePet('pet1')
    const state = useUserStore.getState()
    expect(state.user?.pets).toHaveLength(0)
  })

  it('should add match correctly', () => {
    useUserStore.getState().setUser(mockUser)
    useUserStore.getState().addMatch(mockMatch)
    const state = useUserStore.getState()
    expect(state.user?.matches).toHaveLength(1)
    expect(state.user?.matches[0]).toEqual(mockMatch)
  })

  it('should update match correctly', () => {
    useUserStore.getState().setUser({ ...mockUser, matches: [mockMatch] })
    useUserStore.getState().updateMatch('match1', { status: 'accepted' })
    const state = useUserStore.getState()
    const match = state.user?.matches[0]
    expect(match).toBeDefined()
    expect(match?.status).toBe('accepted')
  })

  it('should remove match correctly', () => {
    useUserStore.getState().setUser({ ...mockUser, matches: [mockMatch] })
    useUserStore.getState().removeMatch('match1')
    const state = useUserStore.getState()
    expect(state.user?.matches).toHaveLength(0)
  })
})

