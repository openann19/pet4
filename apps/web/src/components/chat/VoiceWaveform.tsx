/**
 * Voice Waveform Component
 * 
 * Renders animated voice message waveform
 * 
 * Location: apps/web/src/components/chat/VoiceWaveform.tsx
 */

import { useEffect } from 'react'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useVoiceWaveform } from '@/effects/chat/media/use-voice-waveform'
import { useAnimatedStyle } from 'react-native-reanimated'

interface VoiceWaveformProps {
  waveform?: number[]
  duration?: number
  currentTime?: number
  isPlaying?: boolean
  width?: number
  height?: number
  color?: string
  className?: string
}

export function VoiceWaveform({
  waveform = [],
  duration = 0,
  currentTime = 0,
  isPlaying = false,
  width = 200,
  height = 40,
  color = '#3B82F6',
  className,
}: VoiceWaveformProps) {
  const { playheadProgress, animatedStyle, canvasRef, drawWaveform } = useVoiceWaveform({
    enabled: true,
    waveform,
    duration,
    currentTime,
    isPlaying,
    width,
    height,
    color,
  })

  useEffect(() => {
    drawWaveform()
  }, [drawWaveform])

  const playheadStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: `${playheadProgress.value * 100}%`,
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: color,
      opacity: 0.8,
    }
  })

  return (
    <AnimatedView
      style={animatedStyle}
      className={`relative ${className ?? ''}`}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full"
      />
      {isPlaying && (
        <AnimatedView style={playheadStyle}>
          <div />
        </AnimatedView>
      )}
    </AnimatedView>
  )
}

