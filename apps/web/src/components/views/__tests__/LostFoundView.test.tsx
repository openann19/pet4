import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import LostFoundView from '../LostFoundView'
import type { LostAlert } from '@/lib/lost-found-types'

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

vi.mock('@/effects/reanimated/use-animate-presence', () => ({
  useAnimatePresence: vi.fn(() => ({
    shouldRender: true,
    animatedStyle: {}
  }))
}))

vi.mock('@/effects/reanimated/use-entry-animation', () => ({
  useEntryAnimation: vi.fn(() => ({
    animatedStyle: {}
  }))
}))

// Mock hooks
vi.mock('@/hooks/useStorage', () => ({
  useStorage: vi.fn((key: string, defaultValue: unknown) => {
    const storage: Record<string, unknown> = {
      'lost-found-favorites': []
    }
    const setValue = vi.fn()
    return [storage[key] ?? defaultValue, setValue]
  })
}))

// Mock dependencies
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(() => ({
    t: {
      lostFound: {
        title: 'Lost & Found'
      }
    }
  }))
}))

vi.mock('@/api/lost-found-api', () => ({
  lostFoundAPI: {
    getLostAlerts: vi.fn(() => Promise.resolve({ alerts: [], nextCursor: undefined })),
    createLostAlert: vi.fn(() => Promise.resolve({}))
  }
}))

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn()
  }))
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock geolocation
global.navigator.geolocation = {
  getCurrentPosition: vi.fn((success) => {
    success({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194
      }
    } as GeolocationPosition)
  }),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
} as unknown as Geolocation

// Mock components
vi.mock('@/components/lost-found/LostAlertCard', () => ({
  LostAlertCard: ({ alert }: { alert: LostAlert }) => (
    <div data-testid={`alert-${alert.id}`}>{alert.petName}</div>
  )
}))

vi.mock('@/components/lost-found/CreateLostAlertDialog', () => ({
  CreateLostAlertDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="create-alert-dialog">Create Dialog</div> : null
}))

vi.mock('@/components/lost-found/ReportSightingDialog', () => ({
  ReportSightingDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="sighting-dialog">Sighting Dialog</div> : null
}))

describe('LostFoundView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render lost found view', async () => {
    const { lostFoundAPI } = await import('@/api/lost-found-api')
    vi.mocked(lostFoundAPI.getLostAlerts).mockResolvedValue({ alerts: [], nextCursor: undefined })

    render(<LostFoundView />)

    await waitFor(() => {
      expect(screen.getByTestId('animated-view')).toBeInTheDocument()
    })
  })
})

