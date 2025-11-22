'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { getRoomMessages } from '@/lib/chat-service';
import type { ChatRoom } from '@/lib/chat-types';
import { createChatRoom } from '@/lib/chat-utils';
import { createLogger } from '@/lib/logger';
import type { Match, Pet } from '@/lib/types';
import { safeArrayAccess } from '@/lib/runtime-safety';

const logger = createLogger('useChatRooms');

interface UseChatRoomsReturn {
  chatRooms: ChatRoom[];
  isLoading: boolean;
  userPet: Pet | undefined;
  selectedRoom: ChatRoom | null;
  handleSelectRoom: (room: ChatRoom) => void;
  handleBack: () => void;
}

export function useChatRooms(): UseChatRoomsReturn {
  const [matches] = useStorage<Match[]>('matches', []);
  const [allPets] = useStorage<Pet[]>('all-pets', []);
  const [userPets] = useStorage<Pet[]>('user-pets', []);
  const [chatRooms, setChatRooms] = useStorage<ChatRoom[]>('chat-rooms', []);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userPet = safeArrayAccess(userPets, 0);

  const handleSelectRoom = useCallback((room: ChatRoom) => {
    setSelectedRoom(room);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedRoom(null);
  }, []);

  useEffect(() => {
    if (userPets !== undefined && chatRooms !== undefined) {
      setIsLoading(false);
    }
  }, [userPets, chatRooms]);

  useEffect(() => {
    if (!userPet || !Array.isArray(matches) || !Array.isArray(chatRooms)) return;

    const activeMatches = matches.filter((m) => m.status === 'active');
    const existingRoomIds = new Set(chatRooms.map((r) => r.matchId));

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
      void setChatRooms((current) => [...(current ?? []), ...newRooms]);
    }
  }, [matches, userPet, allPets, chatRooms, setChatRooms]);

  useEffect(() => {
    const updateRoomsWithLastMessages = async () => {
      if (!Array.isArray(chatRooms) || !userPet) return;

      const updatedRooms = await Promise.all(
        chatRooms.map(async (room) => {
          try {
            const result = await getRoomMessages(room.id);
            const messages = result.messages;
            if (Array.isArray(messages) && messages.length > 0) {
              const lastMessage = messages[messages.length - 1];
              const unreadCount = messages.filter(
                (m) => m.status !== 'read' && m.senderId !== userPet.id
              ).length;

              return {
                ...room,
                ...(lastMessage && { lastMessage }),
                unreadCount,
                updatedAt: lastMessage?.timestamp ?? room.updatedAt,
              };
            }
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Error loading messages for room', {
              roomId: room.id,
              error: err.message,
            });
          }
          return room;
        })
      );

      const sorted = updatedRooms.sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      });

      // Only update if there's a meaningful change to avoid re-renders
      if (JSON.stringify(sorted) !== JSON.stringify(chatRooms)) {
        void setChatRooms(sorted);
      }
    };

    const intervalId = setInterval(() => void updateRoomsWithLastMessages(), 5000); // Poll for updates
    void updateRoomsWithLastMessages(); // Initial fetch

    return () => clearInterval(intervalId);
  }, [chatRooms, userPet, setChatRooms]);

  return {
    chatRooms: chatRooms ?? [],
    isLoading,
    userPet,
    selectedRoom,
    handleSelectRoom,
    handleBack,
  };
}
