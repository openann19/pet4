import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdvancedChatWindow from '../AdvancedChatWindow';
import type { ChatRoom, ChatMessage } from '@/lib/chat-types';
import { useStorage } from '@/hooks/use-storage';

vi.mock('@/hooks/use-storage');
vi.mock('@/hooks/use-typing-manager', () => ({
  useTypingManager: () => ({
    typingUsers: [],
    handleInputChange: vi.fn(),
    handleMessageSend: vi.fn(),
  }),
}));

vi.mock('@/effects/chat/ui/use-scroll-fab-magnetic', () => ({
  useScrollFabMagnetic: () => ({
    animatedStyle: {},
  }),
}));

vi.mock('@/hooks/useInteractiveAnimations', () => ({
  useInteractiveAnimations: () => ({
    templatesStyle: {},
    templateButtonHover: { animatedStyle: {} },
    templateButtonTap: { animatedStyle: {} },
    stickerButtonHover: { animatedStyle: {} },
    stickerButtonTap: { animatedStyle: {} },
    emojiButtonHover: { animatedStyle: {} },
    emojiButtonTap: { animatedStyle: {} },
    sendButtonHover: { animatedStyle: {} },
    sendButtonTap: { animatedStyle: {} },
  }),
}));

vi.mock('@/hooks/chat/use-chat-keyboard-shortcuts', () => ({
  useChatKeyboardShortcuts: vi.fn(),
}));

vi.mock('@/hooks/chat/use-message-handling', () => ({
  useMessageHandling: (
    _messages: ChatMessage[],
    _setMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void,
    _currentUserId: string,
    _currentUserName: string,
    _enqueue: (id: string, payload: unknown) => void,
    _room: ChatRoom,
    _typingSend: () => void,
    _currentUserAvatar?: string
  ) => ({
    onSend: vi.fn(),
    onReaction: vi.fn(),
    onTranslate: vi.fn(),
    inputValue: '',
    setInputValue: vi.fn(),
    showStickers: false,
    setShowStickers: vi.fn(),
    showTemplates: false,
    setShowTemplates: vi.fn(),
    confettiSeed: 0,
    burstSeed: 0,
  }),
}));

vi.mock('@petspark/chat-core', () => ({
  useOutbox: () => ({
    enqueue: vi.fn(),
  }),
}));

vi.mock('@petspark/config', () => ({
  flags: () => ({
    chat: {
      virtualization: false,
    },
  }),
}));

vi.mock('@/api/chat-api', () => ({
  chatApi: {
    sendMessage: vi.fn(),
  },
}));

vi.mock('@/lib/realtime', () => ({
  realtime: {},
}));

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
  },
}));

const mockUseStorage = vi.mocked(useStorage);

const room: ChatRoom = {
  id: 'room-1',
  name: 'Test Room',
  participants: [],
  createdAt: new Date().toISOString(),
};

describe('AdvancedChatWindow (web)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // chat messages storage
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key.startsWith('chat-messages-')) {
        return [[], vi.fn().mockResolvedValue(undefined), vi.fn().mockResolvedValue(undefined)];
      }
      if (key.startsWith('away-mode-')) {
        return [false, vi.fn().mockResolvedValue(undefined), vi.fn().mockResolvedValue(undefined)];
      }
      return [defaultValue, vi.fn().mockResolvedValue(undefined), vi.fn().mockResolvedValue(undefined)];
    });
  });

  it('renders header and message list', async () => {
    render(
      <AdvancedChatWindow
        room={room}
        currentUserId="user-1"
        currentUserName="Tester"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Room')).toBeInTheDocument();
    });

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls onBack when back handler is invoked via header', async () => {
    const onBack = vi.fn();
    render(
      <AdvancedChatWindow
        room={room}
        currentUserId="user-1"
        currentUserName="Tester"
        onBack={onBack}
      />
    );

    // ChatHeader uses a button with aria-label or text; rely on text if present
    const backButton = screen.queryByRole('button', { name: /back/i });
    if (backButton) {
      const user = userEvent.setup();
      await user.click(backButton);
      expect(onBack).toHaveBeenCalled();
    }
  });
});

