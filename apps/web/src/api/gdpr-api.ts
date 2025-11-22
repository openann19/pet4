/**
 * GDPR API Service
 *
 * Enhanced GDPR-compliant data export, deletion, consent management, and data subject rights through backend API.
 */

import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import { createLogger } from '@/lib/logger';
import type {
  UserDataExport,
  DataDeletionResult,
  DataExportRequest,
  DataDeletionRequest,
  ConsentRecord,
  ConsentUpdateRequest,
} from '@petspark/shared';

const logger = createLogger('GDPRApi');

/**
 * Data rectification request
 */
export interface DataRectificationRequest {
  readonly userId: string;
  readonly corrections: Record<string, unknown>;
  readonly reason?: string;
}

/**
 * Data subject request status
 */
export interface DataSubjectRequestStatus {
  readonly id: string;
  readonly userId: string;
  readonly right: 'access' | 'rectification' | 'erasure' | 'portability';
  readonly status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  readonly requestedAt: number;
  readonly completedAt?: number;
  readonly data?: unknown;
  readonly reason?: string;
}

/**
 * Grant consent request
 */
export interface GrantConsentRequest {
  readonly type: string;
  readonly granted: boolean;
  readonly grantedAt: number;
  readonly purpose: string;
  readonly legalBasis: string;
}

class GDPRApiImpl {
  /**
   * Export user data (GDPR Right to Access)
   */
  async exportUserData(request: DataExportRequest): Promise<UserDataExport> {
    try {
      const response = await APIClient.post<UserDataExport>(
        ENDPOINTS.GDPR.EXPORT,
        request
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to export user data', err, {
        userId: request.userId,
      });
      throw err;
    }
  }

  /**
   * Delete user data (GDPR Right to Erasure)
   */
  async deleteUserData(request: DataDeletionRequest): Promise<DataDeletionResult> {
    try {
      const response = await APIClient.post<DataDeletionResult>(
        ENDPOINTS.GDPR.DELETE,
        request
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete user data', err, {
        userId: request.userId,
      });
      throw err;
    }
  }

  /**
   * Get user consent status
   */
  async getConsentStatus(userId: string): Promise<ConsentRecord[]> {
    try {
      const response = await APIClient.get<ConsentRecord[]>(
        ENDPOINTS.GDPR.CONSENT_STATUS(userId)
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get consent status', err, { userId });
      return [];
    }
  }

  /**
   * Update user consent
   */
  async updateConsent(request: ConsentUpdateRequest): Promise<ConsentRecord> {
    try {
      const response = await APIClient.post<ConsentRecord>(
        ENDPOINTS.GDPR.UPDATE_CONSENT,
        request
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update consent', err, {
        userId: request.userId,
        category: request.category,
      });
      throw err;
    }
  }

  /**
   * Request data access (Right to Access)
   */
  async requestDataAccess(userId: string): Promise<DataSubjectRequestStatus> {
    try {
      const response = await APIClient.post<DataSubjectRequestStatus>(
        `${ENDPOINTS.GDPR.EXPORT}/request`,
        { userId }
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to request data access', err, { userId });
      throw err;
    }
  }

  /**
   * Request data rectification (Right to Rectification)
   */
  async requestDataRectification(request: DataRectificationRequest): Promise<DataSubjectRequestStatus> {
    try {
      const response = await APIClient.post<DataSubjectRequestStatus>(
        '/api/gdpr/rectification',
        request
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to request data rectification', err, {
        userId: request.userId,
      });
      throw err;
    }
  }

  /**
   * Request data erasure (Right to Erasure)
   */
  async requestDataErasure(userId: string, reason?: string): Promise<DataSubjectRequestStatus> {
    try {
      const response = await APIClient.post<DataSubjectRequestStatus>(
        `${ENDPOINTS.GDPR.DELETE}/request`,
        { userId, reason }
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to request data erasure', err, { userId });
      throw err;
    }
  }

  /**
   * Request data portability (Right to Data Portability)
   */
  async requestDataPortability(userId: string, format: 'json' | 'csv' | 'xml' = 'json'): Promise<DataSubjectRequestStatus> {
    try {
      const response = await APIClient.post<DataSubjectRequestStatus>(
        `${ENDPOINTS.GDPR.EXPORT}/portability`,
        { userId, format }
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to request data portability', err, { userId, format });
      throw err;
    }
  }

  /**
   * Get data subject request status
   */
  async getRequestStatus(userId: string, requestId: string): Promise<DataSubjectRequestStatus | null> {
    try {
      const response = await APIClient.get<DataSubjectRequestStatus>(
        `/api/gdpr/requests/${userId}/${requestId}`
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get request status', err, { userId, requestId });
      return null;
    }
  }

  /**
   * Get all data subject requests for user
   */
  async getUserRequests(userId: string): Promise<DataSubjectRequestStatus[]> {
    try {
      const response = await APIClient.get<DataSubjectRequestStatus[]>(
        `/api/gdpr/requests/${userId}`
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user requests', err, { userId });
      return [];
    }
  }

  /**
   * Grant consent (internal method for GDPR service)
   */
  async grantConsent(userId: string, request: GrantConsentRequest): Promise<void> {
    try {
      await APIClient.post(
        ENDPOINTS.GDPR.UPDATE_CONSENT,
        {
          userId,
          category: request.type,
          status: request.granted ? 'accepted' : 'rejected',
          version: '1.0.0',
        }
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to grant consent', err, { userId, type: request.type });
      throw err;
    }
  }

  /**
   * Revoke consent (internal method for GDPR service)
   */
  async revokeConsent(userId: string, type: string): Promise<void> {
    try {
      await APIClient.post(
        ENDPOINTS.GDPR.UPDATE_CONSENT,
        {
          userId,
          category: type,
          status: 'withdrawn',
          version: '1.0.0',
        }
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to revoke consent', err, { userId, type });
      throw err;
    }
  }
}

export const gdprApi = new GDPRApiImpl();
