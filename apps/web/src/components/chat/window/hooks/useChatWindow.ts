import { useEffect, useState } from 'react';
import { useTypingManager } from '@/hooks/use-typing-manager';
import { useCall } from '@/hooks/useCall';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useVoiceMessages } from '@/hooks/api/use-chat';
import { useFeatureFlag } from '@/lib/feature-flags';
import { realtime } from '@/lib/realtime';
import { useChatHeaderAnimations } from '@/components/chat/window/hooks/useChatAnimations';
import { useTypingIndicatorAnimations } from '@/components/chat/window/hooks/useChatAnimations';
import { useTemplatesPanelAnimations } from '@/components/chat/window/hooks/useChatAnimations';
import { useButtonAnimations } from '@/components/chat/window/hooks/useChatAnimations';
import { useChatVoicePlayback } from '@/components/chat/window/hooks/useChatVoicePlayback';
import { useChatCallHandlers } from '@/components/chat/window/hooks/useChatCallHandlers';
import { useChatInput } from '@/components/chat/window/hooks/useChatInput';
import { useChatReactions } from '@/components/chat/window/hooks/useChatReactions';
import { useChatEffects } from '@/components/chat/window/hooks/useChatEffects';
import { useChatAnnouncements } from '@/components/chat/window/hooks/useChatAnnouncements';
import { useChatKeyboard } from '@/components/chat/window/hooks/useChatKeyboard';
import type { ChatRoom } from '@/lib/chat-types';

interface UseChatWindowProps {
  room: ChatRoom;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
}

/**
 * Main hook that combines all chat window logic
 */
export function useChatWindow({
  room,
  currentUserId,
  currentUserName,
  currentUserAvatar,
}: UseChatWindowProps) {
  const useVirtualizedList = useFeatureFlag('chat.virtualization');
  const {
    messages,
    messageGroups: chatMessageGroups,
    sendMessage: sendChatMessage,
    addReaction: addChatReaction,
    markAsRead: markChatAsRead,
    setMessages,
  } = useChatMessages({
    roomId: room.id,
    currentUserId,
    currentUserName,
    ...(currentUserAvatar !== undefined ? { currentUserAvatar } : {}),
  });
  const { voiceMessages, setVoiceMessage } = useVoiceMessages(room.id);
  const [isRecording, setIsRecording] = useState(false);

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

  const { headerStyle } = useChatHeaderAnimations();
  const { typingContainerStyle, typingTextStyle, typingDotsStyle } =
    useTypingIndicatorAnimations(typingUsers.length);

  const {
    messageBubbleHover,
    messageBubbleHoverStyle,
    voiceButtonHover,
    voiceButtonHoverStyle,
    voiceButtonTapStyle,
    templateButtonHover,
    templateButtonHoverStyle,
    templateButtonTap,
    templateButtonTapStyle,
    stickerButtonHover,
    stickerButtonHoverStyle,
    stickerButtonTapStyle,
    emojiButtonHover,
    emojiButtonHoverStyle,
    emojiButtonTapStyle,
    sendButtonHover,
    sendButtonHoverStyle,
    sendButtonTapStyle,
    videoButtonHover,
  } = useButtonAnimations();

  const inputHook = useChatInput({
    sendChatMessage,
    handleTypingMessageSend,
  });

  const { showReactions, setShowReactions, handleReaction } = useChatReactions({
    addChatReaction,
  });

  const { playingVoice, handleVoiceRecorded, handleVoiceCancel, toggleVoicePlayback } =
    useChatVoicePlayback({
      roomId: room.id,
      currentUserId,
      currentUserName,
      currentUserAvatar,
      voiceMessages,
      setVoiceMessage,
      setMessages,
      setIsRecording,
    });

  const { templatesStyle } = useTemplatesPanelAnimations(inputHook.showTemplates);

  const {
    activeCall,
    incomingCall,
    initiateCall,
    answerCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCall(room.id, currentUserId, currentUserName, currentUserAvatar);

  const { handleVoiceCall, handleVideoCall } = useChatCallHandlers({
    room,
    initiateCall,
  });

  const { scrollToBottom, dateGroupStyle, messageItemStyle, typingIndicatorStyle } = useChatEffects(
    messages,
    room.id,
    markChatAsRead
  );

  useChatKeyboard(
    inputHook.showStickers,
    inputHook.showTemplates,
    showReactions,
    inputHook.setShowStickers,
    inputHook.setShowTemplates,
    setShowReactions
  );

  useEffect(() => {
    if (typingUsers.length > 0) {
      scrollToBottom();
    }
  }, [typingUsers, scrollToBottom]);

  const handleInputChange = (value: string) => {
    inputHook.handleInputChange(value);
    handleTypingInputChange(value);
  };

  const messageGroups = chatMessageGroups;

  const { lastMessageText, lastMessageSender, typingUser, multipleTypingUsers } =
    useChatAnnouncements(messages, typingUsers, currentUserId);

  return {
    useVirtualizedList,
    messages,
    messageGroups,
    voiceMessages,
    playingVoice,
    isRecording,
    setIsRecording,
    typingUsers,
    headerStyle,
    typingContainerStyle,
    typingTextStyle,
    typingDotsStyle,
    messageBubbleHover,
    messageBubbleHoverStyle,
    voiceButtonHover,
    voiceButtonHoverStyle,
    voiceButtonTapStyle,
    templateButtonHover,
    templateButtonHoverStyle,
    templateButtonTap,
    templateButtonTapStyle,
    stickerButtonHover,
    stickerButtonHoverStyle,
    stickerButtonTapStyle,
    emojiButtonHover,
    emojiButtonHoverStyle,
    emojiButtonTapStyle,
    sendButtonHover,
    sendButtonHoverStyle,
    sendButtonTapStyle,
    videoButtonHover,
    inputHook,
    handleInputChange,
    handleReaction,
    handleVoiceRecorded,
    handleVoiceCancel,
    toggleVoicePlayback,
    templatesStyle,
    activeCall,
    incomingCall,
    answerCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    handleVoiceCall,
    handleVideoCall,
    dateGroupStyle,
    messageItemStyle,
    typingIndicatorStyle,
    lastMessageText,
    lastMessageSender,
    typingUser,
    multipleTypingUsers,
  };
}

