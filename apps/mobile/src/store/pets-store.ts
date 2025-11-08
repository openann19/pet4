/**
 * Pets store for swipeable pet cards
 * Location: src/store/pets-store.ts
 */

import { create } from 'zustand'
import type { PetProfile } from '../types/pet'

export interface PetsStore {
  availablePets: PetProfile[]
  swipedPets: Set<string>
  likedPets: Set<string>
  setAvailablePets: (pets: PetProfile[]) => void
  addAvailablePet: (pet: PetProfile) => void
  markAsSwiped: (petId: string) => void
  markAsLiked: (petId: string) => void
  reset: () => void
}

export const usePetsStore = create<PetsStore>(set => ({
  availablePets: [],
  swipedPets: new Set(),
  likedPets: new Set(),
  setAvailablePets: pets =>
    set({
      availablePets: pets,
      swipedPets: new Set(),
      likedPets: new Set(),
    }),
  addAvailablePet: pet =>
    set(state => ({
      availablePets: [...state.availablePets, pet],
    })),
  markAsSwiped: petId =>
    set(state => {
      const swipedPets = new Set(state.swipedPets)
      swipedPets.add(petId)
      return { swipedPets }
    }),
  markAsLiked: petId =>
    set(state => {
      const likedPets = new Set(state.likedPets)
      likedPets.add(petId)
      return { likedPets }
    }),
  reset: () =>
    set({
      availablePets: [],
      swipedPets: new Set(),
      likedPets: new Set(),
    }),
}))
