import type { Species, LifeStage, PetSize } from './species';

export type Sex = 'male' | 'female';
export type NeuterStatus = 'intact' | 'neutered' | 'unknown';

export type Intent = 'playdate' | 'companionship' | 'adoption' | 'breeding';

export interface HealthData {
  vaccinationsUpToDate: boolean;
  lastVetCheck?: string;
  specialNeeds: string[];
  aggressionFlags: boolean;
  aggressionReason?: string;
  biteHistory: boolean;
  attackHistory: boolean;
}

export interface TemperamentData {
  energyLevel: number;
  friendliness: number;
  playfulness: number;
  calmness: number;
  independence: number;
  traits: string[];
}

export interface SocializationData {
  comfortWithDogs: number;
  comfortWithCats: number;
  comfortWithKids: number;
  comfortWithStrangers: number;
}

export interface LocationData {
  geohash: string;
  roundedLat: number;
  roundedLng: number;
  city: string;
  country: string;
  timezone: string;
}

export interface MediaItem {
  id: string;
  url: string;
  status: 'pending' | 'approved' | 'held_for_kyc' | 'rejected';
  moderatedAt?: string;
  moderatedBy?: string;
  rejectionReason?: string;
}

export interface AIHints {
  breedInference?: string;
  breedConfidence?: number;
  coatColor?: string;
  sizeEstimate?: string;
  ageEstimateMonths?: number;
  qualityScore?: number;
}

export interface PetProfile {
  id: string;
  ownerId: string;

  species: Species;
  breedId: string;
  breedName: string;

  name: string;
  sex: Sex;
  neuterStatus: NeuterStatus;

  dateOfBirth?: string;
  ageMonths: number;
  lifeStage: LifeStage;

  size: PetSize;
  weightKg?: number;

  health: HealthData;
  temperament: TemperamentData;
  socialization: SocializationData;

  intents: Intent[];

  location: LocationData;

  media: MediaItem[];

  aiHints?: AIHints;

  vetVerified: boolean;
  kycVerified: boolean;

  bio?: string;

  blocklist: string[];

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerPreferences {
  ownerId: string;

  maxDistanceKm: number;

  speciesAllowed: Species[];
  allowCrossSpecies: boolean;

  sizesCompatible: PetSize[];

  intentsAllowed: Intent[];

  lifeStageMin?: LifeStage;
  lifeStageMax?: LifeStage;

  requireVaccinations: boolean;

  scheduleWindows?: {
    day: number;
    startHour: number;
    endHour: number;
  }[];

  globalSearch: boolean;

  updatedAt: string;
}

export interface SwipeRecord {
  id: string;
  petId: string;
  targetPetId: string;
  action: 'like' | 'pass' | 'superlike';
  timestamp: string;
}

export interface MatchRecord {
  id: string;
  petId1: string;
  petId2: string;
  score: number;
  matchedAt: string;
  status: 'active' | 'archived';
  chatRoomId?: string;
}
