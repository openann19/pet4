import { useEffect, useRef, useState } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { useTypingManager } from '@/hooks/use-typing-manager';
import { realtime } from '@/lib/realtime';
import type { ChatMessage, ChatRoom } from '@/lib/chat-types';
import type { InputRef } from '@/components/ui/input';

interface UseChatWindowStateProps {
  room: ChatRoom;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
}

/**
 * Hook for managing chat window state (messages, input, UI state)
 */
export function useChatWindowState({
  room,
  currentUserId,
  currentUserName,
  currentUserAvatar: _currentUserAvatar,
}: UseChatWindowStateProps) {
  const [messages, setMessages] = useStorage<ChatMessage[]>(`chat-messages-${room.id}`, []);
  const [inputValue, setInputValue] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [scrollFabVisible, setScrollFabVisible] = useState(false);
  const [previousBadgeCount, setPreviousBadgeCount] = useState(0);
  const [burstSeed, setBurstSeed] = useState(0);
  const [confettiSeed, setConfettiSeed] = useState(0);
  const [lastIncomingText, setLastIncomingText] = useState<string | null>(null);
  const inputRef = useRef<InputRef>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    typingUsers,
    handleInputChange: typingChange,
    handleMessageSend: typingSend,
  } = useTypingManager({
    roomId: room.id,
    currentUserId,
    currentUserName,
    realtimeClient: realtime,
  });

  // Track last incoming message text for announcements
  useEffect(() => {
    const lastMsg = messages?.[messages.length - 1];
    if (lastMsg && lastMsg.senderId !== currentUserId && lastMsg.content) {
      setLastIncomingText(lastMsg.content);
    }
  }, [messages, currentUserId]);

  // Track badge count for scroll FAB
  useEffect(() => {
    const c = messages?.length ?? 0;
    if (c > previousBadgeCount) {
      setPreviousBadgeCount(previousBadgeCount);
    }
  }, [messages, previousBadgeCount]);

  return {
    messages,
    setMessages,
    inputValue,
    setInputValue,
    showStickers,
    setShowStickers,
    showTemplates,
    setShowTemplates,
    isRecordingVoice,
    setIsRecordingVoice,
    scrollFabVisible,
    setScrollFabVisible,
    previousBadgeCount,
    setPreviousBadgeCount,
    burstSeed,
    setBurstSeed,
    confettiSeed,
    setConfettiSeed,
    lastIncomingText,
    inputRef,
    scrollRef,
    typingUsers,
    typingChange,
    typingSend,
  };
}

