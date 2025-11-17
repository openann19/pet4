import { View } from 'react-native'
import { ReactionBurstParticles } from '@/components/chat/ReactionBurstParticles'
import { ConfettiBurst } from '@/components/chat/ConfettiBurst'

export interface OverlaysProps {
  burstSeed: number
  confettiSeed: number
  roomId: string
}

export function Overlays({ burstSeed, confettiSeed, roomId }: OverlaysProps): JSX.Element {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
    >
      {burstSeed > 0 ? (
        <ReactionBurstParticles
          key={`burst-${burstSeed}`}
          enabled
          seed={`reaction-${roomId}-${burstSeed}`}
        />
      ) : null}
      {confettiSeed > 0 ? (
        <ConfettiBurst
          key={`confetti-${confettiSeed}`}
          enabled
          seed={`confetti-${roomId}-${confettiSeed}`}
        />
      ) : null}
    </View>
  )
}
