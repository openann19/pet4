/**
 * Analytics API Service
 *
 * Handles analytics events, sessions, metrics, and insights through backend API.
 */

import { APIClient } from '@/lib/api-client';
import type {
  AnalyticsEvent,
  UserSession,
  AnalyticsMetrics,
  UserBehaviorInsights,
} from '@/lib/advanced-analytics';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AnalyticsAPI', undefined, { enableSentry: false });

export interface TrackEventRequest {
  event: AnalyticsEvent;
}

export interface CreateSessionRequest {
  session: Omit<UserSession, 'id'>;
}

export interface CreateSessionResponse {
  session: UserSession;
}

export interface GetMetricsResponse {
  metrics: AnalyticsMetrics;
}

export interface GetInsightsResponse {
  insights: UserBehaviorInsights;
}

class AnalyticsApiImpl {
  /**
   * POST /analytics/events
   * Track analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const request: TrackEventRequest = { event };
      await APIClient.post('/analytics/events', request);
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to track event', err, { event: event });
      // Don't throw - analytics should be fire-and-forget
    }
  }

  /**
   * POST /analytics/sessions
   * Create or update analytics session
   */
  async createSession(session: Omit<UserSession, 'id'>): Promise<UserSession> {
    try {
      const request: CreateSessionRequest = { session };
      const response = await APIClient.post<CreateSessionResponse>('/analytics/sessions', request);
      return response.data.session;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to create analytics session', err);
      throw err;
    }
  }

  /**
   * GET /analytics/metrics
   * Get analytics metrics
   */
  async getMetrics(startDate?: string, endDate?: string): Promise<AnalyticsMetrics> {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const url = `/analytics/metrics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await APIClient.get<GetMetricsResponse>(url);
      return response.data.metrics;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to get analytics metrics', err);
      throw err;
    }
  }

  /**
   * GET /analytics/insights/:userId
   * Get user behavior insights
   */
  async getUserBehaviorInsights(userId: string): Promise<UserBehaviorInsights> {
    try {
      const response = await APIClient.get<GetInsightsResponse>(`/analytics/insights/${userId}`);
      return response.data.insights;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to get user behavior insights', err, { userId });
      throw err;
    }
  }
}

export const analyticsApi = new AnalyticsApiImpl();
