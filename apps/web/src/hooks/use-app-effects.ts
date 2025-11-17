import { useEffect, useState } from 'react';
import { errorTracking } from '@/lib/error-tracking';
import { isAgeVerified } from '@/components/compliance';
import type { User } from '@/lib/types';

export function useAppEffects(user: User | null) {
  const [ageVerified, setAgeVerified] = useState(isAgeVerified());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Initialize error tracking with user context
  useEffect(() => {
    if (user?.id) {
      errorTracking.setUserContext(user.id);
    }
  }, [user]);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); };
    const handleOffline = () => { setIsOnline(false); };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Initialize performance monitoring in production
    if (import.meta.env.NODE_ENV === 'production') {
      void Promise.all([
        import('@/lib/monitoring/performance'),
        import('@/lib/logger')
      ]).then(([{ initPerformanceMonitoring }, { createLogger }]) => {
        const logger = createLogger('PerformanceMonitoring');
        initPerformanceMonitoring((metric) => {
          // Log performance metrics (could send to analytics service)
          if (metric.rating === 'poor') {
            logger.warn(`Poor ${String(metric.name ?? '')}: ${String(metric.value ?? '')}ms`, { metric });
          }
        });
      });
    }
  }, []);

  return { ageVerified, setAgeVerified, isOnline };
}

