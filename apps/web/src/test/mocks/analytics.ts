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

  // Deterministic session ID generator
  const generateSessionId = (): string => {
    eventCounter += 1;
    return `test-session-${eventCounter}`;
  };

  // Deterministic timestamp generator (increments by 1ms per event)
  let currentTimestamp = 1000000000000; // Fixed base timestamp

  const getTimestamp = (): number => {
    const ts = currentTimestamp;
    currentTimestamp += 1; // Increment for next event
    return ts;
  };

  // Deterministic success/failure based on successRate
  const shouldSucceed = (): boolean => {
    // Use a deterministic approach: check if (eventIndex % (1/successRate)) === 0
    // For 100% success rate, always return true
    if (successRate >= 1.0) return true;
    if (successRate <= 0.0) return false;

    // For partial success rates, use deterministic pattern
    const threshold = Math.floor(1 / successRate);
    return events.length % threshold === 0;
  };

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

    if (trackOrder) {
      events.push(event);
    } else {
      // Still track but don't enforce order
      events.push(event);
    }

    // Simulate API call with deterministic delay
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Deterministic success/failure
    if (!shouldSucceed()) {
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
    const sessionDuration = 1000; // Fixed duration for deterministic tests
    return mockTrack('session_end', {
      duration: sessionDuration,
      eventCount: events.length,
    });
  });

  const mockClear = vi.fn(() => {
    events.length = 0;
    eventCounter = 0;
    currentTimestamp = 1000000000000;
  });

  const mockSetUserId = vi.fn((newUserId: string) => {
    userId = newUserId;
  });

  const mockGetSessionId = vi.fn(() => sessionId);

  const mockGetUserId = vi.fn(() => userId);

  const mockIsEnabled = vi.fn(() => enabled);

  // Reset function to restore initial state
  const reset = () => {
    events.length = 0;
    eventCounter = 0;
    currentTimestamp = 1000000000000;
    sessionId = 'test-session-1';
    userId = undefined;
    mockTrack.mockClear();
    mockTrackPageView.mockClear();
    mockTrackFeatureUse.mockClear();
    mockTrackError.mockClear();
    mockEndSession.mockClear();
    mockClear.mockClear();
    mockSetUserId.mockClear();
    mockGetSessionId.mockClear();
    mockGetUserId.mockClear();
    mockIsEnabled.mockClear();
  };

  return {
    // Mock methods
    track: mockTrack,
    trackPageView: mockTrackPageView,
    trackFeatureUse: mockTrackFeatureUse,
    trackError: mockTrackError,
    endSession: mockEndSession,
    clear: mockClear,
    setUserId: mockSetUserId,
    getSessionId: mockGetSessionId,
    getUserId: mockGetUserId,
    isEnabled: mockIsEnabled,

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
