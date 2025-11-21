/**
 * GDPR Compliance Service (Web)
 *
 * Enhanced GDPR compliance with consent management, data subject rights,
 * data portability, and privacy policy integration.
 * Features:
 * - Consent management improvements
 * - Data subject rights (access, rectification, erasure)
 * - Data portability enhancements
 * - Privacy policy and terms integration
 *
 * Location: apps/web/src/lib/privacy/gdpr.ts
 */

import { createLogger } from '../logger';
import { gdprApi } from '@/api/gdpr-api';

const logger = createLogger('gdpr-service');

/**
 * Consent type
 */
export type ConsentType = 'necessary' | 'analytics' | 'marketing' | 'functional' | 'performance';

/**
 * Consent status
 */
export interface ConsentStatus {
  readonly type: ConsentType;
  readonly granted: boolean;
  readonly grantedAt?: number;
  readonly revokedAt?: number;
  readonly purpose: string;
  readonly legalBasis: string;
}

/**
 * Data subject right
 */
export type DataSubjectRight =
  | 'access'
  | 'rectification'
  | 'erasure'
  | 'restriction'
  | 'portability'
  | 'objection'
  | 'withdraw-consent';

/**
 * Data subject request
 */
export interface DataSubjectRequest {
  readonly id: string;
  readonly userId: string;
  readonly right: DataSubjectRight;
  readonly status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  readonly requestedAt: number;
  readonly completedAt?: number;
  readonly data?: unknown;
  readonly reason?: string;
}

/**
 * Data portability format
 */
export type DataPortabilityFormat = 'json' | 'csv' | 'xml';

/**
 * GDPR service
 */
export class GDPRService {
  private readonly consents = new Map<string, ConsentStatus>();
  private readonly requests = new Map<string, DataSubjectRequest>();

  /**
   * Grant consent
   */
  async grantConsent(
    userId: string,
    type: ConsentType,
    purpose: string,
    legalBasis: string
  ): Promise<void> {
    const consent: ConsentStatus = {
      type,
      granted: true,
      grantedAt: Date.now(),
      purpose,
      legalBasis,
    };

    this.consents.set(`${userId}:${type}`, consent);

    // Persist to API
    try {
      await gdprApi.grantConsent(userId, {
        type,
        granted: true,
        grantedAt: consent.grantedAt ?? Date.now(),
        purpose,
        legalBasis,
      });
    } catch (error) {
      logger.error('Failed to persist consent to API', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }

    logger.debug('Consent granted', { userId, type, purpose });
  }

  /**
   * Revoke consent
   */
  async revokeConsent(userId: string, type: ConsentType): Promise<void> {
    const key = `${userId}:${type}`;
    const existing = this.consents.get(key);

    if (existing) {
      const updated: ConsentStatus = {
        ...existing,
        granted: false,
        revokedAt: Date.now(),
      };
      this.consents.set(key, updated);

      // Persist to API
      try {
        await gdprApi.revokeConsent(userId, type);
      } catch (error) {
        logger.error('Failed to persist consent revocation to API', {
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }

      logger.debug('Consent revoked', { userId, type });
    }
  }

  /**
   * Get consent status
   */
  getConsentStatus(userId: string, type: ConsentType): ConsentStatus | null {
    return this.consents.get(`${userId}:${type}`) ?? null;
  }

  /**
   * Get all consents for user
   */
  getUserConsents(userId: string): readonly ConsentStatus[] {
    const userConsents: ConsentStatus[] = [];

    this.consents.forEach((consent, key) => {
      if (key.startsWith(`${userId}:`)) {
        userConsents.push(consent);
      }
    });

    return userConsents;
  }

  /**
   * Request data access (Right to Access)
   */
  async requestDataAccess(userId: string): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      id: `request-${userId}-${Date.now()}`,
      userId,
      right: 'access',
      status: 'pending',
      requestedAt: Date.now(),
    };

    this.requests.set(request.id, request);

    // Submit to API
    try {
      const apiRequest = await gdprApi.requestDataAccess(userId);
      // Update request with API response
      this.requests.set(apiRequest.id, {
        id: apiRequest.id,
        userId: apiRequest.userId,
        right: apiRequest.right,
        status: apiRequest.status,
        requestedAt: apiRequest.requestedAt,
        completedAt: apiRequest.completedAt,
        data: apiRequest.data,
        reason: apiRequest.reason,
      });
      logger.debug('Data access request submitted', { requestId: apiRequest.id, userId });
      return {
        id: apiRequest.id,
        userId: apiRequest.userId,
        right: apiRequest.right,
        status: apiRequest.status,
        requestedAt: apiRequest.requestedAt,
        completedAt: apiRequest.completedAt,
        data: apiRequest.data,
        reason: apiRequest.reason,
      };
    } catch (error) {
      logger.error('Failed to submit data access request', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      // Return local request even if API call fails
      return request;
    }
  }

  /**
   * Request data rectification (Right to Rectification)
   */
  async requestDataRectification(
    userId: string,
    corrections: Record<string, unknown>
  ): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      id: `request-${userId}-${Date.now()}`,
      userId,
      right: 'rectification',
      status: 'pending',
      requestedAt: Date.now(),
      data: corrections,
    };

    this.requests.set(request.id, request);

    // Submit to API
    try {
      const apiRequest = await gdprApi.requestDataRectification({
        userId,
        corrections,
      });
      // Update request with API response
      this.requests.set(apiRequest.id, {
        id: apiRequest.id,
        userId: apiRequest.userId,
        right: apiRequest.right,
        status: apiRequest.status,
        requestedAt: apiRequest.requestedAt,
        completedAt: apiRequest.completedAt,
        data: apiRequest.data,
        reason: apiRequest.reason,
      });
      logger.debug('Data rectification request submitted', { requestId: apiRequest.id, userId });
      return {
        id: apiRequest.id,
        userId: apiRequest.userId,
        right: apiRequest.right,
        status: apiRequest.status,
        requestedAt: apiRequest.requestedAt,
        completedAt: apiRequest.completedAt,
        data: apiRequest.data,
        reason: apiRequest.reason,
      };
    } catch (error) {
      logger.error('Failed to submit data rectification request', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      // Return local request even if API call fails
      return request;
    }
  }

  /**
   * Request data erasure (Right to Erasure)
   */
  async requestDataErasure(userId: string, reason?: string): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      id: `request-${userId}-${Date.now()}`,
      userId,
      right: 'erasure',
      status: 'pending',
      requestedAt: Date.now(),
      reason,
    };

