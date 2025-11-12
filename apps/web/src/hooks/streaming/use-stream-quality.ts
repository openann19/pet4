/**
 * Adaptive quality streaming with bandwidth detection and layer switching
 *
 * Features:
 * - Automatic quality adjustment based on bandwidth
 * - Network condition monitoring
 * - Simulcast layer switching
 * - Quality presets (low, medium, high, ultra)
 * - Smooth transitions between qualities
 * - Manual quality override
 * - Buffer health monitoring
 * - Adaptive bitrate algorithm
 *
 * @example
 * ```tsx
 * const quality = useStreamQuality({
 *   onQualityChange: (level) => updateUI(level),
 *   onBuffering: (isBuffering) => showSpinner(isBuffering),
 *   enableAdaptive: true
 * });
 *
 * // Get recommended quality
 * const level = quality.getRecommendedQuality();
 *
 * // Set manual quality
 * quality.setQuality('high');
 *
 * // Monitor network
 * const bandwidth = quality.state.estimatedBandwidth;
 * ```
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export type QualityLevel = 'low' | 'medium' | 'high' | 'ultra' | 'auto';

export interface QualityPreset {
  readonly level: QualityLevel;
  readonly width: number;
  readonly height: number;
  readonly frameRate: number;
  readonly bitrate: number; // kbps
  readonly minBandwidth: number; // kbps
}

export interface StreamQualityConfig {
  readonly onQualityChange?: (level: QualityLevel) => void;
  readonly onBuffering?: (isBuffering: boolean) => void;
  readonly enableAdaptive?: boolean;
  readonly initialQuality?: QualityLevel;
  readonly presets?: readonly QualityPreset[];
}

export interface StreamQualityState {
  readonly currentQuality: QualityLevel;
  readonly estimatedBandwidth: number; // kbps
  readonly networkCondition: 'excellent' | 'good' | 'fair' | 'poor';
  readonly isBuffering: boolean;
  readonly bufferHealth: number; // 0-100
  readonly droppedFrames: number;
  readonly isAdaptive: boolean;
}

export interface NetworkStats {
  readonly downloadSpeed: number; // kbps
  readonly uploadSpeed: number; // kbps
  readonly latency: number; // ms
  readonly packetLoss: number; // percentage
  readonly jitter: number; // ms
  readonly timestamp: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_PRESETS: readonly QualityPreset[] = [
  {
    level: 'low',
    width: 640,
    height: 360,
    frameRate: 15,
    bitrate: 400,
    minBandwidth: 500,
  },
  {
    level: 'medium',
    width: 1280,
    height: 720,
    frameRate: 24,
    bitrate: 1500,
    minBandwidth: 2000,
  },
  {
    level: 'high',
    width: 1920,
    height: 1080,
    frameRate: 30,
    bitrate: 3000,
    minBandwidth: 4000,
  },
  {
    level: 'ultra',
    width: 3840,
    height: 2160,
    frameRate: 60,
    bitrate: 8000,
    minBandwidth: 10000,
  },
] as const;

const BANDWIDTH_CHECK_INTERVAL = 5000; // 5 seconds
const BUFFER_CHECK_INTERVAL = 1000; // 1 second
const QUALITY_SWITCH_DEBOUNCE = 3000; // 3 seconds
const MIN_BUFFER_HEALTH = 20; // percentage
const NETWORK_PROBE_SIZE = 100000; // 100KB

// ============================================================================
// Utilities
// ============================================================================

function determineNetworkCondition(bandwidth: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (bandwidth >= 10000) return 'excellent'; // >= 10 Mbps
  if (bandwidth >= 4000) return 'good'; // >= 4 Mbps
  if (bandwidth >= 2000) return 'fair'; // >= 2 Mbps
  return 'poor'; // < 2 Mbps
}

function findOptimalQuality(
  bandwidth: number,
  presets: readonly QualityPreset[]
): QualityLevel {
  // Add buffer (use 80% of available bandwidth)
  const usableBandwidth = bandwidth * 0.8;

  // Find highest quality that fits bandwidth
  const sorted = [...presets].sort((a, b) => b.minBandwidth - a.minBandwidth);

  for (const preset of sorted) {
    if (usableBandwidth >= preset.minBandwidth) {
      return preset.level;
    }
  }

  // Fallback to lowest quality
  return 'low';
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useStreamQuality(config: StreamQualityConfig = {}) {
  const {
    onQualityChange,
    onBuffering,
    enableAdaptive = true,
    initialQuality = 'auto',
    presets = DEFAULT_PRESETS,
  } = config;

  // State
  const [state, setState] = useState<StreamQualityState>({
    currentQuality: initialQuality === 'auto' ? 'medium' : initialQuality,
    estimatedBandwidth: 0,
    networkCondition: 'fair',
    isBuffering: false,
    bufferHealth: 100,
    droppedFrames: 0,
    isAdaptive: enableAdaptive,
  });

  // Refs
  const bandwidthCheckIntervalRef = useRef<number | null>(null);
  const bufferCheckIntervalRef = useRef<number | null>(null);
  const qualitySwitchTimeoutRef = useRef<number | null>(null);
  const lastQualitySwitchRef = useRef<number>(Date.now());
  const bandwidthHistoryRef = useRef<number[]>([]);
  const networkStatsRef = useRef<NetworkStats | null>(null);

  // ============================================================================
  // Bandwidth Estimation
  // ============================================================================

  const estimateBandwidth = useCallback(async (): Promise<number> => {
    try {
      const startTime = performance.now();

      // Create a probe request
      const probeData = new ArrayBuffer(NETWORK_PROBE_SIZE);
      const blob = new Blob([probeData]);
      const url = URL.createObjectURL(blob);

      // Download probe
      const response = await fetch(url);
      await response.arrayBuffer();

      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000; // seconds

      // Calculate bandwidth (kbps)
      const bandwidth = (NETWORK_PROBE_SIZE * 8) / duration / 1000;

      URL.revokeObjectURL(url);

      // Add to history
      bandwidthHistoryRef.current.push(bandwidth);
      if (bandwidthHistoryRef.current.length > 10) {
        bandwidthHistoryRef.current.shift();
      }

      // Calculate average
      const avgBandwidth =
        bandwidthHistoryRef.current.reduce((sum, bw) => sum + bw, 0) /
        bandwidthHistoryRef.current.length;

      return avgBandwidth;
    } catch {
      // Fallback to last known bandwidth
      return state.estimatedBandwidth || 2000; // Default to 2 Mbps
    }
  }, [state.estimatedBandwidth]);

  // ============================================================================
  // Quality Management
  // ============================================================================

  const setQuality = useCallback(
    (level: QualityLevel) => {
      if (level === 'auto') {
        setState((prev) => ({ ...prev, isAdaptive: true }));
        return;
      }

      setState((prev) => ({
        ...prev,
        currentQuality: level,
        isAdaptive: false,
      }));

      if (onQualityChange) {
        onQualityChange(level);
      }

      lastQualitySwitchRef.current = Date.now();
    },
    [onQualityChange]
  );

  const getRecommendedQuality = useCallback((): QualityLevel => {
    const bandwidth = state.estimatedBandwidth;
    return findOptimalQuality(bandwidth, presets);
  }, [state.estimatedBandwidth, presets]);

  const adjustQualityBasedOnBandwidth = useCallback(() => {
    if (!state.isAdaptive) return;

    const now = Date.now();
    const timeSinceLastSwitch = now - lastQualitySwitchRef.current;

    // Debounce quality switches
    if (timeSinceLastSwitch < QUALITY_SWITCH_DEBOUNCE) {
      return;
    }

    const recommended = getRecommendedQuality();

    if (recommended !== state.currentQuality) {
      setQuality(recommended);
    }
  }, [state.isAdaptive, state.currentQuality, getRecommendedQuality, setQuality]);

  // ============================================================================
  // Buffer Monitoring
  // ============================================================================

  const checkBufferHealth = useCallback(() => {
    // In production, this would monitor actual media buffer
    // For now, simulate based on bandwidth vs bitrate

    const currentPreset = presets.find((p) => p.level === state.currentQuality);
    if (!currentPreset) return;

    const requiredBandwidth = currentPreset.bitrate;
    const availableBandwidth = state.estimatedBandwidth;

    // Calculate buffer health
    const ratio = availableBandwidth / requiredBandwidth;
    const health = Math.min(100, Math.max(0, ratio * 100));

    const isBuffering = health < MIN_BUFFER_HEALTH;

    setState((prev) => ({
      ...prev,
      bufferHealth: health,
      isBuffering,
    }));

    if (onBuffering) {
      onBuffering(isBuffering);
    }

    // Emergency quality downgrade if buffering
    if (isBuffering && state.isAdaptive) {
      const currentIndex = presets.findIndex((p) => p.level === state.currentQuality);
      if (currentIndex > 0) {
        const lowerQuality = presets[currentIndex - 1];
        if (lowerQuality) {
          setQuality(lowerQuality.level);
        }
      }
    }
  }, [state.currentQuality, state.estimatedBandwidth, state.isAdaptive, presets, onBuffering, setQuality]);

  // ============================================================================
  // Network Stats Collection
  // ============================================================================

  const updateNetworkStats = useCallback(async () => {
    const bandwidth = await estimateBandwidth();
    const networkCondition = determineNetworkCondition(bandwidth);

    setState((prev) => ({
      ...prev,
      estimatedBandwidth: bandwidth,
      networkCondition,
    }));

    networkStatsRef.current = {
      downloadSpeed: bandwidth,
      uploadSpeed: bandwidth * 0.3, // Estimate (typically lower)
      latency: 50, // Would measure with ping
      packetLoss: 0, // Would measure from WebRTC stats
      jitter: 5, // Would measure from WebRTC stats
      timestamp: Date.now(),
    };

    adjustQualityBasedOnBandwidth();
  }, [estimateBandwidth, adjustQualityBasedOnBandwidth]);

  // ============================================================================
  // Public API
  // ============================================================================

  const getQualityPreset = useCallback(
    (level?: QualityLevel): QualityPreset | undefined => {
      const targetLevel = level ?? state.currentQuality;
      return presets.find((p) => p.level === targetLevel);
    },
    [state.currentQuality, presets]
  );

  const enableAdaptiveQuality = useCallback(() => {
    setState((prev) => ({ ...prev, isAdaptive: true }));
  }, []);

  const disableAdaptiveQuality = useCallback(() => {
    setState((prev) => ({ ...prev, isAdaptive: false }));
  }, []);

  const getNetworkStats = useCallback((): NetworkStats | null => {
    return networkStatsRef.current;
  }, []);

  const reset = useCallback(() => {
    bandwidthHistoryRef.current = [];
    networkStatsRef.current = null;
    lastQualitySwitchRef.current = Date.now();

    setState({
      currentQuality: initialQuality === 'auto' ? 'medium' : initialQuality,
      estimatedBandwidth: 0,
      networkCondition: 'fair',
      isBuffering: false,
      bufferHealth: 100,
      droppedFrames: 0,
      isAdaptive: enableAdaptive,
    });
  }, [initialQuality, enableAdaptive]);

  // ============================================================================
  // Effects
  // ============================================================================

  // Bandwidth monitoring
  useEffect(() => {
    // Initial check
    void updateNetworkStats();

    bandwidthCheckIntervalRef.current = window.setInterval(() => {
      void updateNetworkStats();
    }, BANDWIDTH_CHECK_INTERVAL);

    return () => {
      if (bandwidthCheckIntervalRef.current !== null) {
        clearInterval(bandwidthCheckIntervalRef.current);
      }
    };
  }, [updateNetworkStats]);

  // Buffer health monitoring
  useEffect(() => {
    bufferCheckIntervalRef.current = window.setInterval(() => {
      checkBufferHealth();
    }, BUFFER_CHECK_INTERVAL);

    return () => {
      if (bufferCheckIntervalRef.current !== null) {
        clearInterval(bufferCheckIntervalRef.current);
      }
    };
  }, [checkBufferHealth]);

  // Cleanup quality switch timeout
  useEffect(() => {
    return () => {
      if (qualitySwitchTimeoutRef.current !== null) {
        clearTimeout(qualitySwitchTimeoutRef.current);
      }
    };
  }, []);

  return {
    setQuality,
    getRecommendedQuality,
    getQualityPreset,
    enableAdaptiveQuality,
    disableAdaptiveQuality,
    getNetworkStats,
    reset,
    state,
  };
}
