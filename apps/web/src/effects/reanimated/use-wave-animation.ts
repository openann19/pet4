/**
 * Wave Animation (Web Adapter)
 * Delegates to shared motion hook for parity and reduced-motion handling.
 */

import { useWaveAnimation as useSharedWaveAnimation } from '@petspark/motion'
export type { UseWaveAnimationOptions } from '@petspark/motion'

export const useWaveAnimation = useSharedWaveAnimation

// Re-export multi-wave helper for convenience
export { useMultiWave } from '@petspark/motion'
