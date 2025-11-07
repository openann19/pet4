/**
 * Date Group Component
 * 
 * Date separator for grouped messages
 */

import { Badge } from '@/components/ui/badge'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation'

export interface DateGroupProps {
  date: string
  delay: number
}

export function DateGroup({ date, delay }: DateGroupProps): JSX.Element {
  const animation = useEntryAnimation({ initialY: -10, delay })

  return (
    <AnimatedView
      style={animation.animatedStyle}
      className="flex items-center justify-center my-4"
    >
      <Badge variant="secondary" className="text-xs px-3 py-1">
        {date}
      </Badge>
    </AnimatedView>
  )
}
