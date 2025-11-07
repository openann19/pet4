import { APIClient } from '@/lib/api-client'
import { createLogger } from '@/lib/logger'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('AuditLogger')

export interface AuditEvent {
  action: string
  resource: string
  resourceId?: string | undefined
  userId?: string | undefined
  metadata?: Record<string, unknown> | undefined
  ipAddress?: string | undefined
  userAgent?: string | undefined
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

class AuditLoggerImpl {
  private eventQueue: AuditEvent[] = []
  private flushTimer: NodeJS.Timeout | null = null
  private readonly FLUSH_INTERVAL = 5000 // 5 seconds
  private readonly MAX_QUEUE_SIZE = 50

  async logEvent(
    action: string,
    resource: string,
    options: Partial<AuditEvent> = {}
  ): Promise<void> {
    const currentUserId = this.getCurrentUserId()
    const userId = options.userId ?? currentUserId
    const ipAddress = await this.getClientIP()
    
    const event: AuditEvent = {
      action,
      resource,
      ...(options.resourceId ? { resourceId: options.resourceId } : {}),
      ...(userId ? { userId } : {}),
      metadata: options.metadata ?? {},
      ...(ipAddress ? { ipAddress } : {}),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      severity: options.severity ?? 'low'
    }

    // Add to queue
    this.eventQueue.push(event)
    
    // Immediate flush for critical events
    if (event.severity === 'critical') {
      await this.flushEvents()
    } else if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
      await this.flushEvents()
    } else {
      this.scheduleFlush()
    }

    logger.debug('Audit event queued', event)
  }

  // High-level audit methods
  async logAdminAction(
    action: string,
    resource: string,
    resourceId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logEvent(action, resource, {
      resourceId,
      ...(metadata ? { metadata } : {}),
      severity: 'high'
    })
  }

  async logModerationAction(
    action: 'approve' | 'reject' | 'flag',
    contentType: 'photo' | 'post' | 'profile',
    contentId: string,
    reason?: string
  ): Promise<void> {
    await this.logEvent('moderation_action', contentType, {
      resourceId: contentId,
      metadata: { action, reason },
      severity: 'medium'
    })
  }

  async logSecurityEvent(
    event: 'login_attempt' | 'password_reset' | 'account_locked' | 'suspicious_activity',
    userId?: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    await this.logEvent('security_event', 'user', {
      ...(userId ? { userId } : {}),
      metadata: { event, ...details },
      severity: 'high'
    })
  }

  async logDataAccess(
    resource: string,
    resourceId: string,
    accessType: 'read' | 'write' | 'delete',
    userId?: string
  ): Promise<void> {
    await this.logEvent('data_access', resource, {
      resourceId,
      ...(userId ? { userId } : {}),
      metadata: { accessType },
      severity: accessType === 'delete' ? 'high' : 'low'
    })
  }

  async logPaymentEvent(
    event: 'payment_attempt' | 'payment_success' | 'payment_failed' | 'refund',
    paymentId: string,
    amount?: number,
    currency?: string
  ): Promise<void> {
    await this.logEvent('payment_event', 'payment', {
      resourceId: paymentId,
      metadata: { event, amount, currency },
      severity: 'medium'
    })
  }

  private scheduleFlush(): void {
    if (isTruthy(this.flushTimer)) return
    
    this.flushTimer = setTimeout(() => {
      void this.flushEvents()
    }, this.FLUSH_INTERVAL)
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return

    const eventsToFlush = [...this.eventQueue]
    this.eventQueue = []

    if (isTruthy(this.flushTimer)) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    try {
      await APIClient.post('/audit/events', { events: eventsToFlush })
      logger.info(`Flushed ${String(eventsToFlush.length ?? '')} audit events`)
    } catch (error) {
      logger.error('Failed to flush audit events', error)
      // Re-queue events on failure
      this.eventQueue.unshift(...eventsToFlush)
    }
  }

  private getCurrentUserId(): string | undefined {
    // Get current user ID from auth context or localStorage
    try {
      const token = localStorage.getItem('access_token')
      if (isTruthy(token)) {
        const parts = token.split('.')
        if (isTruthy(parts[1])) {
          const payload = JSON.parse(atob(parts[1])) as Record<string, unknown>
          const userId = typeof payload['sub'] === 'string' ? payload['sub'] : typeof payload['userId'] === 'string' ? payload['userId'] : undefined
          return userId
        }
      }
    } catch (error) {
      logger.error('Failed to extract user ID from token', error)
    }
    return undefined
  }

  private async getClientIP(): Promise<string | undefined> {
    try {
      // In production, this should come from backend
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json() as { ip?: string }
      return typeof data.ip === 'string' ? data.ip : undefined
    } catch (error) {
      logger.error('Failed to get client IP', error)
      return undefined
    }
  }

  // Cleanup on page unload
  async cleanup(): Promise<void> {
    await this.flushEvents()
  }
}

export const auditLogger = new AuditLoggerImpl()

// Flush events on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    void auditLogger.cleanup()
  })
}

