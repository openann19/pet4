/**
 * Telemetry Service
 *
 * Centralized telemetry tracking for user actions, errors, and performance metrics.
 * Integrates with analytics platforms and error tracking services.
 */

import { createLogger } from './logger';
import { env } from '@/config/env';

const logger = createLogger('Telemetry');

export type TelemetryEventName =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.signup'
  | 'auth.refresh_token'
  | 'auth.password_reset'
  | 'payment.subscription_created'
  | 'payment.subscription_cancelled'
  | 'payment.purchase_completed'
  | 'payment.purchase_failed'
  | 'moderation.report_created'
  | 'moderation.report_resolved'
  | 'moderation.report_dismissed'
  | 'moderation.action_taken'
  | 'adoption.listing_viewed'
  | 'adoption.application_submitted'
  | 'adoption.application_approved'
  | 'adoption.application_rejected'
  | 'chat.message_sent'
  | 'chat.message_received'
  | 'chat.reaction_added'
  | 'chat.media_shared'
  | 'match.created'
  | 'match.viewed'
  | 'profile.viewed'
  | 'profile.updated'
  | 'error.occurred'
  | 'performance.page_load'
  | 'performance.api_call'
  | 'performance.image_load';

export interface TelemetryEvent {
  name: TelemetryEventName;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, unknown>;
  context?: {
    page?: string;
    userAgent?: string;
    platform?: string;
    environment?: string;
  };
}

class TelemetryService {
  private enabled: boolean;
  private sessionId: string;
  private userId?: string;
  private eventQueue: TelemetryEvent[] = [];
  private flushInterval?: ReturnType<typeof setInterval>;

  constructor() {
    this.enabled = !env.flags.mocks && typeof window !== 'undefined';
    this.sessionId = this.generateSessionId();

    if (this.enabled) {
      this.startFlushInterval();
      this.trackPageView();
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private startFlushInterval(): void {
    // Flush events every 30 seconds
    this.flushInterval = setInterval(() => {
      // Fire-and-forget: flush asynchronously without blocking
      void this.flush();
    }, 30000);
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  track(eventName: TelemetryEventName, properties?: Record<string, unknown>): void {
    if (!this.enabled) {
      return;
    }

    const event: TelemetryEvent = {
      name: eventName,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      properties,
      context: {
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        platform: 'web',
        environment: import.meta.env.MODE,
      },
    };

    this.eventQueue.push(event);
    logger.debug('Telemetry event tracked', { eventName, properties });

    // Flush immediately for critical events
    if (this.isCriticalEvent(eventName)) {
      // Fire-and-forget: flush asynchronously without blocking
      void this.flush();
    }
  }

  private isCriticalEvent(eventName: TelemetryEventName): boolean {
    const criticalEvents: TelemetryEventName[] = [
      'auth.login',
      'auth.logout',
      'payment.purchase_completed',
      'payment.purchase_failed',
      'error.occurred',
      'moderation.action_taken',
    ];
    return criticalEvents.includes(eventName);
  }

  private trackPageView(): void {
    this.track('performance.page_load', {
      url: window.location.href,
      referrer: document.referrer,
    });
  }

  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Send to backend telemetry endpoint
      const response = await fetch(`${env.VITE_API_URL}/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        logger.warn('Failed to send telemetry events', {
          status: response.status,
          eventCount: events.length,
        });
        // Re-queue events for retry (limit queue size)
        this.eventQueue = [...events, ...this.eventQueue].slice(0, 100);
      } else {
        logger.debug('Telemetry events sent', { eventCount: events.length });
      }
    } catch (error) {
      logger.error(
        'Error sending telemetry events',
        error instanceof Error ? error : new Error(String(error))
      );
      // Re-queue events for retry
      this.eventQueue = [...events, ...this.eventQueue].slice(0, 100);
    }
  }

  trackError(error: Error, context?: Record<string, unknown>): void {
    this.track('error.occurred', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
      ...context,
    });
  }

  trackPerformance(metricName: string, value: number, unit: string = 'ms'): void {
    this.track('performance.api_call', {
      metricName,
      value,
      unit,
    });
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    // Fire-and-forget: attempt to flush remaining events before destroy
    // Note: This may not complete if page is unloading, but we try anyway
    void this.flush();
  }
}

export const telemetry = new TelemetryService();

// Track page views on navigation
if (typeof window !== 'undefined') {
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    const url = window.location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      // trackPageView is synchronous, no promise to handle
      telemetry.trackPageView();
    }
  }).observe(document, { subtree: true, childList: true });
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    telemetry.destroy();
  });
}
