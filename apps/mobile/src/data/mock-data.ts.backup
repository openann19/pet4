import { DEFAULT_HARD_GATES, DEFAULT_MATCHING_WEIGHTS } from '@pet/domain/matching-config'
import type { OwnerPreferences, PetProfile } from '@pet/domain/pet-model'

export const samplePets: PetProfile[] = [
  {
    id: 'pet-alpha',
    ownerId: 'owner-a',
    species: 'dog',
    breedId: 'labrador_retriever',
    breedName: 'Labrador Retriever',
    name: 'Nova',
    sex: 'female',
    neuterStatus: 'neutered',
    dateOfBirth: '2021-06-15',
    ageMonths: 44,
    lifeStage: 'adult',
    size: 'medium',
    weightKg: 24,
    health: {
      vaccinationsUpToDate: true,
      lastVetCheck: '2024-10-05',
      specialNeeds: [],
      aggressionFlags: false,
      biteHistory: false,
      attackHistory: false
    },
    temperament: {
      energyLevel: 7,
      friendliness: 9,
      playfulness: 8,
      calmness: 6,
      independence: 4,
      traits: ['affectionate', 'outgoing', 'trainable']
    },
    socialization: {
      comfortWithDogs: 8,
      comfortWithCats: 6,
      comfortWithKids: 9,
      comfortWithStrangers: 8
    },
    intents: ['playdate', 'adoption'],
    location: {
      geohash: 'dr5regw3pg',
      roundedLat: 40.7128,
      roundedLng: -74.006,
      city: 'New York',
      country: 'US',
      timezone: 'America/New_York'
    },
    media: [
      {
        id: 'media-alpha',
        url: 'https://example.com/pets/nova-1.jpg',
        status: 'approved',
        moderatedAt: '2024-10-07T12:00:00Z',
        moderatedBy: 'mod-1'
      }
    ],
    aiHints: {
      breedInference: 'Labrador Retriever',
      breedConfidence: 0.92,
      sizeEstimate: 'medium',
      ageEstimateMonths: 46,
      qualityScore: 0.88
    },
    vetVerified: true,
    kycVerified: true,
    bio: 'Adventure buddy who loves water and puzzle feeders.',
    blocklist: [],
    isActive: true,
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2024-11-05T09:30:00Z'
  },
  {
    id: 'pet-bravo',
    ownerId: 'owner-b',
    species: 'dog',
    breedId: 'australian_shepherd',
    breedName: 'Australian Shepherd',
    name: 'Atlas',
    sex: 'male',
    neuterStatus: 'intact',
    dateOfBirth: '2022-02-10',
    ageMonths: 36,
    lifeStage: 'adult',
    size: 'medium',
    weightKg: 21,
    health: {
      vaccinationsUpToDate: true,
      lastVetCheck: '2024-09-18',
      specialNeeds: ['daily agility training'],
      aggressionFlags: false,
      biteHistory: false,
      attackHistory: false
    },
    temperament: {
      energyLevel: 9,
      friendliness: 7,
      playfulness: 9,
      calmness: 4,
      independence: 5,
      traits: ['energetic', 'smart', 'loyal']
    },
    socialization: {
      comfortWithDogs: 7,
      comfortWithCats: 5,
      comfortWithKids: 8,
      comfortWithStrangers: 7
    },
    intents: ['playdate', 'companionship'],
    location: {
      geohash: 'dr5regw3ph',
      roundedLat: 40.7132,
      roundedLng: -74.0015,
      city: 'New York',
      country: 'US',
      timezone: 'America/New_York'
    },
    media: [
      {
        id: 'media-bravo',
        url: 'https://example.com/pets/atlas-1.jpg',
        status: 'approved',
        moderatedAt: '2024-10-12T15:20:00Z',
        moderatedBy: 'mod-2'
      }
    ],
    aiHints: {
      breedInference: 'Australian Shepherd',
      breedConfidence: 0.89,
      coatColor: 'blue merle',
      qualityScore: 0.9
    },
    vetVerified: true,
    kycVerified: true,
    bio: 'Working dog with a brain for puzzles and a love for long hikes.',
    blocklist: [],
    isActive: true,
    createdAt: '2023-02-01T13:00:00Z',
    updatedAt: '2024-11-04T08:10:00Z'
  }
]

export const sampleOwnerPreferences: OwnerPreferences = {
  ownerId: 'owner-a',
  maxDistanceKm: 80,
  speciesAllowed: ['dog'],
  allowCrossSpecies: false,
  sizesCompatible: ['medium', 'large'],
  intentsAllowed: ['playdate', 'companionship', 'adoption'],
  lifeStageMin: 'young',
  lifeStageMax: 'senior',
  requireVaccinations: true,
  scheduleWindows: [
    { day: 6, startHour: 9, endHour: 12 },
    { day: 0, startHour: 14, endHour: 18 }
  ],
  globalSearch: false,
  updatedAt: '2024-11-05T09:00:00Z'
}

export const sampleMatchingWeights = DEFAULT_MATCHING_WEIGHTS
export const sampleHardGates = {
  ...DEFAULT_HARD_GATES,
  maxDistanceKm: 80
}
