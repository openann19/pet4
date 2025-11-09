import { renderHook, act, waitFor } from '@testing-library/react-native'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useTypingManager } from '../use-typing-manager'
import type { RealtimeClient } from '@/lib/realtime'

describe('useTypingManager', () => {
  let mockRealtimeClient: RealtimeClient

  beforeEach(() => {
    vi.useFakeTimers()

    mockRealtimeClient = {
      emit: vi.fn().mockResolvedValue({ success: true }),
      on: vi.fn(),
      off: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      setAccessToken: vi.fn(),
    } as unknown as RealtimeClient
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should initialize with empty typing users and not typing', () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room-1',
        currentUserId: 'user-1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    )

    expect(result.current.typingUsers).toEqual([])
    expect(result.current.isTyping).toBe(false)
  })

  it('should start typing when startTyping is called', () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room-1',
        currentUserId: 'user-1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    )

    act(() => {
      result.current.startTyping()
    })

    expect(result.current.isTyping).toBe(true)
    expect(mockRealtimeClient.emit).toHaveBeenCalledWith('typing_start', {
      roomId: 'room-1',
      userId: 'user-1',
      userName: 'User 1',
    })
  })

  it('should stop typing when stopTyping is called', () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room-1',
        currentUserId: 'user-1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    )

    act(() => {
      result.current.startTyping()
    })

    expect(result.current.isTyping).toBe(true)

    act(() => {
      result.current.stopTyping()
    })

    expect(result.current.isTyping).toBe(false)
    expect(mockRealtimeClient.emit).toHaveBeenCalledWith('typing_stop', {
      roomId: 'room-1',
      userId: 'user-1',
    })
  })

  it('should handle input change and start typing after debounce', async () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room-1',
        currentUserId: 'user-1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
        debounceDelay: 500,
      })
    )

    act(() => {
      result.current.handleInputChange('Hello')
    })

    expect(result.current.isTyping).toBe(false)

    act(() => {
      vi.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(result.current.isTyping).toBe(true)
    })
  })

  it('should stop typing when input is empty', () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room-1',
        currentUserId: 'user-1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    )

    act(() => {
      result.current.startTyping()
    })

    expect(result.current.isTyping).toBe(true)

    act(() => {
      result.current.handleInputChange('')
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current.isTyping).toBe(false)
  })

  it('should stop typing when message is sent', () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room-1',
        currentUserId: 'user-1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    )

    act(() => {
      result.current.startTyping()
    })

    expect(result.current.isTyping).toBe(true)

    act(() => {
      result.current.handleMessageSend()
    })

    expect(result.current.isTyping).toBe(false)
  })

  it('should auto-stop typing after timeout', () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room-1',
        currentUserId: 'user-1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
        typingTimeout: 3000,
      })
    )

    act(() => {
      result.current.startTyping()
    })

    expect(result.current.isTyping).toBe(true)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.isTyping).toBe(false)
  })

  it('should add typing user when typing_start event is received', () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room-1',
        currentUserId: 'user-1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    )

    expect(mockRealtimeClient.on).toHaveBeenCalledWith('typing_start', expect.any(Function))
    expect(mockRealtimeClient.on).toHaveBeenCalledWith('typing_stop', expect.any(Function))

    const typingStartHandler = (mockRealtimeClient.on as ReturnType<typeof vi.fn>).mock.calls.find(
      (call) => call[0] === 'typing_start'
    )?.[1] as (data: unknown) => void

    act(() => {
      typingStartHandler({
        roomId: 'room-1',
        userId: 'user-2',
        userName: 'User 2',
        startedAt: new Date().toISOString(),
      })
    })

    expect(result.current.typingUsers).toHaveLength(1)
    expect(result.current.typingUsers[0]).toMatchObject({
      userId: 'user-2',
      userName: 'User 2',
    })
  })

  it('should remove typing user when typing_stop event is received', () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room-1',
        currentUserId: 'user-1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    )

    const typingStartHandler = (mockRealtimeClient.on as ReturnType<typeof vi.fn>).mock.calls.find(
      (call) => call[0] === 'typing_start'
    )?.[1] as (data: unknown) => void

    const typingStopHandler = (mockRealtimeClient.on as ReturnType<typeof vi.fn>).mock.calls.find(
      (call) => call[0] === 'typing_stop'
    )?.[1] as (data: unknown) => void

    act(() => {
      typingStartHandler({
        roomId: 'room-1',
        userId: 'user-2',
        userName: 'User 2',
      })
    })

    expect(result.current.typingUsers).toHaveLength(1)

    act(() => {
      typingStopHandler({
        roomId: 'room-1',
        userId: 'user-2',
      })
    })

    expect(result.current.typingUsers).toHaveLength(0)
  })

  it('should ignore typing events from different rooms', () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room-1',
        currentUserId: 'user-1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    )

    const typingStartHandler = (mockRealtimeClient.on as ReturnType<typeof vi.fn>).mock.calls.find(
      (call) => call[0] === 'typing_start'
    )?.[1] as (data: unknown) => void

    act(() => {
      typingStartHandler({
        roomId: 'room-2',
        userId: 'user-2',
        userName: 'User 2',
      })
    })

    expect(result.current.typingUsers).toHaveLength(0)
  })

  it('should ignore typing events from current user', () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room-1',
        currentUserId: 'user-1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    )

    const typingStartHandler = (mockRealtimeClient.on as ReturnType<typeof vi.fn>).mock.calls.find(
      (call) => call[0] === 'typing_start'
    )?.[1] as (data: unknown) => void

    act(() => {
      typingStartHandler({
        roomId: 'room-1',
        userId: 'user-1',
        userName: 'User 1',
      })
    })

    expect(result.current.typingUsers).toHaveLength(0)
  })

  it('should work without realtime client', () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room-1',
        currentUserId: 'user-1',
        currentUserName: 'User 1',
      })
    )

    expect(result.current.typingUsers).toEqual([])
    expect(result.current.isTyping).toBe(false)

    act(() => {
      result.current.startTyping()
    })

    expect(result.current.isTyping).toBe(true)
  })

  it('should cleanup event listeners on unmount', () => {
    const { unmount } = renderHook(() =>
      useTypingManager({
        roomId: 'room-1',
        currentUserId: 'user-1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    )

    const typingStartHandler = (mockRealtimeClient.on as ReturnType<typeof vi.fn>).mock.calls.find(
      (call) => call[0] === 'typing_start'
    )?.[1] as (data: unknown) => void

    const typingStopHandler = (mockRealtimeClient.on as ReturnType<typeof vi.fn>).mock.calls.find(
      (call) => call[0] === 'typing_stop'
    )?.[1] as (data: unknown) => void

    unmount()

    expect(mockRealtimeClient.off).toHaveBeenCalledWith('typing_start', typingStartHandler)
    expect(mockRealtimeClient.off).toHaveBeenCalledWith('typing_stop', typingStopHandler)
  })

  it('should debounce typing start emissions', async () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room-1',
        currentUserId: 'user-1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
        debounceDelay: 500,
      })
    )

    act(() => {
      result.current.startTyping()
    })

    const firstCallCount = (mockRealtimeClient.emit as ReturnType<typeof vi.fn>).mock.calls.length

    act(() => {
      result.current.startTyping()
    })

    await waitFor(() => {
      const secondCallCount = (mockRealtimeClient.emit as ReturnType<typeof vi.fn>).mock.calls.length
      expect(secondCallCount).toBe(firstCallCount)
    })
  })
})