    this.requests.set(request.id, request);

    // Submit to API
    try {
      const apiRequest = await gdprApi.requestDataErasure(userId, reason);
      // Update request with API response
      this.requests.set(apiRequest.id, {
        id: apiRequest.id,
        userId: apiRequest.userId,
        right: apiRequest.right,
        status: apiRequest.status,
        requestedAt: apiRequest.requestedAt,
        completedAt: apiRequest.completedAt,
        data: apiRequest.data,
        reason: apiRequest.reason,
      });
      logger.debug('Data erasure request submitted', { requestId: apiRequest.id, userId });
      return {
        id: apiRequest.id,
        userId: apiRequest.userId,
        right: apiRequest.right,
        status: apiRequest.status,
        requestedAt: apiRequest.requestedAt,
        completedAt: apiRequest.completedAt,
        data: apiRequest.data,
        reason: apiRequest.reason,
      };
    } catch (error) {
      logger.error('Failed to submit data erasure request', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      // Return local request even if API call fails
      return request;
    }
  }

  /**
   * Request data portability (Right to Data Portability)
   */
  async requestDataPortability(
    userId: string,
    format: DataPortabilityFormat = 'json'
  ): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      id: `request-${userId}-${Date.now()}`,
      userId,
      right: 'portability',
      status: 'pending',
      requestedAt: Date.now(),
      data: { format },
    };

    this.requests.set(request.id, request);

    // Submit to API
    try {
      const apiRequest = await gdprApi.requestDataPortability(userId, format);
      // Update request with API response
      this.requests.set(apiRequest.id, {
        id: apiRequest.id,
        userId: apiRequest.userId,
        right: apiRequest.right,
        status: apiRequest.status,
        requestedAt: apiRequest.requestedAt,
        completedAt: apiRequest.completedAt,
        data: apiRequest.data,
        reason: apiRequest.reason,
      });
      logger.debug('Data portability request submitted', {
        requestId: apiRequest.id,
        userId,
        format,
      });
      return {
        id: apiRequest.id,
        userId: apiRequest.userId,
        right: apiRequest.right,
        status: apiRequest.status,
        requestedAt: apiRequest.requestedAt,
        completedAt: apiRequest.completedAt,
        data: apiRequest.data,
        reason: apiRequest.reason,
      };
    } catch (error) {
      logger.error('Failed to submit data portability request', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      // Return local request even if API call fails
      return request;
    }
  }

  /**
   * Get request status
   */
  getRequestStatus(requestId: string): DataSubjectRequest | null {
    return this.requests.get(requestId) ?? null;
  }

  /**
   * Get user requests
   */
  getUserRequests(userId: string): readonly DataSubjectRequest[] {
    const userRequests: DataSubjectRequest[] = [];

    this.requests.forEach((request) => {
      if (request.userId === userId) {
        userRequests.push(request);
      }
    });

    return userRequests;
  }

  /**
   * Export user data (Right to Access)
   */
  async exportUserData(userId: string, format: DataPortabilityFormat = 'json'): Promise<Blob> {
    try {
      const response = await gdprApi.exportUserData({
        userId,
        format: format === 'json' ? 'json' : undefined,
      });
      const jsonString = JSON.stringify(response, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      logger.debug('User data exported', { userId, format });
      return blob;
    } catch (error) {
      logger.error('Failed to export user data', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }

  /**
   * Delete user data (Right to Erasure)
   */
  async deleteUserData(userId: string, reason?: string): Promise<void> {
    try {
      await gdprApi.deleteUserData({
        userId,
        confirmDeletion: true,
        reason: reason ?? 'User requested deletion',
      });
      logger.debug('User data deletion requested', { userId, reason });
    } catch (error) {
      logger.error('Failed to delete user data', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }

  /**
   * Fetch request status from API
   */
  async fetchRequestStatus(userId: string): Promise<void> {
    try {
      const apiRequests = await gdprApi.getUserRequests(userId);
      apiRequests.forEach((request) => {
        this.requests.set(request.id, {
          id: request.id,
          userId: request.userId,
          right: request.right,
          status: request.status,
          requestedAt: request.requestedAt,
          completedAt: request.completedAt,
          data: request.data,
          reason: request.reason,
        });
      });
      logger.debug('Request status fetched', { userId, count: apiRequests.length });
    } catch (error) {
      logger.error('Failed to fetch request status', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }
}

/**
 * Create GDPR service instance
 */
let gdprServiceInstance: GDPRService | null = null;

export function getGDPRService(): GDPRService {
  gdprServiceInstance ??= new GDPRService();
  return gdprServiceInstance;
}
