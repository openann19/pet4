/* eslint-disable max-lines -- advanced analytics service with comprehensive metrics computation */
import { useEffect } from 'react';
import { generateCorrelationId } from './utils';
import { createLogger } from './logger';
import { storage } from './storage';
import { analyticsApi } from '@/api/analytics-api';

const logger = createLogger('advanced-analytics');

export type EventName =
  | 'app_opened'
  | 'pet_viewed'
  | 'pet_liked'
  | 'pet_passed'
  | 'match_created'
  | 'chat_opened'
  | 'message_sent'
  | 'story_created'
  | 'story_viewed'
  | 'story_view_completed'
  | 'story_reaction'
  | 'story_interaction'
  | 'story_reaction_received'
  | 'story_view_received'
  | 'profile_edited'
  | 'filter_applied'
  | 'photo_uploaded'
  | 'notification_received'
  | 'notification_clicked'
  | 'feature_used'
  | 'error_occurred'
  | 'page_view'
  | 'session_start'
  | 'session_end';

export interface AnalyticsEvent {
  id: string;
  name: EventName;
  timestamp: string;
  sessionId: string;
  userId?: string;
  properties: Record<string, unknown>;
  correlationId: string;
}

export interface UserSession {
  id: string;
  userId?: string;
  startTime: string;
  endTime?: string;
  events: AnalyticsEvent[];
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
    screenSize: string;
  };
  entryPoint: string;
  exitPoint?: string;
}

export interface AnalyticsMetrics {
  totalSessions: number;
  totalEvents: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  topEvents: { name: EventName; count: number }[];
  conversionRate: number;
  retentionRate: number;
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface UserBehaviorInsights {
  mostViewedPets: string[];
  matchingSuccessRate: number;
  averageSwipesPerSession: number;
  preferredPetTypes: string[];
  peakActivityHours: number[];
  averageMessagesPerMatch: number;
  storyEngagement: {
    viewRate: number;
    creationRate: number;
  };
}

class AnalyticsService {
  private sessionId: string;
  private userId?: string;
  private sessionStart: number;
  private events: AnalyticsEvent[] = [];

  constructor() {
    this.sessionId = generateCorrelationId();
    this.sessionStart = Date.now();
    void this.initializeSession();
  }

  private async initializeSession() {
    const userId = localStorage.getItem('user-id') ?? undefined;
    if (userId) {
      this.userId = userId;
    }

    await this.trackEvent('session_start', {
      entryPoint: window.location.pathname,
      referrer: document.referrer,
    });
  }

  async trackEvent(name: EventName, properties: Record<string, unknown> = {}): Promise<void> {
    // Check consent before tracking
    if (!this.hasAnalyticsConsent()) {
      logger.debug('Analytics tracking skipped - consent not granted', { eventName: name });
      return;
    }

    const event: AnalyticsEvent = {
      id: generateCorrelationId(),
      name,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      ...(this.userId ? { userId: this.userId } : {}),
      properties: {
        ...properties,
        url: window.location.href,
        pathname: window.location.pathname,
      },
      correlationId: generateCorrelationId(),
    };

    this.events.push(event);

    // Send to backend API (fire-and-forget)
    try {
      await analyticsApi.trackEvent(event);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to track event via API, storing locally', err, { name });
      // Store locally as fallback
      const allEvents = (await storage.get<AnalyticsEvent[]>('analytics-events')) ?? [];
      allEvents.push(event);
      await storage.set('analytics-events', allEvents.slice(-10000));
    }

    logger.debug('Analytics event', { name, properties });
  }

  /**
   * Check if analytics consent is granted
   */
  private hasAnalyticsConsent(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const consentData = localStorage.getItem('gdpr-consent');
      if (!consentData) {
        return false;
      }

      const parsed = JSON.parse(consentData) as { value?: { analytics?: boolean } };
      return parsed.value?.analytics === true;
    } catch {
      return false;
    }
  }

  async trackPageView(path: string, properties: Record<string, unknown> = {}): Promise<void> {
    await this.trackEvent('page_view', {
      path,
      ...properties,
    });
  }

  async trackFeatureUse(
    featureName: string,
    properties: Record<string, unknown> = {}
  ): Promise<void> {
    await this.trackEvent('feature_used', {
      featureName,
      ...properties,
    });
  }

  async trackError(error: Error, context: Record<string, unknown> = {}): Promise<void> {
    await this.trackEvent('error_occurred', {
      errorMessage: error.message,
      errorStack: error.stack,
      ...context,
    });
  }

  async endSession(): Promise<void> {
    const sessionDuration = Date.now() - this.sessionStart;

    await this.trackEvent('session_end', {
      duration: sessionDuration,
      eventCount: this.events.length,
      exitPoint: window.location.pathname,
    });

    const session: UserSession = {
      id: this.sessionId,
      ...(this.userId ? { userId: this.userId } : {}),
      startTime: new Date(this.sessionStart).toISOString(),
      endTime: new Date().toISOString(),
      events: this.events,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      },
      entryPoint: (this.events[0]?.properties?.pathname as string | undefined) ?? '/',
      exitPoint: window.location.pathname,
    };

