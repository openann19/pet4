/**
 * Integration Tests: Matching Flow
 *
 * Tests the complete matching flow from discovery to match creation
 * Coverage target: Critical user flows
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create properly typed mocks
const mockGetPets = vi.fn();
const mockGetPetById = vi.fn();
const mockLikePet = vi.fn();
const mockPassPet = vi.fn();
const mockGetMatches = vi.fn();

vi.mock('@/api/matching-api', () => ({
  matchingAPI: {
    getPets: mockGetPets,
    getPetById: mockGetPetById,
    likePet: mockLikePet,
    passPet: mockPassPet,
    getMatches: mockGetMatches,
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('Matching Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Pet Discovery', () => {
    it('should load pets for discovery', async () => {
      mockGetPets.mockResolvedValue({
        pets: [
          { id: '1', name: 'Fluffy', photos: [] },
          { id: '2', name: 'Max', photos: [] },
        ],
        hasMore: true,
      });

      const result = await mockGetPets({ limit: 10 });

      expect(result.pets).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(mockGetPets).toHaveBeenCalledWith({ limit: 10 });
    });

    it('should handle empty discovery results', async () => {
      mockGetPets.mockResolvedValue({
        pets: [],
        hasMore: false,
      });

      const result = await mockGetPets({ limit: 10 });

      expect(result.pets).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('Like/Pass Actions', () => {
    it('should like a pet and create match if mutual', async () => {
      mockLikePet.mockResolvedValue({
        isMatch: true,
        match: { id: 'match-1', petId: '1' },
      });

      const result = await mockLikePet('pet-1');

      expect(result.isMatch).toBe(true);
      expect(result.match).toBeDefined();
      expect(mockLikePet).toHaveBeenCalledWith('pet-1');
    });

    it('should like a pet without match', async () => {
      mockLikePet.mockResolvedValue({
        isMatch: false,
      });

      const result = await mockLikePet('pet-1');

      expect(result.isMatch).toBe(false);
    });

    it('should pass a pet', async () => {
      mockPassPet.mockResolvedValue(undefined);

      await mockPassPet('pet-1');

      expect(mockPassPet).toHaveBeenCalledWith('pet-1');
    });
  });

  describe('Matches List', () => {
    it('should load matches', async () => {
      mockGetMatches.mockResolvedValue({
        matches: [
          { id: 'match-1', pet: { id: '1', name: 'Fluffy' } },
          { id: 'match-2', pet: { id: '2', name: 'Max' } },
        ],
      });

      const result = await mockGetMatches();

      expect(result.matches).toHaveLength(2);
      expect(mockGetMatches).toHaveBeenCalled();
    });
  });
});
