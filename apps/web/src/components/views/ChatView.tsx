'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import ChatRoomsList from '@/components/ChatRoomsList';
import ChatWindow from '@/components/ChatWindowNew';
import { ChatErrorBoundary } from '@/components/chat/window/ChatErrorBoundary';
import { useApp } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useStorage } from '@/hooks/use-storage';
import { getRoomMessages } from '@/lib/chat-service';
import type { ChatRoom } from '@/lib/chat-types';
import { createChatRoom } from '@/lib/chat-utils';
import { createLogger } from '@/lib/logger';
import type { Match, Pet } from '@/lib/types';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { usePageTransition } from '@/effects/reanimated/use-page-transition';
import { timingConfigs } from '@/effects/reanimated/transitions';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';

const logger = createLogger('ChatView');

export default function ChatView() {
  const { t } = useApp();
  const [matches] = useStorage<Match[]>('matches', []);
  const [allPets] = useStorage<Pet[]>('all-pets', []);
  const [userPets] = useStorage<Pet[]>('user-pets', []);
  const [chatRooms, setChatRooms] = useStorage<ChatRoom[]>('chat-rooms', []);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  const userPet = Array.isArray(userPets) && userPets.length > 0 ? userPets[0] : undefined;

  const headerAnimation = usePageTransition({
    isVisible: !isLoading,
    direction: 'down',
    duration: 300,
  });

  const emptyStateAnimation = usePageTransition({
    isVisible: !userPet,
    direction: 'up',
    duration: 300,
  });

  const roomsListAnimation = usePageTransition({
    isVisible: !isMobile || !selectedRoom,
    direction: 'fade',
    duration: 250,
  });

  const chatWindowAnimation = usePageTransition({
    isVisible: Boolean(selectedRoom && (!isMobile || selectedRoom)),
    direction: 'fade',
    duration: 250,
  });

  const emptyChatAnimation = usePageTransition({
    isVisible: !selectedRoom && !isMobile,
    direction: 'fade',
    duration: 300,
  });

  const emptyChatIconScale = useSharedValue(1);
  const emptyChatIconRotation = useSharedValue(0);

  useEffect(() => {
    if (userPets !== undefined && chatRooms !== undefined) {
      setIsLoading(false);
    }
  }, [userPets, chatRooms]);

  useEffect(() => {
    if (!userPet || !Array.isArray(matches)) return;

    const activeMatches = matches.filter((m) => m.status === 'active');
    const existingRoomIds = new Set(
      Array.isArray(chatRooms) ? chatRooms.map((r) => r.matchId) : []
    );

    const newRooms: ChatRoom[] = [];

    activeMatches.forEach((match) => {
      if (!existingRoomIds.has(match.id)) {
        const matchedPet = Array.isArray(allPets)
          ? allPets.find((p) => p.id === match.matchedPetId)
          : undefined;
        if (matchedPet && userPet) {
          newRooms.push(
            createChatRoom(
              match.id,
              match.petId,
              match.matchedPetId,
              userPet.name,
              matchedPet.name,
              userPet.photo,
              matchedPet.photo
            )
          );
        }
      }
    });

    if (newRooms.length > 0) {
      setChatRooms((current) => (Array.isArray(current) ? [...current, ...newRooms] : newRooms));
    }
  }, [matches, userPet, allPets, chatRooms, setChatRooms]);

  useEffect(() => {
    const updateRoomsWithLastMessages = async () => {
      if (!Array.isArray(chatRooms)) return;

      const updatedRooms = await Promise.all(
        chatRooms.map(async (room) => {
          try {
            const result = await getRoomMessages(room.id);
            const messages = result.messages;
            if (Array.isArray(messages) && messages.length > 0) {
              const lastMessage = messages[messages.length - 1];
              const unreadCount = messages.filter(
                (m) => m.status !== 'read' && m.senderId !== userPet?.id
              ).length;

              return {
                ...room,
                ...(lastMessage && { lastMessage }),
                ...(unreadCount !== undefined && { unreadCount }),
                updatedAt: lastMessage?.timestamp ?? room.updatedAt,
              };
            }
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Error loading messages', err);
          }
          return room;
        })
      );

      setChatRooms(() => {
        const sorted = updatedRooms.sort((a, b) => {
          const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return bTime - aTime;
        });
        return sorted;
      });
    };

    void updateRoomsWithLastMessages();
  }, [selectedRoom, chatRooms, userPet, setChatRooms]);

  useEffect(() => {
    if (!selectedRoom && !isMobile) {
      emptyChatIconScale.value = withRepeat(
        withSequence(withTiming(1.1, timingConfigs.smooth), withTiming(1, timingConfigs.smooth)),
        -1,
        true
      );
      emptyChatIconRotation.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 500 }),
          withTiming(-5, { duration: 500 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        false
      );
    } else {
      emptyChatIconScale.value = 1;
      emptyChatIconRotation.value = 0;
    }
  }, [selectedRoom, isMobile, emptyChatIconScale, emptyChatIconRotation]);

  const handleSelectRoom = useCallback((room: ChatRoom) => {
    setSelectedRoom(room);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedRoom(null);
  }, []);

  const emptyChatIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: emptyChatIconScale.value },
        { rotate: `${emptyChatIconRotation.value}deg` },
      ],
    };
  }) as AnimatedStyle;

  if (isLoading) {
    return null;
  }

  if (!userPet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AnimatedView
          style={emptyStateAnimation.style}
          className="glass-strong p-8 rounded-3xl max-w-md"
        >
          <h2 className="text-2xl font-bold mb-2">{t.chat.createProfile}</h2>
          <p className="text-muted-foreground">{t.chat.createProfileDesc}</p>
        </AnimatedView>
      </div>
    );
  }

  const showChatWindow = selectedRoom && (!isMobile || selectedRoom);
  const showRoomsList = !isMobile || !selectedRoom;

  return (
    <PageTransitionWrapper key="chat-view" direction="up">
      <div className="h-[calc(100vh-8rem)]">
        <AnimatedView style={headerAnimation.style} className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{t.chat.title}</h2>
          <p className="text-muted-foreground">
            {(chatRooms || []).length}{' '}
            {(chatRooms || []).length === 1 ? t.chat.subtitle : t.chat.subtitlePlural}
          </p>
        </AnimatedView>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100%-5rem)]">
          {showRoomsList && (
            <AnimatedView
              style={roomsListAnimation.style}
              className="md:col-span-4 glass-strong rounded-3xl p-4 shadow-xl backdrop-blur-2xl border border-white/20 overflow-hidden"
            >
              <ChatRoomsList
                rooms={chatRooms || []}
                onSelectRoom={handleSelectRoom}
                {...(selectedRoom?.id && { selectedRoomId: selectedRoom.id })}
              />
            </AnimatedView>
          )}

          {showChatWindow && selectedRoom && (
            <AnimatedView
              style={chatWindowAnimation.style}
              className={`${
                isMobile ? 'col-span-1' : 'md:col-span-8'
              } glass-strong rounded-3xl shadow-xl backdrop-blur-2xl border border-white/20 overflow-hidden flex flex-col`}
            >
              <ChatErrorBoundary>
                <ChatWindow
                  room={selectedRoom}
                  currentUserId={userPet.id}
                  currentUserName={userPet.name}
                  currentUserAvatar={userPet.photo}
                  {...(isMobile && { onBack: handleBack })}
                />
              </ChatErrorBoundary>
            </AnimatedView>
          )}

          {!selectedRoom && !isMobile && (
            <AnimatedView
              style={emptyChatAnimation.style}
              className="md:col-span-8 glass-effect rounded-3xl flex items-center justify-center border border-white/20"
            >
              <div className="text-center px-4">
                <AnimatedView style={emptyChatIconStyle} className="text-6xl mb-4">
                  💬
                </AnimatedView>
                <h3 className="text-xl font-semibold mb-2">{t.chat.selectConversation}</h3>
                <p className="text-muted-foreground">{t.chat.selectConversationDesc}</p>
              </div>
            </AnimatedView>
          )}
        </div>
      </div>
    </PageTransitionWrapper>
  );
}
