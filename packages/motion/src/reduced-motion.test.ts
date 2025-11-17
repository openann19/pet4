/**
 * Unit tests for reduced motion hooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import {
  useReducedMotion,
  useReducedMotionSV,
  getReducedMotionDuration,
  getReducedMotionMultiplier,
} from './reduced-motion'

describe('useReducedMotion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return false when reduced motion is not enabled', async () => {
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useReducedMotion())

    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })

  it('should return true when reduced motion is enabled', async () => {
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useReducedMotion())

    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })
})

describe('getReducedMotionDuration', () => {
  it('should return original duration when reduced motion is false', () => {
    expect(getReducedMotionDuration(300, false)).toBe(300)
    expect(getReducedMotionDuration(500, false)).toBe(500)
  })

  it('should clamp to 120ms when reduced motion is true', () => {
    expect(getReducedMotionDuration(300, true)).toBe(120)
    expect(getReducedMotionDuration(500, true)).toBe(120)
    expect(getReducedMotionDuration(50, true)).toBe(50) // Already less than 120
  })

  it('should check system preference when reduced is undefined', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true,
    }))
    expect(getReducedMotionDuration(300)).toBe(120)
  })
})

describe('getReducedMotionMultiplier', () => {
  it('should return 1 when reduced motion is false', () => {
    expect(getReducedMotionMultiplier(false)).toBe(1)
  })

  it('should return 0 when reduced motion is true', () => {
    expect(getReducedMotionMultiplier(true)).toBe(0)
  })

  it('should check system preference when reduced is undefined', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true,
    }))
    expect(getReducedMotionMultiplier()).toBe(0)
  })
})

describe('useReducedMotionSV', () => {
  it('should return SharedValue that updates reactively', async () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useReducedMotionSV())

    await waitFor(() => {
      expect(result.current).toBeDefined()
      expect(result.current.value).toBe(false)
    })
  })
})
