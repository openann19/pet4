import type { ChatRoom } from '@/lib/chat-types';
import { useChatWindowState } from './useChatWindowState';
import { useChatMessageSending } from './useChatMessageSending';
import { useChatReactionsAdvanced } from './useChatReactionsAdvanced';
import { useChatTranslation } from './useChatTranslation';
import { useChatScrollFab } from './useChatScrollFab';
import { useChatHeaderButtonAnimations } from './useChatHeaderButtonAnimations';
import { useChatInputAnimations } from './useChatInputAnimations';

interface UseAdvancedChatWindowPropsParams {
  room: ChatRoom;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  onBack?: () => void;
}

/**
 * Hook that combines all chat window logic and returns props for AdvancedChatWindowContent
 */
export function useAdvancedChatWindowProps({
  room,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onBack,
}: UseAdvancedChatWindowPropsParams) {
  // State management
  const state = useChatWindowState({
    room,
    currentUserId,
    currentUserName,
    currentUserAvatar,
  });

  // Wrap setMessages to ensure void return (useStorage returns Promise<void>)
  const setMessagesWrapper: React.Dispatch<React.SetStateAction<typeof state.messages>> = (
    updater: React.SetStateAction<typeof state.messages>
  ): void => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    state.setMessages(updater);
  };

  // Message sending
  const { sendMessage } = useChatMessageSending({
    room,
    currentUserId,
    currentUserName,
    currentUserAvatar,
    setMessages: setMessagesWrapper,
    setInputValue: state.setInputValue,
    setShowStickers: state.setShowStickers,
    setShowTemplates: state.setShowTemplates,
    setConfettiSeed: state.setConfettiSeed,
    typingSend: state.typingSend,
    inputRef: state.inputRef,
  });

  // Reactions
  const { handleReaction } = useChatReactionsAdvanced({
    currentUserId,
    currentUserName,
    currentUserAvatar,
    setMessages: setMessagesWrapper,
    setBurstSeed: state.setBurstSeed,
  });

  // Translation
  const { translateMessage } = useChatTranslation({
    messages: state.messages,
    setMessages: setMessagesWrapper,
  });

  // Scroll FAB
  const { scrollFabVisible, scrollFabStyleValue, scrollToBottom } = useChatScrollFab({
    messages: state.messages,
    scrollRef: state.scrollRef,
    scrollFabVisible: state.scrollFabVisible,
    setScrollFabVisible: state.setScrollFabVisible,
    previousBadgeCount: state.previousBadgeCount,
    typingUsers: state.typingUsers,
  });

  // Header animations
  const headerAnimations = useChatHeaderButtonAnimations(state.typingUsers.length);

  // Input animations
  const inputAnimations = useChatInputAnimations(state.showTemplates);

  // Handler wrappers
  const handleSendMessage = (content: string, type?: 'text' | 'sticker' | 'voice'): void => {
    void sendMessage(content, type ?? 'text');
  };

  const handleInputChange = (v: string): void => {
    state.setInputValue(v);
    state.typingChange(v);
  };

  const handleUseTemplate = (template: string): void => {
    state.setInputValue(template);
  };

  const handleVoiceRecorded = (_audioBlob: Blob, _duration: number, _waveform: number[]): void => {
    state.setIsRecordingVoice(false);
    // Handle voice message
    void sendMessage('Voice message', 'voice');
  };

  const handleVoiceCancel = (): void => {
    state.setIsRecordingVoice(false);
  };

  const handleStartRecording = (): void => {
    state.setIsRecordingVoice(true);
  };

  return {
    room,
    currentUserId,
    currentUserName,
    messages: state.messages,
    typingUsers: state.typingUsers,
    inputValue: state.inputValue,
    inputRef: state.inputRef,
    showTemplates: state.showTemplates,
    showStickers: state.showStickers,
    isRecordingVoice: state.isRecordingVoice,
    scrollFabVisible,
    scrollFabStyleValue,
    lastIncomingText: state.lastIncomingText,
    burstSeed: state.burstSeed,
    confettiSeed: state.confettiSeed,
    scrollRef: state.scrollRef,
    headerAnimations,
    inputAnimations,
    onBack,
    onSendMessage: handleSendMessage,
    onReaction: (messageId: string, emoji: string): void => {
      void handleReaction(messageId, emoji);
    },
    onTranslate: async (messageId: string): Promise<void> => {
      await translateMessage(messageId);
    },
    onInputChange: handleInputChange,
    onUseTemplate: handleUseTemplate,
    onVoiceRecorded: handleVoiceRecorded,
    onVoiceCancel: handleVoiceCancel,
    onStartRecording: handleStartRecording,
    setShowTemplates: state.setShowTemplates,
    setShowStickers: state.setShowStickers,
    scrollToBottom,
  };
}

