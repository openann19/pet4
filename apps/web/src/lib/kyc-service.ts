/**
 * KYC Service
 *
 * Handles identity verification, age gate, consent management, and KYC pipeline.
 * Migrated from legacy KV mocks to use backend API endpoints.
 */

import type { KYCSubmission, KYCStatus, ConsentRecord, AgeVerification } from './kyc-types';
import { kycApi } from '@/api/kyc-api';
import { createLogger } from './logger';

const logger = createLogger('KYCService');

/**
 * Start KYC process
 */
export async function startKYC(
  userId: string,
  provider: 'onfido' | 'veriff' | 'jumio' | 'manual' = 'onfido'
): Promise<{ sessionId: string; providerToken?: string; url?: string }> {
  try {
    const result = await kycApi.startKYC({ userId, provider });
    return {
      sessionId: result.submissionId,
      ...(result.providerToken ? { providerToken: result.providerToken } : {}),
      ...(result.url ? { url: result.url } : {}),
    };
  } catch (_error) {
    const err = _error instanceof Error ? _error : new Error(String(_error));
    logger.error('KYC start failed', err, { action: 'startKYC', userId, provider });
    throw err;
  }
}

/**
 * Handle KYC webhook from provider
 */
export async function handleKYCWebhook(
  submissionId: string,
  status: 'verified' | 'rejected',
  data: {
    reference?: string;
    reason?: string;
    riskScore?: number;
    country?: string;
    documentType?: string;
  }
): Promise<void> {
  try {
    await kycApi.handleKYCWebhook({
      submissionId,
      status,
      ...data,
    });
  } catch (_error) {
    const err = _error instanceof Error ? _error : new Error(String(_error));
    logger.error('KYC webhook handling failed', err, { submissionId, status });
    throw err;
  }
}

/**
 * Get KYC status for user
 */
export async function getKYCStatus(userId: string): Promise<KYCStatus> {
  try {
    return await kycApi.getKYCStatus(userId);
  } catch (_error) {
    const err = _error instanceof Error ? _error : new Error(String(_error));
    logger.error('Failed to get KYC status', err, { userId });
    return 'not_started';
  }
}

/**
 * Get KYC submission by ID
 */
export async function getKYCSubmission(submissionId: string): Promise<KYCSubmission | null> {
  try {
    return await kycApi.getKYCSubmission(submissionId);
  } catch (_error) {
    const err = _error instanceof Error ? _error : new Error(String(_error));
    logger.error('Failed to get KYC submission', err, { submissionId });
    return null;
  }
}

/**
 * Manual verify/reject (admin only)
 */
export async function manualKYCReview(
  submissionId: string,
  decision: 'verified' | 'rejected',
  actorUserId: string,
  reason?: string
): Promise<void> {
  try {
    await kycApi.manualKYCReview({
      submissionId,
      decision,
      actorUserId,
      ...(reason ? { reason } : {}),
    });
  } catch (_error) {
    const err = _error instanceof Error ? _error : new Error(String(_error));
    logger.error('Manual KYC review failed', err, { submissionId, decision, actorUserId });
    throw err;
  }
}

/**
 * Record age verification
 */
export async function recordAgeVerification(
  userId: string,
  ageVerified: boolean,
  country?: string
): Promise<AgeVerification> {
  try {
    return await kycApi.recordAgeVerification({
      userId,
      ageVerified,
      ...(country ? { country } : {}),
    });
  } catch (_error) {
    const err = _error instanceof Error ? _error : new Error(String(_error));
    logger.error('Failed to record age verification', err, { userId, ageVerified });
    throw err;
  }
}

/**
 * Record consent
 */
export async function recordConsent(
  userId: string,
  type: 'terms' | 'privacy' | 'marketing',
  version: string,
  accepted: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<ConsentRecord> {
  try {
    return await kycApi.recordConsent({
      userId,
      type,
      version,
      accepted,
      ...(ipAddress ? { ipAddress } : {}),
      ...(userAgent ? { userAgent } : {}),
    });
  } catch (_error) {
    const err = _error instanceof Error ? _error : new Error(String(_error));
    logger.error('Failed to record consent', err, { userId, type, version });
    throw err;
  }
}

/**
 * Get user consents
 */
export async function getUserConsents(userId: string): Promise<ConsentRecord[]> {
  try {
    return await kycApi.getUserConsents(userId);
  } catch (_error) {
    const err = _error instanceof Error ? _error : new Error(String(_error));
    logger.error('Failed to get user consents', err, { userId });
    return [];
  }
}

/**
 * Check if user has required consents
 */
export async function hasRequiredConsents(userId: string): Promise<boolean> {
  const consents = await getUserConsents(userId);
  const terms = consents.find((c) => c.type === 'terms' && c.accepted);
  const privacy = consents.find((c) => c.type === 'privacy' && c.accepted);

  return !!(terms && privacy);
}
