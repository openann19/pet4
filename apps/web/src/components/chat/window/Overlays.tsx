'use client'

import { ConfettiBurst } from '../ConfettiBurst'
import { ReactionBurstParticles } from '../ReactionBurstParticles'

export interface OverlaysProps {
  burstSeed: number
  confettiSeed: number
  roomId: string
}

export function Overlays({ burstSeed, confettiSeed, roomId }: OverlaysProps): JSX.Element {
  return (
    <>
      {burstSeed > 0 && (
        <ReactionBurstParticles
          key={`burst-${burstSeed}`}
          enabled
          seed={`reaction-${roomId}-${burstSeed}`}
          className="pointer-events-none fixed inset-0 z-50"
        />
      )}
      {confettiSeed > 0 && (
        <ConfettiBurst
          key={`confetti-${confettiSeed}`}
          enabled
          seed={`confetti-${roomId}-${confettiSeed}`}
          className="pointer-events-none fixed inset-0 z-50"
        />
      )}
    </>
  )
}

