import { createLogger } from './logger'
import { isTruthy, isDefined } from '@/core/guards';

type EventProperties = Record<string, string | number | boolean>

const logger = createLogger('Analytics')

class Analytics {
  track(eventName: string, properties?: EventProperties) {
    if (typeof window === 'undefined') return
    
    logger.debug('Track event', { eventName, properties })
    
    if (isTruthy(window.spark_analytics)) {
      window.spark_analytics.track(eventName, properties)
    }
  }
}

export const analytics = new Analytics()

declare global {
  interface Window {
    spark_analytics?: {
      track: (eventName: string, properties?: EventProperties) => void
    }
  }
}
