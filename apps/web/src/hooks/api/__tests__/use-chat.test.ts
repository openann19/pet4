import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQueryClient } from '@/test-utils/react-query';
import { useChatMessages, useSendMessage, useMarkAsRead } from '../use-chat';
import { chatAPI } from '@/lib/api-services';

const mockedChatAPI = vi.mocked(chatAPI);

vi.mock('@/lib/api-services', () => ({
  chatAPI: {
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn(),
  },
}));

describe('useChatMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch chat messages', async () => {
    const mockMessages = [
      { id: 'msg-1', content: 'Hello', createdAt: new Date().toISOString() },
      { id: 'msg-2', content: 'World', createdAt: new Date().toISOString() },
    ];

    mockedChatAPI.getMessages.mockResolvedValue({
      items: mockMessages,
    } as never);

    const { result } = renderHookWithQueryClient(() => useChatMessages('room-1'));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(mockedChatAPI.getMessages.mock.calls[0]).toEqual(['room-1', undefined]);
  });

  it('should not fetch when roomId is null', () => {
    const { result } = renderHookWithQueryClient(() => useChatMessages(null));

    expect(result.current.isFetching).toBe(false);
    expect(mockedChatAPI.getMessages.mock.calls.length).toBe(0);
  });

  it('should handle error', async () => {
    mockedChatAPI.getMessages.mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHookWithQueryClient(() => useChatMessages('room-1'));

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

    mockedChatAPI.sendMessage.mockResolvedValue(mockMessage as never);

    const { result } = renderHookWithQueryClient(() => useSendMessage());

    await result.current.sendMessage({
      chatRoomId: 'room-1',
      content: 'Test message',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedChatAPI.sendMessage.mock.calls[0]).toEqual(['room-1', 'Test message']);
  });

  it('should handle error', async () => {
    mockedChatAPI.sendMessage.mockRejectedValue(new Error('Failed to send'));

    const { result } = renderHookWithQueryClient(() => useSendMessage());

    await expect(
      result.current.sendMessage({
        chatRoomId: 'room-1',
        content: 'Test message',
      })
    ).rejects.toThrow('Failed to send');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useMarkAsRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark message as read', async () => {
    mockedChatAPI.markAsRead.mockResolvedValue({ success: true } as never);

    const { result } = renderHookWithQueryClient(() => useMarkAsRead());

    await result.current.markAsRead({
      chatRoomId: 'room-1',
      messageId: 'msg-1',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedChatAPI.markAsRead.mock.calls[0]).toEqual(['room-1', 'msg-1']);
  });

  it('should handle error', async () => {
    mockedChatAPI.markAsRead.mockRejectedValue(new Error('Failed to mark as read'));

    const { result } = renderHookWithQueryClient(() => useMarkAsRead());

    await expect(
      result.current.markAsRead({
        chatRoomId: 'room-1',
        messageId: 'msg-1',
      })
    ).rejects.toThrow('Failed to mark as read');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
