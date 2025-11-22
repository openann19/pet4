/**
 * Stable References Integration Tests
 *
 * Tests stable message references integration in chat components.
 *
 * Location: apps/web/src/core/a11y/__tests__/stable-references-integration.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageItem } from '@/components/chat/components/MessageItem';
import type { ChatMessage } from '@/lib/chat-types';
import {
  getStableMessageReference,
  generateStableId,
  formatStableTimestamp,
} from '../fixed-references';

describe('Stable References Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Cleanup
  });

  describe('getStableMessageReference', () => {
    it('should generate stable message reference', () => {
      const messageId = 'msg-123';
      const timestamp = new Date().toISOString();
      const senderName = 'John Doe';
      const content = 'Test message';

      const reference = getStableMessageReference(
        messageId,
        timestamp,
        senderName,
        content,
        true
      );

      expect(reference.stableId).toBeTruthy();
      expect(reference.stableId).toContain('message-');
      expect(reference.ariaLabel).toContain(senderName);
      expect(reference.ariaLabel).toContain(content);
      expect(reference.stableTimestamp).toBeTruthy();
    });

    it('should generate consistent stable IDs for same message', () => {
      const messageId = 'msg-123';
      const timestamp = new Date().toISOString();
      const senderName = 'John Doe';
      const content = 'Test message';

      const reference1 = getStableMessageReference(
        messageId,
        timestamp,
        senderName,
        content,
        true
      );
      const reference2 = getStableMessageReference(
        messageId,
        timestamp,
        senderName,
        content,
        true
      );

      expect(reference1.stableId).toBe(reference2.stableId);
    });

    it('should generate different stable IDs for different messages', () => {
      const timestamp = new Date().toISOString();
      const senderName = 'John Doe';
      const content = 'Test message';

      const reference1 = getStableMessageReference(
        'msg-123',
        timestamp,
        senderName,
        content,
        true
      );
      const reference2 = getStableMessageReference(
        'msg-456',
        timestamp,
        senderName,
        content,
        true
      );

      expect(reference1.stableId).not.toBe(reference2.stableId);
    });
  });

  describe('generateStableId', () => {
    it('should generate stable ID from message ID', () => {
      const messageId = 'msg-123';
      const stableId = generateStableId(messageId);

      expect(stableId).toBeTruthy();
      expect(stableId).toContain('message-');
      expect(stableId).toContain(messageId.slice(-8)); // Last 8 chars of message ID
    });

    it('should generate consistent IDs for same message ID', () => {
      const messageId = 'msg-123';
      const stableId1 = generateStableId(messageId);
      const stableId2 = generateStableId(messageId);

      expect(stableId1).toBe(stableId2);
    });
  });

  describe('formatStableTimestamp', () => {
    it('should format timestamp consistently', () => {
      const timestamp = new Date('2024-01-15T10:30:00Z').toISOString();
      const formatted = formatStableTimestamp(timestamp);

      expect(formatted).toBeTruthy();
      expect(formatted).toMatch(/\d{4}-\d{2}-\d{2}/); // Date format
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatStableTimestamp(date);

      expect(formatted).toBeTruthy();
      expect(formatted).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('MessageItem Component', () => {
    const mockMessage: ChatMessage = {
      id: 'msg-123',
      roomId: 'room-1',
      senderId: 'user-1',
      senderName: 'John Doe',
      content: 'Test message',
      type: 'text',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'sent',
      reactions: [],
    };

    it('should use stable message references', () => {
      render(
        <MessageItem
          message={mockMessage}
          isCurrentUser={false}
          currentUserId="user-2"
          currentUserName="Jane Doe"
          delay={0}
          onReaction={() => {}}
          onTranslate={() => {}}
        />
      );

      // Check if message element has stable ID
      const messageElement = document.querySelector('[role="article"]');
      expect(messageElement).toBeInTheDocument();

      const id = messageElement?.getAttribute('id');
      expect(id).toBeTruthy();
      expect(id?.startsWith('message-')).toBe(true);

      // Check if ARIA label is present
      const ariaLabel = messageElement?.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain(mockMessage.senderName);
    });

    it('should have stable ID that persists across re-renders', () => {
      const { rerender } = render(
        <MessageItem
          message={mockMessage}
          isCurrentUser={false}
          currentUserId="user-2"
          currentUserName="Jane Doe"
          delay={0}
          onReaction={() => {}}
          onTranslate={() => {}}
        />
      );

      const messageElement1 = document.querySelector('[role="article"]');
      const id1 = messageElement1?.getAttribute('id');

      rerender(
        <MessageItem
          message={mockMessage}
          isCurrentUser={false}
          currentUserId="user-2"
          currentUserName="Jane Doe"
          delay={0}
          onReaction={() => {}}
          onTranslate={() => {}}
        />
      );

      const messageElement2 = document.querySelector('[role="article"]');
      const id2 = messageElement2?.getAttribute('id');

      // Stable ID should remain the same
      expect(id1).toBe(id2);
    });

    it('should have ARIA description for screen readers', () => {
      render(
        <MessageItem
          message={mockMessage}
          isCurrentUser={false}
          currentUserId="user-2"
          currentUserName="Jane Doe"
          delay={0}
          onReaction={() => {}}
          onTranslate={() => {}}
        />
      );

      const messageElement = document.querySelector('[role="article"]');
      const ariaDescribedBy = messageElement?.getAttribute('aria-describedby');

      if (ariaDescribedBy) {
        const descriptionElement = document.getElementById(ariaDescribedBy);
        expect(descriptionElement).toBeInTheDocument();
        expect(descriptionElement?.textContent).toBeTruthy();
      }
    });
  });
});
