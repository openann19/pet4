import { APIClient } from './api-client'
import type {
  AuditLog,
  EventPayload,
  KYCRejectReason,
  KYCSession,
  ModerationAction,
  ModerationDecision,
  ModerationMetrics,
  ModerationQueue,
  ModerationReason,
  ModerationTask,
  PhotoRecord,
  PhotoStatus,
  PolicyConfig,
  UploadSession,
  UserQuota,
} from './backend-types'
import { ENDPOINTS, buildUrl } from './endpoints'
import { createLogger } from './logger'
import { generateULID } from './utils'

const logger = createLogger('BackendServices')

const DEFAULT_POLICY: PolicyConfig = {
  requireKYCToPublish: false,
  requireKYCByRegion: {},
  blockHumanDominantPhotos: true,
  humanDominanceThreshold: 0.7,
  breedScoreThreshold: 0.6,
  maxUploadsPerDay: 50,
  maxUploadsPerHour: 10,
  maxStoragePerUser: 500 * 1024 * 1024,
  retentionDaysRejected: 30,
  retentionDaysLogs: 365,
  autoApproveThreshold: 0.95,
  enableDuplicateDetection: true,
}

interface UploadSessionResponse {
  session: UploadSession
}

interface PhotoResponse {
  photo: PhotoRecord
}

interface PhotosResponse {
  photos: PhotoRecord[]
}

interface ModerationQueueResponse {
  queue: ModerationQueue
}

interface ModerationTaskResponse {
  task: ModerationTask
}

interface ModerationMetricsResponse {
  metrics: ModerationMetrics
}

interface KYCSessionResponse {
  session: KYCSession
}

interface KYCSessionListResponse {
  sessions: KYCSession[]
}

function unwrapPayload<T>(payload: unknown, key: string): T {
  if (payload && typeof payload === 'object' && key in (payload as Record<string, unknown>)) {
    const value = (payload as Record<string, unknown>)[key] as T | undefined
    if (value === undefined || value === null) {
      throw new Error(`Response is missing expected "${String(key ?? '')}" payload`)
    }
    return value
  }

  if (payload === undefined || payload === null) {
    throw new Error(`Response is missing expected "${String(key ?? '')}" payload`)
  }

  return payload as T
}

function unwrapList<T>(payload: unknown, key: string): T[] {
  if (Array.isArray(payload)) {
    return payload as T[]
  }

  if (payload && typeof payload === 'object' && key in (payload as Record<string, unknown>)) {
    const value = (payload as Record<string, unknown>)[key]
    if (!Array.isArray(value)) {
      throw new Error(`Response is missing expected "${String(key ?? '')}" list payload`)
    }
    return value as T[]
  }

  throw new Error(`Response is missing expected "${String(key ?? '')}" list payload`)
}

export class PhotoService {
  async getPolicy(): Promise<PolicyConfig> {
    try {
      const response = await APIClient.get<PolicyConfig | { policy: PolicyConfig }>(
        ENDPOINTS.MODERATION.POLICY,
      )
      const policy = unwrapPayload<PolicyConfig>(response.data, 'policy')
      return policy ?? DEFAULT_POLICY
    } catch (error) {
      logger.warn('Failed to load moderation policy from backend, using defaults', { error })
      return DEFAULT_POLICY
    }
  }

  async createUploadSession(userId: string, petId: string): Promise<UploadSession> {
    await this.ensureQuotaWithinLimits(userId)

    const response = await APIClient.post<UploadSessionResponse>(ENDPOINTS.UPLOADS.SIGN_URL, {
      userId,
      petId,
    })

    return unwrapPayload<UploadSession>(response.data, 'session')
  }

  async processUpload(
    sessionId: string,
    file: { size: number; type: string; data: string },
  ): Promise<PhotoRecord> {
    const response = await APIClient.post<PhotoResponse>(ENDPOINTS.PHOTOS.CREATE, {
      sessionId,
      file: {
        size: file.size,
        mimeType: file.type,
        content: file.data,
      },
    })

    const photo = unwrapPayload<PhotoRecord>(response.data, 'photo')

    await this.emitEvent('photo.uploaded', { photoId: photo.id, sessionId })
    await this.incrementQuota(photo.ownerId, file.size)

    return photo
  }

  async getPhotosByStatus(status: PhotoStatus): Promise<PhotoRecord[]> {
    const url = buildUrl(ENDPOINTS.PHOTOS.BY_STATUS, { status })
    const response = await APIClient.get<PhotosResponse>(url)
    return unwrapList<PhotoRecord>(response.data, 'photos')
  }

  async getPhotosByOwner(ownerId: string, includeAll: boolean = false): Promise<PhotoRecord[]> {
    const url = buildUrl(ENDPOINTS.PHOTOS.BY_OWNER, { ownerId, includeAll })
    const response = await APIClient.get<PhotosResponse>(url)
    return unwrapList<PhotoRecord>(response.data, 'photos')
  }

