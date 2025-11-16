/**
 * Deterministic analytics mock for testing
 * Provides predictable event tracking and validation
 */

import { vi } from 'vitest';

export interface TrackedEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: number;
  sessionId?: string;
  userId?: string;
}

export interface AnalyticsMockConfig {
  /**
   * Whether analytics is enabled (consent granted)
   * Default: true
   */
  enabled?: boolean;
  /**
   * Success rate for API calls (0-1)
   * Default: 1.0 (always succeeds)
   */
  successRate?: number;
  /**
   * Fixed delay for async operations in ms
   * Default: 0 (immediate)
   */
  delay?: number;
  /**
   * Whether to track events in order
   * Default: true
   */
  trackOrder?: boolean;
}

/**
 * Deterministic session ID generator
 */
function generateSessionId(eventCounter: number): string {
  return `test-session-${eventCounter + 1}`;
}

/**
 * Deterministic timestamp generator
 */
function createTimestampGenerator(initialTimestamp = 1000000000000) {
  let currentTimestamp = initialTimestamp;
  return (): number => {
    const ts = currentTimestamp;
    currentTimestamp += 1;
    return ts;
  };
}

/**
 * Deterministic success/failure based on successRate
 */
function shouldSucceed(eventCount: number, successRate: number): boolean {
  if (successRate >= 1.0) return true;
  if (successRate <= 0.0) return false;
  const threshold = Math.floor(1 / successRate);
  return eventCount % threshold === 0;
}

/**
 * Create tracking functions for analytics mock
 */
function createTrackingFunctions(
  enabled: boolean,
  delay: number,
  successRate: number,
  trackOrder: boolean,
  events: TrackedEvent[],
  getTimestamp: () => number,
  sessionId: string,
  userId: string | undefined
) {
  const mockTrack = vi.fn(async (eventName: string, properties?: Record<string, unknown>) => {
    if (!enabled) {
      return;
    }

    const event: TrackedEvent = {
      name: eventName,
      properties,
      timestamp: getTimestamp(),
      sessionId,
      userId,
    };

    events.push(event);

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    if (!shouldSucceed(events.length, successRate)) {
      throw new Error(`Analytics API call failed (deterministic failure)`);
    }
  });

  const mockTrackPageView = vi.fn(async (path: string, properties?: Record<string, unknown>) => {
    return mockTrack('page_view', { path, ...properties });
  });

  const mockTrackFeatureUse = vi.fn(
    async (featureName: string, properties?: Record<string, unknown>) => {
      return mockTrack('feature_used', { featureName, ...properties });
    }
  );

  const mockTrackError = vi.fn(async (error: Error, context?: Record<string, unknown>) => {
    return mockTrack('error_occurred', {
      errorMessage: error.message,
      errorStack: error.stack,
      ...context,
    });
  });

  const mockEndSession = vi.fn(async () => {
    const sessionDuration = 1000;
    return mockTrack('session_end', {
      duration: sessionDuration,
      eventCount: events.length,
    });
  });

  return {
    mockTrack,
    mockTrackPageView,
    mockTrackFeatureUse,
    mockTrackError,
    mockEndSession,
  };
}

/**
 * Create utility functions for analytics mock
 */
function createUtilityFunctions(
  events: TrackedEvent[],
  sessionId: string,
  userId: string | undefined,
  enabled: boolean
) {
  const mockClear = vi.fn(() => {
    events.length = 0;
  });

  const mockSetUserId = vi.fn((newUserId: string) => {
    // Note: This would need to be mutable, but we'll keep it simple for tests
  });

  const mockGetSessionId = vi.fn(() => sessionId);
  const mockGetUserId = vi.fn(() => userId);
  const mockIsEnabled = vi.fn(() => enabled);

  return {
    mockClear,
    mockSetUserId,
    mockGetSessionId,
    mockGetUserId,
    mockIsEnabled,
  };
}

/**
 * Create a deterministic analytics mock
 */
export function createAnalyticsMock(config: AnalyticsMockConfig = {}) {
  const {
    enabled = true,
    successRate = 1.0,
    delay = 0,
    trackOrder = true,
  } = config;

  const events: TrackedEvent[] = [];
  let sessionId = 'test-session-1';
  let userId: string | undefined;
  let eventCounter = 0;

  const getTimestamp = createTimestampGenerator();

  const trackingFunctions = createTrackingFunctions(
    enabled,
    delay,
    successRate,
    trackOrder,
    events,
    getTimestamp,
    sessionId,
    userId
  );

  const utilityFunctions = createUtilityFunctions(
    events,
    sessionId,
    userId,
    enabled
  );

  // Reset function to restore initial state
  const reset = () => {
    events.length = 0;
    eventCounter = 0;
    trackingFunctions.mockTrack.mockClear();
    trackingFunctions.mockTrackPageView.mockClear();
    trackingFunctions.mockTrackFeatureUse.mockClear();
    trackingFunctions.mockTrackError.mockClear();
    trackingFunctions.mockEndSession.mockClear();
    utilityFunctions.mockClear.mockClear();
    utilityFunctions.mockSetUserId.mockClear();
    utilityFunctions.mockGetSessionId.mockClear();
    utilityFunctions.mockGetUserId.mockClear();
    utilityFunctions.mockIsEnabled.mockClear();
  };

  return {
    // Mock methods
    track: trackingFunctions.mockTrack,
    trackPageView: trackingFunctions.mockTrackPageView,
    trackFeatureUse: trackingFunctions.mockTrackFeatureUse,
    trackError: trackingFunctions.mockTrackError,
    endSession: trackingFunctions.mockEndSession,
    clear: utilityFunctions.mockClear,
    setUserId: utilityFunctions.mockSetUserId,
    getSessionId: utilityFunctions.mockGetSessionId,
    getUserId: utilityFunctions.mockGetUserId,
    isEnabled: utilityFunctions.mockIsEnabled,

    // Test utilities
    getEvents: () => [...events],
    getEventCount: () => events.length,
    getEvent: (index: number) => events[index],
    findEvents: (predicate: (event: TrackedEvent) => boolean) => events.filter(predicate),
    hasEvent: (eventName: string) => events.some((e) => e.name === eventName),
    reset,
  };
}

/**
 * Default analytics mock instance
 */
export const analyticsMock = createAnalyticsMock();
