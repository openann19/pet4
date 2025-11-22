/**
 * A/B testing framework with variant assignment, tracking, and statistical analysis
 *
 * Features:
 * - Deterministic variant assignment based on user ID
 * - Multi-variant support (A/B/n testing)
 * - Traffic allocation with percentage-based splits
 * - Automatic exposure tracking
 * - Conversion goal tracking
 * - Statistical significance calculation (chi-square test)
 * - Persistent variant assignment
 * - Feature flags with gradual rollouts
 *
 * @example
 * ```tsx
 * const experiment = useABTesting({
 *   experimentId: 'chat-effect-pricing',
 *   userId: user.id,
 *   variants: [
 *     { id: 'control', name: 'Current Pricing', allocation: 0.5 },
 *     { id: 'variant-a', name: 'Premium Bundle', allocation: 0.5 }
 *   ],
 *   onExposure: (variant) => analytics.track('experiment_exposure', { variant })
 * });
 *
 * // Use assigned variant
 * const price = experiment.variant.id === 'variant-a' ? '$9.99' : '$4.99';
 *
 * // Track conversion
 * experiment.trackConversion('purchase', { amount: 9.99 });
 *
 * // Check if feature is enabled
 * const showNewUI = experiment.isEnabled('new-ui-v2');
 * ```
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ABVariant {
  readonly id: string;
  readonly name: string;
  readonly allocation: number; // 0-1, sum must equal 1
  readonly metadata?: Record<string, unknown>;
}

export interface ABExperiment {
  readonly id: string;
  readonly name: string;
  readonly variants: readonly ABVariant[];
  readonly startDate: number;
  readonly endDate?: number;
  readonly goals: readonly string[];
  readonly trafficAllocation: number; // 0-1, percentage of users in experiment
}

export interface ABTestingConfig {
  readonly experimentId: string;
  readonly userId?: string;
  readonly variants: readonly ABVariant[];
  readonly goals?: readonly string[];
  readonly trafficAllocation?: number;
  readonly onExposure?: (variant: ABVariant) => void;
  readonly onConversion?: (goal: string, variant: ABVariant, value?: number) => void;
  readonly persistKey?: string;
}

export interface ABTestingState {
  readonly variant: ABVariant;
  readonly isInExperiment: boolean;
  readonly exposureTracked: boolean;
  readonly conversions: readonly ConversionEvent[];
}

export interface ConversionEvent {
  readonly goal: string;
  readonly timestamp: number;
  readonly value?: number;
  readonly metadata?: Record<string, unknown>;
}

export interface ExperimentResults {
  readonly experimentId: string;
  readonly variants: readonly VariantResults[];
  readonly winner?: string;
  readonly confidence: number;
  readonly sampleSize: number;
}

export interface VariantResults {
  readonly variantId: string;
  readonly exposures: number;
  readonly conversions: number;
  readonly conversionRate: number;
  readonly revenue?: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TRAFFIC_ALLOCATION = 1.0;
const STORAGE_PREFIX = 'petspark_ab_';
const CONFIDENCE_THRESHOLD = 0.95; // 95% confidence
const MIN_SAMPLE_SIZE = 100;

// ============================================================================
// Utilities
// ============================================================================

/**
 * Deterministic hash function for consistent variant assignment
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Assign variant based on user ID and allocation percentages
 */
function assignVariant(
  userId: string,
  experimentId: string,
  variants: readonly ABVariant[]
): ABVariant {
  // Validate allocations sum to 1
  const totalAllocation = variants.reduce((sum, v) => sum + v.allocation, 0);
  if (Math.abs(totalAllocation - 1) > 0.001) {
    throw new Error(
      `Variant allocations must sum to 1, got ${totalAllocation}`
    );
  }

  // Generate deterministic hash
  const hash = hashString(`${userId}-${experimentId}`);
  const normalized = (hash % 10000) / 10000; // 0-1 range

  // Find variant based on cumulative allocation
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.allocation;
    if (normalized < cumulative) {
      return variant;
    }
  }

  // Fallback to last variant (should never reach here)
  const lastVariant = variants[variants.length - 1];
  if (!lastVariant) {
    throw new Error('No variants provided');
  }
  return lastVariant;
}

