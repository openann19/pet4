import { db, type DBRecord } from './database';
import { createLogger } from './logger';
import { storage } from './storage';
import type { User } from './user-service';
import { userService } from './user-service';

const logger = createLogger('EnhancedAuth');

export interface UserProfile extends DBRecord {
  githubId?: string;
  githubLogin?: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  roles: UserRole[];
  status: 'active' | 'suspended' | 'deleted';
  preferences: UserPreferences;
  lastSeenAt: string;
  metadata?: Record<string, unknown>;
}

export type UserRole = 'user' | 'moderator' | 'admin';

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'en' | 'bg';
  notifications: {
    push: boolean;
    email: boolean;
    matches: boolean;
    messages: boolean;
    likes: boolean;
  };
  quietHours: {
    start: string;
    end: string;
  } | null;
}

export interface Session extends DBRecord {
  userId: string;
  githubUserId?: string;
  expiresAt: string;
  lastActivityAt: string;
  metadata?: Record<string, unknown>;
}

export class EnhancedAuthService {
  private currentUser: UserProfile | null = null;
  private currentSession: Session | null = null;
  private sessionCheckInterval: number | null = null;

  async initialize(): Promise<void> {
    try {
      const currentUser = await userService.user();

      if (currentUser && currentUser.isGuest !== true) {
        const loginIdentifier = currentUser.login ?? currentUser.email ?? currentUser.id;
        let userProfile = await db.findOne<UserProfile>('users', {
          githubLogin: loginIdentifier,
        });

        if (!userProfile) {
          userProfile = await this.createUserFromCurrentUser(currentUser);
        } else {
          userProfile = await db.update<UserProfile>('users', userProfile.id, {
            lastSeenAt: new Date().toISOString(),
            ...(currentUser.avatarUrl ? { avatarUrl: currentUser.avatarUrl } : {}),
            ...(currentUser.email ? { email: currentUser.email } : {}),
            displayName: currentUser.displayName ?? currentUser.login ?? userProfile.displayName,
          });
        }

        if (userProfile) {
          await this.createSession(userProfile);
        }
      } else {
        await this.restoreGuestSession();
      }

      this.startSessionMonitoring();
    } catch (_error) {
      logger.error(
        'Auth initialization failed',
        _error instanceof Error ? _error : new Error(String(_error))
      );
      await this.restoreGuestSession();
    }
  }

  private async createUserFromCurrentUser(user: User): Promise<UserProfile> {
    const roles: UserRole[] = ['user'];

    const possibleRoles = (user as { roles?: unknown }).roles;
    if (Array.isArray(possibleRoles)) {
      for (const role of possibleRoles) {
        if (role === 'admin' || role === 'moderator') {
          roles.push(role);
        }
      }
    }

    if ((user as { isOwner?: boolean }).isOwner) {
      roles.push('admin', 'moderator');
    }

    const userProfile = await db.create<UserProfile>('users', {
      githubId: user.id,
      githubLogin: user.login ?? user.email ?? user.id,
      ...(user.email ? { email: user.email } : {}),
      displayName: user.displayName ?? user.login ?? 'Anonymous',
      ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
      roles,
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
      lastSeenAt: new Date().toISOString(),
    });

    return userProfile;
  }

