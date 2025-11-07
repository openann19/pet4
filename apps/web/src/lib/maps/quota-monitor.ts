import { useEffect, useState, useCallback } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { getGeocodingReport } from '@/lib/maps/geocoding';
import { createLogger } from '@/lib/logger';

const logger = createLogger('MapQuotaMonitor');

interface QuotaAlert {
  type: 'tiles' | 'geocoding';
  current: number;
  limit: number;
  percentage: number;
}

interface QuotaConfig {
  tilesLimit: number;
  geocodingLimit: number;
  alertThreshold: number;
}

const DEFAULT_QUOTA_CONFIG: QuotaConfig = {
  tilesLimit: 100000,
  geocodingLimit: 10000,
  alertThreshold: 80,
};

let tilesRequestCount = 0;
let lastResetTime = Date.now();

export function useMapQuotaMonitor(config: QuotaConfig = DEFAULT_QUOTA_CONFIG): {
  geocodingQuota: {
    totalRequests: number;
    averageLatency: number;
    errorRate: number;
  };
  tilesQuota: {
    current: number;
    limit: number;
    percentage: number;
  };
  alerts: QuotaAlert[];
  resetQuotas: () => void;
} {
  const [alerts, setAlerts] = useState<QuotaAlert[]>([]);
  const [lastReset, setLastReset] = useStorage<number>('map-quota-reset', Date.now());

  useEffect(() => {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    if (now - lastReset > dayInMs) {
      resetQuotas();
      setLastReset(now);
    }
  }, [lastReset, setLastReset]);

  const resetQuotas = useCallback(() => {
    tilesRequestCount = 0;
    lastResetTime = Date.now();
    setAlerts([]);
    logger.info('Quotas reset', { timestamp: new Date().toISOString() });
  }, []);

  useEffect(() => {
    const geocodingReport = getGeocodingReport();
    const geocodingPercentage = config.geocodingLimit > 0
      ? (geocodingReport.totalRequests / config.geocodingLimit) * 100
      : 0;

    const tilesPercentage = config.tilesLimit > 0
      ? (tilesRequestCount / config.tilesLimit) * 100
      : 0;

    const newAlerts: QuotaAlert[] = [];

    if (geocodingPercentage >= config.alertThreshold) {
      newAlerts.push({
        type: 'geocoding',
        current: geocodingReport.totalRequests,
        limit: config.geocodingLimit,
        percentage: geocodingPercentage,
      });
    }

    if (tilesPercentage >= config.alertThreshold) {
      newAlerts.push({
        type: 'tiles',
        current: tilesRequestCount,
        limit: config.tilesLimit,
        percentage: tilesPercentage,
      });
    }

    setAlerts(newAlerts);

    if (newAlerts.length > 0) {
      logger.warn('Quota alerts triggered', { alerts: newAlerts });
    }
  }, [config, tilesRequestCount]);

  const geocodingReport = getGeocodingReport();

  return {
    geocodingQuota: {
      totalRequests: geocodingReport.totalRequests,
      averageLatency: geocodingReport.averageLatency,
      errorRate: geocodingReport.errorRate,
    },
    tilesQuota: {
      current: tilesRequestCount,
      limit: config.tilesLimit,
      percentage: config.tilesLimit > 0 ? (tilesRequestCount / config.tilesLimit) * 100 : 0,
    },
    alerts,
    resetQuotas,
  };
}

export function trackTileRequest(): void {
  tilesRequestCount++;
  logger.debug('Tile request tracked', { count: tilesRequestCount });
}

export function getQuotaReport(): string {
  const geocodingReport = getGeocodingReport();
  const report = `
Map Quota Report
================
Geocoding:
  Total Requests: ${String(geocodingReport.totalRequests ?? '')}
  Average Latency: ${String(geocodingReport.averageLatency.toFixed(2) ?? '')}ms
  Error Rate: ${String((geocodingReport.errorRate * 100).toFixed(2) ?? '')}%

Tiles:
  Current: ${String(tilesRequestCount ?? '')}
  Last Reset: ${String(new Date(lastResetTime).toISOString() ?? '')}

Recent Geocoding Metrics:
${String(geocodingReport.recentMetrics.map((m, i) => `
  ${String(i + 1 ?? '')}. Query: ${String(m.query ?? '')}
     Latency: ${String(m.latency ?? '')}ms
     Results: ${String(m.resultCount ?? '')}
     ${String(m.error ? `Error: ${String(m.error ?? '')}` : 'Success' ?? '')}
`).join('') ?? '')}
`;

  return report;
}

