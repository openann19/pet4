import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTypingManager } from './use-typing-manager';
import type { RealtimeClient } from '@/lib/realtime';

describe('useTypingManager', () => {
  let mockRealtimeClient: RealtimeClient;
  let mockEmit: ReturnType<typeof vi.fn>;
  let mockOn: ReturnType<typeof vi.fn>;
  let mockOff: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockEmit = vi.fn().mockResolvedValue({ success: true });
    mockOn = vi.fn();
    mockOff = vi.fn();

    // Create type-safe mock client that matches RealtimeClient interface
    mockRealtimeClient = {
      emit: mockEmit,
      on: mockOn,
      off: mockOff,
      connect: vi.fn(),
      disconnect: vi.fn(),
      setAccessToken: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      publish: vi.fn(),
      trigger: vi.fn(),
    } as RealtimeClient;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('initializes with empty typing users', () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    );

    expect(result.current.typingUsers).toEqual([]);
    expect(result.current.isTyping).toBe(false);
  });

  it('emits typing_start when startTyping is called', async () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    );

    act(() => {
      result.current.startTyping();
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    await waitFor(() => {
      expect(mockEmit).toHaveBeenCalledWith('typing_start', {
        roomId: 'room1',
        userId: 'user1',
        userName: 'User 1',
      });
    });
  });

  it('emits typing_stop when stopTyping is called', async () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    );

    act(() => {
      result.current.startTyping();
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    act(() => {
      result.current.stopTyping();
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    await waitFor(() => {
      expect(mockEmit).toHaveBeenCalledWith('typing_stop', {
        roomId: 'room1',
        userId: 'user1',
      });
    });
  });

  it('automatically stops typing after timeout', async () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
        typingTimeout: 1000,
      })
    );

    act(() => {
      result.current.startTyping();
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(true);
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
    });
  });

  it('handles input change and starts typing', async () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
        debounceDelay: 100,
      })
    );

    act(() => {
      result.current.handleInputChange('Hello');
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(true);
    });
  });

  it('handles input change and stops typing when empty', async () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    );

    act(() => {
      result.current.startTyping();
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    act(() => {
      result.current.handleInputChange('');
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
    });
  });

  it('stops typing when message is sent', async () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    );

    act(() => {
      result.current.startTyping();
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    act(() => {
      result.current.handleMessageSend();
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
    });
  });

  it('adds typing user when typing_start event is received', async () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    );

    const typingStartHandler = mockOn.mock.calls.find((call) => call[0] === 'typing_start')?.[1];

    await act(async () => {
      if (typingStartHandler) {
        typingStartHandler({
          roomId: 'room1',
          userId: 'user2',
          userName: 'User 2',
          startedAt: new Date().toISOString(),
        });
      }
      vi.advanceTimersByTime(0);
    });

    await waitFor(() => {
      expect(result.current.typingUsers).toHaveLength(1);
      expect(result.current.typingUsers[0]?.userId).toBe('user2');
    });
  });

  it('removes typing user when typing_stop event is received', async () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    );

    const typingStartHandler = mockOn.mock.calls.find((call) => call[0] === 'typing_start')?.[1];

    const typingStopHandler = mockOn.mock.calls.find((call) => call[0] === 'typing_stop')?.[1];

    await act(async () => {
      if (typingStartHandler) {
        typingStartHandler({
          roomId: 'room1',
          userId: 'user2',
          userName: 'User 2',
          startedAt: new Date().toISOString(),
        });
      }
      vi.advanceTimersByTime(0);
    });

    await waitFor(() => {
      expect(result.current.typingUsers).toHaveLength(1);
    });

    await act(async () => {
      if (typingStopHandler) {
        typingStopHandler({
          roomId: 'room1',
          userId: 'user2',
        });
      }
      vi.advanceTimersByTime(0);
    });

    await waitFor(() => {
      expect(result.current.typingUsers).toHaveLength(0);
    });
  });

  it('ignores typing events from current user', async () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    );

    const typingStartHandler = mockOn.mock.calls.find((call) => call[0] === 'typing_start')?.[1];

    await act(async () => {
      if (typingStartHandler) {
        typingStartHandler({
          roomId: 'room1',
          userId: 'user1',
          userName: 'User 1',
          startedAt: new Date().toISOString(),
        });
      }
      vi.advanceTimersByTime(0);
    });

    await waitFor(() => {
      expect(result.current.typingUsers).toHaveLength(0);
    });
  });

  it('ignores typing events from different rooms', async () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    );

    const typingStartHandler = mockOn.mock.calls.find((call) => call[0] === 'typing_start')?.[1];

    await act(async () => {
      if (typingStartHandler) {
        typingStartHandler({
          roomId: 'room2',
          userId: 'user2',
          userName: 'User 2',
          startedAt: new Date().toISOString(),
        });
      }
      vi.advanceTimersByTime(0);
    });

    await waitFor(() => {
      expect(result.current.typingUsers).toHaveLength(0);
    });
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
      })
    );

    unmount();

    expect(mockOff).toHaveBeenCalledWith('typing_start', expect.any(Function));
    expect(mockOff).toHaveBeenCalledWith('typing_stop', expect.any(Function));
  });

  it('works without realtime client', async () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
      })
    );

    expect(result.current.typingUsers).toEqual([]);
    expect(result.current.isTyping).toBe(false);

    act(() => {
      result.current.startTyping();
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(true);
    });

    act(() => {
      result.current.stopTyping();
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
    });
  });

  it('debounces typing start', async () => {
    const { result } = renderHook(() =>
      useTypingManager({
        roomId: 'room1',
        currentUserId: 'user1',
        currentUserName: 'User 1',
        realtimeClient: mockRealtimeClient,
        debounceDelay: 500,
      })
    );

    act(() => {
      result.current.handleInputChange('H');
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current.handleInputChange('He');
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current.handleInputChange('Hel');
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(mockEmit).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(mockEmit).toHaveBeenCalledTimes(1);
    });
  });
});
