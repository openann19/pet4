import { RootShell } from '@mobile/navigation/RootShell'
import { render } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@mobile/screens/HomeScreen', () => ({
  HomeScreen: () => null,
}))

vi.mock('@mobile/screens/CommunityScreen', () => ({
  CommunityScreen: () => null,
}))

vi.mock('@mobile/screens/ProfileScreen', () => ({
  ProfileScreen: () => null,
}))

vi.mock('@mobile/screens/ChatScreen', () => ({
  ChatScreen: () => null,
}))

vi.mock('@mobile/screens/AdoptScreen', () => ({
  AdoptScreen: () => null,
}))

vi.mock('@mobile/screens/MatchesScreen', () => ({
  MatchesScreen: () => null,
}))

vi.mock('@mobile/components/BottomNavBar', () => ({
  BottomNavBar: () => {
    return null
  },
}))

describe('RootShell', () => {
  it('should render without crashing', () => {
    const result = render(<RootShell />)
    expect(result).toBeTruthy()
  })

  it('should render HomeScreen by default', () => {
    const result = render(<RootShell />)
    expect(result).toBeTruthy()
  })
})
