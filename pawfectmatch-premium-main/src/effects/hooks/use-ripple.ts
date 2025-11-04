import { useCallback } from 'react'
import { MicroInteractions } from '../micro-interactions/core'

export function useRipple() {
  return useCallback((event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    const element = event.currentTarget as HTMLElement
    MicroInteractions.createRipple(element, event.nativeEvent)
  }, [])
}

