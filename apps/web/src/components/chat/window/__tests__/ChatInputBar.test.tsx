import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AnimatedStyle } from '../../../../effects/reanimated/animated-view';
import { ChatInputBar } from '../ChatInputBar';

// Stub data for templates, stickers, and reaction emojis
vi.mock('@/lib/chat-types', () => ({
    MESSAGE_TEMPLATES: [
        { id: '1', icon: '✨', title: 'Greeting', text: 'Hello there!' },
    ],
    REACTION_EMOJIS: ['👍', '❤️'],
}));

vi.mock('@/lib/chat-utils', () => ({
    CHAT_STICKERS: [
        { id: 's1', emoji: '🐶', label: 'Dog' },
    ],
}));

// Mock VoiceRecorder to avoid audio APIs
vi.mock('@/components/chat/VoiceRecorder', () => ({
    __esModule: true,
    default: ({ onRecorded, onCancel }: { onRecorded: () => void; onCancel: () => void }) => (
        <div data-testid="voice-recorder">
            <button type="button" onClick={onRecorded}>
                recorded
            </button>
            <button type="button" onClick={onCancel}>
                cancel
            </button>
        </div>
    ),
}));

function createAnimatedStyleStub(): AnimatedStyle {
    return {} as AnimatedStyle;
}

function createBaseProps(overrides: Partial<React.ComponentProps<typeof ChatInputBar>> = {}) {
    const templatesStyle = createAnimatedStyleStub();

    const baseProps: React.ComponentProps<typeof ChatInputBar> = {
        inputRef: { current: document.createElement('input') },
        showTemplates: false,
        showStickers: false,
        isRecording: false,
        templatesStyle: templatesStyle as any, // Cast to match MotionStyle from framer-motion mock
        templateButtonHover: {
            animatedStyle: {} as any,
            handleEnter: vi.fn(),
            handleLeave: vi.fn(),
        },
        templateButtonTap: {
            animatedStyle: {} as any,
            handlePress: vi.fn(),
        },
        stickerButtonTap: {
            animatedStyle: {} as any,
        },
        stickerButtonHover: {
            animatedStyle: {} as any,
            handleEnter: vi.fn(),
            handleLeave: vi.fn(),
        },
        emojiButtonTap: {
            animatedStyle: {} as any,
        },
        emojiButtonHover: {
            animatedStyle: {} as any,
            handleEnter: vi.fn(),
            handleLeave: vi.fn(),
        },
        sendButtonHover: {
            animatedStyle: {} as any,
            handleEnter: vi.fn(),
            handleLeave: vi.fn(),
        },
        sendButtonTap: {
            animatedStyle: {} as any,
        },
        onInputChange: vi.fn(),
        onSendMessage: vi.fn(),
        onUseTemplate: vi.fn(),
        onVoiceRecorded: vi.fn(),
        onVoiceCancel: vi.fn(),
        onStartRecording: vi.fn(),
        setShowTemplates: vi.fn(),
        setShowStickers: vi.fn(),
        ...overrides,
        // Ensure inputValue is never undefined
        inputValue: overrides.inputValue ?? '',
    };

    return baseProps;
}

describe('ChatInputBar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders message input and primary controls', () => {
        const props = createBaseProps();

        render(<ChatInputBar {...props} />);

        expect(screen.getByLabelText('Message input')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /open message templates/i })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /open stickers and emojis/i })
        ).toBeInTheDocument();
    });

    it('renders input with correct attributes', () => {
        const props = createBaseProps();

        render(<ChatInputBar {...props} />);

        const input = screen.getByLabelText('Message input');
        expect(input).toHaveAttribute('placeholder', 'Type a message...');
        expect(input).toHaveAttribute('aria-label', 'Message input');
        expect(input).toHaveValue(''); // Should start empty
    });

    it('sends message on send button click', async () => {
        const props = createBaseProps({ inputValue: 'Hi there' });
        const user = userEvent.setup();

        render(<ChatInputBar {...props} />);

        const sendButton = screen.getByRole('button', { name: /send message/i });
        await user.click(sendButton);

        expect(props.onSendMessage).toHaveBeenCalledWith('Hi there', 'text');
    });

    it('sends message on Enter key press', async () => {
        const props = createBaseProps({ inputValue: 'Hello world' });
        const user = userEvent.setup();

        render(<ChatInputBar {...props} />);

        const input = screen.getByLabelText('Message input');
        await user.type(input, '{enter}');

        expect(props.onSendMessage).toHaveBeenCalledWith('Hello world', 'text');
    });

    it('toggles templates panel via templates button', async () => {
        const setShowTemplates = vi.fn();
        const props = createBaseProps({ setShowTemplates });
        const user = userEvent.setup();

        render(<ChatInputBar {...props} />);

        const button = screen.getByRole('button', { name: /open message templates/i });
        await user.click(button);

        expect(setShowTemplates).toHaveBeenCalledWith(true);
    });

    it('uses template when a template is clicked', async () => {
        const onUseTemplate = vi.fn();
        const props = createBaseProps({ showTemplates: true, onUseTemplate });
        const user = userEvent.setup();

        render(<ChatInputBar {...props} />);

        const templateButton = screen.getByText('Greeting');
        await user.click(templateButton);

        expect(onUseTemplate).toHaveBeenCalledWith('Hello there!');
    });

    it('sends sticker and emoji messages when clicked', async () => {
        const onSendMessage = vi.fn();
        const props = createBaseProps({ onSendMessage, showStickers: true });
        const user = userEvent.setup();

        render(<ChatInputBar {...props} />);

        // Stickers tab is selected by default
        const sticker = screen.getByRole('button', { name: /send dog sticker/i });
        await user.click(sticker);

        expect(onSendMessage).toHaveBeenCalledWith('🐶', 'sticker');

        // Switch to emojis tab
        const emojisTab = screen.getByRole('tab', { name: /reactions/i });
        await user.click(emojisTab);

        const emoji = screen.getByRole('button', { name: /send 👍 emoji/i });
        await user.click(emoji);

        expect(onSendMessage).toHaveBeenCalledWith('👍', 'text');
    });

    it('shows voice recorder when recording and wires callbacks', async () => {
        const onVoiceRecorded = vi.fn();
        const onVoiceCancel = vi.fn();
        const props = createBaseProps({
            isRecording: true,
            onVoiceRecorded,
            onVoiceCancel,
        });
        const user = userEvent.setup();

        render(<ChatInputBar {...props} />);

        expect(screen.getByTestId('voice-recorder')).toBeInTheDocument();

        await user.click(screen.getByText('recorded'));
        await user.click(screen.getByText('cancel'));

        expect(onVoiceRecorded).toHaveBeenCalled();
        expect(onVoiceCancel).toHaveBeenCalled();
    });

    it('calls onStartRecording when microphone button is clicked', async () => {
        const onStartRecording = vi.fn();
        const props = createBaseProps({ onStartRecording });
        const user = userEvent.setup();

        render(<ChatInputBar {...props} />);

        const micButton = screen.getByRole('button', { name: /record voice message/i });
        await user.click(micButton);

        expect(onStartRecording).toHaveBeenCalledTimes(1);
    });
});
