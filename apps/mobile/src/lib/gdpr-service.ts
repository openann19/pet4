/**
 * Mobile GDPR Service
 *
 * Handles GDPR-compliant data export and deletion for mobile app.
 */

import { apiClient } from '../utils/api-client';
import { createLogger } from './logger';
import type {
  UserDataExport,
  DataDeletionResult,
  DataExportRequest,
  DataDeletionRequest,
  ConsentRecord,
  ConsentUpdateRequest,
} from '@petspark/shared';
import { BaseGDPRService } from '@petspark/shared';

const logger = createLogger('GDPRService');

class MobileGDPRService extends BaseGDPRService {
  /**
   * Export user data (GDPR Right to Access)
   */
  async exportUserData(request: DataExportRequest): Promise<UserDataExport> {
    try {
      this.validateUserId(request.userId);

      const response = await apiClient.post<UserDataExport>('/api/gdpr/export', request);
      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to export user data', { error: err.message, userId: request.userId });
      throw err;
    }
  }

  /**
   * Delete user data (GDPR Right to Erasure)
   */
  async deleteUserData(request: DataDeletionRequest): Promise<DataDeletionResult> {
    try {
      this.validateDeletionRequest(request);

      const response = await apiClient.post<DataDeletionResult>('/api/gdpr/delete', request);
      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete user data', { error: err.message, userId: request.userId });
      throw err;
    }
  }

  /**
   * Get user consent status
   */
  async getConsentStatus(userId: string): Promise<ConsentRecord[]> {
    try {
      this.validateUserId(userId);

      const response = await apiClient.get<ConsentRecord[]>(
        `/api/gdpr/consent?userId=${userId}`
      );
      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get consent status', { error: err.message, userId });
      return [];
    }
  }

  /**
   * Update user consent
   */
  async updateConsent(request: ConsentUpdateRequest): Promise<ConsentRecord> {
    try {
      this.validateUserId(request.userId);

      const response = await apiClient.post<ConsentRecord>('/api/gdpr/consent', request);
      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update consent', {
        error: err.message,
        userId: request.userId,
        category: request.category,
      });
      throw err;
    }
  }
}

export const gdprService = new MobileGDPRService();
