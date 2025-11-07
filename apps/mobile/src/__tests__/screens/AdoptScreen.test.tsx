import { AdoptScreen } from '@mobile/screens/AdoptScreen'
import { render } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

describe('AdoptScreen', () => {
  it('should render without crashing', () => {
    const result = render(<AdoptScreen />)
    expect(result).toBeTruthy()
  })

  it('should render Adopt header', () => {
    const { getByText } = render(<AdoptScreen />)
    expect(getByText('Adopt')).toBeTruthy()
  })

  it('should render marketplace message', () => {
    const { getByText } = render(<AdoptScreen />)
    expect(getByText('Listings and filters coming next.')).toBeTruthy()
  })
})