/**
 * Check if user should be included in experiment based on traffic allocation
 */
function shouldIncludeInExperiment(
  userId: string,
  experimentId: string,
  trafficAllocation: number
): boolean {
  const hash = hashString(`${userId}-${experimentId}-traffic`);
  const normalized = (hash % 10000) / 10000;
  return normalized < trafficAllocation;
}

/**
 * Calculate chi-square statistic for A/B test
 */
function calculateChiSquare(
  variantResults: readonly VariantResults[]
): number {
  if (variantResults.length < 2) return 0;

  const totalExposures = variantResults.reduce((sum, v) => sum + v.exposures, 0);
  const totalConversions = variantResults.reduce((sum, v) => sum + v.conversions, 0);
  const expectedRate = totalConversions / totalExposures;

  let chiSquare = 0;
  for (const variant of variantResults) {
    const expected = variant.exposures * expectedRate;
    const observed = variant.conversions;
    chiSquare += Math.pow(observed - expected, 2) / expected;
  }

  return chiSquare;
}

/**
 * Calculate p-value from chi-square statistic
 * Simplified approximation for df=1 (two variants)
 */
function chiSquareToPValue(chiSquare: number, degreesOfFreedom: number): number {
  // Simplified approximation - in production, use proper chi-square CDF
  // For df=1, approximate using normal distribution
  if (degreesOfFreedom === 1) {
    const z = Math.sqrt(chiSquare);
    // Approximate normal CDF
    return 2 * (1 - normalCDF(z));
  }

  // For other df, return conservative estimate
  return chiSquare > 3.841 ? 0.05 : 1.0; // 3.841 is critical value for df=1, p=0.05
}

