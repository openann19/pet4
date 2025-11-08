/**
 * User Service
 *
 * Replaces window.spark.user() functionality.
 * Manages current user authentication and profile.
 */

import { log } from './logger';
import { storage } from './storage';

export interface User {
  id: string;
  login: string | null;
  avatarUrl: string | null;
  email: string | null;
  displayName?: string;
  isGuest?: boolean;
  [key: string]: unknown;
}

class UserService {
  private currentUser: User | null = null;
  private currentUserPromise: Promise<User | null> | null = null;

  /**
   * Get current user
   * Returns guest user if not authenticated
   */
  async user(): Promise<User | null> {
    // Return cached user if available
    if (this.currentUser) {
      return this.currentUser;
    }

    // Return existing promise if already loading
    if (this.currentUserPromise) {
      return this.currentUserPromise;
    }

    // Load user from storage
    this.currentUserPromise = this.loadUser();

    try {
      const user = await this.currentUserPromise;
      this.currentUser = user;
      return user;
    } finally {
      this.currentUserPromise = null;
    }
  }

  /**
   * Load user from storage
   */
  private async loadUser(): Promise<User | null> {
    try {
      // Try to get authenticated user
      const userId = await storage.get<string>('current-user-id');

      if (userId) {
        const user = await storage.get<User>(`user:${userId}`);
        if (user) {
          return user;
        }
      }

      // Check if user is authenticated
      const isAuthenticated = await storage.get<boolean>('is-authenticated');

      if (isAuthenticated) {
        // Try to get from all-users array
        const allUsers = (await storage.get<User[]>('all-users')) ?? [];
        const user = allUsers.find((u) => u.id === userId);
        if (user) {
          return user;
        }
      }

      // Return guest user
      return this.createGuestUser();
    } catch (error) {
      log.error(
        'Failed to load user',
        error instanceof Error ? error : new Error(String(error)),
        'UserService'
      );
      return this.createGuestUser();
    }
  }

  /**
   * Create a guest user object
   */
  private createGuestUser(): User {
    return {
      id: `guest-${Date.now()}`,
      login: null,
      avatarUrl: null,
      email: null,
      isGuest: true,
    };
  }

  /**
   * Set current user
   */
  async setUser(user: User): Promise<void> {
    this.currentUser = user;

    // Store user ID
    await storage.set('current-user-id', user.id);

    // Store user object
    await storage.set(`user:${user.id}`, user);

    // Update all-users array
    const allUsers = (await storage.get<User[]>('all-users')) ?? [];
    const existingIndex = allUsers.findIndex((u) => u.id === user.id);

    if (existingIndex >= 0) {
      allUsers[existingIndex] = user;
    } else {
      allUsers.push(user);
    }

    await storage.set('all-users', allUsers);
    await storage.set('is-authenticated', !user.isGuest);
  }

  /**
   * Clear current user (logout)
   */
  async clearUser(): Promise<void> {
    this.currentUser = null;
    await storage.delete('current-user-id');
    await storage.set('is-authenticated', false);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      // Try direct storage
      const user = await storage.get<User>(`user:${userId}`);
      if (user) {
        return user;
      }

      // Try all-users array
      const allUsers = (await storage.get<User[]>('all-users')) ?? [];
      return allUsers.find((u) => u.id === userId) ?? null;
    } catch (error) {
      log.error(
        `Failed to get user ${userId}`,
        error instanceof Error ? error : new Error(String(error)),
        'UserService'
      );
      return null;
    }
  }
}

// Export singleton instance
export const userService = new UserService();
