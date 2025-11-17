import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from '../App'

// Mock all lazy-loaded components
vi.mock('@/components/views/DiscoverView', () => ({
  default: () => <div data-testid="discover-view">Discover</div>
}))

vi.mock('@/components/views/MatchesView', () => ({
  default: () => <div data-testid="matches-view">Matches</div>
}))

vi.mock('@/components/views/ProfileView', () => ({
  default: () => <div data-testid="profile-view">Profile</div>
}))

vi.mock('@/components/views/ChatView', () => ({
  default: () => <div data-testid="chat-view">Chat</div>
}))

vi.mock('@/components/views/CommunityView', () => ({
  default: () => <div data-testid="community-view">Community</div>
}))

vi.mock('@/components/AuthScreen', () => ({
  default: () => <div data-testid="auth-screen">Auth</div>
}))

vi.mock('@/components/WelcomeScreen', () => ({
  default: () => <div data-testid="welcome-screen">Welcome</div>
}))

// Mock hooks
vi.mock('@/hooks/useStorage', () => ({
  useStorage: vi.fn((key: string, defaultValue: unknown) => {
    const storage: Record<string, unknown> = {
      'has-seen-welcome-v2': false,
      'user-pets': [],
      'matches': [],
      'swipe-history': [],
      'playdates': []
    }
    const setValue = vi.fn()
    return [storage[key] ?? defaultValue, setValue]
  })
}))

// Mock contexts
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(() => ({
    t: {},
    theme: 'light',
    toggleTheme: vi.fn(),
    language: 'en',
    toggleLanguage: vi.fn()
  }))
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: false
  }))
}))

// Mock effects
vi.mock('@/effects/reanimated', () => ({
  usePressBounce: vi.fn(() => ({ animatedStyle: {} })),
  useHeaderAnimation: vi.fn(() => ({ animatedStyle: {} })),
  useHeaderButtonAnimation: vi.fn(() => ({ animatedStyle: {} })),
  useHoverLift: vi.fn(() => ({ animatedStyle: {} })),
  useIconRotation: vi.fn(() => ({ animatedStyle: {} })),
  useLogoAnimation: vi.fn(() => ({ animatedStyle: {} })),
  useLogoGlow: vi.fn(() => ({ animatedStyle: {} })),
  useModalAnimation: vi.fn(() => ({ animatedStyle: {} })),
  useNavBarAnimation: vi.fn(() => ({ animatedStyle: {} })),
  usePageTransition: vi.fn(() => ({ animatedStyle: {} })),
  useStaggeredContainer: vi.fn(() => ({ animatedStyle: {} }))
}))

vi.mock('@/hooks/use-nav-button-animation', () => ({
  useNavButtonAnimation: vi.fn(() => ({ animatedStyle: {} }))
}))

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn()
  }
}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })
  })

  it('should render welcome screen initially', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByTestId('welcome-screen')).toBeInTheDocument()
    })
  })
})

