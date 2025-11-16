/**
 * Voice Waveform Component
 *
 * Renders animated voice message waveform
 *
 * Location: apps/web/src/components/chat/VoiceWaveform.tsx
 */

import { useEffect } from 'react';
import { useVoiceWaveform } from '@/effects/chat/media/use-voice-waveform';
import { useAnimatedStyle, MotionView } from '@petspark/motion';
import { useUIConfig } from "@/hooks/use-ui-config";

interface VoiceWaveformProps {
  waveform?: number[];
  duration?: number;
  currentTime?: number;
  isPlaying?: boolean;
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function VoiceWaveform({
  waveform = [],
  duration = 0,
  currentTime = 0,
  isPlaying = false,
  width = 200,
  height = 40,
  color = 'var(--color-accent-secondary-9)',
  className,
}: VoiceWaveformProps) {
    const _uiConfig = useUIConfig();
    const { playheadProgress, animatedStyle, canvasRef, drawWaveform } = useVoiceWaveform({
        enabled: true,
        waveform,
        duration,
        currentTime,
        isPlaying,
        width,
        height,
        color,
      });

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  const playheadStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: `${String(playheadProgress.value * 100)}%`,
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: color,
      opacity: 0.8,
    };
  });

  return (
    <MotionView style={animatedStyle} className={`relative ${className ?? ''}`}>
      <canvas ref={canvasRef} width={width} height={height} className="w-full h-full" />
      {isPlaying && (
        <MotionView style={playheadStyle}>
          <div />
        </MotionView>
      )}
    </MotionView>
  );
}
