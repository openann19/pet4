import { _isTruthy, isDefined } from '@petspark/shared';

/**
 * Photo Moderation Domain
 *
 * Core domain logic for photo moderation workflow:
 * - Status transitions
 * - Visibility rules
 * - KYC gating
 * - Audit requirements
 */

export type PhotoModerationStatus =
  | 'pending' // Uploaded, awaiting review
  | 'scanning' // AI/ML scan in progress
  | 'approved' // Approved, visible to public
  | 'held_for_kyc' // Waiting for KYC approval
  | 'rejected' // Rejected, not visible
  | 'quarantined'; // Suspicious, requires manual review

export type PhotoModerationAction =
  | 'approve'
  | 'reject'
  | 'hold_for_kyc'
  | 'quarantine'
  | 'release_from_quarantine';

export interface PhotoModerationMetadata {
  photoId: string;
  uploadedBy: string;
  uploadedAt: string;
  contentType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  originalFilename?: string;
}

export interface PhotoScanResult {
  nsfwScore: number;
  toxicityScore: number;
  contentFingerprint: string;
  detectedIssues: string[];
  requiresManualReview: boolean;
  scannedAt: string;
}

export interface PhotoModerationRecord {
  photoId: string;
  status: PhotoModerationStatus;
  metadata: PhotoModerationMetadata;
  scanResult?: PhotoScanResult;
  moderatedBy?: string;
  moderatedAt?: string;
  rejectionReason?: string;
  kycRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoModerationAuditLog {
  auditId: string;
  photoId: string;
  action: PhotoModerationAction;
  performedBy: string;
  performedAt: string;
  reason?: string;
  previousStatus: PhotoModerationStatus;
  newStatus: PhotoModerationStatus;
  metadata: Record<string, unknown>;
}

/**
 * Validate status transition
 * Pure function - no side effects
 */
export function isValidStatusTransition(
  current: PhotoModerationStatus,
  next: PhotoModerationStatus
): boolean {
  if (current === next) return false;

  const validTransitions: Record<PhotoModerationStatus, PhotoModerationStatus[]> = {
    pending: ['scanning', 'approved', 'rejected', 'held_for_kyc', 'quarantined'],
    scanning: ['approved', 'rejected', 'held_for_kyc', 'quarantined', 'pending'],
    approved: ['rejected', 'quarantined'],
    held_for_kyc: ['approved', 'rejected', 'quarantined'],
    rejected: ['pending'], // Can resubmit
    quarantined: ['approved', 'rejected', 'held_for_kyc'],
  };

  return validTransitions[current]?.includes(next) ?? false;
}

/**
 * Check if photo is visible to public
 * Pure function - no side effects
 */
export function isPhotoVisible(
  status: PhotoModerationStatus,
  kycRequired: boolean,
  kycVerified: boolean
): boolean {
  if (status !== 'approved') return false;
  if (kycRequired && !kycVerified) return false;
  return true;
}

/**
 * Check if photo requires KYC
 * Pure function - no side effects
 */
export function requiresKYC(status: PhotoModerationStatus, systemRequiresKYC: boolean): boolean {
  if (status === 'held_for_kyc') return true;
  if (status === 'pending' && systemRequiresKYC) return true;
  return false;
}

/**
 * Determine if photo should be quarantined based on scan results
 * Pure function - no side effects
 */
export function shouldQuarantine(scanResult: PhotoScanResult): boolean {
  const nsfwThreshold = 0.7;
  const toxicityThreshold = 0.8;

  if (scanResult.nsfwScore >= nsfwThreshold) return true;
  if (scanResult.toxicityScore >= toxicityThreshold) return true;
  if (scanResult.detectedIssues.length > 3) return true;
  return false;
}

/**
 * Determine if photo can be auto-approved
 * Pure function - no side effects
 */
export function canAutoApprove(scanResult: PhotoScanResult): boolean {
  const nsfwThreshold = 0.1;
  const toxicityThreshold = 0.1;

  if (scanResult.nsfwScore > nsfwThreshold) return false;
  if (scanResult.toxicityScore > toxicityThreshold) return false;
  if (scanResult.detectedIssues.length > 0) return false;
  if (scanResult.requiresManualReview) return false;

  return true;
}
