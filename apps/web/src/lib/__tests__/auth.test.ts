import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService, authService, AuthError } from '../auth';
import type { User, AuthTokens } from '../contracts';

// Mock dependencies
vi.mock('../utils', () => ({
  generateULID: vi.fn(() => 'test-ulid-123'),
}));

vi.mock('../api', () => ({
  api: {
    setAccessToken: vi.fn(),
  },
}));

vi.mock('../realtime', () => ({
  realtime: {
    setAccessToken: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  },
}));

vi.mock('../password-utils', () => ({
  hashPassword: vi.fn(() => ({ hash: 'hashed-password', salt: 'password-salt' })),
  verifyPassword: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('../logger', () => ({
  log: {
    warn: vi.fn(),
  },
}));

vi.mock('../storage', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('AuthError', () => {
  it('should create AuthError with correct properties', () => {
    const error = new AuthError('AUTH_001', 'Test error message');

    expect(error.name).toBe('AuthError');
    expect(error.code).toBe('AUTH_001');
    expect(error.message).toBe('Test error message');
    expect(error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});

describe('AuthService', () => {
  let service: AuthService;
  let mockStorage: any;
  let mockApi: any;
  let mockRealtime: any;

  beforeEach(() => {
    service = new AuthService();
    vi.clearAllMocks();

    mockStorage = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };

    mockApi = {
      setAccessToken: vi.fn(),
    };

    mockRealtime = {
      setAccessToken: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    // Update mocks
    const { storage, api, realtime } = require('../storage');
    storage.get = mockStorage.get;
    storage.set = mockStorage.set;
    storage.delete = mockStorage.delete;

    const { api: apiModule, realtime: realtimeModule } = require('../api');
    apiModule.setAccessToken = mockApi.setAccessToken;
    realtimeModule.setAccessToken = mockRealtime.setAccessToken;
    realtimeModule.connect = mockRealtime.connect;
    realtimeModule.disconnect = mockRealtime.disconnect;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAccessToken', () => {
    it('should return null initially', () => {
      expect(service.getAccessToken()).toBeNull();
    });

    it('should return access token after login', async () => {
      const mockUser = createMockUser();
      mockStorage.get.mockResolvedValue([mockUser]);

      await service.login({ email: 'test@example.com', password: 'password' });

      expect(service.getAccessToken()).toContain('access_');
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = createMockUser();
      mockStorage.get.mockResolvedValue([mockUser]);

      const result = await service.login({ email: 'test@example.com', password: 'password' });

      expect(result.user).toEqual(mockUser);
      expect(result.tokens.accessToken).toContain('access_');
      expect(result.tokens.refreshToken).toContain('refresh_');
      expect(result.tokens.expiresIn).toBe(900);

      expect(mockStorage.set).toHaveBeenCalledWith('current-user', mockUser);
      expect(mockStorage.set).toHaveBeenCalledWith('access-token', expect.any(String));
      expect(mockStorage.set).toHaveBeenCalledWith('refresh-token', expect.any(String));
      expect(mockApi.setAccessToken).toHaveBeenCalled();
      expect(mockRealtime.setAccessToken).toHaveBeenCalled();
      expect(mockRealtime.connect).toHaveBeenCalled();
    });

    it('should throw error for invalid credentials', async () => {
      const mockUser = createMockUser();
      mockStorage.get.mockResolvedValue([mockUser]);

      // Mock password verification to fail
      const { verifyPassword } = require('../password-utils');
      verifyPassword.mockReturnValue(Promise.resolve(false));

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong-password' })
      ).rejects.toThrow(AuthError);

      try {
        await service.login({ email: 'test@example.com', password: 'wrong-password' });
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AuthError);
        if (error instanceof AuthError) {
          expect(error.code).toBe('AUTH_001');
          expect(error.message).toBe('Invalid credentials');
        }
      }
    });

    it('should throw error for non-existent user', async () => {
      mockStorage.get.mockResolvedValue([]);

      await expect(
        service.login({ email: 'nonexistent@example.com', password: 'password' })
      ).rejects.toThrow(AuthError);
    });

    it('should handle legacy users without password hashes', async () => {
      const mockUser = createMockUser();
      delete mockUser.passwordHash;
      delete mockUser.passwordSalt;
      mockStorage.get.mockResolvedValue([mockUser]);

      const { log } = require('../logger');

      const result = await service.login({ email: 'test@example.com', password: 'password' });

      expect(result.user).toEqual(mockUser);
      expect(log.warn).toHaveBeenCalledWith(
        'User without password hash - allowing login for migration',
        expect.objectContaining({ userId: mockUser.id })
      );
    });
  });

  describe('signup', () => {
    it('should signup successfully with valid credentials', async () => {
      mockStorage.get.mockResolvedValue([]);

      const credentials = {
        email: 'newuser@example.com',
        password: 'password',
        displayName: 'New User',
      };

      const result = await service.signup(credentials);

      expect(result.user.email).toBe(credentials.email);
      expect(result.user.displayName).toBe(credentials.displayName);
      expect(result.user.roles).toContain('user');
      expect(result.user.passwordHash).toBe('hashed-password');
      expect(result.user.passwordSalt).toBe('password-salt');

      expect(result.tokens.accessToken).toContain('access_');
      expect(result.tokens.refreshToken).toContain('refresh_');

      expect(mockStorage.set).toHaveBeenCalledWith('all-users', expect.any(Array));
      expect(mockStorage.set).toHaveBeenCalledWith('current-user', expect.any(Object));
    });

    it('should throw error for existing email', async () => {
      const mockUser = createMockUser();
      mockStorage.get.mockResolvedValue([mockUser]);

      await expect(
        service.signup({
          email: 'test@example.com',
          password: 'password',
          displayName: 'Test User',
        })
      ).rejects.toThrow(AuthError);

      try {
        await service.signup({
          email: 'test@example.com',
          password: 'password',
          displayName: 'Test User',
        });
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AuthError);
        if (error instanceof AuthError) {
          expect(error.code).toBe('AUTH_008');
          expect(error.message).toBe('Email already exists');
        }
      }
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockUser = createMockUser();
      mockStorage.get.mockResolvedValue([mockUser]);

      // Login first
      await service.login({ email: 'test@example.com', password: 'password' });

      // Change password
      await service.changePassword('password', 'new-password');

      const { hashPassword } = require('../password-utils');
      expect(hashPassword).toHaveBeenCalledWith('new-password');
      expect(mockStorage.set).toHaveBeenCalledWith('all-users', expect.any(Array));
    });

    it('should throw error when not authenticated', async () => {
      await expect(service.changePassword('old-password', 'new-password')).rejects.toThrow(
        AuthError
      );
    });

    it('should throw error for invalid current password', async () => {
      const mockUser = createMockUser();
      mockStorage.get.mockResolvedValue([mockUser]);

      await service.login({ email: 'test@example.com', password: 'password' });

      // Mock password verification to fail
      const { verifyPassword } = require('../password-utils');
      verifyPassword.mockReturnValue(Promise.resolve(false));

      await expect(service.changePassword('wrong-password', 'new-password')).rejects.toThrow(
        AuthError
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const mockUser = createMockUser();
      mockStorage.get.mockResolvedValue([mockUser]);

      // Login first
      await service.login({ email: 'test@example.com', password: 'password' });

      // Logout
      await service.logout();

      expect(service.getAccessToken()).toBeNull();
      expect(service.getCurrentUser()).toBeNull();

      expect(mockApi.setAccessToken).toHaveBeenCalledWith(null);
      expect(mockRealtime.setAccessToken).toHaveBeenCalledWith(null);
      expect(mockRealtime.disconnect).toHaveBeenCalled();

      expect(mockStorage.delete).toHaveBeenCalledWith('current-user');
      expect(mockStorage.delete).toHaveBeenCalledWith('access-token');
      expect(mockStorage.delete).toHaveBeenCalledWith('refresh-token');
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const mockUser = createMockUser();
      mockStorage.get.mockResolvedValue([mockUser]);

      // Login first
      await service.login({ email: 'test@example.com', password: 'password' });

      // Clear refresh attempt flag
      (service as any).refreshAttempted = false;

      // Refresh tokens
      const tokens = await service.refreshTokens();

      expect(tokens).toBeTruthy();
      expect(tokens?.accessToken).toContain('access_');
      expect(tokens?.refreshToken).toContain('refresh_');
    });

    it('should return null if refresh already attempted', async () => {
      const mockUser = createMockUser();
      mockStorage.get.mockResolvedValue([mockUser]);

      await service.login({ email: 'test@example.com', password: 'password' });

      // Set refresh attempted flag
      (service as any).refreshAttempted = true;

      const tokens = await service.refreshTokens();
      expect(tokens).toBeNull();
    });

    it('should logout on refresh failure', async () => {
      const mockUser = createMockUser();
      mockStorage.get.mockResolvedValue([mockUser]);

      await service.login({ email: 'test@example.com', password: 'password' });

      // Clear refresh token to force failure
      (service as any).refreshToken = null;

      await service.refreshTokens();

      expect(service.getAccessToken()).toBeNull();
      expect(service.getCurrentUser()).toBeNull();
    });
  });

  describe('restoreSession', () => {
    it('should restore session successfully', async () => {
      const mockUser = createMockUser();
      const mockTokens = {
        accessToken: 'access_test-ulid-123_test-id',
        refreshToken: 'refresh_test-ulid-123_test-id',
      };

      mockStorage.get
        .mockResolvedValueOnce(mockUser) // current-user
        .mockResolvedValueOnce(mockTokens.accessToken) // access-token
        .mockResolvedValueOnce(mockTokens.refreshToken) // refresh-token
        .mockResolvedValue([mockUser]); // all-users for update

      const user = await service.restoreSession();

      expect(user).toEqual(mockUser);
      expect(service.getAccessToken()).toBe(mockTokens.accessToken);
      expect(mockApi.setAccessToken).toHaveBeenCalledWith(mockTokens.accessToken);
      expect(mockRealtime.setAccessToken).toHaveBeenCalledWith(mockTokens.accessToken);
      expect(mockRealtime.connect).toHaveBeenCalled();
    });

    it('should return null for incomplete session', async () => {
      mockStorage.get.mockResolvedValue(null);

      const user = await service.restoreSession();
      expect(user).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return null initially', () => {
      expect(service.getCurrentUser()).toBeNull();
    });

    it('should return user after login', async () => {
      const mockUser = createMockUser();
      mockStorage.get.mockResolvedValue([mockUser]);

      await service.login({ email: 'test@example.com', password: 'password' });

      expect(service.getCurrentUser()).toEqual(mockUser);
    });
  });

  describe('hasRole', () => {
    it('should return false for unauthenticated user', () => {
      expect(service.hasRole('user')).toBe(false);
      expect(service.hasRole('admin')).toBe(false);
    });

    it('should return true for user with role', async () => {
      const mockUser = createMockUser();
      mockStorage.get.mockResolvedValue([mockUser]);

      await service.login({ email: 'test@example.com', password: 'password' });

      expect(service.hasRole('user')).toBe(true);
      expect(service.hasRole('admin')).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should return false for unauthenticated user', () => {
      expect(service.hasPermission('read', 'posts')).toBe(false);
    });

    it('should return true for admin user', async () => {
      const adminUser = createMockUser();
      adminUser.roles = ['admin'];
      mockStorage.get.mockResolvedValue([adminUser]);

      await service.login({ email: 'admin@example.com', password: 'password' });

      expect(service.hasPermission('read', 'posts')).toBe(true);
      expect(service.hasPermission('delete', 'users')).toBe(true);
    });

    it('should return true for regular user', async () => {
      const mockUser = createMockUser();
      mockStorage.get.mockResolvedValue([mockUser]);

      await service.login({ email: 'test@example.com', password: 'password' });

      expect(service.hasPermission('read', 'posts')).toBe(true);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const mockUser = createMockUser();
      mockStorage.get.mockResolvedValue([mockUser]);

      await service.login({ email: 'test@example.com', password: 'password' });

      const updates = { displayName: 'Updated Name' };
      const updatedUser = await service.updateUser(updates);

      expect(updatedUser.displayName).toBe('Updated Name');
      expect(updatedUser.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(mockStorage.set).toHaveBeenCalledWith('all-users', expect.any(Array));
      expect(mockStorage.set).toHaveBeenCalledWith('current-user', updatedUser);
    });

    it('should throw error when not authenticated', async () => {
      await expect(service.updateUser({ displayName: 'Updated Name' })).rejects.toThrow(
        'No user logged in'
      );
    });
  });

  describe('createDemoUsers', () => {
    it('should create demo users when no users exist', async () => {
      mockStorage.get.mockResolvedValue([]);

      await service.createDemoUsers();

      expect(mockStorage.set).toHaveBeenCalledWith('all-users', expect.any(Array));

      const savedUsers = mockStorage.set.mock.calls[0][1];
      expect(savedUsers).toHaveLength(3);
      expect(savedUsers[0].email).toBe('user@demo.com');
      expect(savedUsers[1].email).toBe('moderator@demo.com');
      expect(savedUsers[2].email).toBe('admin@demo.com');
    });

    it('should not create users when users already exist', async () => {
      const mockUser = createMockUser();
      mockStorage.get.mockResolvedValue([mockUser]);

      await service.createDemoUsers();

      expect(mockStorage.set).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockStorage.get.mockRejectedValue(new Error('Storage error'));

      await expect(
        service.login({ email: 'test@example.com', password: 'password' })
      ).rejects.toThrow();
    });
  });
});

describe('authService singleton', () => {
  it('should export singleton instance', () => {
    expect(authService).toBeInstanceOf(AuthService);
  });
});

describe('integration tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle complete auth flow', async () => {
    const { storage } = require('../storage');
    storage.get.mockResolvedValue([]); // No existing users

    // Signup
    const signupResult = await authService.signup({
      email: 'newuser@example.com',
      password: 'password',
      displayName: 'New User',
    });

    expect(signupResult.user.email).toBe('newuser@example.com');
    expect(authService.getCurrentUser()).toEqual(signupResult.user);

    // Logout
    await authService.logout();
    expect(authService.getCurrentUser()).toBeNull();

    // Restore session
    storage.get
      .mockResolvedValueOnce(signupResult.user) // current-user
      .mockResolvedValueOnce(signupResult.tokens.accessToken) // access-token
      .mockResolvedValueOnce(signupResult.tokens.refreshToken) // refresh-token
      .mockResolvedValue([signupResult.user]); // all-users

    const restoredUser = await authService.restoreSession();
    expect(restoredUser?.email).toBe('newuser@example.com');
  });

  it('should handle role-based permissions', async () => {
    const { storage } = require('../storage');

    const adminUser = {
      id: 'admin-123',
      email: 'admin@example.com',
      displayName: 'Admin User',
      roles: ['admin'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      status: 'active' as const,
      preferences: {
        theme: 'light' as const,
        language: 'en' as const,
        notifications: {
          push: true,
          email: true,
          matches: true,
          messages: true,
          likes: true,
        },
        quietHours: null,
      },
    };

    storage.get.mockResolvedValue([adminUser]);

    await authService.login({ email: 'admin@example.com', password: 'password' });

    expect(authService.hasRole('admin')).toBe(true);
    expect(authService.hasRole('user')).toBe(false);
    expect(authService.hasPermission('delete', 'users')).toBe(true);
    expect(authService.hasPermission('read', 'posts')).toBe(true);
  });
});

// Helper function to create mock user
function createMockUser(): User {
  return {
    id: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    roles: ['user'],
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    lastSeenAt: '2023-01-01T00:00:00.000Z',
    status: 'active',
    passwordHash: 'hashed-password',
    passwordSalt: 'password-salt',
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
  };
}
