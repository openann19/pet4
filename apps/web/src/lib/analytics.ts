import { createLogger } from './logger';

type EventProperties = Record<string, string | number | boolean>;

const logger = createLogger('Analytics');

class Analytics {
  track(eventName: string, properties?: EventProperties) {
    if (typeof window === 'undefined') return;

    logger.debug('Track event', { eventName, properties });

    if (window.spark_analytics) {
      window.spark_analytics.track(eventName, properties);
    }
  }
}

export const analytics = new Analytics();

declare global {
  interface Window {
    spark_analytics?: {
      track: (eventName: string, properties?: EventProperties) => void;
    };
  }
}
