import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { ChatHeader } from '../chat/window/ChatHeader'

describe('ChatHeader', () => {
  it('should render header with room name', () => {
    const setAwayMode = vi.fn()
    render(
      <ChatHeader
        room={{ matchedPetName: 'Fluffy' }}
        typingIndicator={null}
        awayMode={false}
        setAwayMode={setAwayMode}
      />
    )

    expect(screen.getByText('Fluffy')).toBeTruthy()
  })

  it('should render back button when onBack is provided', () => {
    const onBack = vi.fn()
    const setAwayMode = vi.fn()
    render(
      <ChatHeader
        room={{ matchedPetName: 'Fluffy' }}
        typingIndicator={null}
        onBack={onBack}
        awayMode={false}
        setAwayMode={setAwayMode}
      />
    )

    const backButton = screen.getByLabelText('Back')
    expect(backButton).toBeTruthy()

    fireEvent.press(backButton)
    expect(onBack).toHaveBeenCalled()
  })

  it('should toggle away mode', () => {
    const setAwayMode = vi.fn()
    render(
      <ChatHeader
        room={{ matchedPetName: 'Fluffy' }}
        typingIndicator={null}
        awayMode={false}
        setAwayMode={setAwayMode}
      />
    )

    const awayButton = screen.getByText('🌙 Away')
    expect(awayButton).toBeTruthy()

    fireEvent.press(awayButton)
    expect(setAwayMode).toHaveBeenCalled()
  })

  it('should show available status when awayMode is true', () => {
    const setAwayMode = vi.fn()
    render(
      <ChatHeader
        room={{ matchedPetName: 'Fluffy' }}
        typingIndicator={null}
        awayMode={true}
        setAwayMode={setAwayMode}
      />
    )

    expect(screen.getByText('🟢 Available')).toBeTruthy()
  })
})
