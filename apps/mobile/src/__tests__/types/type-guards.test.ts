/**
 * Tests for type guards
 * Location: src/__tests__/types/type-guards.test.ts
 */

import { describe, expect, it } from 'vitest'
import type { ApiError, ApiResponse } from '../../types/api'
import { isApiError, isApiResponse } from '../../types/api'
import type { Match, PetProfile } from '../../types/pet'
import { isMatch, isPetProfile } from '../../types/pet'

describe('Type Guards', () => {
  describe('isPetProfile', () => {
    it('should return true for valid PetProfile', () => {
      const pet: PetProfile = {
        id: '1',
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        age: 3,
        photos: ['https://example.com/photo.jpg'],
        ownerId: 'owner1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }
      expect(isPetProfile(pet)).toBe(true)
    })

    it('should return false for invalid PetProfile', () => {
      expect(isPetProfile(null)).toBe(false)
      expect(isPetProfile(undefined)).toBe(false)
      expect(isPetProfile({})).toBe(false)
      expect(isPetProfile({ id: '1' })).toBe(false)
    })
  })

  describe('isMatch', () => {
    it('should return true for valid Match', () => {
      const match: Match = {
        id: 'match1',
        petId: 'pet1',
        matchedPetId: 'pet2',
        matchedAt: '2024-01-01T00:00:00Z',
        status: 'pending',
      }
      expect(isMatch(match)).toBe(true)
    })

    it('should return false for invalid Match', () => {
      expect(isMatch(null)).toBe(false)
      expect(isMatch(undefined)).toBe(false)
      expect(isMatch({})).toBe(false)
      expect(isMatch({ id: '1' })).toBe(false)
    })
  })

  describe('isApiResponse', () => {
    it('should return true for valid ApiResponse', () => {
      const response: ApiResponse<string> = {
        data: 'test',
        status: 200,
      }
      expect(isApiResponse(response)).toBe(true)
    })

    it('should return false for invalid ApiResponse', () => {
      expect(isApiResponse(null)).toBe(false)
      expect(isApiResponse({})).toBe(false)
      expect(isApiResponse({ data: 'test' })).toBe(false)
    })
  })

  describe('isApiError', () => {
    it('should return true for valid ApiError', () => {
      const error: ApiError = {
        code: 'ERROR_CODE',
        message: 'Error message',
      }
      expect(isApiError(error)).toBe(true)
    })

    it('should return false for invalid ApiError', () => {
      expect(isApiError(null)).toBe(false)
      expect(isApiError({})).toBe(false)
      expect(isApiError({ code: 'ERROR' })).toBe(false)
    })
  })
})

