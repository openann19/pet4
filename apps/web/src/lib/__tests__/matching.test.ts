import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateCompatibility,
  getCompatibilityFactors,
  generateMatchReasoning,
  generateMatchReasonsSync,
} from '../matching';
import type { Pet } from '../types';

// Mock dependencies
vi.mock('./llm-prompt');
vi.mock('./llm-service');
vi.mock('./logger');

const mockBuildLLMPrompt = vi.hoisted(() => vi.fn());
const mockLLMService = vi.hoisted(() => ({ llm: vi.fn() }));
const mockLogger = vi.hoisted(() => ({ warn: vi.fn() }));

vi.mock('./llm-prompt', () => ({
  buildLLMPrompt: mockBuildLLMPrompt,
}));

vi.mock('./llm-service', () => ({
  llmService: mockLLMService,
}));

vi.mock('./logger', () => ({
  logger: mockLogger,
}));

describe('matching utilities', () => {
  const mockUserPet: Pet = {
    id: '1',
    name: 'Buddy',
    breed: 'Golden Retriever',
    age: 3,
    size: 'medium',
    personality: ['playful', 'friendly', 'energetic'],
    interests: ['fetch', 'walks', 'swimming'],
    lookingFor: ['playdates', 'training'],
    verified: true,
    description: 'Friendly golden retriever',
  };

  const mockOtherPet: Pet = {
    id: '2',
    name: 'Max',
    breed: 'Labrador',
    age: 4,
    size: 'large',
    personality: ['energetic', 'playful', 'adventurous'],
    interests: ['fetch', 'running', 'swimming'],
    lookingFor: ['playdates', 'adventure'],
    verified: false,
    description: 'Active labrador',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockBuildLLMPrompt.mockReturnValue('mock-prompt');
    mockLLMService.llm.mockResolvedValue(
      '{"reasons": ["Great energy match!", "Love swimming together"]}'
    );
  });

  describe('calculateCompatibility', () => {
    it('should calculate compatibility score correctly', () => {
      const score = calculateCompatibility(mockUserPet, mockOtherPet);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(typeof score).toBe('number');
    });

    it('should add verification bonus for verified pets', () => {
      const verifiedPet = { ...mockOtherPet, verified: true };
      const scoreWithVerification = calculateCompatibility(mockUserPet, verifiedPet);
      const scoreWithoutVerification = calculateCompatibility(mockUserPet, mockOtherPet);

      expect(scoreWithVerification).toBeGreaterThan(scoreWithoutVerification);
    });

    it('should cap score at 100', () => {
      const perfectMatchPet: Pet = {
        ...mockOtherPet,
        size: 'medium',
        personality: ['playful', 'friendly', 'energetic'],
        interests: ['fetch', 'walks', 'swimming'],
        age: 3,
        verified: true,
      };

      const score = calculateCompatibility(mockUserPet, perfectMatchPet);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle pets with minimal data', () => {
      const minimalPet: Pet = {
        id: '3',
        name: 'Minimal',
        breed: 'Unknown',
        age: 1,
        size: 'small',
        personality: [],
        interests: [],
        lookingFor: [],
        verified: false,
        description: '',
      };

      const score = calculateCompatibility(mockUserPet, minimalPet);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getCompatibilityFactors', () => {
    it('should return all compatibility factors', () => {
      const factors = getCompatibilityFactors(mockUserPet, mockOtherPet);

      expect(factors).toHaveProperty('sizeMatch');
      expect(factors).toHaveProperty('personalityMatch');
      expect(factors).toHaveProperty('interestMatch');
      expect(factors).toHaveProperty('ageCompatibility');
      expect(factors).toHaveProperty('locationProximity');

      // Check that all values are between 0 and 1
      Object.values(factors).forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      });
    });

    it('should calculate size match correctly', () => {
      const sameSizePet: Pet = { ...mockOtherPet, size: 'medium' };
      const factors = getCompatibilityFactors(mockUserPet, sameSizePet);
      expect(factors.sizeMatch).toBe(1);

      const incompatibleSizePet: Pet = { ...mockOtherPet, size: 'extra-large' };
      const incompatibleFactors = getCompatibilityFactors(mockUserPet, incompatibleSizePet);
      expect(incompatibleFactors.sizeMatch).toBe(0.3);
    });

    it('should calculate personality match correctly', () => {
      const compatiblePersonalityPet: Pet = {
        ...mockOtherPet,
        personality: ['playful', 'energetic'],
      };
      const factors = getCompatibilityFactors(mockUserPet, compatiblePersonalityPet);
      expect(factors.personalityMatch).toBeGreaterThan(0.5);

      const incompatiblePersonalityPet: Pet = {
        ...mockOtherPet,
        personality: ['independent', 'quiet'],
      };
      const incompatibleFactors = getCompatibilityFactors(mockUserPet, incompatiblePersonalityPet);
      expect(incompatibleFactors.personalityMatch).toBeLessThan(0.5);
    });

    it('should calculate interest match correctly', () => {
      const sharedInterestsPet: Pet = {
        ...mockOtherPet,
        interests: ['fetch', 'walks', 'swimming'],
      };
      const factors = getCompatibilityFactors(mockUserPet, sharedInterestsPet);
      expect(factors.interestMatch).toBeGreaterThan(0.5);

      const noSharedInterestsPet: Pet = {
        ...mockOtherPet,
        interests: ['grooming', 'sleeping', 'eating'],
      };
      const noSharedFactors = getCompatibilityFactors(mockUserPet, noSharedInterestsPet);
      expect(noSharedFactors.interestMatch).toBe(0);
    });

    it('should calculate age compatibility correctly', () => {
      const sameAgePet: Pet = { ...mockOtherPet, age: 3 };
      const factors = getCompatibilityFactors(mockUserPet, sameAgePet);
      expect(factors.ageCompatibility).toBe(1);

      const closeAgePet: Pet = { ...mockOtherPet, age: 4 };
      const closeFactors = getCompatibilityFactors(mockUserPet, closeAgePet);
      expect(closeFactors.ageCompatibility).toBe(0.9);

      const distantAgePet: Pet = { ...mockOtherPet, age: 10 };
      const distantFactors = getCompatibilityFactors(mockUserPet, distantAgePet);
      expect(distantFactors.ageCompatibility).toBeLessThan(0.5);
    });
  });

  describe('generateMatchReasoning', () => {
    it('should generate AI-based match reasons', async () => {
      const reasons = await generateMatchReasoning(mockUserPet, mockOtherPet);

      expect(mockBuildLLMPrompt).toHaveBeenCalled();
      expect(mockLLMService.llm).toHaveBeenCalledWith('mock-prompt', 'gpt-4o-mini', true);
      expect(Array.isArray(reasons)).toBe(true);
      expect(reasons.length).toBeGreaterThan(0);
      expect(reasons[0]).toBe('Great energy match!');
      expect(reasons[1]).toBe('Love swimming together');
    });

    it('should handle malformed AI response gracefully', async () => {
      mockLLMService.llm.mockResolvedValue('invalid json');

      const reasons = await generateMatchReasoning(mockUserPet, mockOtherPet);

      expect(Array.isArray(reasons)).toBe(true);
      expect(reasons.length).toBeGreaterThan(0);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'AI reasoning unavailable, using fallback logic',
        expect.any(Object)
      );
    });

    it('should handle empty AI response gracefully', async () => {
      mockLLMService.llm.mockResolvedValue('{"reasons": []}');

      const reasons = await generateMatchReasoning(mockUserPet, mockOtherPet);

      expect(Array.isArray(reasons)).toBe(true);
      expect(reasons.length).toBeGreaterThan(0);
    });

    it('should handle AI service errors gracefully', async () => {
      mockLLMService.llm.mockRejectedValue(new Error('AI service unavailable'));

      const reasons = await generateMatchReasoning(mockUserPet, mockOtherPet);

      expect(Array.isArray(reasons)).toBe(true);
      expect(reasons.length).toBeGreaterThan(0);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'AI reasoning unavailable, using fallback logic',
        expect.any(Object)
      );
    });

    it('should handle non-string reasons in AI response', async () => {
      mockLLMService.llm.mockResolvedValue('{"reasons": ["valid", 123, null, "also valid"]}');

      const reasons = await generateMatchReasoning(mockUserPet, mockOtherPet);

      expect(Array.isArray(reasons)).toBe(true);
      expect(reasons).toEqual(['valid', '123', 'also valid']);
    });

    it('should trim whitespace from AI reasons', async () => {
      mockLLMService.llm.mockResolvedValue('{"reasons": ["  reason 1  ", "  reason 2  "]}');

      const reasons = await generateMatchReasoning(mockUserPet, mockOtherPet);

      expect(reasons).toEqual(['reason 1', 'reason 2']);
    });
  });

  describe('generateMatchReasonsSync', () => {
    it('should generate synchronous match reasons', () => {
      const reasons = generateMatchReasonsSync(mockUserPet, mockOtherPet);

      expect(Array.isArray(reasons)).toBe(true);
      expect(reasons.length).toBeGreaterThan(0);
      expect(typeof reasons[0]).toBe('string');

      // Should not call AI service
      expect(mockLLMService.llm).not.toHaveBeenCalled();
    });

    it('should generate personality-based reasons', () => {
      const compatiblePet: Pet = {
        ...mockOtherPet,
        personality: ['playful', 'energetic'],
      };

      const reasons = generateMatchReasonsSync(mockUserPet, compatiblePet);

      expect(reasons.some((reason) => reason.toLowerCase().includes('personality'))).toBe(true);
    });

    it('should generate interest-based reasons', () => {
      const sharedInterestsPet: Pet = {
        ...mockOtherPet,
        interests: ['fetch', 'walks', 'swimming'],
      };

      const reasons = generateMatchReasonsSync(mockUserPet, sharedInterestsPet);

      expect(reasons.some((reason) => reason.toLowerCase().includes('interest'))).toBe(true);
    });

    it('should generate size-based reasons', () => {
      const sameSizePet: Pet = { ...mockOtherPet, size: 'medium' };

      const reasons = generateMatchReasonsSync(mockUserPet, sameSizePet);

      expect(reasons.some((reason) => reason.toLowerCase().includes('size'))).toBe(true);
    });

    it('should generate age-based reasons', () => {
      const sameAgePet: Pet = { ...mockOtherPet, age: 3 };

      const reasons = generateMatchReasonsSync(mockUserPet, sameAgePet);

      expect(
        reasons.some(
          (reason) =>
            reason.toLowerCase().includes('age') || reason.toLowerCase().includes('energy')
        )
      ).toBe(true);
    });

    it('should provide fallback reason when no specific matches', () => {
      const incompatiblePet: Pet = {
        ...mockOtherPet,
        personality: ['independent', 'quiet'],
        interests: ['grooming', 'sleeping'],
        size: 'extra-large',
        age: 10,
      };

      const reasons = generateMatchReasonsSync(mockUserPet, incompatiblePet);

      expect(reasons.length).toBeGreaterThan(0);
      expect(reasons[reasons.length - 1]).toBe('Could be a great match!');
    });

    it('should handle pets with empty arrays', () => {
      const emptyPet: Pet = {
        ...mockOtherPet,
        personality: [],
        interests: [],
      };

      const reasons = generateMatchReasonsSync(mockUserPet, emptyPet);

      expect(Array.isArray(reasons)).toBe(true);
      expect(reasons.length).toBeGreaterThan(0);
    });
  });

  describe('integration tests', () => {
    it('should work with complete matching workflow', async () => {
      const factors = getCompatibilityFactors(mockUserPet, mockOtherPet);
      const score = calculateCompatibility(mockUserPet, mockOtherPet);
      const aiReasons = await generateMatchReasoning(mockUserPet, mockOtherPet);
      const syncReasons = generateMatchReasonsSync(mockUserPet, mockOtherPet);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);

      expect(typeof factors.sizeMatch).toBe('number');
      expect(typeof factors.personalityMatch).toBe('number');
      expect(typeof factors.interestMatch).toBe('number');
      expect(typeof factors.ageCompatibility).toBe('number');
      expect(typeof factors.locationProximity).toBe('number');

      expect(Array.isArray(aiReasons)).toBe(true);
      expect(aiReasons.length).toBeGreaterThan(0);

      expect(Array.isArray(syncReasons)).toBe(true);
      expect(syncReasons.length).toBeGreaterThan(0);
    });

    it('should handle edge case pets gracefully', () => {
      const edgeCasePet: Pet = {
        id: 'edge',
        name: '',
        breed: '',
        age: 0,
        size: '',
        personality: [''],
        interests: [''],
        lookingFor: [''],
        verified: false,
        description: '',
      };

      expect(() => {
        calculateCompatibility(mockUserPet, edgeCasePet);
        getCompatibilityFactors(mockUserPet, edgeCasePet);
        generateMatchReasonsSync(mockUserPet, edgeCasePet);
      }).not.toThrow();
    });
  });
});
