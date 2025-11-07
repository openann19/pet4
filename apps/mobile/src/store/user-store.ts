/**
 * User store with Zustand and persistence
 * Location: src/store/user-store.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import type { StateCreator } from 'zustand'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Match, PetProfile } from '../types/pet'

export interface User {
  id: string
  email: string
  name: string
  pets: PetProfile[]
  matches: Match[]
  createdAt: string
}

export interface UserStore {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User) => void
  clearUser: () => void
  addPet: (pet: PetProfile) => void
  updatePet: (petId: string, updates: Partial<PetProfile>) => void
  removePet: (petId: string) => void
  addMatch: (match: Match) => void
  updateMatch: (matchId: string, updates: Partial<Match>) => void
  removeMatch: (matchId: string) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    ((set: (partial: UserStore | Partial<UserStore> | ((state: UserStore) => UserStore | Partial<UserStore>)) => void) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user: User) =>
        { set({
          user,
          isAuthenticated: true,
        }); },
      clearUser: () =>
        { set({
          user: null,
          isAuthenticated: false,
        }); },
      addPet: (pet: PetProfile) =>
        { set((state: UserStore) => {
          if (!state.user) return state
          return {
            user: {
              ...state.user,
              pets: [...state.user.pets, pet],
            },
          }
        }); },
      updatePet: (petId: string, updates: Partial<PetProfile>) =>
        { set((state: UserStore) => {
          if (!state.user) return state
          return {
            user: {
              ...state.user,
              pets: state.user.pets.map((p: PetProfile) =>
                p.id === petId ? { ...p, ...updates } : p
              ),
            },
          }
        }); },
      removePet: (petId: string) =>
        { set((state: UserStore) => {
          if (!state.user) return state
          return {
            user: {
              ...state.user,
              pets: state.user.pets.filter((p: PetProfile) => p.id !== petId),
            },
          }
        }); },
      addMatch: (match: Match) =>
        { set((state: UserStore) => {
          if (!state.user) return state
          return {
            user: {
              ...state.user,
              matches: [...state.user.matches, match],
            },
          }
        }); },
      updateMatch: (matchId: string, updates: Partial<Match>) =>
        { set((state: UserStore) => {
          if (!state.user) return state
          return {
            user: {
              ...state.user,
              matches: state.user.matches.map((m: Match) =>
                m.id === matchId ? { ...m, ...updates } : m
              ),
            },
          }
        }); },
      removeMatch: (matchId: string) =>
        { set((state: UserStore) => {
          if (!state.user) return state
          return {
            user: {
              ...state.user,
              matches: state.user.matches.filter((m: Match) => m.id !== matchId),
            },
          }
        }); },
    })) as StateCreator<UserStore>,
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

