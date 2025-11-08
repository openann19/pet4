/**
 * Realtime Events Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RealtimeEvents } from '../realtime-events';
import type { WebSocketManager } from '../websocket-manager';

vi.mock('../websocket-manager');
vi.mock('../config', () => ({
  config: {
    current: {
      WS_URL: 'ws://localhost:3000',
    },
  },
}));

describe('RealtimeEvents', () => {
  let events: RealtimeEvents;
  let mockWsManager: WebSocketManager;

  beforeEach(() => {
    mockWsManager = {
      send: vi.fn().mockReturnValue('msg-123'),
      on: vi.fn().mockReturnValue(() => {}),
      connect: vi.fn(),
      disconnect: vi.fn(),
      getState: vi.fn().mockReturnValue('connected'),
    } as unknown as WebSocketManager;

    events = new RealtimeEvents(mockWsManager);
  });

  describe('joinRoom', () => {
    it('should send join_room event', async () => {
      const sendSpy = vi.spyOn(events as any, 'sendWithAck');
      sendSpy.mockResolvedValue(undefined);

      await events.joinRoom('room-123', 'user-456');

      expect(sendSpy).toHaveBeenCalledWith('/chat', 'join_room', {
        roomId: 'room-123',
        userId: 'user-456',
      });
    });
  });

  describe('sendMessage', () => {
    it('should send message event', async () => {
      const sendSpy = vi.spyOn(events as any, 'sendWithAck');
      sendSpy.mockResolvedValue(undefined);

      const message = {
        id: 'msg-123',
        chatRoomId: 'room-123',
        senderId: 'user-456',
        content: 'Hello',
        type: 'text' as const,
        reactions: [],
        status: 'sent' as const,
        createdAt: new Date().toISOString(),
      };

      await events.sendMessage(message);

      expect(sendSpy).toHaveBeenCalledWith(
        '/chat',
        'message_send',
        expect.objectContaining({
          messageId: 'msg-123',
          roomId: 'room-123',
          content: 'Hello',
          senderId: 'user-456',
        })
      );
    });
  });

  describe('event listeners', () => {
    it('should register chat message listener', () => {
      const handler = vi.fn();
      const unsubscribe = events.onChatMessage(handler);

      expect(mockWsManager.on).toHaveBeenCalledWith('chat:message_send', handler);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should register match created listener', () => {
      const handler = vi.fn();
      const unsubscribe = events.onMatchCreated(handler);

      expect(mockWsManager.on).toHaveBeenCalledWith('notifications:match_created', handler);
      expect(typeof unsubscribe).toBe('function');
    });
  });
});
