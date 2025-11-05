import { APIClient } from '@/lib/api-client'
import { createLogger } from '@/lib/logger'

const logger = createLogger('AuditLogger')

export interface AuditEvent {
  action: string
  resource: string
  resourceId?: string
  userId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
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
    const event: AuditEvent = {
      action,
      resource,
      resourceId: options.resourceId,
      userId: options.userId || this.getCurrentUserId(),
      metadata: options.metadata || {},
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      severity: options.severity || 'low'
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
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent(action, resource, {
      resourceId,
      metadata,
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
    details?: Record<string, any>
  ): Promise<void> {
    await this.logEvent('security_event', 'user', {
      userId,
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
      userId,
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
    if (this.flushTimer) return

    this.flushTimer = setTimeout(() => {
      this.flushEvents()
    }, this.FLUSH_INTERVAL)
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return

    const eventsToFlush = [...this.eventQueue]
    this.eventQueue = []

    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    try {
      await APIClient.post('/audit/events', { events: eventsToFlush })
      logger.info(`Flushed ${eventsToFlush.length} audit events`)
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
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.sub || payload.userId
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
      const data = await response.json()
      return data.ip
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
    auditLogger.cleanup()
  })
}