  async getPublicPhotos(): Promise<PhotoRecord[]> {
    const response = await APIClient.get<PhotosResponse>(ENDPOINTS.PHOTOS.PUBLIC)
    return unwrapList<PhotoRecord>(response.data, 'photos')
  }

  async createModerationTask(photo: PhotoRecord): Promise<ModerationTask> {
    const response = await APIClient.post<ModerationTaskResponse>(ENDPOINTS.MODERATION.TASKS, {
      photoId: photo.id,
      ownerId: photo.ownerId,
      petId: photo.petId,
      priority: this.calculatePriority(photo),
    })

    const task = unwrapPayload<ModerationTask>(response.data, 'task')
    await this.emitEvent('moderation.task.created', { taskId: task.id, photoId: photo.id })
    return task
  }

  private async ensureQuotaWithinLimits(userId: string): Promise<void> {
    const response = await APIClient.get<UserQuota>(ENDPOINTS.QUOTAS.GET(userId))
    const quota = response.data

    if (!quota) {
      throw new Error('Unable to resolve current upload quota')
    }

    const policy = await this.getPolicy()

    if (quota.uploadsToday >= policy.maxUploadsPerDay) {
      throw new Error('Daily upload limit reached')
    }

    if (quota.uploadsThisHour >= policy.maxUploadsPerHour) {
      throw new Error('Hourly upload limit reached')
    }

    if (quota.totalStorage >= policy.maxStoragePerUser) {
      throw new Error('Storage limit reached')
    }
  }

  private async incrementQuota(userId: string, fileSize: number): Promise<void> {
    await APIClient.post(ENDPOINTS.QUOTAS.INCREMENT(userId), { fileSize })
  }

  private calculatePriority(photo: PhotoRecord): 'low' | 'medium' | 'high' {
    const flags = photo.safetyCheck?.flags ?? []

    if (flags.includes('nsfw') || flags.includes('violent')) {
      return 'high'
    }

    if (flags.includes('human_dominant') || flags.includes('not_animal') || flags.includes('duplicate')) {
      return 'medium'
    }

    return 'low'
  }

  private async emitEvent(event: string, data: Record<string, unknown>): Promise<void> {
    const payload: EventPayload = {
      event,
      data,
      correlationId: generateULID(),
      timestamp: new Date().toISOString(),
    }

    await APIClient.post(ENDPOINTS.EVENTS.CREATE, payload)
  }
}

export class ModerationService {
  async getQueue(): Promise<ModerationQueue> {
    const response = await APIClient.get<ModerationQueue | ModerationQueueResponse>(
      ENDPOINTS.MODERATION.TASKS,
    )

    const queue =
      'queue' in response.data
        ? (response.data).queue
        : (response.data)

    return {
      pending: queue.pending ?? [],
      inProgress: queue.inProgress ?? [],
      completed: queue.completed ?? [],
      totalCount:
        queue.totalCount ?? (queue.pending?.length ?? 0) + (queue.inProgress?.length ?? 0) + (queue.completed?.length ?? 0),
      averageReviewTime: queue.averageReviewTime ?? 0,
    }
  }

  async takeTask(taskId: string, reviewerId: string): Promise<ModerationTask> {
    const response = await APIClient.post<ModerationTaskResponse | ModerationTask>(
      ENDPOINTS.MODERATION.TAKE_TASK(taskId),
      { reviewerId },
    )

    const task =
      'task' in response.data
        ? (response.data).task
        : (response.data)

    if (!task) {
      throw new Error('Task assignment failed')
    }

    await this.logAudit({
      id: generateULID(),
      action: 'moderation.task.claimed',
      resource: 'moderation_task',
      resourceId: taskId,
      userId: reviewerId,
      userRole: 'moderator',
      userName: 'Moderator',
      timestamp: new Date().toISOString(),
    })

    await this.emitEvent('moderation.task.claimed', { taskId, reviewerId })
    return task
  }

  async makeDecision(
    taskId: string,
    action: ModerationAction,
    reason: ModerationReason | undefined,
    reasonText: string | undefined,
    reviewerId: string,
    reviewerName: string,
  ): Promise<ModerationTask> {
    const response = await APIClient.patch<ModerationTaskResponse | ModerationTask>(
      ENDPOINTS.MODERATION.TASK(taskId),
      {
        action,
        reason,
        reasonText,
        reviewerId,
        reviewerName,
      },
    )

    const task =
      'task' in response.data
        ? (response.data).task
        : (response.data)

    if (!task) {
      throw new Error('Moderation decision failed')
    }

    const decision: ModerationDecision = {
      action,
      ...(reason ? { reason } : {}),
      ...(reasonText ? { reasonText } : {}),
      reviewerId,
      reviewerName,
      reviewedAt: new Date().toISOString(),
      requiresKYC: action === 'hold_for_kyc',
    }

    await this.logAudit({
      id: generateULID(),
      action: 'moderation.task.decision',
      resource: 'moderation_task',
      resourceId: taskId,
      userId: reviewerId,
      userRole: 'moderator',
      userName: reviewerName,
      after: decision as unknown as Record<string, unknown>,
      timestamp: decision.reviewedAt,
    })

    if (action === 'hold_for_kyc') {
      await this.notifyUserKYCRequired(task.ownerId, task.photoId)
    } else {
      const photo = await this.fetchPhoto(task.photoId)
      await this.notifyUserDecision(task.ownerId, photo, decision)
    }

    await this.emitEvent('moderation.task.updated', {
      taskId,
      action,
      reviewerId,
    })

    return task
  }

