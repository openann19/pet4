'use client'

import { useFloatingParticle as useFloatingParticleBase } from '@petspark/motion'
import type { UseFloatingParticleOptions, UseFloatingParticleReturn } from '@petspark/motion'

export type { UseFloatingParticleOptions, UseFloatingParticleReturn }

interface WebFloatingParticleOptions extends UseFloatingParticleOptions {
  width?: number
  height?: number
}

/**
 * Web-specific floating particle hook
 * Adapts the base hook with web-specific defaults and behaviors
 */
export function useFloatingParticle(
  options: WebFloatingParticleOptions = {}
): UseFloatingParticleReturn {
  const {
    width = 1920,
    height = 1080,
    initialOffset = { x: 0.5, y: 0.5 },
    amplitude = { x: width * 0.1, y: height * 0.1 }, // 10% of container size
    ...rest
  } = options

  // Convert legacy options to new format
  const adaptedOptions = {
    initialOffset,
    amplitude,
    floatDuration: 2000,
    fadeOut: true,
    enableScale: true,
    ...rest
  }

  return useFloatingParticleBase(adaptedOptions)
}