    // Send to backend API
    try {
      await analyticsApi.createSession(session);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create session via API, storing locally', err);
      // Store locally as fallback
      const sessions = (await storage.get<UserSession[]>('analytics-sessions')) ?? [];
      sessions.push(session);
      await storage.set('analytics-sessions', sessions.slice(-1000));
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }
}

let analyticsInstance: AnalyticsService | null = null;

export function getAnalytics(): AnalyticsService {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsService();

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        void analyticsInstance?.endSession();
      });
    }
  }
  return analyticsInstance;
}

export function useAnalytics() {
  const analytics = getAnalytics();

  useEffect(() => {
    void analytics.trackPageView(window.location.pathname);
  }, []);

  return analytics;
}

function calculateActiveUsers(
  sessions: UserSession[],
  timeThreshold: number
): number {
  return new Set(
    sessions
      .filter((s) => new Date(s.startTime).getTime() > timeThreshold)
      .filter((s) => s.userId)
      .map((s) => s.userId)
  ).size;
}

function calculateRetentionRate(sessions: UserSession[]): number {
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

  const usersThisWeek = new Set(
    sessions
      .filter((s) => new Date(s.startTime).getTime() > oneWeekAgo)
      .filter((s) => s.userId)
      .map((s) => s.userId)
  );

  const usersLastWeek = new Set(
    sessions
      .filter((s) => {
        const time = new Date(s.startTime).getTime();
        return time > twoWeeksAgo && time <= oneWeekAgo;
      })
      .filter((s) => s.userId)
      .map((s) => s.userId)
  );

  const retainedUsers = [...usersThisWeek].filter((u) => usersLastWeek.has(u));
  return usersLastWeek.size > 0 ? retainedUsers.length / usersLastWeek.size : 0;
}

function calculateBasicMetrics(
  sessions: UserSession[],
  events: AnalyticsEvent[]
): {
  uniqueUsers: number;
  totalSessions: number;
  totalEvents: number;
  averageSessionDuration: number;
} {
  const uniqueUsers = new Set(sessions.filter((s) => s.userId).map((s) => s.userId)).size;
  const totalSessions = sessions.length;
  const totalEvents = events.length;

  const sessionDurations = sessions
    .filter((s) => s.endTime)
    .map((s) => new Date(s.endTime!).getTime() - new Date(s.startTime).getTime());
  const averageSessionDuration =
    sessionDurations.length > 0
      ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
      : 0;

  return {
    uniqueUsers,
    totalSessions,
    totalEvents,
    averageSessionDuration: Math.round(averageSessionDuration / 1000),
  };
}

