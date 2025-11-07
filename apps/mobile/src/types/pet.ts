/**
 * Pet domain types
 * Location: src/types/pet.ts
 */

export interface PetProfile {
  id: string
  name: string
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
  breed: string
  age: number
  photos: string[]
  bio?: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface Match {
  id: string
  petId: string
  matchedPetId: string
  matchedAt: string
  status: 'pending' | 'accepted' | 'declined'
  lastMessageAt?: string
}

export interface SwipeAction {
  petId: string
  direction: 'left' | 'right'
  timestamp: number
}

/**
 * Type guard for PetProfile
 */
export function isPetProfile(data: unknown): data is PetProfile {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'species' in data &&
    'breed' in data &&
    'age' in data &&
    'photos' in data &&
    'ownerId' in data &&
    typeof (data as PetProfile).id === 'string' &&
    typeof (data as PetProfile).name === 'string' &&
    Array.isArray((data as PetProfile).photos)
  )
}

/**
 * Type guard for Match
 */
export function isMatch(data: unknown): data is Match {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'petId' in data &&
    'matchedPetId' in data &&
    'matchedAt' in data &&
    'status' in data &&
    typeof (data as Match).id === 'string' &&
    typeof (data as Match).status === 'string'
  )
}

