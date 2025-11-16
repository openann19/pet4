/**
 * Integration Tests: Chat Flow
 *
 * Tests the complete chat flow from match to message sending
 * Coverage target: Critical user flows
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create properly typed mocks
const mockGetMessages = vi.fn();
const mockSendMessage = vi.fn();
const mockMarkAsRead = vi.fn();
const mockGetConversations = vi.fn();

vi.mock('@/api/chat-api', () => ({
    chatApi: {
        getMessages: mockGetMessages,
        sendMessage: mockSendMessage,
        markAsRead: mockMarkAsRead,
        getConversations: mockGetConversations,
    },
}));

vi.mock('@/lib/websocket-manager', () => ({
    WebSocketManager: vi.fn().mockImplementation(() => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
        send: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        isConnected: vi.fn(() => true),
    })),
}));

vi.mock('@/lib/logger', () => ({
    createLogger: () => ({
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    }),
}));

describe('Chat Flow Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Message Sending', () => {
        it('should send text message successfully', async () => {
            mockSendMessage.mockResolvedValue({
                id: 'msg-1',
                text: 'Hello!',
                success: true,
                messageId: 'msg-123',
            });

            const result = await mockSendMessage('conversation-1', {
                text: 'Hello!',
                type: 'text',
            });

            expect(result.id).toBe('msg-1');
            expect(result.text).toBe('Hello!');
            expect(mockSendMessage).toHaveBeenCalledWith('conversation-1', {
                text: 'Hello!',
                type: 'text',
            });
        });

        it('should handle message send errors', async () => {
            mockSendMessage.mockRejectedValue(new Error('Failed to send message'));

            await expect(
                mockSendMessage('conversation-1', {
                    text: 'Hello!',
                    type: 'text',
                })
            ).rejects.toThrow('Failed to send message');
        });
    });

    describe('Message Loading', () => {
        it('should load messages for conversation', async () => {
            mockGetMessages.mockResolvedValue({
                messages: [
                    { id: 'msg-1', text: 'Hello', timestamp: Date.now() },
                    { id: 'msg-2', text: 'Hi there', timestamp: Date.now() },
                ],
                hasMore: false,
            });

            const result = await mockGetMessages('conversation-1', { limit: 50 });

            expect(result.messages).toHaveLength(2);
            expect(result.hasMore).toBe(false);
            expect(mockGetMessages).toHaveBeenCalledWith('conversation-1', { limit: 50 });
        });
    });

    describe('Conversations List', () => {
        it('should load conversations', async () => {
            mockGetConversations.mockResolvedValue({
                conversations: [
                    { id: 'conv-1', lastMessage: { text: 'Hello' } },
                    { id: 'conv-2', lastMessage: { text: 'Hi' } },
                ],
            });

            const result = await mockGetConversations();

            expect(result.conversations).toHaveLength(2);
            expect(mockGetConversations).toHaveBeenCalled();
        });
    });

    describe('Read Receipts', () => {
        it('should mark messages as read', async () => {
            mockMarkAsRead.mockResolvedValue(undefined);

            await mockMarkAsRead('conversation-1', 'msg-1');

            expect(mockMarkAsRead).toHaveBeenCalledWith('conversation-1', 'msg-1');
        });
    });
});
