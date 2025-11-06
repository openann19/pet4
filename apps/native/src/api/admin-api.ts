/**
 * Mobile Admin API Client
 * 
 * Admin API client for mobile app, matching web API structure.
 */

import type { AdminUser, AdminAction } from '@petspark/shared'

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
  private baseUrl = '/api/v1/admin';

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<SystemStats> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return await response.json();
    } catch (error) {
      console.error('Failed to get system stats:', error);
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
      const response = await fetch(`${this.baseUrl}/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendEmail: options?.sendEmail ?? true,
          ...(options?.newPassword ? { newPassword: options.newPassword } : {}),
        }),
      });
      if (!response.ok) throw new Error('Failed to reset password');
      return await response.json();
    } catch (error) {
      console.error('Failed to reset password:', error);
      throw error;
    }
  }

  /**
   * Get user details
   */
  async getUserDetails(userId: string): Promise<AdminUser> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return await response.json();
    } catch (error) {
      console.error('Failed to get user details:', error);
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
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update user');
    } catch (error) {
      console.error('Failed to update user:', error);
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
      const response = await fetch(`${this.baseUrl}/config/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configType,
          config,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Failed to broadcast config');
      return await response.json();
    } catch (error) {
      console.error('Failed to broadcast config:', error);
      throw error;
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(limit: number = 100): Promise<AdminAction[]> {
    try {
      const response = await fetch(`${this.baseUrl}/audit-logs?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      return await response.json();
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(entry: Omit<AdminAction, 'id' | 'timestamp'>): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/audit-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...entry,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Moderate photo/content
   */
  async moderatePhoto(
    taskId: string,
    action: string,
    reason?: string
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/moderation/photos/${taskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      if (!response.ok) throw new Error('Failed to moderate photo');
    } catch (error) {
      console.error('Failed to moderate photo:', error);
      throw error;
    }
  }

  /**
   * Get KYC queue
   */
  async getKYCQueue(): Promise<Array<{
    id: string;
    userId: string;
    status: string;
    createdAt: string;
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/kyc/queue`);
      if (!response.ok) throw new Error('Failed to fetch KYC queue');
      const data = await response.json();
      return data.pending || [];
    } catch (error) {
      console.error('Failed to get KYC queue:', error);
      return [];
    }
  }

  /**
   * Review KYC session
   */
  async reviewKYC(
    sessionId: string,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/kyc/sessions/${sessionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      if (!response.ok) throw new Error('Failed to review KYC');
    } catch (error) {
      console.error('Failed to review KYC:', error);
      throw error;
    }
  }
}

export const mobileAdminApi = new MobileAdminApiImpl();

