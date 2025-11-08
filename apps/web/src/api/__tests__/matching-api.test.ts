/**
 * Matching API tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { MatchingAPI } from '@/api/matching-api';
import type {
  PetProfile,
  OwnerPreferences,
  MatchRecord,
  LocationData,
} from '@/core/domain/pet-model';
import type {
  MatchingConfig,
  MatchingWeights,
  HardGatesConfig,
} from '@/core/domain/matching-config';
import { getRealtimeEvents } from '@/lib/realtime-events';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/realtime-events', () => ({
  getRealtimeEvents: vi.fn(() => ({
    notifyMatchCreated: vi.fn().mockResolvedValue(undefined),
    notifyLikeReceived: vi.fn().mockResolvedValue(undefined),
  })),
}));

let server: ReturnType<typeof createServer>;
const matchingAPI = new MatchingAPI();

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const body = Buffer.concat(chunks).toString('utf8');
  return body ? (JSON.parse(body) as T) : ({} as T);
}

const mockLocation: LocationData = {
  geohash: '9q8yy',
  roundedLat: 37.77,
  roundedLng: -122.42,
  city: 'San Francisco',
  country: 'US',
  timezone: 'America/Los_Angeles',
};

const mockPet: PetProfile = {
  id: 'pet-1',
  ownerId: 'owner-1',
  species: 'dog',
  breedId: 'breed-1',
  breedName: 'Golden Retriever',
  name: 'Buddy',
  sex: 'male',
  neuterStatus: 'neutered',
  ageMonths: 24,
  lifeStage: 'adult',
  size: 'large',
  health: {
    vaccinationsUpToDate: true,
    specialNeeds: [],
    aggressionFlags: false,
    biteHistory: false,
    attackHistory: false,
  },
  temperament: {
    energyLevel: 7,
    friendliness: 9,
    playfulness: 8,
    calmness: 6,
    independence: 5,
    traits: ['friendly', 'playful'],
  },
  socialization: {
    comfortWithDogs: 9,
    comfortWithCats: 7,
    comfortWithKids: 10,
    comfortWithStrangers: 8,
  },
  intents: ['playdate', 'companionship'],
  location: mockLocation,
  media: [],
  vetVerified: false,
  kycVerified: false,
  blocklist: [],
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockMatch: MatchRecord = {
  id: 'match-1',
  petId1: 'pet-1',
  petId2: 'pet-2',
  score: 0.85,
  matchedAt: new Date().toISOString(),
  status: 'active',
  chatRoomId: 'room-1',
};

const mockPreferences: OwnerPreferences = {
  ownerId: 'owner-1',
  maxDistanceKm: 50,
  speciesAllowed: ['dog'],
  allowCrossSpecies: false,
  sizesCompatible: ['small', 'medium', 'large'],
  intentsAllowed: ['playdate', 'companionship'],
  requireVaccinations: true,
  globalSearch: true,
  updatedAt: new Date().toISOString(),
};

const mockWeights: MatchingWeights = {
  temperamentFit: 0.2,
  energyLevelFit: 0.1,
  lifeStageProximity: 0.1,
  sizeCompatibility: 0.15,
  speciesBreedCompatibility: 0.15,
  socializationCompatibility: 0.1,
  intentMatch: 0.1,
  distance: 0.1,
  healthVaccinationBonus: 0.05,
};

const mockHardGates: HardGatesConfig = {
  allowCrossSpecies: false,
  requireVaccinations: true,
  blockAggressionConflicts: true,
  requireApprovedMedia: true,
  enforceNeuterPolicy: false,
  maxDistanceKm: 50,
};

const mockConfig: MatchingConfig = {
  id: 'config-1',
  weights: mockWeights,
  hardGates: mockHardGates,
  featureFlags: {
    MATCH_ALLOW_CROSS_SPECIES: false,
    MATCH_REQUIRE_VACCINATION: true,
    MATCH_DISTANCE_MAX_KM: 50,
    MATCH_AB_TEST_KEYS: [],
    MATCH_AI_HINTS_ENABLED: true,
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'admin-1',
};

beforeAll(async () => {
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url || !req.method) {
      res.statusCode = 400;
      res.end();
      return;
    }

    const url = new URL(req.url, 'http://localhost:8080');

    if (req.method === 'POST' && url.pathname === '/matching/discover') {
      await readJson(req);
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            candidates: [{ pet: mockPet, score: 0.85, distance: 5 }],
            nextCursor: undefined,
            totalCount: 1,
          },
        })
      );
      return;
    }

    if (req.method === 'POST' && url.pathname === '/matching/score') {
      await readJson(req);
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            score: {
              overall: 0.85,
              personality: 0.8,
              interests: 0.9,
              size: 0.7,
              age: 0.9,
              location: 0.8,
            },
            hardGates: {
              passed: true,
              failures: [],
            },
            canMatch: true,
          },
        })
      );
      return;
    }

    if (req.method === 'POST' && url.pathname === '/matching/swipe') {
      const payload = await readJson<{ petId: string; targetPetId: string; action: string }>(req);
      const isMatch = payload.action === 'like' && payload.targetPetId === 'pet-2';
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            recorded: true,
            isMatch,
            matchId: isMatch ? 'match-1' : undefined,
            chatRoomId: isMatch ? 'room-1' : undefined,
          },
        })
      );
      return;
    }

    if (req.method === 'GET' && url.pathname === '/matching/matches') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { matches: [mockMatch] } }));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/matching/preferences') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { preferences: mockPreferences } }));
      return;
    }

    if (req.method === 'PUT' && url.pathname === '/matching/preferences') {
      await readJson(req);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { preferences: mockPreferences } }));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/matching/report') {
      await readJson(req);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ data: { success: true } }));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/matching/config') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { config: mockConfig } }));
      return;
    }

    if (req.method === 'PUT' && url.pathname === '/matching/config') {
      await readJson(req);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { config: mockConfig } }));
      return;
    }

    res.statusCode = 404;
    res.end();
  });

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        process.env['TEST_API_PORT'] = String(address.port);
      }
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('MatchingAPI.discover', () => {
  it('should discover candidates', async () => {
    const result = await matchingAPI.discover({
      petId: 'pet-1',
      filters: {
        species: ['dog'],
        minAge: 1,
        maxAge: 5,
        maxDistance: 50,
      },
    });

    expect(result).toMatchObject({
      candidates: expect.any(Array),
      totalCount: expect.any(Number),
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(
      matchingAPI.discover({
        petId: 'pet-1',
      })
    ).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('MatchingAPI.score', () => {
  it('should calculate match score', async () => {
    const result = await matchingAPI.score({
      petId1: 'pet-1',
      petId2: 'pet-2',
    });

    expect(result).toMatchObject({
      score: expect.any(Object),
      hardGates: expect.any(Object),
      canMatch: expect.any(Boolean),
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(
      matchingAPI.score({
        petId1: 'pet-1',
        petId2: 'pet-2',
      })
    ).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('MatchingAPI.swipe', () => {
  it('should record swipe', async () => {
    const result = await matchingAPI.swipe({
      petId: 'pet-1',
      targetPetId: 'pet-2',
      action: 'like',
    });

    expect(result).toMatchObject({
      recorded: true,
      isMatch: expect.any(Boolean),
    });
  });

  it('should emit match event on match', async () => {
    const result = await matchingAPI.swipe({
      petId: 'pet-1',
      targetPetId: 'pet-2',
      action: 'like',
    });

    if (result.isMatch) {
      const realtimeEvents = getRealtimeEvents();
      expect(realtimeEvents.notifyMatchCreated).toHaveBeenCalled();
    }
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(
      matchingAPI.swipe({
        petId: 'pet-1',
        targetPetId: 'pet-2',
        action: 'like',
      })
    ).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('MatchingAPI.getMatches', () => {
  it('should return matches', async () => {
    const matches = await matchingAPI.getMatches('pet-1');

    expect(Array.isArray(matches)).toBe(true);
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(matchingAPI.getMatches('pet-1')).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('MatchingAPI.getPreferences', () => {
  it('should return preferences', async () => {
    const preferences = await matchingAPI.getPreferences('owner-1');

    expect(preferences).toMatchObject({
      ownerId: 'owner-1',
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(matchingAPI.getPreferences('owner-1')).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('MatchingAPI.updatePreferences', () => {
  it('should update preferences', async () => {
    const preferences = await matchingAPI.updatePreferences('owner-1', { maxDistanceKm: 100 });

    expect(preferences).toMatchObject({
      ownerId: 'owner-1',
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(
      matchingAPI.updatePreferences('owner-1', { maxDistanceKm: 100 })
    ).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('MatchingAPI.reportPet', () => {
  it('should report pet', async () => {
    await expect(
      matchingAPI.reportPet({
        reporterPetId: 'pet-1',
        reportedPetId: 'pet-2',
        reason: 'inappropriate',
      })
    ).resolves.not.toThrow();
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(
      matchingAPI.reportPet({
        reporterPetId: 'pet-1',
        reportedPetId: 'pet-2',
        reason: 'inappropriate',
      })
    ).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('MatchingAPI.getConfig', () => {
  it('should return config', async () => {
    const config = await matchingAPI.getConfig();

    expect(config).toMatchObject({
      id: expect.any(String),
      weights: expect.any(Object),
    });
  });

  it('should use default config on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const config = await matchingAPI.getConfig();

    expect(config).toMatchObject({
      id: 'default',
      weights: expect.any(Object),
    });

    global.fetch = originalFetch;
  });
});

describe('MatchingAPI.updateConfig', () => {
  it('should update config', async () => {
    const config = await matchingAPI.updateConfig({ weights: mockConfig.weights });

    expect(config).toMatchObject({
      id: expect.any(String),
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(matchingAPI.updateConfig({ weights: mockConfig.weights })).rejects.toThrow();

    global.fetch = originalFetch;
  });
});
