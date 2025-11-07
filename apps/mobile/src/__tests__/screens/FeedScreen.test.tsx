import { FeedScreen } from '@mobile/screens/FeedScreen'
import { fireEvent, render } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@mobile/data/mock-data', () => ({
  samplePets: [
    {
      id: 'test-1',
      name: 'Test Pet',
      breedName: 'Test Breed',
      location: { city: 'Test City' },
      lifeStage: 'adult',
      intents: ['playdate'],
    },
  ],
}))

describe('FeedScreen', () => {
  it('should render without crashing', () => {
    const result = render(<FeedScreen />)
    expect(result).toBeTruthy()
  })

  it('should render Discovery view by default', () => {
    const { getByText } = render(<FeedScreen />)
    expect(getByText('Discover')).toBeTruthy()
  })

  it('should switch to Map view when Map tab is pressed', () => {
    const { getByText } = render(<FeedScreen />)
    const mapButton = getByText('Map')
    fireEvent.press(mapButton)
    expect(getByText('Map module not installed')).toBeTruthy()
  })

  it('should switch back to Discovery view', () => {
    const { getByText } = render(<FeedScreen />)
    const mapButton = getByText('Map')
    const discoveryButton = getByText('Discovery')

    fireEvent.press(mapButton)
    fireEvent.press(discoveryButton)

    expect(getByText('Test Pet')).toBeTruthy()
  })
})

