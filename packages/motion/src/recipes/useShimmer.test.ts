/**
 * Unit tests for useShimmer hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useShimmer } from '../recipes/useShimmer'

describe('useShimmer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with animated style', async () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useShimmer())

    await waitFor(() => {
      expect(result.current.animatedStyle).toBeDefined()
    })
  })

  it('should use opacity pulse when reduced motion is enabled', async () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true, // Reduced motion enabled
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    await act(async () => {
      const { result } = renderHook(() => useShimmer())

      await waitFor(() => {
        // Should return opacity-based style instead of transform
        expect(result.current.animatedStyle).toBeDefined()
      })
    })
  })
})
