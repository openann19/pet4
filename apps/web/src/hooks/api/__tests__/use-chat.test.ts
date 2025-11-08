import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChatMessages, useSendMessage, useMarkAsRead } from '../use-chat';
import { chatAPI } from '@/lib/api-services';

vi.mock('@/lib/api-services', () => ({
  chatAPI: {
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useChatMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch chat messages', async () => {
    const mockMessages = [
      { id: 'msg-1', content: 'Hello', createdAt: new Date().toISOString() },
      { id: 'msg-2', content: 'World', createdAt: new Date().toISOString() },
    ];

    vi.mocked(chatAPI.getMessages).mockResolvedValue({
      items: mockMessages,
    } as never);

    const { result } = renderHook(() => useChatMessages('room-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(chatAPI.getMessages).toHaveBeenCalledWith('room-1', undefined);
  });

  it('should not fetch when roomId is null', () => {
    const { result } = renderHook(() => useChatMessages(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(chatAPI.getMessages).not.toHaveBeenCalled();
  });

  it('should handle error', async () => {
    vi.mocked(chatAPI.getMessages).mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHook(() => useChatMessages('room-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe('useSendMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send message', async () => {
    const mockMessage = {
      id: 'msg-1',
      content: 'Test message',
      createdAt: new Date().toISOString(),
    };

    vi.mocked(chatAPI.sendMessage).mockResolvedValue(mockMessage as never);

    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      chatRoomId: 'room-1',
      content: 'Test message',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(chatAPI.sendMessage).toHaveBeenCalledWith('room-1', 'Test message');
  });

  it('should handle error', async () => {
    vi.mocked(chatAPI.sendMessage).mockRejectedValue(new Error('Failed to send'));

    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        chatRoomId: 'room-1',
        content: 'Test message',
      })
    ).rejects.toThrow();

    expect(result.current.isError).toBe(true);
  });
});

describe('useMarkAsRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark message as read', async () => {
    vi.mocked(chatAPI.markAsRead).mockResolvedValue({ success: true } as never);

    const { result } = renderHook(() => useMarkAsRead(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      chatRoomId: 'room-1',
      messageId: 'msg-1',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(chatAPI.markAsRead).toHaveBeenCalledWith('room-1', 'msg-1');
  });

  it('should handle error', async () => {
    vi.mocked(chatAPI.markAsRead).mockRejectedValue(new Error('Failed to mark as read'));

    const { result } = renderHook(() => useMarkAsRead(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        chatRoomId: 'room-1',
        messageId: 'msg-1',
      })
    ).rejects.toThrow();

    expect(result.current.isError).toBe(true);
  });
});
