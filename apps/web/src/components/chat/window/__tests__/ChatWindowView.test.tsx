import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ChatRoom, ChatMessage } from '../../../../lib/chat-types';
import type { AnimatedStyle } from '@petspark/motion';
import type { InputRef } from '../../../ui/input';
import { ChatWindowView } from '../ChatWindowView';

const renderSpy = vi.fn<(props: Record<string, unknown>) => void>();

vi.mock('../ChatWindowContent', () => ({
    ChatWindowContent: (props: Record<string, unknown>) => {
        renderSpy(props);
        return <div data-testid="chat-window-content" />;
    },
}));

function createAnimatedStyleStub(): AnimatedStyle {
    return {} as AnimatedStyle;
}

describe('ChatWindowView', () => {
    it('renders ChatWindowContent with mapped props and live regions', () => {
        const room: ChatRoom = {
            id: 'room-1',
            participantIds: [],
            type: 'direct',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const currentUserId = 'user-1';
        const currentUserName = 'Alice';

        const inputElement = document.createElement('input') as InputRef;
        const inputRef = { current: inputElement } as React.RefObject<InputRef>;

        const headerStyle = createAnimatedStyleStub();
        const typingContainerStyle = createAnimatedStyleStub();
        const typingTextStyle = createAnimatedStyleStub();
        const typingDotsStyle = createAnimatedStyleStub();

        const chatWindowData = {
            lastMessageText: 'Hello there',
            lastMessageSender: 'Bob',
            typingUser: 'Carol',
            multipleTypingUsers: false,
            typingUsers: [{ userId: 'u2', userName: 'Carol' }],
            messages: [{
                id: 'm1',
                roomId: room.id,
                senderId: 'u2',
                senderName: 'Carol',
                content: 'Hello there',
                type: 'text',
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                status: 'sent',
                reactions: [],
            } satisfies ChatMessage],
            messageGroups: [{ date: '2025-01-01', messages: [] }],
            voiceMessages: undefined,
            playingVoice: null,
            useVirtualizedList: false,
            isRecording: false,
            setIsRecording: vi.fn(),
            headerStyle,
            typingContainerStyle,
            typingTextStyle,
            typingDotsStyle,
            videoButtonHover: {
                scale: 1,
                translateY: 0,
                handleEnter: vi.fn(),
                handleLeave: vi.fn(),
            },
            voiceButtonHover: {
                scale: 1,
                translateY: 0,
                handleEnter: vi.fn(),
                handleLeave: vi.fn(),
            },
            messageBubbleHover: {
                handleEnter: vi.fn(),
                handleLeave: vi.fn(),
            },
            messageBubbleHoverStyle: createAnimatedStyleStub(),
            voiceButtonHoverStyle: createAnimatedStyleStub(),
            voiceButtonTapStyle: createAnimatedStyleStub(),
            dateGroupStyle: createAnimatedStyleStub(),
            messageItemStyle: createAnimatedStyleStub(),
            typingIndicatorStyle: createAnimatedStyleStub(),
            templatesStyle: createAnimatedStyleStub(),
            templateButtonHoverStyle: createAnimatedStyleStub(),
            templateButtonHover: {
                handleEnter: vi.fn(),
                handleLeave: vi.fn(),
            },
            templateButtonTapStyle: createAnimatedStyleStub(),
            templateButtonTap: {
                handlePress: vi.fn(),
            },
            stickerButtonTapStyle: createAnimatedStyleStub(),
            stickerButtonHoverStyle: createAnimatedStyleStub(),
            stickerButtonHover: {
                handleEnter: vi.fn(),
                handleLeave: vi.fn(),
            },
            emojiButtonTapStyle: createAnimatedStyleStub(),
            emojiButtonHoverStyle: createAnimatedStyleStub(),
            emojiButtonHover: {
                handleEnter: vi.fn(),
                handleLeave: vi.fn(),
            },
            sendButtonHoverStyle: createAnimatedStyleStub(),
            sendButtonHover: {
                handleEnter: vi.fn(),
                handleLeave: vi.fn(),
            },
            sendButtonTapStyle: createAnimatedStyleStub(),
            inputHook: {
                inputValue: 'Hello there',
                inputRef,
                showTemplates: false,
                showStickers: false,
                setShowTemplates: vi.fn(),
                setShowStickers: vi.fn(),
                handleSendMessage: vi.fn(),
                handleUseTemplate: vi.fn(),
            },
            handleInputChange: vi.fn(),
            handleVoiceRecorded: vi.fn(),
            handleVoiceCancel: vi.fn(),
            toggleVoicePlayback: vi.fn(),
            handleReaction: vi.fn(),
            handleVoiceCall: vi.fn(),
            handleVideoCall: vi.fn(),
            activeCall: null,
            incomingCall: null,
            answerCall: vi.fn(),
            declineCall: vi.fn(),
            endCall: vi.fn(),
            toggleMute: vi.fn(),
            toggleVideo: vi.fn(),
        };

        render(
            <ChatWindowView
                room={room}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                onBack={vi.fn()}
                chatWindowData={chatWindowData}
            />
        );

        // Live regions should be rendered
        expect(
            screen.getByRole('status', { name: /new message announcement/i })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('status', { name: /typing indicator announcement/i })
        ).toBeInTheDocument();

        // ChatWindowContent mock should have been rendered
        expect(screen.getByTestId('chat-window-content')).toBeInTheDocument();

        expect(renderSpy).toHaveBeenCalledTimes(1);
        const props = renderSpy.mock.calls[0][0];

        expect(props.room).toBe(room);
        expect(props.currentUserId).toBe(currentUserId);
        expect(props.currentUserName).toBe(currentUserName);
        expect(props.typingUsers).toEqual(chatWindowData.typingUsers);
        expect(props.messageGroups).toEqual(chatWindowData.messageGroups);
        expect(props.useVirtualizedList).toBe(chatWindowData.useVirtualizedList);
    });
});
