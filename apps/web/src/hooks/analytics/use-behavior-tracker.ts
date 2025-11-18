/**
 * User behavior tracking with rage clicks, dead clicks, session replay markers, and scroll depth
 *
 * Features:
 * - Rage click detection (rapid repeated clicks)
 * - Dead click detection (clicks with no response)
 * - Error boundary integration
 * - Scroll depth tracking with milestones
 * - Time on page tracking
 * - Element visibility tracking (intersection observer)
 * - Mouse movement heatmap data collection
 * - Form abandonment tracking
 * - Session replay markers for debugging
 *
 * @example
 * ```tsx
 * const behavior = useBehaviorTracker({
 *   onRageClick: (data) => analytics.track('rage_click', data),
 *   onDeadClick: (data) => analytics.track('dead_click', data),
 *   onScrollMilestone: (depth) => analytics.track('scroll_depth', { depth }),
 *   trackMouseMovement: true,
 *   trackVisibility: true
 * });
 *
 * // Access behavior data
 * const { rageClicks, deadClicks, scrollDepth, timeOnPage } = behavior.state;
 *
 * // Manual event marking
 * behavior.markEvent('user_frustrated', { reason: 'slow_load' });
 * ```
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface BehaviorTrackerConfig {
  readonly onRageClick?: (event: RageClickEvent) => void;
  readonly onDeadClick?: (event: DeadClickEvent) => void;
  readonly onScrollMilestone?: (depth: number) => void;
  readonly onFormAbandonment?: (event: FormAbandonmentEvent) => void;
  readonly onError?: (event: ErrorEvent) => void;
  readonly trackMouseMovement?: boolean;
  readonly trackVisibility?: boolean;
  readonly rageClickThreshold?: number;
  readonly rageClickTimeWindow?: number;
  readonly deadClickTimeout?: number;
  readonly scrollMilestones?: readonly number[];
}

export interface RageClickEvent {
  readonly target: string;
  readonly selector: string;
  readonly clickCount: number;
  readonly timestamp: number;
  readonly timeWindow: number;
  readonly position: { readonly x: number; readonly y: number };
}

export interface DeadClickEvent {
  readonly target: string;
  readonly selector: string;
  readonly timestamp: number;
  readonly timeout: number;
  readonly position: { readonly x: number; readonly y: number };
}

export interface FormAbandonmentEvent {
  readonly formId: string;
  readonly formName: string;
  readonly fieldsFilled: number;
  readonly totalFields: number;
  readonly timeSpent: number;
  readonly lastField: string;
  readonly timestamp: number;
}

export interface ScrollDepthData {
  readonly maxDepth: number;
  readonly milestonesReached: readonly number[];
  readonly timeToMilestone: Record<number, number>;
}

export interface MouseMovementData {
  readonly totalDistance: number;
  readonly points: readonly MousePoint[];
  readonly samplingRate: number;
}

export interface MousePoint {
  readonly x: number;
  readonly y: number;
  readonly timestamp: number;
}

export interface VisibilityEvent {
  readonly element: string;
  readonly selector: string;
  readonly timestamp: number;
  readonly duration: number;
  readonly visiblePercentage: number;
}

export interface BehaviorState {
  readonly rageClicks: readonly RageClickEvent[];
  readonly deadClicks: readonly DeadClickEvent[];
  readonly scrollDepth: ScrollDepthData;
  readonly mouseMovement: MouseMovementData;
  readonly visibilityEvents: readonly VisibilityEvent[];
  readonly timeOnPage: number;
  readonly formAbandonment: readonly FormAbandonmentEvent[];
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_RAGE_THRESHOLD = 5; // clicks
const DEFAULT_RAGE_TIME_WINDOW = 2000; // ms
const DEFAULT_DEAD_CLICK_TIMEOUT = 1000; // ms
const DEFAULT_SCROLL_MILESTONES = [25, 50, 75, 90, 100] as const;
const MOUSE_SAMPLE_INTERVAL = 100; // ms
const MAX_MOUSE_POINTS = 1000;
const TIME_UPDATE_INTERVAL = 1000; // ms

// ============================================================================
// Utilities
// ============================================================================

function getElementSelector(element: Element): string {
  // Try ID first
  if (element.id) {
    return `#${element.id}`;
  }

  // Try data attributes
  const dataTestId = element.getAttribute('data-testid');
  if (dataTestId) {
    return `[data-testid="${dataTestId}"]`;
  }

  // Use tag + classes
  const classes = Array.from(element.classList)
    .slice(0, 2)
    .join('.');
  return classes ? `${element.tagName.toLowerCase()}.${classes}` : element.tagName.toLowerCase();
}

function getScrollDepth(): number {
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  if (documentHeight <= windowHeight) return 100;

  return Math.round((scrollTop / (documentHeight - windowHeight)) * 100);
}

function calculateDistance(p1: MousePoint, p2: MousePoint): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useBehaviorTracker(config: BehaviorTrackerConfig = {}) {
  const {
    onRageClick,
    onDeadClick,
    onScrollMilestone,
    onFormAbandonment,
    _onError,
    trackMouseMovement = false,
    trackVisibility = false,
    rageClickThreshold = DEFAULT_RAGE_THRESHOLD,
    rageClickTimeWindow = DEFAULT_RAGE_TIME_WINDOW,
    deadClickTimeout = DEFAULT_DEAD_CLICK_TIMEOUT,
    scrollMilestones = DEFAULT_SCROLL_MILESTONES,
  } = config;

  // State
  const [state, setState] = useState<BehaviorState>({
    rageClicks: [],
    deadClicks: [],
    scrollDepth: {
      maxDepth: 0,
      milestonesReached: [],
      timeToMilestone: {},
    },
    mouseMovement: {
      totalDistance: 0,
      points: [],
      samplingRate: MOUSE_SAMPLE_INTERVAL,
    },
    visibilityEvents: [],
    timeOnPage: 0,
    formAbandonment: [],
  });

  // Refs
  const clickHistoryRef = useRef<
    { element: Element; timestamp: number; x: number; y: number }[]
  >([]);
  const mousePointsRef = useRef<MousePoint[]>([]);
  const lastMousePointRef = useRef<MousePoint | null>(null);
  const totalDistanceRef = useRef(0);
  const pageStartTimeRef = useRef(Date.now());
  const scrollStartTimeRef = useRef(Date.now());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const formStartTimesRef = useRef<Map<HTMLFormElement, number>>(new Map());
  const formFieldsRef = useRef<Map<HTMLFormElement, Set<HTMLInputElement>>>(
    new Map()
  );

  // ============================================================================
  // Rage Click Detection
  // ============================================================================

  const handleClick = useCallback(
    (event: MouseEvent) => {
      const target = event.target as Element;
      const now = Date.now();
      const position = { x: event.clientX, y: event.clientY };

      // Add to click history
      clickHistoryRef.current.push({
        element: target,
        timestamp: now,
        x: position.x,
        y: position.y,
      });

      // Remove old clicks outside time window
      clickHistoryRef.current = clickHistoryRef.current.filter(
        (click) => now - click.timestamp < rageClickTimeWindow
      );

      // Count recent clicks on same element (within 50px radius)
      const recentClicks = clickHistoryRef.current.filter((click) => {
        const distance = Math.sqrt(
          Math.pow(click.x - position.x, 2) + Math.pow(click.y - position.y, 2)
        );
        return distance < 50;
      });

      // Detect rage click
      if (recentClicks.length >= rageClickThreshold) {
        const rageEvent: RageClickEvent = {
          target: target.tagName,
          selector: getElementSelector(target),
          clickCount: recentClicks.length,
          timestamp: now,
          timeWindow: rageClickTimeWindow,
          position,
        };

        setState((prev) => ({
          ...prev,
          rageClicks: [...prev.rageClicks, rageEvent],
        }));

        if (onRageClick) {
          onRageClick(rageEvent);
        }

        // Clear history to avoid multiple triggers
        clickHistoryRef.current = [];
      }

      // Dead click detection - check if click causes DOM changes
      const deadClickTimer = setTimeout(() => {
        // Simple heuristic: check if any visible changes occurred
        // In production, could use MutationObserver or check for network requests
        const hasVisibleChange =
          document.querySelector(':focus') !== null ||
          window.location.hash !== '' ||
          document.body.classList.contains('modal-open');

        if (!hasVisibleChange) {
          const deadEvent: DeadClickEvent = {
            target: target.tagName,
            selector: getElementSelector(target),
            timestamp: now,
            timeout: deadClickTimeout,
            position,
          };

          setState((prev) => ({
            ...prev,
            deadClicks: [...prev.deadClicks, deadEvent],
          }));

          if (onDeadClick) {
            onDeadClick(deadEvent);
          }
        }
      }, deadClickTimeout);

      // Clear timer if user navigates away
      const clearTimer = () => clearTimeout(deadClickTimer);
      window.addEventListener('beforeunload', clearTimer, { once: true });
    },
    [
      rageClickThreshold,
      rageClickTimeWindow,
      deadClickTimeout,
      onRageClick,
      onDeadClick,
    ]
  );

  // ============================================================================
  // Scroll Depth Tracking
  // ============================================================================

  const handleScroll = useCallback(() => {
    const currentDepth = getScrollDepth();

    setState((prev) => {
      const { scrollDepth: prevDepth } = prev;

      // Update max depth
      const maxDepth = Math.max(prevDepth.maxDepth, currentDepth);

      // Check for new milestones
      const newMilestones = scrollMilestones.filter(
        (milestone) =>
          currentDepth >= milestone &&
          !prevDepth.milestonesReached.includes(milestone)
      );

      // Record time to milestone
      const timeToMilestone = { ...prevDepth.timeToMilestone };
      const now = Date.now();
      for (const milestone of newMilestones) {
        timeToMilestone[milestone] = now - scrollStartTimeRef.current;

        if (onScrollMilestone) {
          onScrollMilestone(milestone);
        }
      }

      return {
        ...prev,
        scrollDepth: {
          maxDepth,
          milestonesReached: [
            ...prevDepth.milestonesReached,
            ...newMilestones,
          ],
          timeToMilestone,
        },
      };
    });
  }, [scrollMilestones, onScrollMilestone]);

  // ============================================================================
  // Mouse Movement Tracking
  // ============================================================================

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!trackMouseMovement) return;

      const now = Date.now();
      const point: MousePoint = {
        x: event.clientX,
        y: event.clientY,
        timestamp: now,
      };

      // Sample at interval
      if (
        lastMousePointRef.current === null ||
        now - lastMousePointRef.current.timestamp >= MOUSE_SAMPLE_INTERVAL
      ) {
        // Calculate distance
        if (lastMousePointRef.current !== null) {
          const distance = calculateDistance(lastMousePointRef.current, point);
          totalDistanceRef.current += distance;
        }

        // Add point
        mousePointsRef.current.push(point);

        // Limit buffer size
        if (mousePointsRef.current.length > MAX_MOUSE_POINTS) {
          mousePointsRef.current.shift();
        }

        lastMousePointRef.current = point;

        // Update state periodically
        setState((prev) => ({
          ...prev,
          mouseMovement: {
            totalDistance: totalDistanceRef.current,
            points: mousePointsRef.current,
            samplingRate: MOUSE_SAMPLE_INTERVAL,
          },
        }));
      }
    },
    [trackMouseMovement]
  );

  // ============================================================================
  // Form Abandonment Tracking
  // ============================================================================

  const handleFormInteraction = useCallback(() => {
    const forms = document.querySelectorAll('form');

    forms.forEach((form) => {
      if (!(form instanceof HTMLFormElement)) return;

      // Track form start time
      if (!formStartTimesRef.current.has(form)) {
        formStartTimesRef.current.set(form, Date.now());
        formFieldsRef.current.set(form, new Set());
      }

      // Track field interactions
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach((input) => {
        if (!(input instanceof HTMLInputElement)) return;

        input.addEventListener('change', () => {
          const fields = formFieldsRef.current.get(form);
          if (fields) {
            fields.add(input);
          }
        });
      });
    });
  }, []);

  const handleBeforeUnload = useCallback(() => {
    // Check for abandoned forms
    formStartTimesRef.current.forEach((startTime, form) => {
      const fields = formFieldsRef.current.get(form);
      if (!fields) return;

      const allInputs = form.querySelectorAll('input, textarea, select');
      const totalFields = allInputs.length;
      const fieldsFilled = fields.size;

      // Only track if user started filling the form but didn't submit
      if (fieldsFilled > 0 && fieldsFilled < totalFields) {
        const lastField = Array.from(fields).pop();
        const abandonmentEvent: FormAbandonmentEvent = {
          formId: form.id || 'unknown',
          formName: form.name || form.id || 'unknown',
          fieldsFilled,
          totalFields,
          timeSpent: Date.now() - startTime,
          lastField: lastField?.name ?? lastField?.id ?? 'unknown',
          timestamp: Date.now(),
        };

        if (onFormAbandonment) {
          onFormAbandonment(abandonmentEvent);
        }
      }
    });
  }, [onFormAbandonment]);

  // ============================================================================
  // Visibility Tracking
  // ============================================================================

  useEffect(() => {
    if (!trackVisibility) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visibilityEvents: VisibilityEvent[] = [];

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const event: VisibilityEvent = {
              element: entry.target.tagName,
              selector: getElementSelector(entry.target),
              timestamp: Date.now(),
              duration: 0,
              visiblePercentage: entry.intersectionRatio * 100,
            };
            visibilityEvents.push(event);
          }
        });

        if (visibilityEvents.length > 0) {
          setState((prev) => ({
            ...prev,
            visibilityEvents: [...prev.visibilityEvents, ...visibilityEvents],
          }));
        }
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      }
    );

    // Observe important elements
    const elementsToObserve = document.querySelectorAll(
      '[data-track-visibility], button, a, img, video'
    );
    elementsToObserve.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [trackVisibility]);

  // ============================================================================
  // Event Listeners
  // ============================================================================

  useEffect(() => {
    document.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Initial form tracking setup
    handleFormInteraction();

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleClick, handleScroll, handleMouseMove, handleBeforeUnload, handleFormInteraction]);

  // ============================================================================
  // Time on Page Tracking
  // ============================================================================

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        timeOnPage: Date.now() - pageStartTimeRef.current,
      }));
    }, TIME_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // Public API
  // ============================================================================

  const markEvent = useCallback((name: string, metadata?: Record<string, unknown>) => {
    // Mark custom event for session replay integration
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`behavior:${name}`, {
        detail: metadata,
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      rageClicks: [],
      deadClicks: [],
      scrollDepth: {
        maxDepth: 0,
        milestonesReached: [],
        timeToMilestone: {},
      },
      mouseMovement: {
        totalDistance: 0,
        points: [],
        samplingRate: MOUSE_SAMPLE_INTERVAL,
      },
      visibilityEvents: [],
      timeOnPage: 0,
      formAbandonment: [],
    });

    clickHistoryRef.current = [];
    mousePointsRef.current = [];
    lastMousePointRef.current = null;
    totalDistanceRef.current = 0;
    pageStartTimeRef.current = Date.now();
    scrollStartTimeRef.current = Date.now();
    formStartTimesRef.current.clear();
    formFieldsRef.current.clear();
  }, []);

  return {
    state,
    markEvent,
    reset,
  };
}