  private async restoreGuestSession(): Promise<void> {
    const guestUserId = await storage.get<string>('guest-user-id');

    if (guestUserId) {
      const guestUser = await db.findById<UserProfile>('users', guestUserId);
      if (guestUser) {
        this.currentUser = guestUser;
        return;
      }
    }

    const guestUser = await db.create<UserProfile>('users', {
      displayName: 'Guest User',
      roles: ['user'],
      status: 'active',
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          push: false,
          email: false,
          matches: true,
          messages: true,
          likes: true,
        },
        quietHours: null,
      },
      lastSeenAt: new Date().toISOString(),
    });

    this.currentUser = guestUser;
    await storage.set('guest-user-id', guestUser.id);
  }

  private async createSession(user: UserProfile): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const session = await db.create<Session>('sessions', {
      userId: user.id,
      ...(user.githubId ? { githubUserId: user.githubId } : {}),
      expiresAt: expiresAt.toISOString(),
      lastActivityAt: new Date().toISOString(),
    });

    this.currentUser = user;
    this.currentSession = session;

    await storage.set('current-session-id', session.id);
  }

  private startSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    this.sessionCheckInterval = window.setInterval(async () => {
      if (this.currentSession) {
        await this.updateSessionActivity();
      }
    }, 60000);
  }

  private async updateSessionActivity(): Promise<void> {
    if (!this.currentSession) return;

    const now = new Date();
    const expiresAt = new Date(this.currentSession.expiresAt);

    if (now > expiresAt) {
      await this.logout();
      return;
    }

    await db.update<Session>('sessions', this.currentSession.id, {
      lastActivityAt: now.toISOString(),
    });
  }

  async logout(): Promise<void> {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }

    if (this.currentSession) {
      await db.delete<Session>('sessions', this.currentSession.id);
    }

    this.currentUser = null;
    this.currentSession = null;

    await storage.delete('current-session-id');
    await storage.delete('guest-user-id');
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  hasRole(role: UserRole): boolean {
    return this.currentUser?.roles.includes(role) ?? false;
  }

  isOwner(): boolean {
    return this.hasRole('admin');
  }

  async updateUserProfile(
    updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'githubId' | 'githubLogin'>>
  ): Promise<UserProfile | null> {
    if (!this.currentUser) return null;

    const updated = await db.update<UserProfile>('users', this.currentUser.id, updates);

    if (updated) {
      this.currentUser = updated;
    }

    return updated;
  }

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    if (!this.currentUser) return;

    const updatedPreferences = {
      ...this.currentUser.preferences,
      ...preferences,
    };

    await this.updateUserProfile({ preferences: updatedPreferences });
  }

  async getAllUsers(options: { limit?: number; offset?: number } = {}): Promise<UserProfile[]> {
    if (!this.hasRole('moderator')) {
      throw new Error('Unauthorized: Moderator role required');
    }

    const result = await db.findMany<UserProfile>('users', {
      limit: options.limit ?? 50,
      offset: options.offset ?? 0,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    return result.data;
  }

  async getUserById(userId: string): Promise<UserProfile | null> {
    return await db.findById<UserProfile>('users', userId);
  }

  async deleteUser(userId: string): Promise<boolean> {
    if (!this.hasRole('admin')) {
      throw new Error('Unauthorized: Admin role required');
    }

    return await db.delete<UserProfile>('users', userId);
  }

  async suspendUser(userId: string): Promise<UserProfile | null> {
    if (!this.hasRole('moderator')) {
      throw new Error('Unauthorized: Moderator role required');
    }

    return await db.update<UserProfile>('users', userId, {
      status: 'suspended',
    });
  }

  async activateUser(userId: string): Promise<UserProfile | null> {
    if (!this.hasRole('moderator')) {
      throw new Error('Unauthorized: Moderator role required');
    }

    return await db.update<UserProfile>('users', userId, {
      status: 'active',
    });
  }

  async getActiveSessions(): Promise<Session[]> {
    if (!this.hasRole('admin')) {
      throw new Error('Unauthorized: Admin role required');
    }

    const now = new Date().toISOString();

    const result = await db.findMany<Session>('sessions', {
      filter: { expiresAt: { $gt: now } },
      sortBy: 'lastActivityAt',
      sortOrder: 'desc',
    });

    return result.data;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date().toISOString();

    // Get all sessions and filter expired ones
    const allSessions = await db.findMany<Session>('sessions', {});
    const expiredSessions = allSessions.data.filter((session) => session.expiresAt < now);

    // Delete expired sessions
    let deletedCount = 0;
    for (const session of expiredSessions) {
      const deleted = await db.delete<Session>('sessions', session.id);
      if (deleted) deletedCount++;
    }

    return deletedCount;
  }

  destroy(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }
}

export const enhancedAuth = new EnhancedAuthService();
