/**
 * Admin API Service
 *
 * Handles admin-only endpoints for system management and analytics.
 */

import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AdminApi');

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalPets: number;
  totalMatches: number;
  totalMessages: number;
  pendingReports: number;
  pendingVerifications: number;
  resolvedReports: number;
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string;
  timestamp: string;
  ipAddress?: string;
}

class AdminApiImpl {
  /**
   * Get system statistics for admin dashboard
   */
  async getSystemStats(): Promise<SystemStats> {
    try {
      const response = await APIClient.get<SystemStats>(ENDPOINTS.ADMIN.ANALYTICS);
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get system stats', err);
      // Return default stats on error
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalPets: 0,
        totalMatches: 0,
        totalMessages: 0,
        pendingReports: 0,
        pendingVerifications: 0,
        resolvedReports: 0,
      };
    }
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      await APIClient.post(`${ENDPOINTS.ADMIN.SETTINGS}/audit`, {
        ...entry,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create audit log', err, { action: entry.action });
      // Don't throw - audit logging failures shouldn't break the app
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
    try {
      const response = await APIClient.get<AuditLogEntry[]>(
        `${ENDPOINTS.ADMIN.SETTINGS}/audit?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get audit logs', err);
      return [];
    }
  }
  /**
   * Moderate photo/content
   */
  async moderatePhoto(taskId: string, action: string, reason?: string): Promise<void> {
    try {
      await APIClient.post(`${ENDPOINTS.ADMIN.SETTINGS}/moderate`, {
        taskId,
        action,
        reason: reason || undefined,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to moderate photo', err, { taskId, action });
      throw err;
    }
  }

  /**
   * Reset user password (admin-initiated)
   * @param userId - User ID to reset password for
   * @param options - Reset options: sendEmail (default true) or newPassword (optional)
   */
  async resetUserPassword(
    userId: string,
    options?: {
      sendEmail?: boolean;
      newPassword?: string;
    }
  ): Promise<{ success: boolean; resetToken?: string; message: string }> {
    try {
      const response = await APIClient.post<{
        success: boolean;
        resetToken?: string;
        message: string;
      }>(ENDPOINTS.ADMIN.RESET_PASSWORD(userId), {
        sendEmail: options?.sendEmail ?? true,
        newPassword: options?.newPassword,
      });
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to reset user password', err, { userId });
      throw err;
    }
  }

  /**
   * Get detailed user information
   */
  async getUserDetails(userId: string): Promise<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    joinedAt: string;
    lastActive: string;
    [key: string]: unknown;
  }> {
    try {
      const response = await APIClient.get<{
        id: string;
        name: string;
        email: string;
        role: string;
        status: string;
        joinedAt: string;
        lastActive: string;
        [key: string]: unknown;
      }>(ENDPOINTS.ADMIN.USER(userId));
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user details', err, { userId });
      throw err;
    }
  }

  /**
   * Update user details
   */
  async updateUser(
    userId: string,
    updates: {
      name?: string;
      email?: string;
      role?: string;
      status?: string;
      [key: string]: unknown;
    }
  ): Promise<void> {
    try {
      await APIClient.put(ENDPOINTS.ADMIN.USER(userId), updates);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update user', err, { userId });
      throw err;
    }
  }

  /**
   * Broadcast config update to all clients
   */
  async broadcastConfig(
    configType: 'business' | 'matching' | 'map' | 'api' | 'system',
    config: Record<string, unknown>
  ): Promise<{ success: boolean; version: number }> {
    try {
      const response = await APIClient.post<{ success: boolean; version: number }>(
        ENDPOINTS.ADMIN.CONFIG_BROADCAST,
        {
          configType,
          config,
          timestamp: new Date().toISOString(),
        }
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to broadcast config', err, { configType });
      throw err;
    }
  }

  /**
   * Get config change history
   */
  async getConfigHistory(
    configType?: string,
    limit = 50
  ): Promise<
    {
      id: string;
      configType: string;
      changedBy: string;
      timestamp: string;
      changes: Record<string, unknown>;
    }[]
  > {
    try {
      const params = new URLSearchParams();
      if (configType) params.append('type', configType);
      params.append('limit', limit.toString());

      const response = await APIClient.get<
        {
          id: string;
          configType: string;
          changedBy: string;
          timestamp: string;
          changes: Record<string, unknown>;
        }[]
      >(`${ENDPOINTS.ADMIN.CONFIG_HISTORY}?${params.toString()}`);
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get config history', err);
      return [];
    }
  }
}

export const adminApi = new AdminApiImpl();
