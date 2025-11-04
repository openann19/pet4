/**
 * KYC Service
 * 
 * Handles identity verification, age gate, consent management, and KYC pipeline.
 */

import type { KYCSubmission, KYCStatus, ConsentRecord, AgeVerification, KYCAuditLog } from './kyc-types'
import { generateULID } from './utils'
import { logger } from './logger'
import { FixerError } from './fixer-error'

const KV_PREFIX = {
  KYC: 'kyc:',
  CONSENT: 'consent:',
  AGE_VERIFY: 'age-verify:',
  AUDIT: 'kyc-audit:',
}

/**
 * Start KYC process
 */
export async function startKYC(
  userId: string,
  provider: 'onfido' | 'veriff' | 'jumio' | 'manual' = 'onfido'
): Promise<{ sessionId: string; providerToken?: string; url?: string }> {
  const submission: KYCSubmission = {
    id: generateULID(),
    userId,
    status: 'pending',
    provider,
    startedAt: new Date().toISOString(),
    retryCount: 0,
    metadata: {},
  }

  const key = `${KV_PREFIX.KYC}${submission.id}`
  await window.spark.kv.set(key, submission)

  // Index by user
  const userKYC = await window.spark.kv.get<KYCSubmission[]>(`${KV_PREFIX.KYC}user:${userId}`) || []
  userKYC.push(submission)
  await window.spark.kv.set(`${KV_PREFIX.KYC}user:${userId}`, userKYC)

  // Call backend to get provider session
  try {
    const response = await fetch('/api/v1/kyc/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, provider, submissionId: submission.id }),
    })

    if (response.ok) {
      const data = await response.json()
      submission.providerSessionId = data.sessionId
      submission.providerReference = data.reference
      await window.spark.kv.set(key, submission)

      return {
        sessionId: submission.id,
        providerToken: data.token,
        url: data.url,
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('KYC start failed', err, { action: 'startKYC', userId, provider })
    throw new FixerError('KYC start failed', { action: 'startKYC', userId, provider }, 'KYC_START_ERROR')
  }

  return { sessionId: submission.id }
}

/**
 * Handle KYC webhook from provider
 */
export async function handleKYCWebhook(
  submissionId: string,
  status: 'verified' | 'rejected',
  data: {
    reference?: string
    reason?: string
    riskScore?: number
    country?: string
    documentType?: string
  }
): Promise<void> {
  const key = `${KV_PREFIX.KYC}${submissionId}`
  const submission = await window.spark.kv.get<KYCSubmission>(key)

  if (!submission) {
    throw new Error('KYC submission not found')
  }

  submission.status = status
  submission.completedAt = new Date().toISOString()
  submission.metadata = {
    ...submission.metadata,
    ...data,
  }

  if (status === 'rejected') {
    submission.rejectedAt = new Date().toISOString()
    submission.rejectionReason = data.reason || 'Verification failed'
  }

  await window.spark.kv.set(key, submission)

  // Update user profile
  const userKey = `users:${submission.userId}`
  const user = await window.spark.kv.get<any>(userKey)
  if (user) {
    user.kycStatus = status
    await window.spark.kv.set(userKey, user)
  }

  // Log audit
  await logKYCAudit({
    action: status === 'verified' ? 'verified' : 'rejected',
    userId: submission.userId,
    kycSubmissionId: submissionId,
    ...(data.reason ? { reason: data.reason } : {}),
  })
}

/**
 * Get KYC status for user
 */
export async function getKYCStatus(userId: string): Promise<KYCStatus> {
  const userKYC = await window.spark.kv.get<KYCSubmission[]>(`${KV_PREFIX.KYC}user:${userId}`)
  
  if (!userKYC || userKYC.length === 0) {
    return 'not_started'
  }

  // Get most recent submission
  const latest = userKYC.sort((a, b) => 
    new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  )[0]
  
  if (!latest) {
    return 'not_started'
  }
  
  return latest.status
}

/**
 * Get KYC submission by ID
 */
export async function getKYCSubmission(submissionId: string): Promise<KYCSubmission | null> {
  const key = `${KV_PREFIX.KYC}${submissionId}`
  return await window.spark.kv.get<KYCSubmission>(key) || null
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
  const key = `${KV_PREFIX.KYC}${submissionId}`
  const submission = await window.spark.kv.get<KYCSubmission>(key)

  if (!submission) {
    throw new Error('KYC submission not found')
  }

  submission.status = decision
  submission.completedAt = new Date().toISOString()
  submission.provider = 'manual'

  if (decision === 'rejected') {
    submission.rejectedAt = new Date().toISOString()
    submission.rejectionReason = reason || 'Manual rejection'
  }

  await window.spark.kv.set(key, submission)

  // Update user profile
  const userKey = `users:${submission.userId}`
  const user = await window.spark.kv.get<any>(userKey)
  if (user) {
    user.kycStatus = decision
    await window.spark.kv.set(userKey, user)
  }

  // Log audit
  await logKYCAudit({
    action: decision === 'verified' ? 'manual_override' : 'manual_reject',
    userId: submission.userId,
    kycSubmissionId: submissionId,
    ...(actorUserId ? { actorUserId } : {}),
    ...(reason ? { reason } : {}),
  })
}

/**
 * Record age verification
 */
export async function recordAgeVerification(
  userId: string,
  ageVerified: boolean,
  country?: string
): Promise<AgeVerification> {
  const verification: AgeVerification = {
    userId,
    ageVerified,
    verifiedAt: new Date().toISOString(),
    ...(country ? { country } : {}),
  }

  const key = `${KV_PREFIX.AGE_VERIFY}${userId}`
  await window.spark.kv.set(key, verification)

  // Update user profile
  const userKey = `users:${userId}`
  const user = await window.spark.kv.get<any>(userKey)
  if (user) {
    user.ageVerified = ageVerified
    if (country) {
      user.country = country
    }
    await window.spark.kv.set(userKey, user)
  }

  return verification
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
  const consent: ConsentRecord = {
    id: generateULID(),
    userId,
    type,
    version,
    accepted,
    acceptedAt: new Date().toISOString(),
    ...(ipAddress ? { ipAddress } : {}),
    ...(userAgent ? { userAgent } : {}),
  }

  const key = `${KV_PREFIX.CONSENT}${userId}:${type}:${version}`
  await window.spark.kv.set(key, consent)

  // Index by user
  const userConsents = await window.spark.kv.get<ConsentRecord[]>(`${KV_PREFIX.CONSENT}user:${userId}`) || []
  userConsents.push(consent)
  await window.spark.kv.set(`${KV_PREFIX.CONSENT}user:${userId}`, userConsents)

  return consent
}

/**
 * Get user consents
 */
export async function getUserConsents(userId: string): Promise<ConsentRecord[]> {
  const key = `${KV_PREFIX.CONSENT}user:${userId}`
  return await window.spark.kv.get<ConsentRecord[]>(key) || []
}

/**
 * Check if user has required consents
 */
export async function hasRequiredConsents(userId: string): Promise<boolean> {
  const consents = await getUserConsents(userId)
  const terms = consents.find(c => c.type === 'terms' && c.accepted)
  const privacy = consents.find(c => c.type === 'privacy' && c.accepted)
  
  return !!(terms && privacy)
}

/**
 * Log KYC audit entry
 */
async function logKYCAudit(entry: {
  action: string
  userId: string
  kycSubmissionId?: string
  actorUserId?: string
  reason?: string
}): Promise<void> {
  const auditEntry: KYCAuditLog = {
    id: generateULID(),
    kycSubmissionId: entry.kycSubmissionId || '',
    userId: entry.userId,
    action: entry.action as any,
    ...(entry.actorUserId ? { actorUserId: entry.actorUserId, actorRole: 'admin' as const } : {}),
    ...(entry.reason ? { reason: entry.reason } : {}),
    timestamp: new Date().toISOString(),
  }

  const key = `${KV_PREFIX.AUDIT}${auditEntry.id}`
  await window.spark.kv.set(key, auditEntry)

  // Append to audit log list
  const auditLog = await window.spark.kv.get<KYCAuditLog[]>(`${KV_PREFIX.AUDIT}list`) || []
  auditLog.push(auditEntry)
  // Keep only last 1000 entries
  if (auditLog.length > 1000) {
    auditLog.shift()
  }
  await window.spark.kv.set(`${KV_PREFIX.AUDIT}list`, auditLog)
}

