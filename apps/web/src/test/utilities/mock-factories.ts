/**
 * Mock Factories
 *
 * Factory functions for creating mock data objects for tests
 */

import type { Pet, Match, SwipeAction } from '@/lib/types';
import type { User } from '@/lib/contracts';
import type { ChatRoom, Message } from '@/lib/chat-types';
import type { AdoptionProfile } from '@/lib/adoption-types';
import type { Story } from '@petspark/shared';

/**
 * Create a mock User object
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'user-1',
    email: 'test@example.com',
    displayName: 'Test User',
    avatarUrl: 'https://example.com/avatar.jpg',
    roles: ['user'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    status: 'active',
    lastSeenAt: '2024-01-01T00:00:00Z',
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: {
        push: true,
        email: true,
        matches: true,
        messages: true,
        likes: true,
      },
      quietHours: null,
    },
    ...overrides,
  };
}

/**
 * Create a mock Pet object
 */
export function createMockPet(overrides?: Partial<Pet>): Pet {
  return {
    id: 'pet-1',
    name: 'Buddy',
    breed: 'Golden Retriever',
    age: 3,
    gender: 'male',
    size: 'large',
    photo: 'https://example.com/photo1.jpg',
    photos: ['https://example.com/photo1.jpg'],
    bio: 'Friendly and energetic',
    personality: ['playful', 'friendly'],
    interests: ['fetch', 'walks'],
    lookingFor: ['playdates', 'friends'],
    location: 'New York, NY',
    coordinates: {
      latitude: 40.7128,
      longitude: -74.006,
    },
    ownerId: 'user-1',
    ownerName: 'Test Owner',
    verified: false,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Create a mock Match object
 */
export function createMockMatch(overrides?: Partial<Match>): Match {
  return {
    id: 'match-1',
    petId: 'pet-1',
    matchedPetId: 'pet-2',
    matchedPetName: 'Max',
    matchedPetPhoto: 'https://example.com/photo2.jpg',
    compatibilityScore: 85,
    reasoning: ['Similar personality', 'Same size', 'Close location'],
    matchedAt: '2024-01-01T00:00:00Z',
    status: 'active',
    ...overrides,
  };
}

/**
 * Create a mock SwipeAction object
 */
export function createMockSwipeAction(overrides?: Partial<SwipeAction>): SwipeAction {
  return {
    petId: 'pet-1',
    targetPetId: 'pet-2',
    action: 'like',
    timestamp: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Create a mock ChatRoom object
 */
export function createMockChatRoom(overrides?: Partial<ChatRoom>): ChatRoom {
  return {
    id: 'chat-room-1',
    participantIds: ['user-1', 'user-2'],
    type: 'direct',
    matchId: 'match-1',
    matchedPetId: 'pet-2',
    matchedPetName: 'Max',
    matchedPetPhoto: 'https://example.com/photo2.jpg',
    lastMessage: {
      id: 'msg-1',
      roomId: 'chat-room-1',
      senderId: 'user-1',
      content: 'Hello!',
      type: 'text',
      status: 'sent',
      createdAt: '2024-01-01T00:00:00Z',
    },
    lastMessageAt: '2024-01-01T00:00:00Z',
    unreadCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Create a mock Message object
 */
export function createMockMessage(overrides?: Partial<Message>): Message {
  return {
    id: 'msg-1',
    roomId: 'chat-room-1',
    senderId: 'user-1',
    senderName: 'Test User',
    content: 'Hello!',
    type: 'text',
    status: 'sent',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Create a mock AdoptionProfile object
 */
export function createMockAdoptionProfile(overrides?: Partial<AdoptionProfile>): AdoptionProfile {
  return {
    _id: 'adoption-1',
    petId: 'pet-1',
    petName: 'Max',
    petPhoto: 'https://example.com/photo1.jpg',
    breed: 'Labrador',
    age: 2,
    gender: 'male',
    size: 'large',
    location: 'New York, NY',
    shelterId: 'shelter-1',
    shelterName: 'Happy Tails Shelter',
    status: 'available',
    description: 'Looking for a loving home',
    healthStatus: 'Healthy',
    vaccinated: true,
    spayedNeutered: true,
    goodWithKids: true,
    goodWithPets: true,
    energyLevel: 'medium',
    adoptionFee: 200,
    postedDate: '2024-01-01T00:00:00Z',
    personality: ['friendly', 'playful'],
    photos: ['https://example.com/photo1.jpg'],
    contactEmail: 'adopt@happytails.com',
    ...overrides,
  };
}

/**
 * Create a mock Story object
 */
export function createMockStory(overrides?: Partial<Story>): Story {
  return {
    id: 'story-1',
    userId: 'user-1',
    userName: 'Test User',
    petId: 'pet-1',
    petName: 'Test Pet',
    petPhoto: 'https://example.com/pet.jpg',
    type: 'photo',
    mediaUrl: 'https://example.com/story.jpg',
    duration: 10,
    createdAt: '2024-01-01T00:00:00Z',
    expiresAt: '2024-01-02T00:00:00Z',
    visibility: 'everyone',
    viewCount: 0,
    views: [],
    reactions: [],
    ...overrides,
  };
}

/**
 * Create an array of mock objects
 */
export function createMockArray<T>(
  factory: () => T,
  count: number,
  overrides?: (index: number) => Partial<T>
): T[] {
  return Array.from({ length: count }, (_, index) => {
    const base = factory();
    const override = overrides ? overrides(index) : {};
    return { ...base, ...override } as T;
  });
}
