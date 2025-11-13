/**
 * Voice Message Waveform Effect Hook
 *
 * Creates a real-time waveform visualization for voice messages:
 * - Canvas-based waveform with glow effect
 * - Animated playhead with spring
 * - Responsive to audio playback
 *
 * Location: apps/web/src/effects/chat/media/use-voice-waveform.ts
 */

import { useEffect, useRef } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  type SharedValue,
} from '@petspark/motion';
import { useReducedMotionSV } from '../core/reduced-motion';
import { useDeviceRefreshRate } from '@/hooks/use-device-refresh-rate';
import { adaptiveAnimationConfigs } from '../../core/adaptive-animation-config';
import { useUIConfig } from '@/hooks/use-ui-config';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

/**
 * Voice waveform effect options
 */
export interface UseVoiceWaveformOptions {
  enabled?: boolean;
  waveform?: number[];
  duration?: number;
  currentTime?: number;
  isPlaying?: boolean;
  width?: number;
  height?: number;
  color?: string;
}

/**
 * Voice waveform effect return type
 */
export interface UseVoiceWaveformReturn {
  playheadProgress: SharedValue<number>;
  waveformOpacity: SharedValue<number>;
  animatedStyle: AnimatedStyle;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  drawWaveform: () => void;
}

const DEFAULT_ENABLED = true;
const DEFAULT_WIDTH = 200;
const DEFAULT_HEIGHT = 40;
const DEFAULT_COLOR = '#3B82F6';

export function useVoiceWaveform(options: UseVoiceWaveformOptions = {}): UseVoiceWaveformReturn {
  const {
    enabled = DEFAULT_ENABLED,
    waveform = [],
    duration = 0,
    currentTime = 0,
    isPlaying = false,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    color = DEFAULT_COLOR,
  } = options;

  const reducedMotion = useReducedMotionSV();
  const { hz } = useDeviceRefreshRate();
  const { visual, animation } = useUIConfig();
  const playheadProgress = useSharedValue(0);
  const waveformOpacity = useSharedValue(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Update playhead progress
  useEffect(() => {
    if (enabled && duration > 0) {
      const progress = currentTime / duration;
      if (reducedMotion.value) {
        playheadProgress.value = progress;
      } else {
      // Use UI config spring physics or fallback to adaptive config
      const springConfig = animation.enableReanimated && animation.springPhysics
        ? {
            stiffness: animation.springPhysics.stiffness,
            damping: animation.springPhysics.damping,
            mass: animation.springPhysics.mass,
          }
        : adaptiveAnimationConfigs.smoothEntry(hz as 60 | 120);
      playheadProgress.value = withSpring(progress, springConfig);
      }
    }
  }, [enabled, currentTime, duration, reducedMotion, hz, animation, playheadProgress]);

  // Draw waveform on canvas
  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled || waveform.length === 0) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform bars
    const barWidth = width / waveform.length;
    const centerY = height / 2;

    waveform.forEach((amplitude, index) => {
      const barHeight = (amplitude / 100) * height * 0.8;
      const x = index * barWidth;
      const y = centerY - barHeight / 2;

      // Gradient for glow effect (only if glow enabled)
      const gradient = ctx.createLinearGradient(x, 0, x + barWidth, height);
      if (visual.enableGlow) {
        gradient.addColorStop(0, `${color}40`);
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, `${color}40`);
      } else {
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color);
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth * 0.8, barHeight);

      // Glow effect (only if glow enabled)
      if (visual.enableGlow) {
        ctx.shadowBlur = 4;
        ctx.shadowColor = color;
        ctx.fillRect(x, y, barWidth * 0.8, barHeight);
        ctx.shadowBlur = 0;
      }
    });
  };

  // Redraw waveform when data changes
  useEffect(() => {
    drawWaveform();
  }, [waveform, width, height, color, enabled, visual]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: waveformOpacity.value,
    };
  }) as AnimatedStyle;

  return {
    playheadProgress,
    waveformOpacity,
    animatedStyle,
    canvasRef,
    drawWaveform,
  };
}
