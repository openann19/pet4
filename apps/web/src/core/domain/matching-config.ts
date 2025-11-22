import type { Species } from './species';

export interface MatchingWeights {
  temperamentFit: number;
  energyLevelFit: number;
  lifeStageProximity: number;
  sizeCompatibility: number;
  speciesBreedCompatibility: number;
  socializationCompatibility: number;
  intentMatch: number;
  distance: number;
  healthVaccinationBonus: number;
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  temperamentFit: 20,
  energyLevelFit: 10,
  lifeStageProximity: 10,
  sizeCompatibility: 10,
  speciesBreedCompatibility: 15,
  socializationCompatibility: 10,
  intentMatch: 10,
  distance: 10,
  healthVaccinationBonus: 5,
};

export const WEIGHT_SAFE_RANGES: Record<keyof MatchingWeights, { min: number; max: number }> = {
  temperamentFit: { min: 0, max: 40 },
  energyLevelFit: { min: 0, max: 25 },
  lifeStageProximity: { min: 0, max: 25 },
  sizeCompatibility: { min: 0, max: 25 },
  speciesBreedCompatibility: { min: 0, max: 30 },
  socializationCompatibility: { min: 0, max: 25 },
  intentMatch: { min: 0, max: 25 },
  distance: { min: 0, max: 30 },
  healthVaccinationBonus: { min: 0, max: 15 },
};

export interface HardGatesConfig {
  allowCrossSpecies: boolean;
  requireVaccinations: boolean;
  blockAggressionConflicts: boolean;
  requireApprovedMedia: boolean;
  enforceNeuterPolicy: boolean;
  maxDistanceKm: number;
}

export const DEFAULT_HARD_GATES: HardGatesConfig = {
  allowCrossSpecies: false,
  requireVaccinations: true,
  blockAggressionConflicts: true,
  requireApprovedMedia: true,
  enforceNeuterPolicy: true,
  maxDistanceKm: 50,
};

export const DOG_SIZE_COMPATIBILITY_MATRIX: Record<string, string[]> = {
  toy: ['toy', 'small'],
  small: ['toy', 'small', 'medium'],
  medium: ['small', 'medium', 'large'],
  large: ['medium', 'large', 'giant'],
  giant: ['large', 'giant'],
};

export const CAT_SIZE_COMPATIBILITY_MATRIX: Record<string, string[]> = {
  small: ['small', 'medium'],
  medium: ['small', 'medium', 'large'],
  large: ['medium', 'large'],
};

export function getSizeCompatibilityMatrix(species: Species): Record<string, string[]> {
  return species === 'dog' ? DOG_SIZE_COMPATIBILITY_MATRIX : CAT_SIZE_COMPATIBILITY_MATRIX;
}

export const DOG_BREED_FAMILIES: Record<string, string[]> = {
  sporting: ['friendly', 'active', 'trainable'],
  hound: ['independent', 'vocal', 'determined'],
  working: ['confident', 'loyal', 'protective'],
  terrier: ['feisty', 'energetic', 'determined'],
  toy: ['affectionate', 'sociable', 'alert'],
  'non-sporting': ['varied', 'adaptable'],
  herding: ['intelligent', 'energetic', 'trainable'],
  mixed: ['varied', 'adaptable'],
};

export interface FeatureFlags {
  MATCH_ALLOW_CROSS_SPECIES: boolean;
  MATCH_REQUIRE_VACCINATION: boolean;
  MATCH_DISTANCE_MAX_KM: number;
  MATCH_AB_TEST_KEYS: string[];
  MATCH_AI_HINTS_ENABLED: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  MATCH_ALLOW_CROSS_SPECIES: false,
  MATCH_REQUIRE_VACCINATION: true,
  MATCH_DISTANCE_MAX_KM: 50,
  MATCH_AB_TEST_KEYS: [],
  MATCH_AI_HINTS_ENABLED: true,
};

export interface MatchingConfig {
  id: string;
  species?: Species;
  region?: string;
  weights: MatchingWeights;
  hardGates: HardGatesConfig;
  featureFlags: FeatureFlags;
  updatedAt: string;
  updatedBy: string;
  [key: string]: unknown;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  changes: Record<string, unknown>;
  previousValues: Record<string, unknown>;
}
