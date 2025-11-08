/**
 * KYC API Service
 *
 * Handles identity verification, age verification, consent management through backend API.
 */

import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import type {
  KYCSubmission,
  KYCStatus,
  ConsentRecord,
  AgeVerification,
  KYCAuditLog,
} from '@/lib/kyc-types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('KYCApi');

export interface StartKYCRequest {
  userId: string;
  provider: 'onfido' | 'veriff' | 'jumio' | 'manual';
}

export interface StartKYCResponse {
  sessionId: string;
  submissionId: string;
  providerToken?: string;
  url?: string;
}

export interface KYCWebhookRequest {
  submissionId: string;
  status: 'verified' | 'rejected';
  reference?: string;
  reason?: string;
  riskScore?: number;
  country?: string;
  documentType?: string;
}

export interface RecordConsentRequest {
  userId: string;
  type: 'terms' | 'privacy' | 'marketing';
  version: string;
  accepted: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface RecordAgeVerificationRequest {
  userId: string;
  ageVerified: boolean;
  country?: string;
}

export interface ManualKYCReviewRequest {
  submissionId: string;
  decision: 'verified' | 'rejected';
  actorUserId: string;
  reason?: string;
}

class KYCApiImpl {
  /**
   * Start KYC verification process
   */
  async startKYC(request: StartKYCRequest): Promise<StartKYCResponse> {
    try {
      const response = await APIClient.post<StartKYCResponse>(
        ENDPOINTS.KYC.START_VERIFICATION,
        request
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to start KYC', err, {
        userId: request.userId,
        provider: request.provider,
      });
      throw err;
    }
  }

  /**
   * Get KYC status for user
   */
  async getKYCStatus(userId: string): Promise<KYCStatus> {
    try {
      const response = await APIClient.get<{ status: KYCStatus }>(
        `${ENDPOINTS.KYC.STATUS}?userId=${userId}`
      );
      return response.data.status;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get KYC status', err, { userId });
      throw err;
    }
  }

  /**
   * Get KYC submission by ID
   */
  async getKYCSubmission(submissionId: string): Promise<KYCSubmission | null> {
    try {
      const response = await APIClient.get<KYCSubmission>(
        ENDPOINTS.KYC.GET_VERIFICATION(submissionId)
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get KYC submission', err, { submissionId });
      // Return null if not found (404)
      if (err instanceof Error && 'status' in err && (err as { status: number }).status === 404) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Get user's KYC submissions
   */
  async getUserKYCSubmissions(userId: string): Promise<KYCSubmission[]> {
    try {
      const response = await APIClient.get<KYCSubmission[]>(
        `${ENDPOINTS.KYC.STATUS}?userId=${userId}&submissions=true`
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user KYC submissions', err, { userId });
      return [];
    }
  }

  /**
   * Handle KYC webhook from provider
   */
  async handleKYCWebhook(request: KYCWebhookRequest): Promise<void> {
    try {
      await APIClient.post(
        `${ENDPOINTS.KYC.GET_VERIFICATION(request.submissionId)}/webhook`,
        request
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to handle KYC webhook', err, { submissionId: request.submissionId });
      throw err;
    }
  }

  /**
   * Manual verify/reject (admin only)
   */
  async manualKYCReview(request: ManualKYCReviewRequest): Promise<void> {
    try {
      await APIClient.post(
        `${ENDPOINTS.KYC.GET_VERIFICATION(request.submissionId)}/review`,
        request
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to manual review KYC', err, { submissionId: request.submissionId });
      throw err;
    }
  }

  /**
   * Record age verification
   */
  async recordAgeVerification(request: RecordAgeVerificationRequest): Promise<AgeVerification> {
    try {
      const response = await APIClient.post<AgeVerification>(
        `${ENDPOINTS.KYC.STATUS}/age-verification`,
        request
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to record age verification', err, { userId: request.userId });
      throw err;
    }
  }

  /**
   * Record consent
   */
  async recordConsent(request: RecordConsentRequest): Promise<ConsentRecord> {
    try {
      const response = await APIClient.post<ConsentRecord>(
        `${ENDPOINTS.KYC.STATUS}/consent`,
        request
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to record consent', err, { userId: request.userId, type: request.type });
      throw err;
    }
  }

  /**
   * Get user consents
   */
  async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    try {
      const response = await APIClient.get<ConsentRecord[]>(
        `${ENDPOINTS.KYC.STATUS}/consent?userId=${userId}`
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user consents', err, { userId });
      return [];
    }
  }

  /**
   * Get KYC audit logs
   */
  async getKYCAuditLogs(userId?: string, submissionId?: string): Promise<KYCAuditLog[]> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (submissionId) params.append('submissionId', submissionId);

      const response = await APIClient.get<KYCAuditLog[]>(
        `${ENDPOINTS.KYC.STATUS}/audit?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get KYC audit logs', err, { userId, submissionId });
      return [];
    }
  }

  /**
   * Get all KYC submissions (admin only)
   */
  async getAllKYCSubmissions(): Promise<KYCSubmission[]> {
    try {
      const response = await APIClient.get<KYCSubmission[]>(
        `${ENDPOINTS.KYC.STATUS}/admin/submissions`
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get all KYC submissions', err);
      return [];
    }
  }
}

export const kycApi = new KYCApiImpl();
