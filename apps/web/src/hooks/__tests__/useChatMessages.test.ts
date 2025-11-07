import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChatMessages } from '../useChatMessages'
import { useStorage } from '../useStorage'
import { groupMessagesByDate, generateMessageId, getReactionsArray } from '@/lib/chat-utils'

vi.mock('../useStorage')
vi.mock('@/lib/chat-utils', () => ({
  groupMessagesByDate: vi.fn((messages) => messages),
  generateMessageId: vi.fn(() => 'msg-123'),
  getReactionsArray: vi.fn((reactions) => reactions || []),
}))

const mockUseStorage = vi.mocked(useStorage)
const mockGroupMessagesByDate = vi.mocked(groupMessagesByDate)
const mockGenerateMessageId = vi.mocked(generateMessageId)
const mockGetReactionsArray = vi.mocked(getReactionsArray)

describe('useChatMessages', () => {
  const mockSetMessages = vi.fn()
  const mockMessages: Array<{
    id: string
    roomId: string
    senderId: string
    senderName: string
    content: string
    type: string
    timestamp: string
    createdAt: string
    status: string
    reactions: unknown[]
  }> = []

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key.startsWith('chat-messages-')) {
        return [mockMessages, mockSetMessages, vi.fn()]
      }
      return [defaultValue, vi.fn(), vi.fn()]
    })
    mockGenerateMessageId.mockReturnValue('msg-123')
    mockGroupMessagesByDate.mockImplementation((messages) => messages)
    mockGetReactionsArray.mockImplementation((reactions) => reactions || [])
  })

  it('returns empty messages initially', () => {
    const { result } = renderHook(() =>
      useChatMessages({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
      })
    )

    expect(result.current.messages).toEqual([])
  })

  it('sends text message', () => {
    const { result } = renderHook(() =>
      useChatMessages({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
      })
    )

    act(() => {
      const message = result.current.sendMessage('Hello')
      expect(message).not.toBeNull()
    })

    expect(mockSetMessages).toHaveBeenCalled()
  })

  it('does not send empty text message', () => {
    const { result } = renderHook(() =>
      useChatMessages({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
      })
    )

    act(() => {
      const message = result.current.sendMessage('   ')
      expect(message).toBeNull()
    })

    expect(mockSetMessages).not.toHaveBeenCalled()
  })

  it('sends sticker message', () => {
    const { result } = renderHook(() =>
      useChatMessages({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
      })
    )

    act(() => {
      const message = result.current.sendMessage('sticker-id', 'sticker')
      expect(message).not.toBeNull()
    })

    expect(mockSetMessages).toHaveBeenCalled()
  })

  it('sends voice message', () => {
    const { result } = renderHook(() =>
      useChatMessages({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
      })
    )

    act(() => {
      const message = result.current.sendMessage('voice-url', 'voice')
      expect(message).not.toBeNull()
    })

    expect(mockSetMessages).toHaveBeenCalled()
  })

  it('includes metadata in message', () => {
    const { result } = renderHook(() =>
      useChatMessages({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
      })
    )

    act(() => {
      const message = result.current.sendMessage('Hello', 'text', { custom: 'data' })
      expect(message?.metadata).toEqual({ custom: 'data' })
    })
  })

  it('includes avatar when provided', () => {
    const { result } = renderHook(() =>
      useChatMessages({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        currentUserAvatar: 'avatar-url',
      })
    )

    act(() => {
      const message = result.current.sendMessage('Hello')
      expect(message?.senderAvatar).toBe('avatar-url')
    })
  })

  it('adds reaction to message', () => {
    const existingMessages = [
      {
        id: 'msg1',
        roomId: 'room1',
        senderId: 'user1',
        senderName: 'User 1',
        content: 'Hello',
        type: 'text',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: 'sent',
        reactions: [],
      },
    ]

    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key.startsWith('chat-messages-')) {
        return [existingMessages, mockSetMessages, vi.fn()]
      }
      return [defaultValue, vi.fn(), vi.fn()]
    })

    mockGetReactionsArray.mockReturnValue([])

    const { result } = renderHook(() =>
      useChatMessages({
        roomId: 'room1',
        currentUserId: 'user2',
        currentUserName: 'User 2',
      })
    )

    act(() => {
      result.current.addReaction('msg1', '👍')
    })

    expect(mockSetMessages).toHaveBeenCalled()
  })

  it('removes reaction when user already reacted', () => {
    const existingMessages = [
      {
        id: 'msg1',
        roomId: 'room1',
        senderId: 'user1',
        senderName: 'User 1',
        content: 'Hello',
        type: 'text',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: 'sent',
        reactions: [{ emoji: '👍', userIds: ['user2'], count: 1 }],
      },
    ]

    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key.startsWith('chat-messages-')) {
        return [existingMessages, mockSetMessages, vi.fn()]
      }
      return [defaultValue, vi.fn(), vi.fn()]
    })

    mockGetReactionsArray.mockReturnValue([
      { emoji: '👍', userIds: ['user2'], count: 1 },
    ])

    const { result } = renderHook(() =>
      useChatMessages({
        roomId: 'room1',
        currentUserId: 'user2',
        currentUserName: 'User 2',
      })
    )

    act(() => {
      result.current.addReaction('msg1', '👍')
    })

    expect(mockSetMessages).toHaveBeenCalled()
  })

  it('deletes message', () => {
    const existingMessages = [
      {
        id: 'msg1',
        roomId: 'room1',
        senderId: 'user1',
        senderName: 'User 1',
        content: 'Hello',
        type: 'text',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: 'sent',
        reactions: [],
      },
    ]

    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key.startsWith('chat-messages-')) {
        return [existingMessages, mockSetMessages, vi.fn()]
      }
      return [defaultValue, vi.fn(), vi.fn()]
    })

    const { result } = renderHook(() =>
      useChatMessages({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
      })
    )

    act(() => {
      result.current.deleteMessage('msg1')
    })

    expect(mockSetMessages).toHaveBeenCalled()
  })

  it('groups messages by date', () => {
    mockGroupMessagesByDate.mockReturnValue([
      {
        date: '2024-01-01',
        messages: mockMessages,
      },
    ])

    const { result } = renderHook(() =>
      useChatMessages({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
      })
    )

    expect(result.current.messageGroups).toBeDefined()
  })

  it('handles null messages gracefully', () => {
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key.startsWith('chat-messages-')) {
        return [null, mockSetMessages, vi.fn()]
      }
      return [defaultValue, vi.fn(), vi.fn()]
    })

    const { result } = renderHook(() =>
      useChatMessages({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
      })
    )

    expect(result.current.messages).toEqual([])
  })
})

