import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Dispatch, SetStateAction } from 'react';
import { useMessageHandling } from '../chat/use-message-handling';
import type { ChatMessage, ChatRoom } from '@/lib/chat-types';
import { haptics } from '@/lib/haptics';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/llm-service', () => ({
  llmService: {
    llm: vi.fn(),
  },
}));

vi.mock('@/lib/llm-utils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/llm-utils')>('@/lib/llm-utils');
  return {
    ...actual,
    parseLLMError: vi.fn(() => ({
      isBudgetLimit: false,
      isRateLimit: false,
      isNetworkError: false,
      userMessage: 'User friendly message',
      technicalMessage: 'Technical error',
    })),
  };
});

vi.mock('@/lib/chat-utils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/chat-utils')>('@/lib/chat-utils');
  return {
    ...actual,
    generateMessageId: vi.fn(() => 'msg-123'),
  };
});

describe('useMessageHandling', () => {
  const room: ChatRoom = {
    id: 'room-1',
    participantIds: ['user-1', 'user-2'],
    type: 'direct',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createHook = (initialMessages: ChatMessage[] = []) => {
    let updatedMessages: ChatMessage[] | undefined;

    const setMessages = vi
      .fn((updater: (prev: ChatMessage[] | undefined) => ChatMessage[]) => {
        updatedMessages = updater(initialMessages);
      }) as Dispatch<SetStateAction<ChatMessage[]>>;

    const enqueue = vi.fn();
    const typingSend = vi.fn();

    const { result } = renderHook(() =>
      useMessageHandling(
        initialMessages,
        setMessages,
        'user-1',
        'Alice',
        enqueue,
        room,
        typingSend,
        'avatar-url'
      )
    );

    return { result, setMessages, updatedMessagesRef: () => updatedMessages, enqueue, typingSend };
  };

  it('ignores empty text messages without attachments', () => {
    const { result, setMessages, enqueue, typingSend } = createHook();

    act(() => {
      result.current.onSend('   ');
    });

    expect(setMessages).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
    expect(typingSend).not.toHaveBeenCalled();
    expect(haptics.trigger).not.toHaveBeenCalled();
  });

  it('sends a text message and updates state', () => {
    const { result, setMessages, updatedMessagesRef, enqueue, typingSend } = createHook();

    act(() => {
      result.current.onSend(' Hello world ');
    });

    expect(haptics.trigger).toHaveBeenCalledWith('light');
    expect(setMessages).toHaveBeenCalledTimes(1);

    const updated = updatedMessagesRef();
    expect(updated).toBeDefined();
    expect(updated?.length).toBe(1);

    const msg = updated?.[0];
    expect(msg).toMatchObject({
      id: 'msg-123',
      roomId: 'room-1',
      senderId: 'user-1',
      senderName: 'Alice',
      senderAvatar: 'avatar-url',
      content: 'Hello world',
      type: 'text',
      status: 'sent',
    });
    expect(Array.isArray(msg?.reactions)).toBe(true);

    expect(typingSend).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith('msg-123', {
      messageId: 'msg-123',
      roomId: 'room-1',
      content: 'Hello world',
      senderId: 'user-1',
      type: 'text',
      timestamp: msg?.timestamp,
    });
    expect(toast.success).toHaveBeenCalledWith('Message sent!', {
      duration: 1500,
      position: 'top-center',
    });
  });

  it('increments confettiSeed for sticker and pet-card messages', () => {
    const { result } = createHook();

    act(() => {
      result.current.onSend('sticker-1', 'sticker');
    });
    const firstSeed = result.current.confettiSeed;

    act(() => {
      result.current.onSend('pet-card-1', 'pet-card');
    });
    const secondSeed = result.current.confettiSeed;

    expect(firstSeed).toBeGreaterThan(0);
    expect(secondSeed).toBeGreaterThan(firstSeed);
  });

  it('toggles reactions and increments burstSeed', () => {
    const baseMessage: ChatMessage = {
      id: 'msg-1',
      roomId: 'room-1',
      senderId: 'user-2',
      senderName: 'Bob',
      content: 'Hi',
      type: 'text',
      status: 'sent',
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      reactions: [],
    };

    const { result, updatedMessagesRef } = createHook([baseMessage]);

    const initialBurst = result.current.burstSeed;

    act(() => {
      result.current.onReaction('msg-1', '❤️');
    });

    const afterFirst = updatedMessagesRef();
    const reactionsAfterFirst = afterFirst?.[0]?.reactions ?? [];
    expect(reactionsAfterFirst.length).toBe(1);
    expect(reactionsAfterFirst[0]).toMatchObject({
      emoji: '❤️',
      userId: 'user-1',
      userName: 'Alice',
      userAvatar: 'avatar-url',
    });
    expect(result.current.burstSeed).toBeGreaterThan(initialBurst);

    act(() => {
      result.current.onReaction('msg-1', '😂');
    });

    const afterSecond = updatedMessagesRef();
    const reactionsAfterSecond = afterSecond?.[0]?.reactions ?? [];
    expect(reactionsAfterSecond.length).toBe(1);
    expect(reactionsAfterSecond[0]).toMatchObject({
      emoji: '😂',
      userId: 'user-1',
    });

    act(() => {
      result.current.onReaction('msg-1', '😂');
    });

    const afterThird = updatedMessagesRef();
    const reactionsAfterThird = afterThird?.[0]?.reactions ?? [];
    expect(reactionsAfterThird.length).toBe(0);
  });

  it('translates a message and updates metadata on success', async () => {
    const now = new Date().toISOString();
    const message: ChatMessage = {
      id: 'msg-translate',
      roomId: 'room-1',
      senderId: 'user-2',
      senderName: 'Bob',
      content: 'Hola',
      type: 'text',
      status: 'sent',
      createdAt: now,
      timestamp: now,
      reactions: [],
    };

    const { llmService } = await import('@/lib/llm-service');
    vi.mocked(llmService.llm).mockResolvedValue('Hello');

    const { result, updatedMessagesRef } = createHook([message]);

    act(() => {
      result.current.onTranslate('msg-translate');
    });

    await waitFor(() => {
      const updated = updatedMessagesRef();
      const translatedMetadata = updated?.[0]?.metadata?.translation;
      expect(translatedMetadata).toBeDefined();
      expect(translatedMetadata?.translatedText).toBe('Hello');
      expect(translatedMetadata?.targetLang).toBe('en');
    });

    expect(toast.success).toHaveBeenCalledWith('Message translated!');
  });

  it('handles translation errors and shows toast', async () => {
    const now = new Date().toISOString();
    const message: ChatMessage = {
      id: 'msg-error',
      roomId: 'room-1',
      senderId: 'user-2',
      senderName: 'Bob',
      content: 'Bonjour',
      type: 'text',
      status: 'sent',
      createdAt: now,
      timestamp: now,
      reactions: [],
    };

    const { llmService } = await import('@/lib/llm-service');
    vi.mocked(llmService.llm).mockRejectedValue(new Error('LLM failure'));

    const { result } = createHook([message]);

    act(() => {
      result.current.onTranslate('msg-error');
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Translation failed', {
        description: 'User friendly message',
        duration: 5000,
      });
    });
  });
});
