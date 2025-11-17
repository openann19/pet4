/**
 * Chat API Hooks Tests (Mobile)
 * Location: apps/mobile/src/hooks/api/__tests__/use-chat.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { type ReactNode } from 'react'
import { useChatMessages, useSendMessage, useMarkAsRead } from '../use-chat'
import type { Message } from '@/lib/types'
import { apiClient } from '@/utils/api-client'

// Mock API client
vi.mock('@/utils/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockApiClient = vi.mocked(apiClient)

// Create test query client
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

function wrapper({ children }: { children: ReactNode }): ReactNode {
  const queryClient = createTestQueryClient()
  return React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useChatMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch chat messages successfully', async () => {
    const chatRoomId = 'room1'
    const mockMessages: Message[] = [
      {
        id: 'msg1',
        roomId: chatRoomId,
        chatRoomId,
        senderId: 'user1',
        senderName: 'John Doe',
        type: 'text',
        content: 'Hello',
        status: 'sent',
        timestamp: '2024-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'msg2',
        roomId: chatRoomId,
        chatRoomId,
        senderId: 'user2',
        senderName: 'Jane Doe',
        type: 'text',
        content: 'Hi there',
        status: 'sent',
        timestamp: '2024-01-01T00:01:00Z',
        createdAt: '2024-01-01T00:01:00Z',
      },
    ]

    mockApiClient.get.mockResolvedValue({
      items: mockMessages,
      nextCursor: undefined,
    })

    const { result } = renderHook(() => useChatMessages(chatRoomId), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.pages[0]).toEqual(mockMessages)
    expect(mockApiClient.get).toHaveBeenCalledWith(
      `/api/chat/${chatRoomId}/messages`,
      expect.objectContaining({
        cacheKey: `chat:${chatRoomId}:messages:initial`,
        skipCache: false,
      })
    )
  })

  it('should fetch messages with cursor', async () => {
    const chatRoomId = 'room1'
    const mockMessages: Message[] = [
      {
        id: 'msg3',
        roomId: chatRoomId,
        chatRoomId,
        senderId: 'user1',
        type: 'text',
        content: 'Message 3',
        status: 'sent',
        timestamp: '2024-01-01T00:02:00Z',
        createdAt: '2024-01-01T00:02:00Z',
      },
    ]

    mockApiClient.get.mockResolvedValue({
      items: mockMessages,
      nextCursor: undefined,
    })

    const queryClient = createTestQueryClient()
    function customWrapper({ children }: { children: ReactNode }): ReactNode {
      return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    const { result } = renderHook(() => useChatMessages(chatRoomId), { wrapper: customWrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Fetch next page
    await result.current.fetchNextPage()

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalled()
    })
  })

  it('should not fetch when chatRoomId is null', () => {
    const { result } = renderHook(() => useChatMessages(null), { wrapper })

    expect(result.current.isFetching).toBe(false)
    expect(mockApiClient.get).not.toHaveBeenCalled()
  })

  it('should not fetch when chatRoomId is undefined', () => {
    const { result } = renderHook(() => useChatMessages(undefined), { wrapper })

    expect(result.current.isFetching).toBe(false)
    expect(mockApiClient.get).not.toHaveBeenCalled()
  })

  it('should throw error when chatRoomId is missing in queryFn', async () => {
    mockApiClient.get.mockRejectedValue(new Error('Chat room ID is required'))

    const { result } = renderHook(() => useChatMessages(''), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('should handle error', async () => {
    const chatRoomId = 'room1'
    const error = new Error('Failed to fetch messages')
    mockApiClient.get.mockRejectedValue(error)

    const { result } = renderHook(() => useChatMessages(chatRoomId), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('should handle empty messages', async () => {
    const chatRoomId = 'room1'
    mockApiClient.get.mockResolvedValue({
      items: [],
      nextCursor: undefined,
    })

    const { result } = renderHook(() => useChatMessages(chatRoomId), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.pages[0]).toEqual([])
  })
})

describe('useSendMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should send message successfully', async () => {
    const chatRoomId = 'room1'
    const mockMessage: Message = {
      id: 'msg1',
      roomId: chatRoomId,
      chatRoomId,
      senderId: 'user1',
      type: 'text',
      content: 'Hello',
      status: 'sent',
      timestamp: '2024-01-01T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
    }

    mockApiClient.post.mockResolvedValue(mockMessage)

    const { result } = renderHook(() => useSendMessage(), { wrapper })

    result.current.mutate({
      chatRoomId,
      content: 'Hello',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockMessage)
    expect(mockApiClient.post).toHaveBeenCalledWith(
      `/api/chat/${chatRoomId}/messages`,
      { content: 'Hello' },
      expect.objectContaining({
        skipCache: true,
      })
    )
  })

  it('should handle message object in response', async () => {
    const chatRoomId = 'room1'
    const mockMessage: Message = {
      id: 'msg1',
      roomId: chatRoomId,
      chatRoomId,
      senderId: 'user1',
      type: 'text',
      content: 'Hello',
      status: 'sent',
      timestamp: '2024-01-01T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
    }

    mockApiClient.post.mockResolvedValue({ message: mockMessage })

    const { result } = renderHook(() => useSendMessage(), { wrapper })

    result.current.mutate({
      chatRoomId,
      content: 'Hello',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockMessage)
  })

  it('should invalidate queries on success', async () => {
    const chatRoomId = 'room1'
    const mockMessage: Message = {
      id: 'msg1',
      roomId: chatRoomId,
      chatRoomId,
      senderId: 'user1',
      type: 'text',
      content: 'Hello',
      status: 'sent',
      timestamp: '2024-01-01T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
    }

    mockApiClient.post.mockResolvedValue(mockMessage)

    const queryClient = createTestQueryClient()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    function customWrapper({ children }: { children: ReactNode }): ReactNode {
      return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    const { result } = renderHook(() => useSendMessage(), { wrapper: customWrapper })

    result.current.mutate({
      chatRoomId,
      content: 'Hello',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalled()
    })
  })

  it('should handle error', async () => {
    const chatRoomId = 'room1'
    const error = new Error('Failed to send message')
    mockApiClient.post.mockRejectedValue(error)

    const { result } = renderHook(() => useSendMessage(), { wrapper })

    result.current.mutate({
      chatRoomId,
      content: 'Hello',
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})

describe('useMarkAsRead', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mark message as read successfully', async () => {
    const chatRoomId = 'room1'
    const messageId = 'msg1'

    mockApiClient.post.mockResolvedValue({ success: true })

    const { result } = renderHook(() => useMarkAsRead(), { wrapper })

    result.current.mutate({
      chatRoomId,
      messageId,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual({ success: true })
    expect(mockApiClient.post).toHaveBeenCalledWith(
      `/api/chat/${chatRoomId}/messages/${messageId}/read`
    )
  })

  it('should invalidate queries on success', async () => {
    const chatRoomId = 'room1'
    const messageId = 'msg1'

    mockApiClient.post.mockResolvedValue({ success: true })

    const queryClient = createTestQueryClient()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    function customWrapper({ children }: { children: ReactNode }): ReactNode {
      return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    const { result } = renderHook(() => useMarkAsRead(), { wrapper: customWrapper })

    result.current.mutate({
      chatRoomId,
      messageId,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalled()
    })
  })

  it('should handle error', async () => {
    const chatRoomId = 'room1'
    const messageId = 'msg1'
    const error = new Error('Failed to mark as read')
    mockApiClient.post.mockRejectedValue(error)

    const { result } = renderHook(() => useMarkAsRead(), { wrapper })

    result.current.mutate({
      chatRoomId,
      messageId,
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})
