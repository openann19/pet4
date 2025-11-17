import { vi } from 'vitest';
import React from 'react';

/**
 * Module mocks for testing
 */
export function setupModuleMocks(): void {
  // Mock AppContext
  vi.mock('@/contexts/AppContext', () => ({
    AppProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'app-provider' }, children),
    useApp: () => ({
      theme: 'light',
      toggleTheme: vi.fn(),
      setTheme: vi.fn(),
      themePreset: 'default',
      setThemePreset: vi.fn(),
      language: 'en',
      toggleLanguage: vi.fn(),
      setLanguage: vi.fn(),
      t: {
        app: { title: 'PetSpark' },
        common: { loading: 'Loading...', error: 'Error', cancel: 'Cancel', save: 'Save' },
        chat: {
          createProfile: 'Create Profile',
          createProfileDesc: 'Create your profile first',
          title: 'Chat',
          selectConversation: 'Select a conversation',
          selectConversationDesc: 'Choose a conversation to start chatting',
        },
        discover: { title: 'Discover', noMorePets: 'No more pets', loading: 'Loading pets...' },
        matches: { title: 'Matches', noMatches: 'No matches yet' },
        profile: { myPets: 'My Pets' },
        maps: { title: 'Map' },
        adoption: { title: 'Adoption' },
        community: { title: 'Community' },
        lostfound: { title: 'Lost & Found' },
        errors: { operationFailed: 'Operation failed' },
      },
    }),
  }));

  // Mock missing native modules
  vi.mock('ffmpeg-kit-react-native', () => ({
    FFmpegKit: {
      execute: vi.fn(() => Promise.resolve({ getReturnCode: () => 0 })),
      cancel: vi.fn(),
    },
    ReturnCode: {
      SUCCESS: 0,
      CANCEL: 255,
    },
  }));

  vi.mock('@/types/next-server', () => ({
    NextResponse: {
      json: vi.fn((data) => ({ json: () => Promise.resolve(data) })),
      redirect: vi.fn((url) => ({ redirect: url })),
    },
  }));

  // Mock transitions
  vi.mock('@/effects/reanimated/transitions', async () => {
    const mockModule = await import('../mocks/transitions');
    return mockModule;
  });
}

