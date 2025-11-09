/**
 * Domain Snapshots Hook Tests (Mobile)
 * Location: apps/mobile/src/hooks/__tests__/use-domain-snapshots.test.ts
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react-native'
import { useDomainSnapshots } from '../use-domain-snapshots'

// Mock domain functions
vi.mock('@pet/domain/adoption', () => ({
  canEditListing: vi.fn((status: string) => status === 'active'),
  canReceiveApplications: vi.fn((status: string) => status === 'active'),
  isValidListingStatusTransition: vi.fn((from: string, to: string) => {
    const validTransitions: Record<string, string[]> = {
      active: ['adopted', 'withdrawn'],
    }
    return validTransitions[from]?.includes(to) ?? false
  }),
  isValidApplicationStatusTransition: vi.fn((from: string, to: string) => {
    const validTransitions: Record<string, string[]> = {
      submitted: ['under_review', 'accepted', 'rejected'],
    }
    return validTransitions[from]?.includes(to) ?? false
  }),
}))

vi.mock('@pet/domain/community', () => ({
  canEditPost: vi.fn((status: string) => status === 'pending_review'),
  canReceiveComments: vi.fn((status: string) => status === 'active'),
  isValidPostStatusTransition: vi.fn((from: string, to: string) => {
    const validTransitions: Record<string, string[]> = {
      pending_review: ['active', 'rejected', 'archived'],
    }
    return validTransitions[from]?.includes(to) ?? false
  }),
  isValidCommentStatusTransition: vi.fn((from: string, to: string) => {
    const validTransitions: Record<string, string[]> = {
      active: ['deleted', 'hidden', 'active'],
    }
    return validTransitions[from]?.includes(to) ?? false
  }),
}))

vi.mock('@pet/domain/matching-engine', () => ({
  evaluateHardGates: vi.fn(() => ({
    passed: true,
    failureReasons: [],
  })),
  calculateMatchScore: vi.fn(() => ({
    overall: 85,
    factors: {
      sizeMatch: 90,
      personalityMatch: 80,
      interestMatch: 85,
      ageCompatibility: 85,
      locationProximity: 90,
    },
  })),
}))

vi.mock('@mobile/data/mock-data', () => ({
  samplePets: [
    {
      id: 'pet1',
      name: 'Pet 1',
    },
    {
      id: 'pet2',
      name: 'Pet 2',
    },
  ],
  sampleOwnerPreferences: {},
  sampleHardGates: {},
  sampleMatchingWeights: {},
}))

describe('useDomainSnapshots', () => {
  it('should return domain snapshots', () => {
    const { result } = renderHook(() => useDomainSnapshots())

    expect(result.current).toBeDefined()
    expect(result.current.adoption).toBeDefined()
    expect(result.current.community).toBeDefined()
    expect(result.current.matching).toBeDefined()
  })

  it('should return adoption snapshot with correct structure', () => {
    const { result } = renderHook(() => useDomainSnapshots())

    expect(result.current.adoption.canEditActiveListing).toBeDefined()
    expect(result.current.adoption.canReceiveApplications).toBeDefined()
    expect(result.current.adoption.statusTransitions).toBeDefined()
    expect(Array.isArray(result.current.adoption.statusTransitions)).toBe(true)
    expect(result.current.adoption.applicationTransitions).toBeDefined()
    expect(Array.isArray(result.current.adoption.applicationTransitions)).toBe(true)
  })

  it('should return community snapshot with correct structure', () => {
    const { result } = renderHook(() => useDomainSnapshots())

    expect(result.current.community.canEditPendingPost).toBeDefined()
    expect(result.current.community.canReceiveCommentsOnActivePost).toBeDefined()
    expect(result.current.community.postTransitions).toBeDefined()
    expect(Array.isArray(result.current.community.postTransitions)).toBe(true)
    expect(result.current.community.commentTransitions).toBeDefined()
    expect(Array.isArray(result.current.community.commentTransitions)).toBe(true)
  })

  it('should return matching snapshot with correct structure', () => {
    const { result } = renderHook(() => useDomainSnapshots())

    expect(result.current.matching.hardGatesPassed).toBeDefined()
    expect(typeof result.current.matching.hardGatesPassed).toBe('boolean')
    expect(result.current.matching.hardGateFailures).toBeDefined()
    expect(Array.isArray(result.current.matching.hardGateFailures)).toBe(true)
    expect(result.current.matching.score).toBeDefined()
  })

  it('should include status transitions in adoption snapshot', () => {
    const { result } = renderHook(() => useDomainSnapshots())

    expect(result.current.adoption.statusTransitions.length).toBeGreaterThan(0)
    result.current.adoption.statusTransitions.forEach(transition => {
      expect(transition.status).toBeDefined()
      expect(typeof transition.allowed).toBe('boolean')
    })
  })

  it('should include application transitions in adoption snapshot', () => {
    const { result } = renderHook(() => useDomainSnapshots())

    expect(result.current.adoption.applicationTransitions.length).toBeGreaterThan(0)
    result.current.adoption.applicationTransitions.forEach(transition => {
      expect(transition.status).toBeDefined()
      expect(typeof transition.allowed).toBe('boolean')
    })
  })

  it('should include post transitions in community snapshot', () => {
    const { result } = renderHook(() => useDomainSnapshots())

    expect(result.current.community.postTransitions.length).toBeGreaterThan(0)
    result.current.community.postTransitions.forEach(transition => {
      expect(transition.status).toBeDefined()
      expect(typeof transition.allowed).toBe('boolean')
    })
  })

  it('should include comment transitions in community snapshot', () => {
    const { result } = renderHook(() => useDomainSnapshots())

    expect(result.current.community.commentTransitions.length).toBeGreaterThan(0)
    result.current.community.commentTransitions.forEach(transition => {
      expect(transition.status).toBeDefined()
      expect(typeof transition.allowed).toBe('boolean')
    })
  })

  it('should throw error when sample pets are not available', () => {
    vi.doMock('@mobile/data/mock-data', () => ({
      samplePets: [],
    }))

    expect(() => {
      renderHook(() => useDomainSnapshots())
    }).toThrow('Sample pets not available')
  })
})
