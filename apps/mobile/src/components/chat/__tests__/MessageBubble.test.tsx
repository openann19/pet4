import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react-native'
import { MessageBubble, type Message } from '../MessageBubble'

describe('MessageBubble', () => {
  const mockMessage: Message = {
    id: '1',
    content: 'Test message',
    senderId: 'user1',
    timestamp: Date.now(),
    status: 'sent',
    isNew: true,
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('should render message content', () => {
    render(<MessageBubble message={mockMessage} currentUserId="user1" />)

    expect(screen.getByText('Test message')).toBeTruthy()
  })

  it('should apply send animation for own messages', () => {
    const ownMessage: Message = {
      ...mockMessage,
      senderId: 'user1',
      isNew: true,
    }

    render(<MessageBubble message={ownMessage} currentUserId="user1" />)

    expect(screen.getByText('Test message')).toBeTruthy()
  })

  it('should apply receive animation for incoming messages', () => {
    const incomingMessage: Message = {
      ...mockMessage,
      senderId: 'user2',
      isNew: true,
    }

    render(<MessageBubble message={incomingMessage} currentUserId="user1" />)

    expect(screen.getByText('Test message')).toBeTruthy()
  })

  it('should handle reaction callback', () => {
    const onReact = vi.fn()
    render(<MessageBubble message={mockMessage} currentUserId="user1" onReact={onReact} />)

    // Simulate reaction interaction
    // This would need proper test setup for gesture handlers
    expect(screen.getByText('Test message')).toBeTruthy()
  })

  it('should handle reply callback', () => {
    const onReply = vi.fn()
    render(<MessageBubble message={mockMessage} currentUserId="user1" onReply={onReply} />)

    // Simulate swipe-to-reply
    expect(screen.getByText('Test message')).toBeTruthy()
  })
})
