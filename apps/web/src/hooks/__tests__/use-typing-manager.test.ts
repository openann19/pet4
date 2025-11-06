import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTypingManager } from '../use-typing-manager'
import type { RealtimeClient } from '@/lib/realtime'

vi.mock('@/lib/realtime', () => ({}))

describe('useTypingManager', () => {
  const mockRealtimeClient: RealtimeClient = {
    emit: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
  } as never

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial state', () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
      })
    )

    expect(result.current.typingUsers).toEqual([])
    expect(result.current.isTyping).toBe(false)
  })

  it('starts typing when startTyping is called', () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    )

    act(() => {
      result.current.startTyping()
    })

    expect(result.current.isTyping).toBe(true)
  })

  it('emits typing_start event', async () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    )

    act(() => {
      result.current.startTyping()
    })

    await waitFor(() => {
      expect(mockRealtimeClient.emit).toHaveBeenCalledWith('typing_start', {
        roomId: 'room1',
        userId: 'user1',
        userName: 'User 1',
      })
    })
  })

  it('stops typing when stopTyping is called', () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    )

    act(() => {
      result.current.startTyping()
    })

    act(() => {
      result.current.stopTyping()
    })

    expect(result.current.isTyping).toBe(false)
  })

  it('emits typing_stop event', async () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    )

    act(() => {
      result.current.startTyping()
    })

    act(() => {
      result.current.stopTyping()
    })

    await waitFor(() => {
      expect(mockRealtimeClient.emit).toHaveBeenCalledWith('typing_stop', {
        roomId: 'room1',
        userId: 'user1',
      })
    })
  })

  it('handles input change', () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    )

    act(() => {
      result.current.handleInputChange('Hello')
    })

    expect(result.current.isTyping).toBe(true)
  })

  it('stops typing after timeout on input change', async () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
        typingTimeout: 1000,
      })
    )

    act(() => {
      result.current.handleInputChange('Hello')
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false)
    })
  })

  it('handles message send', () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    )

    act(() => {
      result.current.startTyping()
    })

    act(() => {
      result.current.handleMessageSend()
    })

    expect(result.current.isTyping).toBe(false)
  })

  it('debounces typing events', async () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
        debounceDelay: 500,
      })
    )

    act(() => {
      result.current.handleInputChange('H')
    })

    act(() => {
      result.current.handleInputChange('He')
    })

    act(() => {
      result.current.handleInputChange('Hel')
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(mockRealtimeClient.emit).toHaveBeenCalled()
    })
  })

  it('works without realtime client', () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
      })
    )

    act(() => {
      result.current.startTyping()
    })

    expect(result.current.isTyping).toBe(true)
  })

  it('handles realtime client errors gracefully', async () => {
    const errorClient: RealtimeClient = {
      emit: vi.fn().mockRejectedValue(new Error('Network error')),
    } as never

    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: errorClient,
      })
    )

    act(() => {
      result.current.startTyping()
    })

    await waitFor(() => {
      expect(errorClient.emit).toHaveBeenCalled()
    })
  })
})

