import { useTypingManager } from '@/hooks/use-typing-manager';
import { useStorage } from '@/hooks/use-storage';
import { blockService } from '@/lib/block-service';
import type { ChatRoom } from '@/lib/chat-types';
import { groupMessagesByDate } from '@/lib/chat-utils';
import { createLogger } from '@/lib/logger';
import { realtime } from '@/lib/realtime';
import { toast } from 'sonner';
import { AnimatePresence } from '@/effects/reanimated/animate-presence';
import { useCallback, useEffect, useState } from 'react';
import { useScrollFabMagnetic } from '@/effects/chat/ui/use-scroll-fab-magnetic';
import { useMessageManagement } from '@/components/chat/features/message-management';
import { useInputHandling } from '@/components/chat/features/input-handling';
import { useReactions } from '@/components/chat/features/reactions';
import { useMedia } from '@/components/chat/features/media';
import SmartSuggestionsPanel from './SmartSuggestionsPanel';
import { ConfettiBurst } from './ConfettiBurst';
import { ReactionBurstParticles } from './ReactionBurstParticles';
import { ChatHeader } from './components/ChatHeader';
import { ChatFooter } from './components/ChatFooter';
import { MessageItem } from './components/MessageItem';
import { DateGroup } from './components/DateGroup';
import { ScrollToBottomFAB } from './components/ScrollToBottomFAB';
import { TypingIndicator } from './components/TypingIndicator';
import { useChatKeyboardShortcuts } from '@/hooks/chat/use-chat-keyboard-shortcuts';
const logger = createLogger('AdvancedChatWindow');

interface AdvancedChatWindowProps {
  room: ChatRoom;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  onBack?: () => void;
}