  async getMetrics(): Promise<ModerationMetrics> {
    const response = await APIClient.get<ModerationMetrics | ModerationMetricsResponse>(
      ENDPOINTS.MODERATION.METRICS,
    )

    return 'metrics' in response.data
      ? (response.data).metrics
      : (response.data)
  }

  private async fetchPhoto(photoId: string): Promise<PhotoRecord> {
    const response = await APIClient.get<PhotoResponse | PhotoRecord>(ENDPOINTS.PHOTOS.GET(photoId))
    return 'photo' in response.data
      ? (response.data).photo
      : (response.data)
  }

  private async notifyUserKYCRequired(userId: string, photoId: string): Promise<void> {
    await APIClient.post(ENDPOINTS.NOTIFICATIONS.LIST, {
      notificationId: generateULID(),
      userId,
      type: 'kyc_required',
      title: 'Verification Required',
      body: 'Please complete identity verification to publish your photo',
      data: { photoId },
      read: false,
      createdAt: new Date().toISOString(),
    })
  }

  private async notifyUserDecision(
    userId: string,
    photo: PhotoRecord,
    decision: ModerationDecision,
  ): Promise<void> {
    const isApproved = decision.action === 'approve'

    await APIClient.post(ENDPOINTS.NOTIFICATIONS.LIST, {
      notificationId: generateULID(),
      userId,
      type: isApproved ? 'photo_approved' : 'photo_rejected',
      title: isApproved ? 'Photo Approved!' : 'Photo Review Update',
      body: isApproved
        ? 'Your photo is now visible to the community.'
        : `Your photo was not approved. Reason: ${String(decision.reasonText || decision.reason || 'See details in the app.' ?? '')}`,
      data: { photoId: photo.id, decision: decision.action },
      read: false,
      createdAt: decision.reviewedAt,
    })
  }

  private async logAudit(log: AuditLog): Promise<void> {
    await APIClient.post(ENDPOINTS.AUDIT.CREATE, log)
  }

  private async emitEvent(event: string, data: Record<string, unknown>): Promise<void> {
    const payload: EventPayload = {
      event,
      data,
      correlationId: generateULID(),
      timestamp: new Date().toISOString(),
    }

    await APIClient.post(ENDPOINTS.EVENTS.CREATE, payload)
  }
}

export class KYCService {
  async createSession(userId: string): Promise<KYCSession> {
    const response = await APIClient.post<KYCSessionResponse>(ENDPOINTS.KYC.START_VERIFICATION, {
      userId,
    })

    return unwrapPayload<KYCSession>(response.data, 'session')
  }

  async getUserSession(userId: string): Promise<KYCSession | null> {
    const response = await APIClient.get<KYCSessionResponse | KYCSessionListResponse | null>(
      buildUrl(ENDPOINTS.KYC.STATUS, { userId }),
    )

    if (!response.data) {
      return null
    }

    if ('session' in response.data) {
      return (response.data).session
    }

    if ('sessions' in response.data) {
      const sessions = (response.data).sessions
      return sessions.length > 0 ? sessions[0] ?? null : null
    }

    return response.data as KYCSession
  }

  async updateSession(sessionId: string, updates: Partial<KYCSession>): Promise<void> {
    await APIClient.patch(ENDPOINTS.KYC.GET_VERIFICATION(sessionId), updates)
  }

  async verifySession(sessionId: string, reviewerId: string): Promise<void> {
    await APIClient.post(ENDPOINTS.KYC.GET_VERIFICATION(sessionId), {
      action: 'approve',
      reviewerId,
    })
  }

  async rejectSession(
    sessionId: string,
    reason: KYCRejectReason,
    reasonText: string,
    reviewerId: string,
  ): Promise<void> {
    await APIClient.post(ENDPOINTS.KYC.GET_VERIFICATION(sessionId), {
      action: 'reject',
      reason,
      reasonText,
      reviewerId,
    })
  }
}

export const photoService = new PhotoService()
export const moderationService = new ModerationService()
export const kycService = new KYCService()
