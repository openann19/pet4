import type { PetProfile, OwnerPreferences, MatchRecord } from '@/core/domain/pet-model';
import type { MatchScore, HardGateResult } from '@/core/domain/matching-engine';
import type { MatchingConfig } from '@/core/domain/matching-config';
import { DEFAULT_MATCHING_WEIGHTS, DEFAULT_HARD_GATES } from '@/core/domain/matching-config';
import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import { getRealtimeEvents } from '@/lib/realtime-events';
import type { UpdateOwnerPreferencesData, UpdateMatchingConfigData } from '@/api/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('MatchingAPI');

export interface DiscoverRequest {
  petId: string;
  filters?: {
    species?: string[];
    minAge?: number;
    maxAge?: number;
    maxDistance?: number;
    intents?: string[];
  };
  pageCursor?: string;
  pageSize?: number;
}

export interface DiscoverResponse {
  candidates: {
    pet: PetProfile;
    score: number;
    distance: number;
  }[];
  nextCursor?: string;
  totalCount: number;
}

export interface ScoreRequest {
  petId1: string;
  petId2: string;
}

export interface ScoreResponse {
  score: MatchScore;
  hardGates: HardGateResult;
  canMatch: boolean;
}

export interface SwipeRequest {
  petId: string;
  targetPetId: string;
  action: 'like' | 'pass' | 'superlike';
}

export interface SwipeResponse {
  recorded: boolean;
  isMatch: boolean;
  matchId?: string;
  chatRoomId?: string;
}

export interface ReportRequest {
  reporterPetId: string;
  reportedPetId: string;
  reason: string;
  details?: string;
}

export class MatchingAPI {
  private configCache: MatchingConfig | null = null;

  async discover(request: DiscoverRequest): Promise<DiscoverResponse> {
    try {
      const response = await APIClient.post<DiscoverResponse>(ENDPOINTS.MATCHING.DISCOVER, request);
      return response.data;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to discover candidates', err, { petId: request.petId });
      throw err;
    }
  }

  async score(request: ScoreRequest): Promise<ScoreResponse> {
    try {
      const response = await APIClient.post<ScoreResponse>(ENDPOINTS.MATCHING.SCORE, request);
      return response.data;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to calculate match score', err, {
        petId1: request.petId1,
        petId2: request.petId2,
      });
      throw err;
    }
  }

  async swipe(request: SwipeRequest): Promise<SwipeResponse> {
    try {
      const response = await APIClient.post<SwipeResponse>(ENDPOINTS.MATCHING.SWIPE, request);

      const result = response.data;

      if (result.isMatch && result.matchId) {
        const realtimeEvents = getRealtimeEvents();
        await realtimeEvents
          .notifyMatchCreated({
            id: result.matchId,
            petAId: request.petId,
            petBId: request.targetPetId,
            compatibilityScore: 0, // Will be set by backend
            compatibilityBreakdown: {
              personality: 0,
              interests: 0,
              size: 0,
              age: 0,
              location: 0,
              overall: 0,
            },
            status: 'active',
            chatRoomId: result.chatRoomId ?? '',
            createdAt: new Date().toISOString(),
            lastInteractionAt: new Date().toISOString(),
          })
          .catch((error: unknown) => {
            logger.error(
              'Failed to emit match_created event',
              _error instanceof Error ? _error : new Error(String(_error))
            );
          });
      } else if (request.action === 'like' || request.action === 'superlike') {
        const realtimeEvents = getRealtimeEvents();
        await realtimeEvents
          .notifyLikeReceived(request.petId, request.targetPetId)
          .catch((error: unknown) => {
            logger.error(
              'Failed to emit like_received event',
              _error instanceof Error ? _error : new Error(String(_error))
            );
          });
      }

      return result;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to record swipe', err, {
        petId: request.petId,
        targetPetId: request.targetPetId,
      });
      throw err;
    }
  }

  async getMatches(petId: string): Promise<MatchRecord[]> {
    try {
      const response = await APIClient.get<{ matches: MatchRecord[] }>(
        `${ENDPOINTS.MATCHING.MATCHES}?petId=${petId}`
      );
      return response.data.matches;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to get matches', err, { petId });
      throw err;
    }
  }

  async getPreferences(ownerId: string): Promise<OwnerPreferences> {
    try {
      const response = await APIClient.get<{ preferences: OwnerPreferences }>(
        `${ENDPOINTS.MATCHING.PREFERENCES}?ownerId=${ownerId}`
      );
      return response.data.preferences;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to get preferences', err, { ownerId });
      throw err;
    }
  }

  async updatePreferences(
    ownerId: string,
    data: UpdateOwnerPreferencesData
  ): Promise<OwnerPreferences> {
    try {
      const response = await APIClient.put<{ preferences: OwnerPreferences }>(
        ENDPOINTS.MATCHING.PREFERENCES,
        {
          ownerId,
          ...data,
        }
      );
      return response.data.preferences;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to update preferences', err, { ownerId });
      throw err;
    }
  }

  async reportPet(request: ReportRequest): Promise<void> {
    try {
      await APIClient.post('/matching/report', request);
      logger.info('Pet reported', {
        reporterPetId: request.reporterPetId,
        reportedPetId: request.reportedPetId,
        reason: request.reason,
      });
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to report pet', err, { reporterPetId: request.reporterPetId });
      throw err;
    }
  }

  async getConfig(): Promise<MatchingConfig> {
    if (this.configCache) return this.configCache;

    try {
      const response = await APIClient.get<{ config: MatchingConfig }>('/matching/config');
      this.configCache = response.data.config;
      return response.data.config;
    } catch (_error) {
      // If config not found, use defaults
      logger.warn(
        'Failed to get matching config, using defaults',
        _error instanceof Error ? _error : new Error(String(_error))
      );
      const defaultConfig: MatchingConfig = {
        id: 'default',
        weights: DEFAULT_MATCHING_WEIGHTS,
        hardGates: DEFAULT_HARD_GATES,
        featureFlags: {
          MATCH_ALLOW_CROSS_SPECIES: false,
          MATCH_REQUIRE_VACCINATION: true,
          MATCH_DISTANCE_MAX_KM: 50,
          MATCH_AB_TEST_KEYS: [],
          MATCH_AI_HINTS_ENABLED: true,
        },
        updatedAt: new Date().toISOString(),
        updatedBy: 'system',
      };
      this.configCache = defaultConfig;
      return defaultConfig;
    }
  }

  async updateConfig(data: UpdateMatchingConfigData): Promise<MatchingConfig> {
    try {
      const response = await APIClient.put<{ config: MatchingConfig }>('/matching/config', data);
      this.configCache = response.data.config;
      return response.data.config;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to update config', err);
      throw err;
    }
  }
}

export const matchingAPI = new MatchingAPI();
