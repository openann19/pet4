import { useRef, useEffect } from 'react'
import { MicroInteractions } from '../micro-interactions/core'

export function useShimmerOnHover() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleMouseEnter = () => {
      MicroInteractions.shimmer(element)
    }

    element.addEventListener('mouseenter', handleMouseEnter)
    return () => { element.removeEventListener('mouseenter', handleMouseEnter); }
  }, [])

  return ref
}

