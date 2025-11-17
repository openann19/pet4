import { useEffect } from 'react';
import { useScrollFabMagnetic } from '@/effects/chat/ui/use-scroll-fab-magnetic';
import { useAnimatedStyleValue } from '@/effects/reanimated/animated-view';
import type { ChatMessage } from '@/lib/chat-types';

interface UseChatScrollFabProps {
  messages: ChatMessage[] | undefined;
  scrollRef: React.RefObject<HTMLDivElement>;
  scrollFabVisible: boolean;
  setScrollFabVisible: (visible: boolean) => void;
  previousBadgeCount: number;
  typingUsers: { userName?: string }[];
}

/**
 * Hook for managing scroll FAB visibility and animation
 */
export function useChatScrollFab({
  messages,
  scrollRef,
  scrollFabVisible,
  setScrollFabVisible,
  previousBadgeCount,
  typingUsers,
}: UseChatScrollFabProps) {
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, scrollRef]);

  // Auto-scroll when typing users appear
  useEffect(() => {
    if (typingUsers.length > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [typingUsers, scrollRef]);

  // Track scroll position to show/hide FAB
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const nearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setScrollFabVisible(!nearBottom);
    };

    el.addEventListener('scroll', onScroll);
    onScroll();

    return () => {
      el.removeEventListener('scroll', onScroll);
    };
  }, [messages, scrollRef, setScrollFabVisible]);

  const scrollFab = useScrollFabMagnetic({
    enabled: true,
    isVisible: scrollFabVisible,
    badgeCount: messages?.length ?? 0,
    previousBadgeCount,
  });
  const scrollFabStyleValue = useAnimatedStyleValue(scrollFab.animatedStyle);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  return {
    scrollFabVisible,
    scrollFabStyleValue,
    scrollToBottom,
  };
}

