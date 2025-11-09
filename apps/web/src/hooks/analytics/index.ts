/**
 * Analytics & Telemetry Module
 *
 * Comprehensive analytics tracking system with A/B testing and behavior analysis
 */

export { useAnalytics } from './use-analytics';
export type {
  AnalyticsEvent,
  AnalyticsContext,
  AnalyticsConfig,
  AnalyticsState,
  UserProperties,
  CampaignData,
} from './use-analytics';

export { useABTesting } from './use-ab-testing';
export type {
  ABVariant,
  ABExperiment,
  ABTestingConfig,
  ABTestingState,
  ConversionEvent,
  ExperimentResults,
  VariantResults,
} from './use-ab-testing';

export { useBehaviorTracker } from './use-behavior-tracker';
export type {
  BehaviorTrackerConfig,
  RageClickEvent,
  DeadClickEvent,
  FormAbandonmentEvent,
  ScrollDepthData,
  MouseMovementData,
  MousePoint,
  VisibilityEvent,
  BehaviorState,
} from './use-behavior-tracker';
