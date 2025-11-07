import { ChatScreen } from '@mobile/screens/ChatScreen'
import { render } from '@testing-library/react-native'
import { describe, expect, it } from 'vitest'

describe('ChatScreen', () => {
  it('should render without crashing', () => {
    const result = render(<ChatScreen />)
    expect(result).toBeTruthy()
  })

  it('should render Chat header', () => {
    const { getByText } = render(<ChatScreen />)
    expect(getByText('Chat')).toBeTruthy()
  })

  it('should render inbox message', () => {
    const { getByText } = render(<ChatScreen />)
    expect(getByText('Your messages will appear here.')).toBeTruthy()
  })
})

