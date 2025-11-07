'use client'

import React, { Suspense } from 'react'
// Lazy load heavy visual effects to reduce main bundle size
const ConfettiBurst = React.lazy(() => import('../ConfettiBurst').then(m => ({ default: m.ConfettiBurst })))
const ReactionBurstParticles = React.lazy(() => import('../ReactionBurstParticles').then(m => ({ default: m.ReactionBurstParticles })))

export interface OverlaysProps {
  burstSeed: number
  confettiSeed: number
  roomId: string
}

export function Overlays({ burstSeed, confettiSeed, roomId }: OverlaysProps): JSX.Element {
  return (
    <>
      {burstSeed > 0 && (
        <Suspense fallback={null}>
          <ReactionBurstParticles
            key={`burst-${String(burstSeed ?? '')}`}
            enabled
            seed={`reaction-${String(roomId ?? '')}-${String(burstSeed ?? '')}`}
            className="pointer-events-none fixed inset-0 z-50"
          />
        </Suspense>
      )}
      {confettiSeed > 0 && (
        <Suspense fallback={null}>
          <ConfettiBurst
            key={`confetti-${String(confettiSeed ?? '')}`}
            enabled
            seed={`confetti-${String(roomId ?? '')}-${String(confettiSeed ?? '')}`}
            className="pointer-events-none fixed inset-0 z-50"
          />
        </Suspense>
      )}
    </>
  )
}

