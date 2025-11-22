import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import MapView from '../MapView'

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
      'map-precise-sharing': false,
      'map-precise-until': null,
      'saved-places': []
    }
    const setValue = vi.fn()
    return [storage[key] ?? defaultValue, setValue]
  })
}))

// Mock dependencies
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(() => ({
    t: {
      map: {
        title: 'Map'
      }
    }
  }))
}))

vi.mock('@/lib/maps/useMapConfig', () => ({
  useMapConfig: vi.fn(() => ({
    mapSettings: {
      DEFAULT_RADIUS_KM: 10
    },
    PLACE_CATEGORIES: []
  }))
}))

vi.mock('@/lib/maps/utils', () => ({
  calculateDistance: vi.fn(() => 5),
  formatDistance: vi.fn(() => '5 km'),
  snapToGrid: vi.fn((loc) => loc),
  getCurrentLocation: vi.fn(() => Promise.resolve({ lat: 37.7749, lon: -122.4194 }))
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn()
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
  watchPosition: vi.fn(() => 1),
  clearWatch: vi.fn()
} as unknown as Geolocation

describe('MapView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render map view', async () => {
    render(<MapView />)

    await waitFor(() => {
      expect(screen.getByTestId('animated-view')).toBeInTheDocument()
    })
  })
})

