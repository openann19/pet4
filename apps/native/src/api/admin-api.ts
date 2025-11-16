/**
 * Mobile Admin API Client
 *
 * Admin API client for mobile app, matching web API structure.
 */

import type { AdminUser, AdminAction } from '@petspark/shared';
import { createLogger } from '../utils/logger';
import { apiClient } from '../utils/api-client';

const logger = createLogger('AdminAPI');

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

export interface ResetPasswordOptions {
  sendEmail?: boolean;
  newPassword?: string;
}

export interface ResetPasswordResult {
  success: boolean;
  resetToken?: string;
  message: string;
}

class MobileAdminApiImpl {
  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<SystemStats> {
    try {
      return await apiClient.get<SystemStats>('/v1/admin/analytics');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get system stats', err, { context: 'getSystemStats' });
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
   * Reset user password (admin-initiated)
   */
  async resetUserPassword(
    userId: string,
    options?: ResetPasswordOptions
  ): Promise<ResetPasswordResult> {
    try {
      return await apiClient.post<ResetPasswordResult>(`/v1/admin/users/${userId}/reset-password`, {
        sendEmail: options?.sendEmail ?? true,
        ...(options?.newPassword ? { newPassword: options.newPassword } : {}),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to reset password', err, { context: 'resetUserPassword', userId });
      throw error;
    }
  }

  /**
   * Get user details
   */
  async getUserDetails(userId: string): Promise<AdminUser> {
    try {
      return await apiClient.get<AdminUser>(`/v1/admin/users/${userId}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user details', err, { context: 'getUserDetails', userId });
      throw error;
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
    }
  ): Promise<void> {
    try {
      await apiClient.put(`/v1/admin/users/${userId}`, updates);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update user', err, { context: 'updateUser', userId });
      throw error;
    }
  }

  /**
   * Broadcast config update
   */
  async broadcastConfig(
    configType: 'business' | 'matching' | 'map' | 'api' | 'system',
    config: Record<string, unknown>
  ): Promise<{ success: boolean; version: number }> {
    try {
      return await apiClient.post<{ success: boolean; version: number }>(
        '/v1/admin/config/broadcast',
        {
          configType,
          config,
          timestamp: new Date().toISOString(),
        }
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to broadcast config', err, { context: 'broadcastConfig', configType });
      throw error;
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(limit: number = 100): Promise<AdminAction[]> {
    try {
      return await apiClient.get<AdminAction[]>(`/v1/admin/audit-logs?limit=${limit}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get audit logs', err, { context: 'getAuditLogs', limit });
      return [];
    }
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(entry: Omit<AdminAction, 'id' | 'timestamp'>): Promise<void> {
    try {
      // Convert details to string if it's an object (for backend compatibility)
      const details = entry.details
        ? typeof entry.details === 'string'
          ? entry.details
          : JSON.stringify(entry.details)
        : undefined;

      await apiClient.post('/v1/admin/audit-logs', {
        adminId: entry.adminId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create audit log', err, { context: 'createAuditLog', entry });
    }
  }

  /**
   * Moderate photo/content
   */
  async moderatePhoto(taskId: string, action: string, reason?: string): Promise<void> {
    try {
      await apiClient.post(`/v1/admin/moderation/photos/${taskId}`, { action, reason });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to moderate photo', err, { context: 'moderatePhoto', taskId, action });
      throw error;
    }
  }

  /**
   * Get KYC queue
   */
  async getKYCQueue(): Promise<
    Array<{
      id: string;
      userId: string;
      status: string;
      createdAt: string;
    }>
  > {
    try {
      const data = await apiClient.get<{ pending?: Array<{ id: string; userId: string; status: string; createdAt: string }> }>(
        '/v1/admin/kyc/queue'
      );
      return data.pending || [];
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get KYC queue', err, { context: 'getKYCQueue' });
      return [];
    }
  }

  /**
   * Review KYC session
   */
  async reviewKYC(sessionId: string, action: 'approve' | 'reject', reason?: string): Promise<void> {
    try {
      await apiClient.post(`/v1/admin/kyc/sessions/${sessionId}/review`, { action, reason });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to review KYC', err, { context: 'reviewKYC', sessionId, action });
      throw error;
    }
  }

  /**
   * Get system configuration
   */
  async getSystemConfig(): Promise<Record<string, unknown> | null> {
    try {
      const response = await apiClient.get<{ config: Record<string, unknown> | null }>(
        '/v1/admin/config/system'
      );
      return response.config;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get system config', err, { context: 'getSystemConfig' });
      return null;
    }
  }

  /**
   * Update system configuration
   */
  async updateSystemConfig(
    config: Record<string, unknown>,
    updatedBy?: string
  ): Promise<Record<string, unknown>> {
    try {
      const response = await apiClient.put<{ config: Record<string, unknown> }>(
        '/v1/admin/config/system',
        {
          config,
          ...(updatedBy ? { updatedBy } : {}),
        }
      );
      return response.config;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update system config', err, { context: 'updateSystemConfig' });
      throw error;
    }
  }
}

export const mobileAdminApi = new MobileAdminApiImpl();
