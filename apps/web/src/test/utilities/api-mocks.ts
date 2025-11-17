/**
 * API Mock Utilities
 *
 * Utilities for mocking API calls in tests
 */

import { vi } from 'vitest';
import type { MockAPIClient } from '@/test/mocks/api-client';
import { createMockAPIClient, createMockAPIResponse, createMockAPIError } from '@/test/mocks/api-client';
import type { Pet, Match } from '@/lib/types';
import type { User } from '@/lib/api-schemas';
import type { ChatRoom, Message } from '@/lib/chat-types';
import type { AdoptionProfile } from '@/lib/adoption-types';
import {
  createMockUser,
  createMockPet,
  createMockMatch,
  createMockChatRoom,
  createMockMessage,
  createMockAdoptionProfile,
} from './mock-factories';

/**
 * Mock API client instance (can be shared across tests)
 */
export let mockAPIClient: MockAPIClient;

/**
 * Initialize mock API client
 */
export function initMockAPIClient(): MockAPIClient {
  mockAPIClient = createMockAPIClient();
  return mockAPIClient;
}

/**
 * Reset mock API client
 */
export function resetMockAPIClient(): void {
  if (mockAPIClient) {
    Object.values(mockAPIClient).forEach((mockFn) => {
      if (typeof mockFn === 'function' && 'mockClear' in mockFn) {
        mockFn.mockClear();
      }
    });
  }
}

/**
 * Mock auth API responses
 */
export const mockAuthAPI = {
  login: (user: User = createMockUser()) => {
    return createMockAPIResponse({
      user,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    });
  },
  register: (user: User = createMockUser()) => {
    return createMockAPIResponse({
      user,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    });
  },
  me: (user: User = createMockUser()) => {
    return createMockAPIResponse(user);
  },
  logout: () => {
    return createMockAPIResponse({});
  },
  refresh: () => {
    return createMockAPIResponse({
      accessToken: 'new-mock-access-token',
      refreshToken: 'new-mock-refresh-token',
    });
  },
};

/**
 * Mock pets API responses
 */
export const mockPetsAPI = {
  getPets: (pets: Pet[] = [createMockPet()]) => {
    return createMockAPIResponse(pets);
  },
  getPet: (pet: Pet = createMockPet()) => {
    return createMockAPIResponse(pet);
  },
  createPet: (pet: Pet = createMockPet()) => {
    return createMockAPIResponse(pet, 201);
  },
  updatePet: (pet: Pet = createMockPet()) => {
    return createMockAPIResponse(pet);
  },
  deletePet: () => {
    return createMockAPIResponse({}, 204);
  },
};

/**
 * Mock matching API responses
 */
export const mockMatchingAPI = {
  discover: (pets: Pet[] = [createMockPet()]) => {
    return createMockAPIResponse({
      candidates: pets,
      nextCursor: null,
      hasMore: false,
    });
  },
  swipe: (isMatch = false, matchId?: string) => {
    return createMockAPIResponse({
      isMatch,
      matchId: isMatch ? matchId || 'match-1' : undefined,
      chatRoomId: isMatch ? 'chat-room-1' : undefined,
    });
  },
  getMatches: (matches: Match[] = [createMockMatch()]) => {
    return createMockAPIResponse(matches);
  },
  getMatch: (match: Match = createMockMatch()) => {
    return createMockAPIResponse(match);
  },
};

/**
 * Mock chat API responses
 */
export const mockChatAPI = {
  getChatRooms: (rooms: ChatRoom[] = [createMockChatRoom()]) => {
    return createMockAPIResponse(rooms);
  },
  getChatRoom: (room: ChatRoom = createMockChatRoom()) => {
    return createMockAPIResponse(room);
  },
  getMessages: (messages: Message[] = [createMockMessage()]) => {
    return createMockAPIResponse(messages);
  },
  sendMessage: (message: Message = createMockMessage()) => {
    return createMockAPIResponse(message, 201);
  },
};

/**
 * Mock adoption API responses
 */
export const mockAdoptionAPI = {
  getAdoptionListings: (listings: AdoptionProfile[] = [createMockAdoptionProfile()]) => {
    return createMockAPIResponse(listings);
  },
  getAdoptionListing: (listing: AdoptionProfile = createMockAdoptionProfile()) => {
    return createMockAPIResponse(listing);
  },
  createAdoptionListing: (listing: AdoptionProfile = createMockAdoptionProfile()) => {
    return createMockAPIResponse(listing, 201);
  },
  updateAdoptionListing: (listing: AdoptionProfile = createMockAdoptionProfile()) => {
    return createMockAPIResponse(listing);
  },
  deleteAdoptionListing: () => {
    return createMockAPIResponse({}, 204);
  },
};

/**
 * Mock API errors
 */
export const mockAPIErrors = {
  unauthorized: () => createMockAPIError('Unauthorized', 401, 'UNAUTHORIZED'),
  forbidden: () => createMockAPIError('Forbidden', 403, 'FORBIDDEN'),
  notFound: () => createMockAPIError('Not Found', 404, 'NOT_FOUND'),
  serverError: () => createMockAPIError('Internal Server Error', 500, 'SERVER_ERROR'),
  networkError: () => createMockAPIError('Network Error', 0, 'NETWORK_ERROR'),
  validationError: (message = 'Validation Error') =>
    createMockAPIError(message, 400, 'VALIDATION_ERROR'),
};

/**
 * Setup mock API client with default responses
 */
export function setupMockAPI(
  overrides?: Partial<{
    auth: Partial<typeof mockAuthAPI>;
    pets: Partial<typeof mockPetsAPI>;
    matching: Partial<typeof mockMatchingAPI>;
    chat: Partial<typeof mockChatAPI>;
    adoption: Partial<typeof mockAdoptionAPI>;
  }>
): MockAPIClient {
  const client = initMockAPIClient();

  // Setup default responses
  client.post.mockImplementation((url: string) => {
    if (url.includes('/auth/login')) {
      return Promise.resolve(
        overrides?.auth?.login?.() || mockAuthAPI.login()
      );
    }
    if (url.includes('/auth/register')) {
      return Promise.resolve(
        overrides?.auth?.register?.() || mockAuthAPI.register()
      );
    }
    if (url.includes('/matching/swipe')) {
      return Promise.resolve(
        overrides?.matching?.swipe?.() || mockMatchingAPI.swipe()
      );
    }
    return Promise.resolve(createMockAPIResponse({}));
  });

  client.get.mockImplementation((url: string) => {
    if (url.includes('/auth/me')) {
      return Promise.resolve(overrides?.auth?.me?.() || mockAuthAPI.me());
    }
    if (url.includes('/pets')) {
      return Promise.resolve(overrides?.pets?.getPets?.() || mockPetsAPI.getPets());
    }
    if (url.includes('/matching/matches')) {
      return Promise.resolve(overrides?.matching?.getMatches?.() || mockMatchingAPI.getMatches());
    }
    if (url.includes('/chat/rooms')) {
      return Promise.resolve(overrides?.chat?.getChatRooms?.() || mockChatAPI.getChatRooms());
    }
    if (url.includes('/adoption/listings')) {
      return Promise.resolve(
        overrides?.adoption?.getAdoptionListings?.() || mockAdoptionAPI.getAdoptionListings()
      );
    }
    return Promise.resolve(createMockAPIResponse({}));
  });

  return client;
}
