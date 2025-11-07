import { useRef, useEffect } from 'react'
import { MicroInteractions } from '../micro-interactions/core'
import { isTruthy, isDefined } from '@/core/guards';

export function useCountUp(end: number, duration?: number) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (isTruthy(ref.current)) {
      MicroInteractions.countUp(ref.current, 0, end, duration)
    }
  }, [end, duration])

  return ref
}

