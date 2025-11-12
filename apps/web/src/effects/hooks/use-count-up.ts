import { useRef, useEffect } from 'react';
import { MicroInteractions } from '../micro-interactions/core';

export function useCountUp(end: number, duration?: number) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      MicroInteractions.countUp(ref.current, 0, end, duration);
    }
  }, [end, duration]);

  return ref;
}
