import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState } from 'react';
import { useAppState } from '../use-app-state';
import { createLogger } from '@/lib/logger';

// Mock dependencies
vi.mock('@/hooks/use-storage');
vi.mock('@/contexts/AuthContext');

const mockUseStorage = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/use-storage', () => ({
  useStorage: mockUseStorage,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

describe('useAppState', () => {
  const mockSetHasSeenWelcome = vi.fn();
  const mockLogger = createLogger('test');

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetHasSeenWelcome.mockResolvedValue(undefined);
  });

  it('should start in welcome state when user has not seen welcome', () => {
    mockUseStorage.mockReturnValue([false, mockSetHasSeenWelcome]);
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    const { result } = renderHook(() => useAppState());

    expect(result.current.appState).toBe('welcome');
    expect(result.current.authMode).toBe('signup');
    expect(result.current.hasSeenWelcome).toBe(false);
  });

  it('should transition to auth state when user has seen welcome but not authenticated', () => {
    mockUseStorage.mockReturnValue([true, mockSetHasSeenWelcome]);
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    const { result } = renderHook(() => useAppState());

    expect(result.current.appState).toBe('auth');
    expect(result.current.authMode).toBe('signup');
    expect(result.current.hasSeenWelcome).toBe(true);
  });

  it('should transition to main state when user has seen welcome and is authenticated', () => {
    mockUseStorage.mockReturnValue([true, mockSetHasSeenWelcome]);
    mockUseAuth.mockReturnValue({ isAuthenticated: true });

    const { result } = renderHook(() => useAppState());

    expect(result.current.appState).toBe('main');
    expect(result.current.authMode).toBe('signup');
    expect(result.current.hasSeenWelcome).toBe(true);
  });

  it('should handle welcome get started correctly', async () => {
    mockUseStorage.mockReturnValue([false, mockSetHasSeenWelcome]);
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    const { result } = renderHook(() => useAppState());

    await act(async () => {
      result.current.handleWelcomeGetStarted();
    });

    expect(mockSetHasSeenWelcome).toHaveBeenCalledWith(true);
    expect(result.current.appState).toBe('auth');
    expect(result.current.authMode).toBe('signup');
  });

  it('should handle welcome sign in correctly', async () => {
    mockUseStorage.mockReturnValue([false, mockSetHasSeenWelcome]);
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    const { result } = renderHook(() => useAppState());

    await act(async () => {
      result.current.handleWelcomeSignIn();
    });

    expect(mockSetHasSeenWelcome).toHaveBeenCalledWith(true);
    expect(result.current.appState).toBe('auth');
    expect(result.current.authMode).toBe('signin');
  });

  it('should handle welcome explore correctly', async () => {
    mockUseStorage.mockReturnValue([false, mockSetHasSeenWelcome]);
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    const { result } = renderHook(() => useAppState());

    await act(async () => {
      result.current.handleWelcomeExplore();
    });

    expect(mockSetHasSeenWelcome).toHaveBeenCalledWith(true);
    expect(result.current.appState).toBe('main');
  });

  it('should handle auth success correctly', () => {
    mockUseStorage.mockReturnValue([true, mockSetHasSeenWelcome]);
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.handleAuthSuccess();
    });

    expect(result.current.appState).toBe('main');
  });

  it('should handle auth back correctly', () => {
    mockUseStorage.mockReturnValue([true, mockSetHasSeenWelcome]);
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.handleAuthBack();
    });

    expect(result.current.appState).toBe('welcome');
  });

  it('should allow setting auth mode directly', () => {
    mockUseStorage.mockReturnValue([false, mockSetHasSeenWelcome]);
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.setAuthMode('signin');
    });

    expect(result.current.authMode).toBe('signin');
  });

  it('should handle storage errors gracefully', async () => {
    const error = new Error('Storage failed');
    mockSetHasSeenWelcome.mockRejectedValue(error);
    mockUseStorage.mockReturnValue([false, mockSetHasSeenWelcome]);
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    const { result } = renderHook(() => useAppState());

    await act(async () => {
      result.current.handleWelcomeGetStarted();
    });

    // The error should be handled gracefully - state transitions to auth despite storage error
    expect(result.current.appState).toBe('auth');
    expect(result.current.authMode).toBe('signup');
  });

  it('should update app state when authentication status changes', () => {
    mockUseStorage.mockReturnValue([true, mockSetHasSeenWelcome]);

    // Test unauthenticated state
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    const { result: result1 } = renderHook(() => useAppState());
    expect(result1.current.appState).toBe('auth');

    // Test authenticated state
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    const { result: result2 } = renderHook(() => useAppState());
    expect(result2.current.appState).toBe('main');
  });

  it('should update app state when welcome status changes', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    // Test not seen welcome
    mockUseStorage.mockReturnValue([false, mockSetHasSeenWelcome]);
    const { result: result1 } = renderHook(() => useAppState());
    expect(result1.current.appState).toBe('welcome');

    // Test seen welcome
    mockUseStorage.mockReturnValue([true, mockSetHasSeenWelcome]);
    const { result: result2 } = renderHook(() => useAppState());
    expect(result2.current.appState).toBe('auth');
  });
});