/**
 * Normal cumulative distribution function (approximation)
 */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const probability =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - probability : probability;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useABTesting(config: ABTestingConfig) {
  const {
    experimentId,
    userId,
    variants,
    trafficAllocation = DEFAULT_TRAFFIC_ALLOCATION,
    onExposure,
    onConversion,
    persistKey = `${STORAGE_PREFIX}${experimentId}`,
  } = config;

  // Generate stable anonymous ID if no user ID provided
  const stableUserId = useMemo((): string => {
    if (userId) return userId;

    try {
      let anonId = localStorage.getItem(`${STORAGE_PREFIX}anonymous_id`);
      if (!anonId) {
        anonId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(`${STORAGE_PREFIX}anonymous_id`, anonId);
      }
      return anonId;
    } catch {
      // Fallback if localStorage is not available
      return `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }, [userId]);

  // Check if user is in experiment
  const isInExperiment = useMemo(() => {
    return shouldIncludeInExperiment(
      stableUserId,
      experimentId,
      trafficAllocation
    );
  }, [stableUserId, experimentId, trafficAllocation]);

  // Assign variant
  const assignedVariant = useMemo((): ABVariant => {
    // Check for persisted assignment
    try {
      const persisted = localStorage.getItem(persistKey);
      if (persisted) {
        try {
          const parsed = JSON.parse(persisted) as { variantId: string };
          const found = variants.find((v) => v.id === parsed.variantId);
          if (found) return found;
        } catch {
          // Ignore parse errors
        }
      }
    } catch {
      // Ignore localStorage errors, proceed with new assignment
    }

    // Assign new variant
    const variant = isInExperiment
      ? assignVariant(stableUserId, experimentId, variants)
      : variants[0]; // Default to control if not in experiment

    if (!variant) {
      throw new Error('No variants available for assignment');
    }

    // Persist assignment
    try {
      localStorage.setItem(
        persistKey,
        JSON.stringify({ variantId: variant.id })
      );
    } catch {
      // Ignore localStorage errors, continue without persistence
    }

    return variant;
  }, [stableUserId, experimentId, variants, isInExperiment, persistKey]);

  // State
  const [state, setState] = useState<ABTestingState>({
    variant: assignedVariant,
    isInExperiment,
    exposureTracked: false,
    conversions: [],
  });

  // Refs
  const exposureTrackedRef = useRef(false);
  const conversionsRef = useRef<ConversionEvent[]>([]);

  // ============================================================================
  // Exposure Tracking
  // ============================================================================

  useEffect(() => {
    if (exposureTrackedRef.current || !isInExperiment) return;

    exposureTrackedRef.current = true;
    setState((prev) => ({ ...prev, exposureTracked: true }));

    if (onExposure) {
      onExposure(assignedVariant);
    }

    // Persist exposure
    try {
      const exposureKey = `${persistKey}_exposure`;
      localStorage.setItem(
        exposureKey,
        JSON.stringify({
          timestamp: Date.now(),
          variantId: assignedVariant.id,
        })
      );
    } catch {
      // Ignore localStorage errors, continue without persistence
    }
  }, [isInExperiment, assignedVariant, onExposure, persistKey]);

  // ============================================================================
  // Conversion Tracking
  // ============================================================================

  const trackConversion = useCallback(
    (
      goal: string,
      metadata?: { value?: number; [key: string]: unknown }
    ): void => {
      if (!isInExperiment) return;

      const conversion: ConversionEvent = {
        goal,
        timestamp: Date.now(),
        value: metadata?.value,
        metadata,
      };

      conversionsRef.current.push(conversion);
      setState((prev) => ({
        ...prev,
        conversions: [...prev.conversions, conversion],
      }));

      if (onConversion) {
        onConversion(goal, assignedVariant, metadata?.value);
      }

      // Persist conversion
      try {
        const conversionKey = `${persistKey}_conversions`;
        const existing = localStorage.getItem(conversionKey);
        const conversions = existing ? (JSON.parse(existing) as ConversionEvent[]) : [];
        conversions.push(conversion);
        localStorage.setItem(conversionKey, JSON.stringify(conversions));
      } catch {
        // Ignore localStorage errors, continue without persistence
      }
    },
    [isInExperiment, assignedVariant, onConversion, persistKey]
  );

  // ============================================================================
  // Feature Flags
  // ============================================================================

  const isEnabled = useCallback(
    (featureId: string): boolean => {
      // Check if variant metadata contains feature flag
      return (
        state.variant.metadata?.[featureId] === true ||
        state.variant.id !== 'control'
      );
    },
    [state.variant]
  );

  const getVariantValue = useCallback(
    <T,>(key: string, defaultValue: T): T => {
      return (state.variant.metadata?.[key] as T) ?? defaultValue;
    },
    [state.variant]
  );

  // ============================================================================
  // Results Analysis
  // ============================================================================

  const calculateResults = useCallback(
    (variantResults: readonly VariantResults[]): ExperimentResults => {
      const totalExposures = variantResults.reduce(
        (sum, v) => sum + v.exposures,
        0
      );

      // Check minimum sample size
      if (totalExposures < MIN_SAMPLE_SIZE) {
        return {
          experimentId,
          variants: variantResults,
          confidence: 0,
          sampleSize: totalExposures,
        };
      }

      // Calculate statistical significance
      const chiSquare = calculateChiSquare(variantResults);
      const pValue = chiSquareToPValue(chiSquare, variantResults.length - 1);
      const confidence = 1 - pValue;

      // Determine winner if statistically significant
      let winner: string | undefined;
      if (confidence >= CONFIDENCE_THRESHOLD) {
        const sorted = [...variantResults].sort(
          (a, b) => b.conversionRate - a.conversionRate
        );
        const topVariant = sorted[0];
        winner = topVariant ? topVariant.variantId : undefined;
      }

      return {
        experimentId,
        variants: variantResults,
        winner,
        confidence,
        sampleSize: totalExposures,
      };
    },
    [experimentId]
  );

  return {
    variant: state.variant,
    isInExperiment: state.isInExperiment,
    trackConversion,
    isEnabled,
    getVariantValue,
    calculateResults,
    state,
  };
}
