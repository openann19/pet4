import { generateULID } from './utils';
import { api } from './api';
import { realtime } from './realtime';
import { storage } from './storage';
import { hashPassword, verifyPassword } from './password-utils';
import { log } from './logger';
import type { User, UserRole, AuthTokens } from './contracts';

export class AuthError extends Error {
  code: string;
  timestamp: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupCredentials extends LoginCredentials {
  displayName: string;
}

export class AuthService {
  private currentUser: User | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshAttempted = false;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const existingUsers = (await storage.get<User[]>('all-users')) ?? [];
    const user = existingUsers.find((u) => u.email === credentials.email && u.status === 'active');

    if (!user) {
      throw new AuthError('AUTH_001', 'Invalid credentials');
    }

    // Verify password if password hash exists
    if (user.passwordHash && user.passwordSalt) {
      const isValid = await verifyPassword(
        credentials.password,
        user.passwordHash,
        user.passwordSalt
      );

      if (!isValid) {
        throw new AuthError('AUTH_001', 'Invalid credentials');
      }
    } else {
      // Legacy users without password hashes - allow login for migration
      // In production, you might want to require password reset
      log.warn('User without password hash - allowing login for migration', {
        context: 'AuthService',
        userId: user.id,
      });
    }

    const tokens = this.generateTokens(user);
    await this.setSession(user, tokens);

    return { user, tokens };
  }

  async signup(credentials: SignupCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const existingUsers = (await storage.get<User[]>('all-users')) ?? [];

    if (existingUsers.some((u) => u.email === credentials.email)) {
      throw new AuthError('AUTH_008', 'Email already exists');
    }

    // Hash the password
    const { hash, salt } = await hashPassword(credentials.password);

    const now = new Date().toISOString();
    const user: User = {
      id: generateULID(),
      email: credentials.email,
      displayName: credentials.displayName,
      roles: ['user'],
      createdAt: now,
      updatedAt: now,
      lastSeenAt: now,
      status: 'active',
      passwordHash: hash,
      passwordSalt: salt,
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

    existingUsers.push(user);
    await storage.set('all-users', existingUsers);

    const tokens = this.generateTokens(user);
    await this.setSession(user, tokens);

    return { user, tokens };
  }

  /**
   * Change user password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    if (!this.currentUser) {
      throw new AuthError('AUTH_007', 'Not authenticated');
    }

    // Verify old password
    if (this.currentUser.passwordHash && this.currentUser.passwordSalt) {
      const isValid = await verifyPassword(
        oldPassword,
        this.currentUser.passwordHash,
        this.currentUser.passwordSalt
      );

      if (!isValid) {
        throw new AuthError('AUTH_001', 'Invalid current password');
      }

      // Hash new password
      const { hash, salt } = await hashPassword(newPassword);

      // Update user password
      await this.updateUser({
        passwordHash: hash,
        passwordSalt: salt,
      });
      return;
    }

    // Hash new password
    const { hash, salt } = await hashPassword(newPassword);

    // Update user password
    await this.updateUser({
      passwordHash: hash,
      passwordSalt: salt,
    });
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.refreshAttempted = false;

    api.setAccessToken(null);
    realtime.setAccessToken(null);
    realtime.disconnect();

    await storage.delete('current-user');
    await storage.delete('access-token');
    await storage.delete('refresh-token');
  }

  async refreshTokens(): Promise<AuthTokens | null> {
    if (this.refreshAttempted) {
      return null;
    }

    this.refreshAttempted = true;

    try {
      if (!this.refreshToken || !this.currentUser) {
        throw new Error('No refresh token available');
      }

      const tokens = this.generateTokens(this.currentUser);
      await this.setSession(this.currentUser, tokens);
      this.refreshAttempted = false;

      return tokens;
    } catch {
      await this.logout();
      return null;
    }
  }

  async handleUnauthorized(): Promise<boolean> {
    const tokens = await this.refreshTokens();
    return tokens !== null;
  }

  private generateTokens(user: User): AuthTokens {
    const accessToken = `access_${generateULID()}_${user.id}`;
    const refreshToken = `refresh_${generateULID()}_${user.id}`;

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }

  private async setSession(user: User, tokens: AuthTokens) {
    this.currentUser = user;
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;

    api.setAccessToken(tokens.accessToken);
    realtime.setAccessToken(tokens.accessToken);
    realtime.connect();

    await storage.set('current-user', user);
    await storage.set('access-token', tokens.accessToken);
    await storage.set('refresh-token', tokens.refreshToken);
  }

  async restoreSession(): Promise<User | null> {
    const user = await storage.get<User>('current-user');
    const accessToken = await storage.get<string>('access-token');
    const refreshToken = await storage.get<string>('refresh-token');

    if (user && accessToken && refreshToken) {
      this.currentUser = user;
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;

      api.setAccessToken(accessToken);
      realtime.setAccessToken(accessToken);
      realtime.connect();

      user.lastSeenAt = new Date().toISOString();
      await this.updateUser(user);

      return user;
    }

    return null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  hasRole(role: UserRole): boolean {
    return this.currentUser?.roles.includes(role) ?? false;
  }

  hasPermission(_action: string, _resource: string): boolean {
    if (!this.currentUser) return false;

    const hasAdminRole = this.currentUser.roles.includes('admin');
    if (hasAdminRole) return true;

    return true;
  }

  async updateUser(updates: Partial<User>): Promise<User> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    const updatedUser = {
      ...this.currentUser,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const allUsers = (await storage.get<User[]>('all-users')) ?? [];
    const userIndex = allUsers.findIndex((u) => u.id === updatedUser.id);

    if (userIndex >= 0) {
      allUsers[userIndex] = updatedUser;
      await storage.set('all-users', allUsers);
    }

    this.currentUser = updatedUser;
    await storage.set('current-user', updatedUser);

    return updatedUser;
  }

  async createDemoUsers(): Promise<void> {
    const existingUsers = (await storage.get<User[]>('all-users')) ?? [];

    if (existingUsers.length > 0) return;

    const now = new Date().toISOString();
    const demoUsers: User[] = [
      {
        id: generateULID(),
        email: 'user@demo.com',
        displayName: 'Demo User',
        roles: ['user'],
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
        status: 'active',
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
      },
      {
        id: generateULID(),
        email: 'moderator@demo.com',
        displayName: 'Demo Moderator',
        roles: ['user', 'moderator'],
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
        status: 'active',
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
      },
      {
        id: generateULID(),
        email: 'admin@demo.com',
        displayName: 'Demo Admin',
        roles: ['user', 'moderator', 'admin'],
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
        status: 'active',
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
      },
    ];

    await storage.set('all-users', demoUsers);
  }
}

export const authService = new AuthService();
