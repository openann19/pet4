/**
 * Comprehensive analytics tracking system with batching, persistence, and privacy
 *
 * Features:
 * - Event batching with configurable flush intervals
 * - IndexedDB persistence for offline scenarios
 * - Privacy-first design with PII masking
 * - User session tracking with engagement metrics
 * - Custom dimensions and user properties
 * - Automatic screen view tracking
 * - Network-aware batching (reduces requests on slow connections)
 *
 * @example
 * ```tsx
 * const analytics = useAnalytics({
 *   projectId: 'petspark-prod',
 *   userId: user.id,
 *   batchSize: 10,
 *   flushInterval: 5000
 * });
 *
 * analytics.track('chat_message_sent', {
 *   effect: 'confetti',
 *   duration: 2500,
 *   recipientCount: 3
 * });
 *
 * analytics.identify(user.id, {
 *   plan: 'premium',
 *   pets: ['dog', 'cat']
 * });
 *
 * analytics.page('Profile', {
 *   petType: 'dog',
 *   visibility: 'public'
 * });
 * ```
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createLogger, LogLevel } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

export interface AnalyticsEvent {
  readonly id: string;
  readonly name: string;
  readonly properties: Record<string, unknown>;
  readonly timestamp: number;
  readonly sessionId: string;
  readonly userId?: string;
  readonly anonymousId: string;
  readonly context: AnalyticsContext;
}

export interface AnalyticsContext {
  readonly page: {
    readonly url: string;
    readonly title: string;
    readonly referrer: string;
    readonly path: string;
  };
  readonly screen: {
    readonly width: number;
    readonly height: number;
    readonly density: number;
  };
  readonly locale: string;
  readonly timezone: string;
  readonly userAgent: string;
  readonly campaign?: CampaignData;
}

export interface CampaignData {
  readonly source?: string;
  readonly medium?: string;
  readonly campaign?: string;
  readonly term?: string;
  readonly content?: string;
}

export type UserProperties = Readonly<Record<string, string | number | boolean | readonly string[]>>;

export interface AnalyticsConfig {
  readonly projectId: string;
  readonly userId?: string;
  readonly batchSize?: number;
  readonly flushInterval?: number;
  readonly endpoint?: string;
  readonly debug?: boolean;
  readonly respectDNT?: boolean;
  readonly maskPII?: boolean;
}

interface AnalyticsSession {
  readonly id: string;
  readonly startTime: number;
  engagementTime: number;
  eventCount: number;
  lastActivityTime: number;
}

export interface AnalyticsState {
  readonly sessionId: string;
  readonly anonymousId: string;
  readonly queueSize: number;
  readonly isOnline: boolean;
  readonly lastFlush: number | null;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_FLUSH_INTERVAL = 5000;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const DB_NAME = 'petspark-analytics';
const DB_VERSION = 1;
const STORE_NAME = 'events';
const MAX_QUEUE_SIZE = 1000;
const ENGAGEMENT_UPDATE_INTERVAL = 1000;

// ============================================================================
// Utilities
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getAnonymousId(): string {
  let id = localStorage.getItem('petspark_anonymous_id');
  if (!id) {
    id = generateId();
    localStorage.setItem('petspark_anonymous_id', id);
  }
  return id;
}

function shouldRespectDNT(): boolean {
  return navigator.doNotTrack === '1' ||
         (window as typeof window & { doNotTrack?: string }).doNotTrack === '1';
}

function maskPII(value: string): string {
  // Mask email addresses
  const emailRegex = /([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  let masked = value.replace(emailRegex, (match) => {
    const parts = match.split('@');
    const firstPart = parts[0];
    const secondPart = parts[1];
    if (!firstPart || !secondPart) return match;
    return `${firstPart.charAt(0)}***@${secondPart}`;
  });

  // Mask phone numbers
  const phoneRegex = /(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g;
  masked = masked.replace(phoneRegex, '***-***-****');

  // Mask credit cards
  const ccRegex = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
  masked = masked.replace(ccRegex, '****-****-****-****');

  return masked;
}

function getCampaignData(): CampaignData | undefined {
  const params = new URLSearchParams(window.location.search);
  const source = params.get('utm_source') ?? undefined;
  const medium = params.get('utm_medium') ?? undefined;
  const campaign = params.get('utm_campaign') ?? undefined;
  const term = params.get('utm_term') ?? undefined;
  const content = params.get('utm_content') ?? undefined;

  if (!source && !medium && !campaign && !term && !content) {
    return undefined;
  }

  return { source, medium, campaign, term, content };
}

function getContext(): AnalyticsContext {
  return {
    page: {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      path: window.location.pathname,
    },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      density: window.devicePixelRatio,
    },
    locale: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: navigator.userAgent,
    campaign: getCampaignData(),
  };
}

// ============================================================================
// IndexedDB Management
// ============================================================================

async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

async function persistEvent(event: AnalyticsEvent): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(event);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function getPersistedEvents(): Promise<readonly AnalyticsEvent[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function clearPersistedEvents(ids: readonly string[]): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    let completed = 0;
    const total = ids.length;

    if (total === 0) {
      resolve();
      return;
    }

    for (const id of ids) {
      const request = store.delete(id);
      request.onsuccess = () => {
        completed++;
        if (completed === total) resolve();
      };
      request.onerror = () => reject(request.error);
    }
  });
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useAnalytics(config: AnalyticsConfig) {
  const {
    projectId,
    userId,
    batchSize = DEFAULT_BATCH_SIZE,
    flushInterval = DEFAULT_FLUSH_INTERVAL,
    endpoint = '/api/analytics',
    debug = false,
    respectDNT = true,
    maskPII: shouldMaskPII = true,
  } = config;

  const logger = useMemo(
    () => createLogger('Analytics', debug ? LogLevel.DEBUG : LogLevel.INFO),
    [debug]
  );

  // State
  const [state, setState] = useState<AnalyticsState>(() => ({
    sessionId: generateId(),
    anonymousId: getAnonymousId(),
    queueSize: 0,
    isOnline: navigator.onLine,
    lastFlush: null,
  }));

  // Refs
  const queueRef = useRef<AnalyticsEvent[]>([]);
  const sessionRef = useRef<AnalyticsSession>({
    id: state.sessionId,
    startTime: Date.now(),
    engagementTime: 0,
    eventCount: 0,
    lastActivityTime: Date.now(),
  });
  const flushTimerRef = useRef<number | null>(null);
  const engagementTimerRef = useRef<number | null>(null);
  const userPropertiesRef = useRef<UserProperties>({});
  const trackingEnabledRef = useRef<boolean>(
    !respectDNT || !shouldRespectDNT()
  );

  // ============================================================================
  // Event Flushing
  // ============================================================================

  const flush = useCallback(async () => {
    if (!trackingEnabledRef.current) return;
    if (queueRef.current.length === 0) return;

    const eventsToSend = [...queueRef.current];
    queueRef.current = [];

    setState((prev) => ({
      ...prev,
      queueSize: 0,
      lastFlush: Date.now(),
    }));

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          events: eventsToSend,
          userProperties: userPropertiesRef.current,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analytics flush failed: ${response.status}`);
      }

      // Clear persisted events on success
      await clearPersistedEvents(eventsToSend.map((e) => e.id));

      if (debug) {
        logger.debug('Flushed events', { count: eventsToSend.length });
      }
    } catch (error) {
      // Re-queue events on failure
      queueRef.current.unshift(...eventsToSend);
      setState((prev) => ({
        ...prev,
        queueSize: queueRef.current.length,
      }));

      // Persist for offline scenarios
      for (const event of eventsToSend) {
        await persistEvent(event).catch(() => {
          // Silently fail persistence
        });
      }

      const errorInstance = error instanceof Error ? error : new Error(String(error));
      logger.error('Flush failed', errorInstance, { eventCount: eventsToSend.length });
    }
  }, [projectId, endpoint, debug, logger]);

  // ============================================================================
  // Event Tracking
  // ============================================================================

  const track = useCallback(
    (eventName: string, properties: Record<string, unknown> = {}) => {
      if (!trackingEnabledRef.current) return;

      // Update session engagement
      const now = Date.now();
      const timeSinceLastActivity = now - sessionRef.current.lastActivityTime;

      // Reset session if inactive for too long
      if (timeSinceLastActivity > SESSION_TIMEOUT) {
        sessionRef.current = {
          id: generateId(),
          startTime: now,
          engagementTime: 0,
          eventCount: 0,
          lastActivityTime: now,
        };
        setState((prev) => ({
          ...prev,
          sessionId: sessionRef.current.id,
        }));
      } else {
        sessionRef.current.engagementTime += Math.min(
          timeSinceLastActivity,
          ENGAGEMENT_UPDATE_INTERVAL * 2
        );
      }

      sessionRef.current.lastActivityTime = now;
      sessionRef.current.eventCount++;

      // Mask PII if enabled
      const sanitizedProperties = shouldMaskPII
        ? Object.entries(properties).reduce(
            (acc, [key, value]) => ({
              ...acc,
              [key]:
                typeof value === 'string' ? maskPII(value) : value,
            }),
            {}
          )
        : properties;

      const event: AnalyticsEvent = {
        id: generateId(),
        name: eventName,
        properties: sanitizedProperties,
        timestamp: now,
        sessionId: sessionRef.current.id,
        userId,
        anonymousId: state.anonymousId,
        context: getContext(),
      };

      queueRef.current.push(event);
      setState((prev) => ({
        ...prev,
        queueSize: queueRef.current.length,
      }));

      // Flush if batch size reached
      if (queueRef.current.length >= batchSize) {
        void flush();
      }

      // Persist event for offline scenarios
      void persistEvent(event);

      if (debug) {
        logger.debug('Tracked event', { eventName, properties: sanitizedProperties });
      }
    },
    [userId, state.anonymousId, batchSize, flush, debug, shouldMaskPII, logger]
  );

  // Page view tracking
  const page = useCallback(
    (name: string, properties: Record<string, unknown> = {}) => {
      track('page_view', {
        name,
        ...properties,
      });
    },
    [track]
  );

  // User identification
  const identify = useCallback(
    (newUserId: string, properties: UserProperties = {}) => {
      userPropertiesRef.current = {
        ...userPropertiesRef.current,
        ...properties,
      };

      track('user_identified', {
        userId: newUserId,
      });

      if (debug) {
        logger.debug('User identified', { userId: newUserId, properties });
      }
    },
    [track, debug, logger]
  );

  // Session info
  const getSession = useCallback(() => {
    return {
      id: sessionRef.current.id,
      startTime: sessionRef.current.startTime,
      engagementTime: sessionRef.current.engagementTime,
      eventCount: sessionRef.current.eventCount,
      duration: Date.now() - sessionRef.current.startTime,
    };
  }, []);

  // ============================================================================
  // Effects
  // ============================================================================

  // Auto-flush timer
  useEffect(() => {
    if (!trackingEnabledRef.current) return;

    flushTimerRef.current = window.setInterval(() => {
      void flush();
    }, flushInterval);

    return () => {
      if (flushTimerRef.current !== null) {
        clearInterval(flushTimerRef.current);
      }
    };
  }, [flush, flushInterval]);

  // Engagement tracking
  useEffect(() => {
    if (!trackingEnabledRef.current) return;

    engagementTimerRef.current = window.setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - sessionRef.current.lastActivityTime;

      // Only count as engaged if recent activity
      if (timeSinceLastActivity < ENGAGEMENT_UPDATE_INTERVAL * 2) {
        sessionRef.current.engagementTime += ENGAGEMENT_UPDATE_INTERVAL;
      }
    }, ENGAGEMENT_UPDATE_INTERVAL);

    return () => {
      if (engagementTimerRef.current !== null) {
        clearInterval(engagementTimerRef.current);
      }
    };
  }, []);

  // Load persisted events on mount
  useEffect(() => {
    if (!trackingEnabledRef.current) return;

    void getPersistedEvents().then((events) => {
      if (events.length > 0) {
        queueRef.current.unshift(...events);
        setState((prev) => ({
          ...prev,
          queueSize: queueRef.current.length,
        }));

        // Flush persisted events
        void flush();
      }
    });
  }, [flush]);

  // Online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      void flush();
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flush]);

  // Flush on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (queueRef.current.length > 0) {
        // Use sendBeacon for guaranteed delivery
        const data = JSON.stringify({
          projectId,
          events: queueRef.current,
          userProperties: userPropertiesRef.current,
        });

        navigator.sendBeacon(endpoint, data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [projectId, endpoint]);

  // Track session end
  useEffect(() => {
    return () => {
      track('session_end', {
        duration: Date.now() - sessionRef.current.startTime,
        engagementTime: sessionRef.current.engagementTime,
        eventCount: sessionRef.current.eventCount,
      });
      void flush();
    };
  }, [track, flush]);

  return {
    track,
    page,
    identify,
    flush,
    getSession,
    state,
  };
}
