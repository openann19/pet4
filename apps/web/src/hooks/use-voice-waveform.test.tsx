import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVoiceWaveform } from '@/hooks/use-voice-waveform';

describe('useVoiceWaveform', () => {
  beforeEach(() => {
    // Reset any mocks
  });

  it('should initialize with waveform data', () => {
    const waveform = [0.3, 0.5, 0.7, 0.4, 0.6];
    const { result } = renderHook(() => useVoiceWaveform({ waveform, isPlaying: false }));

    expect(result.current.animatedStyles).toHaveLength(20);
  });

  it('should create correct number of bars', () => {
    const waveform = [0.3, 0.5, 0.7];
    const { result } = renderHook(() =>
      useVoiceWaveform({ waveform, isPlaying: false, barCount: 10 })
    );

    expect(result.current.animatedStyles).toHaveLength(10);
  });

  it('should animate when playing', () => {
    const waveform = [0.3, 0.5, 0.7];
    const { result } = renderHook(() => useVoiceWaveform({ waveform, isPlaying: true }));

    expect(result.current.containerStyle).toBeDefined();
  });

  it('should handle empty waveform', () => {
    const { result } = renderHook(() => useVoiceWaveform({ waveform: [], isPlaying: false }));

    expect(result.current.animatedStyles).toHaveLength(20);
  });

  it('should provide container style', () => {
    const waveform = [0.3, 0.5, 0.7];
    const { result } = renderHook(() => useVoiceWaveform({ waveform, isPlaying: false }));

    expect(result.current.containerStyle).toBeDefined();
  });
});
