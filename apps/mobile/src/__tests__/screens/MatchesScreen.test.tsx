import { MatchesScreen } from '@mobile/screens/MatchesScreen'
import { render } from '@testing-library/react-native'
import { describe, expect, it } from 'vitest'

describe('MatchesScreen', () => {
  it('should render without crashing', () => {
    const result = render(<MatchesScreen />)
    expect(result).toBeTruthy()
  })

  it('should render Matches header', () => {
    const { getByText } = render(<MatchesScreen />)
    expect(getByText('Matches')).toBeTruthy()
  })

  it('should render matches message', () => {
    const { getByText } = render(<MatchesScreen />)
    expect(getByText('Your latest matches will show here.')).toBeTruthy()
  })
})
