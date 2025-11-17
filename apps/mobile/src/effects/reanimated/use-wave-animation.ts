/**
 * Wave Animation (Mobile Adapter)
 * Delegates to shared motion hook for parity and reduced-motion handling.
 */

import { useWaveAnimation as useSharedWaveAnimation } from '@petspark/motion'
export type { WaveAnimationOptions as UseWaveAnimationOptions } from '@petspark/motion'

export const useWaveAnimation = useSharedWaveAnimation

export { useMultiWave } from '@petspark/motion'
