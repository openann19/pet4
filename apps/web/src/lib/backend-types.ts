export type PhotoStatus =
  | 'pending_upload'
  | 'processing'
  | 'awaiting_review'
  | 'approved'
  | 'rejected'
  | 'held_for_kyc';

export type KYCStatus = 'unverified' | 'pending' | 'verified' | 'rejected' | 'expired';

export type ModerationAction = 'approve' | 'reject' | 'hold_for_kyc' | 'request_retake';

export type ModerationReason =
  | 'inappropriate_content'
  | 'not_animal'
  | 'human_faces'
  | 'low_quality'
  | 'duplicate'
  | 'nsfw'
  | 'policy_violation'
  | 'copyright'
  | 'spam'
  | 'other';

export type KYCRejectReason =
  | 'blurry_document'
  | 'expired_document'
  | 'document_mismatch'
  | 'liveness_failed'
  | 'unreadable'
  | 'incomplete'
  | 'suspicious';

export interface PhotoRecord {
  id: string;
  petId: string;
  ownerId: string;
  status: PhotoStatus;
  originalUrl: string;
  processedUrl?: string;
  thumbnailUrl?: string;
  variants: PhotoVariant[];
  metadata: PhotoMetadata;
  safetyCheck: SafetyCheckResult;
  moderationTask?: ModerationTask;
  uploadedAt: string;
  processedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export interface PhotoVariant {
  size: 'small' | 'medium' | 'large' | 'original';
  url: string;
  width: number;
  height: number;
  fileSize: number;
}

export interface PhotoMetadata {
  fileHash: string;
  contentFingerprint: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  exifStripped: boolean;
  uploadIP?: string;
}

export interface SafetyCheckResult {
  isNSFW: boolean;
  isViolent: boolean;
  hasHumanFaces: boolean;
  humanFaceCount: number;
  humanFaceDominance: number;
  isDuplicate: boolean;
  duplicateOf?: string;
  confidence: {
    nsfw: number;
    violence: number;
    animal: number;
    humanFace: number;
  };
  breedInference?: {
    breed: string;
    confidence: number;
  };
  flags: string[];
  scannedAt: string;
}

export interface ModerationTask {
  id: string;
  photoId: string;
  petId: string;
  ownerId: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'escalated';
  assignedTo?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  decision?: ModerationDecision;
  notes?: string[];
}

export interface ModerationDecision {
  action: ModerationAction;
  reason?: ModerationReason;
  reasonText?: string;
  reviewerId: string;
  reviewerName: string;
  reviewedAt: string;
  requiresKYC: boolean;
  kycReason?: string;
}

export interface ModerationQueue {
  pending: ModerationTask[];
  inProgress: ModerationTask[];
  completed: ModerationTask[];
  totalCount: number;
  averageReviewTime: number;
}

export interface KYCSession {
  id: string;
  userId: string;
  status: KYCStatus;
  provider: 'manual' | 'stripe_identity' | 'onfido' | 'persona';
  providerSessionId?: string;
  providerDecisionId?: string;
  documents: KYCDocument[];
  livenessCheck?: LivenessCheck;
  verificationData?: VerificationData;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  expiresAt?: string;
  rejectReason?: KYCRejectReason;
  rejectReasonText?: string;
  retryCount: number;
}

export interface KYCDocument {
  id: string;
  type: 'id_card' | 'passport' | 'drivers_license' | 'selfie';
  url: string;
  uploadedAt: string;
  verified: boolean;
  extractedData?: Record<string, unknown>;
}

export interface LivenessCheck {
  passed: boolean;
  confidence: number;
  attemptCount: number;
  completedAt?: string;
}

export interface VerificationData {
  fullName?: string;
  dateOfBirth?: string;
  documentNumber?: string;
  documentExpiry?: string;
  nationality?: string;
  verifiedFields: string[];
}

export interface UploadSession {
  id: string;
  userId: string;
  petId: string;
  uploadUrl: string;
  expiresAt: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
  status: 'pending' | 'completed' | 'expired' | 'failed';
  photoId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PolicyConfig {
  requireKYCToPublish: boolean;
  requireKYCByRegion: Record<string, boolean>;
  blockHumanDominantPhotos: boolean;
  humanDominanceThreshold: number;
  breedScoreThreshold: number;
  maxUploadsPerDay: number;
  maxUploadsPerHour: number;
  maxStoragePerUser: number;
  retentionDaysRejected: number;
  retentionDaysLogs: number;
  autoApproveThreshold: number;
  enableDuplicateDetection: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  userRole: string;
  userName: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  timestamp: string;
}

export interface ModerationMetrics {
  totalReviews: number;
  approvalRate: number;
  rejectionRate: number;
  averageReviewTime: number;
  queueBacklog: number;
  topRejectReasons: { reason: ModerationReason; count: number }[];
  reviewsByReviewer: { reviewerId: string; count: number }[];
  kycPassRate: number;
  duplicateRate: number;
}

export interface UserQuota {
  userId: string;
  uploadsToday: number;
  uploadsThisHour: number;
  totalStorage: number;
  lastUploadAt?: string;
  resetAt: string;
}

export interface NotificationPayload {
  userId: string;
  type:
    | 'photo_approved'
    | 'photo_rejected'
    | 'kyc_required'
    | 'kyc_approved'
    | 'kyc_rejected'
    | 'photo_processing';
  title: string;
  message: string;
  actionUrl?: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export interface EventPayload {
  event: string;
  data: Record<string, unknown>;
  userId?: string;
  correlationId: string;
  timestamp: string;
}
