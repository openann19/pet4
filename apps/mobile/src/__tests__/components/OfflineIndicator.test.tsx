/**
 * Tests for OfflineIndicator component
 * Location: src/__tests__/components/OfflineIndicator.test.tsx
 */

import { render } from '@testing-library/react-native'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OfflineIndicator } from '../../components/OfflineIndicator'
import { useNetworkStatus } from '../../hooks/use-network-status'

vi.mock('../../hooks/use-network-status')

describe('OfflineIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render nothing when connected', () => {
    vi.mocked(useNetworkStatus).mockReturnValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    })

    const { queryByText } = render(<OfflineIndicator />)
    expect(queryByText(/offline/i)).toBeNull()
  })

  it('should render offline message when disconnected', () => {
    vi.mocked(useNetworkStatus).mockReturnValue({
      isConnected: false,
      isInternetReachable: false,
      type: 'none',
    })

    const { getByText } = render(<OfflineIndicator />)
    expect(getByText(/You're offline/i)).toBeTruthy()
  })
})