export default function AdvancedChatWindow({
  room,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onBack,
}: AdvancedChatWindowProps) {
  // Message management hook
  const messageManagement = useMessageManagement({
    room,
    currentUserId,
    currentUserName,
    currentUserAvatar: currentUserAvatar ?? null,
  });

  // Input handling hook
  const inputHandling = useInputHandling({
    onSendMessage: async (content, type) => {
      await messageManagement.sendMessage(content, type);
      if (type === 'sticker') {
        setConfettiSeed((s) => s + 1);
      }
    },
  });

  // Reactions hook
  const reactions = useReactions({
    currentUserId,
    currentUserName,
    currentUserAvatar: currentUserAvatar ?? null,
    messages: messageManagement.messages,
    setMessages: messageManagement.setMessages,
  });

  // Media hook
  const media = useMedia({
    onSendMessage: messageManagement.sendMessage,
    messages: messageManagement.messages,
    updateMessage: messageManagement.updateMessage,
  });

  const [showSmartSuggestions, setShowSmartSuggestions] = useState(true);
  const [awayMode, setAwayMode] = useStorage<boolean>(`away-mode-${currentUserId}`, false);
  const [scrollFabVisible, setScrollFabVisible] = useState(false);
  const [previousBadgeCount, setPreviousBadgeCount] = useState(0);

  const [burstSeed, setBurstSeed] = useState(0);
  const [confettiSeed, setConfettiSeed] = useState(0);

  // Scroll FAB magnetic effect
  const scrollFab = useScrollFabMagnetic({
    enabled: true,
    isVisible: scrollFabVisible,
    badgeCount: messageManagement.messages.length,
    previousBadgeCount,
  });

  const {
    typingUsers,
    handleInputChange: handleTypingInputChange,
    handleMessageSend: handleTypingMessageSend,
  } = useTypingManager({
    roomId: room.id,
    currentUserId,
    currentUserName,
    realtimeClient: realtime,
  });

  useEffect(() => {
    messageManagement.scrollToBottom();
  }, [messageManagement]);

  useEffect(() => {
    const currentCount = messageManagement.messages.length;
    if (currentCount > previousBadgeCount) {
      setPreviousBadgeCount(previousBadgeCount);
    }
  }, [messageManagement.messages, previousBadgeCount]);

  useEffect(() => {
    if (typingUsers.length > 0) {
      messageManagement.scrollToBottom();
    }
  }, [typingUsers, messageManagement]);

  useEffect(() => {
    const handleScroll = () => {
      if (messageManagement.scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messageManagement.scrollRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setScrollFabVisible(!isNearBottom);
      }
    };

    const scrollElement = messageManagement.scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
      };
    }
    return undefined;
  }, [messageManagement.messages, messageManagement]);

  // Handle reaction with burst effect
  const handleReactionWithBurst = useCallback(
    (messageId: string, emoji: string): void => {
      reactions.handleReaction(messageId, emoji);
      setBurstSeed((s) => s + 1);
    },
    [reactions]
  );

  // Handle message translation
  const handleTranslateMessage = useCallback(
    async (messageId: string): Promise<void> => {
      await media.handleTranslateMessage(messageId);
    },
    [media]
  );

  // Handle input change with typing indicator
  const handleInputChangeWithTyping = useCallback(
    (value: string): void => {
      inputHandling.handleInputChange(value);
      handleTypingInputChange(value);
    },
    [inputHandling, handleTypingInputChange]
  );

  // Handle send with typing indicator
  const handleSendWithTyping = useCallback(
    async (content: string, type?: 'text' | 'sticker'): Promise<void> => {
      if (!content.trim() && type === 'text') return;
      await inputHandling.handleSuggestionSelect({
        id: `suggestion-${Date.now()}`,
        text: content,
        category: 'suggestion',
      });
      handleTypingMessageSend();
      setTimeout(() => {
        setShowSmartSuggestions(true);
      }, 2000);
    },
    [inputHandling, handleTypingMessageSend]
  );

  const messageGroups = groupMessagesByDate(messageManagement.messages);

  // Register keyboard shortcuts for chat actions
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
  const focusedMessage = focusedMessageId
    ? messageManagement.messages.find((m) => m.id === focusedMessageId)
    : null;

  useChatKeyboardShortcuts({
    enabled: true,
    context: 'chat',
    onSend: () => {
      if (inputHandling.inputValue.trim()) {
        void handleSendWithTyping(inputHandling.inputValue, 'text');
      }
    },
    onReply: focusedMessage
      ? () => {
        inputHandling.inputRef.current?.focus();
        inputHandling.handleInputChange(`@${focusedMessage.senderName ?? 'User'} `);
      }
      : undefined,
    onDelete: focusedMessage
      ? () => {
        messageManagement.setMessages((cur) => cur.filter((m) => m.id !== focusedMessageId));
      }
      : undefined,
    onReact: focusedMessage
      ? () => {
        handleReactionWithBurst(focusedMessage.id, '❤️');
      }
      : undefined,
    onScrollToBottom: () => {
      messageManagement.scrollToBottom();
    },
    onFocusInput: () => {
      inputHandling.inputRef.current?.focus();
    },
    onClose: onBack,
    inputRef: inputHandling.inputRef,
    messageFocused: focusedMessageId !== null,
  });

  const handleBlockUser = useCallback(async () => {
    if (!room || !currentUserId) return;

    try {
      const otherUserId = room.participantIds.find((id) => id !== currentUserId);
      if (!otherUserId) return;

      // Show confirmation dialog
      const confirmed = window.confirm(
        'Are you sure you want to block this user? You will no longer see their messages or matches.'
      );

      if (confirmed) {
        await blockService.blockUser(currentUserId, otherUserId, 'harassment');
        toast.success('User blocked successfully');
        // Close chat or navigate away
        onBack?.();
      }
    } catch (error) {
      toast.error('Failed to block user');
      logger.error('Failed to block user', error);
    }
  }, [room, currentUserId, onBack]);

  return (
    <div className="flex flex-col h-full relative">
      <ChatHeader
        room={room}
        typingUsers={typingUsers}
        awayMode={awayMode}
        {...(onBack && { onBack })}
        onToggleAwayMode={() => setAwayMode((prev) => !prev)}
        onBlockUser={handleBlockUser}
      />

      <div ref={messageManagement.scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {messageGroups.map((group, groupIdx) => (
          <div key={group.date} className="space-y-4">
            <DateGroup date={group.date} delay={groupIdx * 100} />

            {group.messages.map((message, msgIdx) => {
              const isCurrentUser = message.senderId === currentUserId;

              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  isCurrentUser={isCurrentUser}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  delay={msgIdx * 50}
                  onReaction={handleReactionWithBurst}
                  onTranslate={handleTranslateMessage}
                />
              );
            })}
          </div>
        ))}

        {typingUsers.length > 0 && (
          <AnimatePresence>
            <TypingIndicator key="typing-indicators" users={typingUsers} />
          </AnimatePresence>
        )}

        {/* Overlays — reaction ring + confetti (mounted once, restart via seed) */}
        {/* Only render when seeds > 0 to avoid initial mount animations */}
        {burstSeed > 0 && (
          <ReactionBurstParticles
            key={`burst-${String(burstSeed ?? '')}`}
            enabled={true}
            seed={`reaction-${String(room.id ?? '')}-${String(burstSeed ?? '')}`}
            className="pointer-events-none fixed inset-0 z-50"
            onComplete={() => {
              // Effect completed, can reset seed after delay if needed
            }}
          />
        )}
        {confettiSeed > 0 && (
          <ConfettiBurst
            key={`confetti-${String(confettiSeed ?? '')}`}
            enabled={true}
            seed={`confetti-${String(room.id ?? '')}-${String(confettiSeed ?? '')}`}
            className="pointer-events-none fixed inset-0 z-50"
            onComplete={() => {
              // Effect completed, can reset seed after delay if needed
            }}
          />
        )}
      </div>

      <ScrollToBottomFAB
        isVisible={scrollFabVisible}
        badgeCount={
          messageManagement.messages.length > previousBadgeCount
            ? messageManagement.messages.length - previousBadgeCount
            : 0
        }
        animatedStyle={scrollFab.animatedStyle}
        badgeAnimatedStyle={scrollFab.badgeAnimatedStyle}
        onClick={() => {
          messageManagement.scrollToBottom();
          setScrollFabVisible(false);
        }}
      />

      {showSmartSuggestions && messageManagement.messages.length >= 0 && (
        <SmartSuggestionsPanel
          onSelect={inputHandling.handleSuggestionSelect}
          onDismiss={() => { setShowSmartSuggestions(false); }}
        />
      )}

      <ChatFooter
        inputValue={inputHandling.inputValue}
        inputRef={inputHandling.inputRef}
        showTemplates={inputHandling.showTemplates}
        showStickers={inputHandling.showStickers}
        isRecordingVoice={media.isRecordingVoice}
        onInputChange={handleInputChangeWithTyping}
        onInputKeyDown={inputHandling.handleKeyDown}
        onSend={() => handleSendWithTyping(inputHandling.inputValue, 'text')}
        onStickerSelect={inputHandling.handleStickerSelect}
        onTemplateSelect={(template) => {
          if (
            'id' in template &&
            template.id &&
            typeof template.id === 'string' &&
            'category' in template
          ) {
            const category = template.category as 'greeting' | 'playdate' | 'followup' | 'closing';
            if (category && ['greeting', 'playdate', 'followup', 'closing'].includes(category)) {
              inputHandling.handleTemplateSelect({
                id: template.id,
                text: template.text,
                category,
                ...(template.title && { title: template.title }),
                ...(template.icon && { icon: template.icon }),
              });
            } else {
              inputHandling.handleSuggestionSelect({
                id: `template-${String(Date.now() ?? '')}`,
                text: template.text,
                category: 'suggestion',
              });
            }
          } else {
            inputHandling.handleSuggestionSelect({
              id: `template-${String(Date.now() ?? '')}`,
              text: template.text,
              category: 'suggestion',
            });
          }
        }}
        onShareLocation={media.handleShareLocation}
        onStartRecording={() => media.setIsRecordingVoice(true)}
        onVoiceRecorded={media.handleVoiceRecorded}
        onCancelRecording={() => media.setIsRecordingVoice(false)}
        setShowTemplates={inputHandling.setShowTemplates}
        setShowStickers={inputHandling.setShowStickers}
      />
    </div>
  );
}
