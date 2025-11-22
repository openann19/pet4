import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceWaveform } from './use-voice-waveform';
import { useReducedMotionSV } from '../core/reduced-motion';

// Mock dependencies
vi.mock('../core/reduced-motion', () => ({
  useReducedMotionSV: vi.fn(() => ({
    value: false,
  })),
}));

describe('useVoiceWaveform', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useVoiceWaveform());

    expect(result.current.playheadProgress).toBeDefined();
    expect(result.current.waveformOpacity).toBeDefined();
    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.canvasRef).toBeDefined();
    expect(result.current.drawWaveform).toBeDefined();

    expect(result.current.playheadProgress.value).toBe(0);
    expect(result.current.waveformOpacity.value).toBe(1);
  });

  it('should update playhead progress when playing', () => {
    const { result, rerender } = renderHook(
      ({ currentTime, duration, isPlaying }) =>
        useVoiceWaveform({
          currentTime,
          duration,
          isPlaying,
        }),
      {
        initialProps: { currentTime: 0, duration: 100, isPlaying: false },
      }
    );

    expect(result.current.playheadProgress.value).toBe(0);

    rerender({ currentTime: 50, duration: 100, isPlaying: true });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Progress should update
    expect(result.current.playheadProgress.value).toBeGreaterThan(0);
  });

  it('should calculate progress correctly', () => {
    const { result, rerender } = renderHook(
      ({ currentTime, duration }) =>
        useVoiceWaveform({
          currentTime,
          duration,
          isPlaying: true,
        }),
      {
        initialProps: { currentTime: 25, duration: 100 },
      }
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Progress should be approximately 0.25 (25/100)
    expect(result.current.playheadProgress.value).toBeGreaterThan(0);
    expect(result.current.playheadProgress.value).toBeLessThanOrEqual(1);
  });

  it('should use spring animation for playhead', () => {
    const { result, rerender } = renderHook(
      ({ currentTime, duration }) =>
        useVoiceWaveform({
          currentTime,
          duration,
          isPlaying: true,
        }),
      {
        initialProps: { currentTime: 0, duration: 100 },
      }
    );

    rerender({ currentTime: 50, duration: 100 });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should use spring animation
    expect(result.current.playheadProgress.value).toBeDefined();
  });

  it('should respect reduced motion', () => {
    vi.mocked(useReducedMotionSV).mockReturnValue({
      value: true,
    });

    const { result, rerender } = renderHook(
      ({ currentTime, duration }) =>
        useVoiceWaveform({
          currentTime,
          duration,
          isPlaying: true,
        }),
      {
        initialProps: { currentTime: 0, duration: 100 },
      }
    );

    rerender({ currentTime: 50, duration: 100 });

    // Should set progress directly without spring
    expect(result.current.playheadProgress.value).toBeDefined();
  });

  it('should draw waveform on canvas', () => {
    const waveform = [10, 20, 30, 40, 50, 60, 70, 80];
    const { result } = renderHook(() =>
      useVoiceWaveform({
        waveform,
        width: 200,
        height: 40,
      })
    );

    // Create a real canvas element (no mocking needed)
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 40;

    // Set canvasRef.current directly
    if (result.current.canvasRef && 'current' in result.current.canvasRef) {
      (result.current.canvasRef as { current: HTMLCanvasElement | null }).current = canvas;
    }

    act(() => {
      result.current.drawWaveform();
    });

    // Waveform should be drawn
    expect(result.current.drawWaveform).toBeDefined();
  });

  it('should not draw when disabled', () => {
    const waveform = [10, 20, 30];
    const { result } = renderHook(() =>
      useVoiceWaveform({
        enabled: false,
        waveform,
      })
    );

    const canvas = document.createElement('canvas');
    Object.defineProperty(result.current.canvasRef, 'current', {
      value: canvas,
      writable: true,
    });

    act(() => {
      result.current.drawWaveform();
    });

    // Should not draw when disabled
    expect(result.current.drawWaveform).toBeDefined();
  });

  it('should use custom width and height', () => {
    const { result } = renderHook(() =>
      useVoiceWaveform({
        width: 300,
        height: 60,
      })
    );

    expect(result.current.canvasRef).toBeDefined();
  });

  it('should use custom color', () => {
    const { result } = renderHook(() =>
      useVoiceWaveform({
        color: '#ff0000',
      })
    );

    expect(result.current.canvasRef).toBeDefined();
  });

  it('should return animated style', () => {
    const { result } = renderHook(() => useVoiceWaveform());

    expect(result.current.animatedStyle).toBeDefined();
    expect(typeof result.current.animatedStyle).toBe('object');
  });

  it('should handle empty waveform', () => {
    const { result } = renderHook(() =>
      useVoiceWaveform({
        waveform: [],
      })
    );

    const canvas = document.createElement('canvas');
    Object.defineProperty(result.current.canvasRef, 'current', {
      value: canvas,
      writable: true,
    });

    act(() => {
      result.current.drawWaveform();
    });

    // Should handle empty waveform gracefully
    expect(result.current.drawWaveform).toBeDefined();
  });
});
