import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { enhancedAuth } from '@/lib/enhanced-auth';

vi.mock('@/lib/enhanced-auth', () => ({
  enhancedAuth: {
    initialize: vi.fn(),
    getCurrentUser: vi.fn(),
    updateUserProfile: vi.fn(),
    updatePreferences: vi.fn(),
    logout: vi.fn(),
    hasRole: vi.fn(),
    isOwner: vi.fn(),
    isAuthenticated: vi.fn(() => false),
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with loading state', () => {
    vi.mocked(enhancedAuth.initialize).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    vi.mocked(enhancedAuth.getCurrentUser).mockReturnValue(null);

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should load user on initialization', async () => {
    const mockUser = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      preferences: {},
      roles: [],
      createdAt: new Date().toISOString(),
      githubId: '123',
      githubLogin: 'testuser',
    };

    vi.mocked(enhancedAuth.initialize).mockResolvedValue(undefined);
    vi.mocked(enhancedAuth.getCurrentUser).mockReturnValue(mockUser as never);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(enhancedAuth.initialize).toHaveBeenCalled();
  });

  it('should handle initialization error', async () => {
    const error = new Error('Initialization failed');
    vi.mocked(enhancedAuth.initialize).mockRejectedValue(error);
    vi.mocked(enhancedAuth.getCurrentUser).mockReturnValue(null);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should check user role', async () => {
    const mockUser = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      preferences: {},
      roles: ['admin'],
      createdAt: new Date().toISOString(),
      githubId: '123',
      githubLogin: 'testuser',
    };

    vi.mocked(enhancedAuth.initialize).mockResolvedValue(undefined);
    vi.mocked(enhancedAuth.getCurrentUser).mockReturnValue(mockUser as never);
    vi.mocked(enhancedAuth.hasRole).mockReturnValue(true);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasRole('admin')).toBe(true);
    expect(enhancedAuth.hasRole).toHaveBeenCalledWith('admin');
  });

  it('should check if user is owner', async () => {
    const mockUser = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      preferences: {},
      roles: [],
      createdAt: new Date().toISOString(),
      githubId: '123',
      githubLogin: 'testuser',
    };

    vi.mocked(enhancedAuth.initialize).mockResolvedValue(undefined);
    vi.mocked(enhancedAuth.getCurrentUser).mockReturnValue(mockUser as never);
    vi.mocked(enhancedAuth.isOwner).mockReturnValue(true);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isOwner('user-1')).toBe(true);
    expect(enhancedAuth.isOwner).toHaveBeenCalledWith('user-1');
  });

  it('should update profile', async () => {
    const mockUser = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      preferences: {},
      roles: [],
      createdAt: new Date().toISOString(),
      githubId: '123',
      githubLogin: 'testuser',
    };

    const updatedUser = {
      ...mockUser,
      name: 'Updated Name',
    };

    vi.mocked(enhancedAuth.initialize).mockResolvedValue(undefined);
    vi.mocked(enhancedAuth.getCurrentUser).mockReturnValue(mockUser as never);
    vi.mocked(enhancedAuth.updateUserProfile).mockResolvedValue(updatedUser as never);
    vi.mocked(enhancedAuth.getCurrentUser)
      .mockReturnValueOnce(mockUser as never)
      .mockReturnValueOnce(updatedUser as never);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updated = await result.current.updateProfile({ name: 'Updated Name' });

    expect(updated).toEqual(updatedUser);
    expect(enhancedAuth.updateUserProfile).toHaveBeenCalledWith({ name: 'Updated Name' });
  });

  it('should update preferences', async () => {
    const mockUser = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      preferences: {},
      roles: [],
      createdAt: new Date().toISOString(),
      githubId: '123',
      githubLogin: 'testuser',
    };

    vi.mocked(enhancedAuth.initialize).mockResolvedValue(undefined);
    vi.mocked(enhancedAuth.getCurrentUser).mockReturnValue(mockUser as never);
    vi.mocked(enhancedAuth.updatePreferences).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.updatePreferences({ theme: 'dark' });

    expect(enhancedAuth.updatePreferences).toHaveBeenCalledWith({ theme: 'dark' });
  });

  it('should logout', async () => {
    const mockUser = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      preferences: {},
      roles: [],
      createdAt: new Date().toISOString(),
      githubId: '123',
      githubLogin: 'testuser',
    };

    vi.mocked(enhancedAuth.initialize).mockResolvedValue(undefined);
    vi.mocked(enhancedAuth.getCurrentUser).mockReturnValue(mockUser as never);
    vi.mocked(enhancedAuth.logout).mockResolvedValue(undefined);
    vi.mocked(enhancedAuth.getCurrentUser)
      .mockReturnValueOnce(mockUser as never)
      .mockReturnValueOnce(null);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.logout();

    expect(enhancedAuth.logout).toHaveBeenCalled();
  });
});
