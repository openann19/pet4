/**
 * Spark API wrapper
 * Provides access to Spark framework functionality
 */

import { userService } from './user-service';
import type { User } from './user-service';

/**
 * Spark API interface
 * Mirrors the Spark framework's global spark object
 */
export const spark = {
  /**
   * Get current user
   * Returns the authenticated user or throws if not authenticated
   */
  async user(): Promise<User> {
    const user = await userService.user();
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user;
  },
};
