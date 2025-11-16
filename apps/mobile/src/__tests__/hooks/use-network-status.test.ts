/**
 * Tests for network status hook
 * Location: src/__tests__/hooks/use-network-status.test.ts
 */

import NetInfo from '@react-native-community/netinfo'
import { renderHook, waitFor } from '@testing-library/react-native'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNetworkStatus } from '../../hooks/use-network-status'
import { isTruthy } from '@petspark/shared';

// Mock NetInfo
vi.mock('@react-native-community/netinfo', () => ({
  default: {
    fetch: vi.fn(),
    addEventListener: vi.fn(),
  },
}))

describe('useNetworkStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return initial network status', async () => {
    const mockState = {
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    }

    vi.mocked(NetInfo.fetch).mockResolvedValue(mockState as never)
    vi.mocked(NetInfo.addEventListener).mockReturnValue(() => {})

    const { result } = renderHook(() => useNetworkStatus())

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })

    expect(result.current.isInternetReachable).toBe(true)
    expect(result.current.type).toBe('wifi')
  })

  it('should update status when network changes', async () => {
    const mockState = {
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    }

    let onChangeCallback: ((state: unknown) => void) | null = null

    vi.mocked(NetInfo.fetch).mockResolvedValue(mockState as never)
    vi.mocked(NetInfo.addEventListener).mockImplementation(callback => {
      onChangeCallback = callback as (state: unknown) => void
      return () => {}
    })

    const { result } = renderHook(() => useNetworkStatus())

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })

    // Simulate network change
    if (isTruthy(onChangeCallback)) {
      const changeCallback = onChangeCallback as (state: unknown) => void
      changeCallback({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      })
    }

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false)
    })
  })
})