function calculateEventMetrics(events: AnalyticsEvent[]): {
  topEvents: { name: EventName; count: number }[];
  conversionRate: number;
} {
  const eventCounts = events.reduce(
    (acc, event) => {
      acc[event.name] = (acc[event.name] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topEvents = Object.entries(eventCounts)
    .map(([name, count]) => ({ name: name as EventName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const matchCreated = events.filter((e) => e.name === 'match_created').length;
  const totalSwipes = events.filter(
    (e) => e.name === 'pet_liked' || e.name === 'pet_passed'
  ).length;
  const conversionRate = totalSwipes > 0 ? matchCreated / totalSwipes : 0;

  return { topEvents, conversionRate };
}

export async function getAnalyticsMetrics(
  startDate?: string,
  endDate?: string
): Promise<AnalyticsMetrics> {
  try {
    return await analyticsApi.getMetrics(startDate, endDate);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get metrics from API, computing locally', err);

    const sessions = (await storage.get<UserSession[]>('analytics-sessions')) ?? [];
    const events = (await storage.get<AnalyticsEvent[]>('analytics-events')) ?? [];

    const basicMetrics = calculateBasicMetrics(sessions, events);
    const eventMetrics = calculateEventMetrics(events);

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const retentionRate = calculateRetentionRate(sessions);

    return {
      totalSessions: basicMetrics.totalSessions,
      totalEvents: basicMetrics.totalEvents,
      uniqueUsers: basicMetrics.uniqueUsers,
      averageSessionDuration: basicMetrics.averageSessionDuration,
      topEvents: eventMetrics.topEvents,
      conversionRate: eventMetrics.conversionRate,
      retentionRate,
      activeUsers: {
        daily: calculateActiveUsers(sessions, oneDayAgo),
        weekly: calculateActiveUsers(sessions, oneWeekAgo),
        monthly: calculateActiveUsers(sessions, oneMonthAgo),
      },
    };
  }
}

function calculateUserEngagementMetrics(
  userEvents: AnalyticsEvent[],
  userSessions: UserSession[]
): {
  matchingSuccessRate: number;
  averageSwipesPerSession: number;
  averageMessagesPerMatch: number;
  storyEngagement: { viewRate: number; creationRate: number };
} {
  const matches = userEvents.filter((e) => e.name === 'match_created').length;
  const likes = userEvents.filter((e) => e.name === 'pet_liked').length;
  const matchingSuccessRate = likes > 0 ? matches / likes : 0;

  const totalSwipes = userEvents.filter(
    (e) => e.name === 'pet_liked' || e.name === 'pet_passed'
  ).length;
  const averageSwipesPerSession = userSessions.length > 0 ? totalSwipes / userSessions.length : 0;

  const messagesSent = userEvents.filter((e) => e.name === 'message_sent').length;
  const averageMessagesPerMatch = matches > 0 ? messagesSent / matches : 0;

  const storiesCreated = userEvents.filter((e) => e.name === 'story_created').length;
  const storiesViewed = userEvents.filter((e) => e.name === 'story_viewed').length;
  const storyCreationRate = userSessions.length > 0 ? storiesCreated / userSessions.length : 0;
  const storyViewRate = userSessions.length > 0 ? storiesViewed / userSessions.length : 0;

  return {
    matchingSuccessRate,
    averageSwipesPerSession: Math.round(averageSwipesPerSession),
    averageMessagesPerMatch: Math.round(averageMessagesPerMatch),
    storyEngagement: {
      viewRate: storyViewRate,
      creationRate: storyCreationRate,
    },
  };
}

function calculateUserPreferences(userEvents: AnalyticsEvent[]): {
  mostViewedPets: string[];
  preferredPetTypes: string[];
  peakActivityHours: number[];
} {
  const viewedPets = userEvents
    .filter((e) => e.name === 'pet_viewed')
    .map((e) => e.properties.petId)
    .filter((petId): petId is string => typeof petId === 'string');
  const mostViewedPets: string[] = Array.from(new Set(viewedPets)).slice(0, 10);

  const likedPets = userEvents
    .filter((e) => e.name === 'pet_liked')
    .map((e) => e.properties.breed)
    .filter((breed): breed is string => typeof breed === 'string');
  const preferredPetTypes: string[] = Array.from(new Set(likedPets)).slice(0, 5);

  const activityByHour = userEvents.reduce(
    (acc, event) => {
      const hour = new Date(event.timestamp).getHours();
      acc[hour] = (acc[hour] ?? 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  const peakActivityHours: number[] = Object.entries(activityByHour)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => parseInt(hour, 10));

  return { mostViewedPets, preferredPetTypes, peakActivityHours };
}

export async function getUserBehaviorInsights(userId: string): Promise<UserBehaviorInsights> {
  try {
    return await analyticsApi.getUserBehaviorInsights(userId);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get insights from API, computing locally', err, { userId });

    const events = (await storage.get<AnalyticsEvent[]>('analytics-events')) ?? [];
    const userEvents = events.filter((e) => e.userId === userId);

    const sessions = (await storage.get<UserSession[]>('analytics-sessions')) ?? [];
    const userSessions = sessions.filter((s) => s.userId === userId);

    const engagementMetrics = calculateUserEngagementMetrics(userEvents, userSessions);
    const preferences = calculateUserPreferences(userEvents);

    return {
      mostViewedPets: preferences.mostViewedPets,
      matchingSuccessRate: engagementMetrics.matchingSuccessRate,
      averageSwipesPerSession: engagementMetrics.averageSwipesPerSession,
      preferredPetTypes: preferences.preferredPetTypes,
      peakActivityHours: preferences.peakActivityHours,
      averageMessagesPerMatch: engagementMetrics.averageMessagesPerMatch,
      storyEngagement: engagementMetrics.storyEngagement,
    };
  }
}

export function trackPetView(petId: string, petName: string, breed: string): void {
  void getAnalytics().trackEvent('pet_viewed', { petId, petName, breed });
}

export function trackPetLike(petId: string, petName: string, breed: string): void {
  void getAnalytics().trackEvent('pet_liked', { petId, petName, breed });
}

export function trackPetPass(petId: string, petName: string, breed: string): void {
  void getAnalytics().trackEvent('pet_passed', { petId, petName, breed });
}

export function trackMatch(matchId: string, petId1: string, petId2: string): void {
  void getAnalytics().trackEvent('match_created', { matchId, petId1, petId2 });
}

export function trackMessageSent(roomId: string, messageType: string): void {
  void getAnalytics().trackEvent('message_sent', { roomId, messageType });
}

export function trackStoryCreated(storyId: string, mediaType: string): void {
  void getAnalytics().trackEvent('story_created', { storyId, mediaType });
}

export function trackStoryViewed(storyId: string, authorId: string): void {
  void getAnalytics().trackEvent('story_viewed', { storyId, authorId });
}
