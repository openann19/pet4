/**
 * KYC (Know Your Customer) Types
 *
 * Defines the domain model for identity verification and compliance.
 */

export type KYCStatus = 'not_started' | 'pending' | 'verified' | 'rejected' | 'expired';

export type KYCRejectReason =
  | 'blurry_document'
  | 'expired_document'
  | 'invalid_document'
  | 'mismatched_information'
  | 'fraudulent_document'
  | 'poor_quality'
  | 'missing_information'
  | 'other';

export type UserRole = 'user' | 'shelter' | 'partner' | 'admin';

export interface AgeVerification {
  userId: string;
  ageVerified: boolean;
  verifiedAt?: string;
  birthDate?: string; // Never stored, only age check result
  country?: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  type: 'terms' | 'privacy' | 'marketing';
  version: string;
  accepted: boolean;
  acceptedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface KYCSubmission {
  id: string;
  userId: string;
  status: KYCStatus;
  provider: 'onfido' | 'veriff' | 'jumio' | 'manual';
  providerSessionId?: string;
  providerReference?: string;
  startedAt: string;
  createdAt: string;
  completedAt?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  updatedAt?: string;
  expiresAt?: string;
  rejectionReason?: KYCRejectReason;
  rejectReasonText?: string;
  retryCount: number;
  documents?: {
    type: string;
    url: string;
    status: string;
  }[];
  livenessCheck?: {
    passed: boolean;
    score?: number;
    images?: string[];
  };
  metadata: {
    country?: string;
    documentType?: string;
    riskScore?: number;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  phone?: string;
  phoneVerified?: boolean;
  ageVerified: boolean;
  kycStatus: KYCStatus;
  roles: UserRole[];
  createdAt: string;
  lastSeenAt: string;
  metadata?: Record<string, unknown>;
}

export interface KYCAuditLog {
  id: string;
  kycSubmissionId: string;
  userId: string;
  action: 'submitted' | 'verified' | 'rejected' | 'manual_override' | 'retry_started';
  actorUserId?: string;
  actorRole?: UserRole;
  reason?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
