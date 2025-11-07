import { useCallback } from 'react'
import { haptics } from '@/lib/haptics'

export function useMicroInteractions() {
  const playLightTap = useCallback(() => {
    haptics.impact('light')
  }, [])

  const playMediumTap = useCallback(() => {
    haptics.impact('medium')
  }, [])

  const playHeavyTap = useCallback(() => {
    haptics.impact('heavy')
  }, [])

  const playSuccess = useCallback(() => {
    haptics.notification('success')
  }, [])

  const playWarning = useCallback(() => {
    haptics.notification('warning')
  }, [])

  const playError = useCallback(() => {
    haptics.notification('error')
  }, [])

  const playSelection = useCallback(() => {
    haptics.selection()
  }, [])

  return {
    playLightTap,
    playMediumTap,
    playHeavyTap,
    playSuccess,
    playWarning,
    playError,
    playSelection
  }
}
