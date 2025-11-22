import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AdoptionMarketplaceView from '../AdoptionMarketplaceView'

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => ({
  default: {
    useSharedValue: vi.fn((initial: number) => ({ value: initial })),
    useAnimatedStyle: vi.fn(() => ({})),
    withSpring: vi.fn((v) => v),
    withTiming: vi.fn((v) => v),
  },
  useSharedValue: vi.fn((initial: number) => ({ value: initial })),
  useAnimatedStyle: vi.fn(() => ({})),
  withSpring: vi.fn((v) => v),
  withTiming: vi.fn((v) => v),
}))

vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="animated-view" {...props}>{children}</div>
  )
}))

// Mock dependencies
vi.mock('@/api/adoption-api', () => ({
  adoptionApi: {
    getAdoptionProfiles: vi.fn(() => Promise.resolve({ profiles: [], nextCursor: undefined }))
  }
}))

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn()
  }))
}))

describe('AdoptionMarketplaceView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render adoption marketplace view', async () => {
    render(<AdoptionMarketplaceView />)

    await waitFor(() => {
      expect(screen.getByTestId('animated-view')).toBeInTheDocument()
    })
  })
})

