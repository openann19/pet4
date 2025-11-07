import { useFloatingParticle as useFloatingParticleBase } from '@petspark/motion'
import type { UseFloatingParticleOptions, UseFloatingParticleReturn } from '@petspark/motion'
import { Dimensions } from 'react-native'
import { useMemo } from 'react'

interface MobileFloatingParticleOptions extends Omit<UseFloatingParticleOptions, 'initialOffset' | 'amplitude'> {
  /**
   * Whether to use screen dimensions for relative calculations
   * @default true
   */
  screenRelative?: boolean
  
  /**
   * Initial position (in pixels for screenRelative=false, or 0-1 range for screenRelative=true)
   */
  initialX?: number
  initialY?: number
  
  /**
   * Container dimensions (defaults to screen dimensions if not provided)
   */
  width?: number
  height?: number
}

/**
 * Mobile-specific floating particle hook
 * Adapts the base hook with mobile-specific defaults and behaviors
 */
export function useFloatingParticle(
  options: MobileFloatingParticleOptions = {}
): UseFloatingParticleReturn {
  // Get screen dimensions for relative calculations
  const { width: screenWidth, height: screenHeight } = useMemo(() => 
    Dimensions.get('window'),
    []
  )

  const {
    screenRelative = true,
    initialX = 0.5,
    initialY = 0.5,
    width = screenWidth,
    height = screenHeight,
    ...rest
  } = options

  // Convert options to shared hook format
  const adaptedOptions = {
    initialOffset: {
      x: screenRelative ? initialX : initialX / width,
      y: screenRelative ? initialY : initialY / height
    },
    amplitude: screenRelative 
      ? { x: width * 0.15, y: height * 0.15 } // 15% of container
      : { x: 50, y: 50 }, // Fixed size
    floatDuration: 1500, // Slightly faster on mobile
    fadeOut: true,
    enableScale: true,
    ...rest
  }

  return useFloatingParticleBase(adaptedOptions)
}

// Re-export types for backwards compatibility
export type { UseFloatingParticleOptions, UseFloatingParticleReturn }
