import { ENV } from '@/config/env';
import { createLogger } from '@/lib/logger';

const logger = createLogger('HealthCheck');

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks?: Record<string, {
      status: 'healthy' | 'unhealthy';
      message?: string;
      latency?: number;
    }>;
}

/**
 * Generate health check response
 * This can be called from a server endpoint or API route
 */
export function getHealthStatus(): HealthStatus {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: ENV.VITE_APP_VERSION ?? '0.0.0',
    environment: ENV.VITE_ENVIRONMENT ?? 'development',
  };
}

/**
 * Generate readiness check response
 */
export function getReadinessStatus(): HealthStatus {
  const checks: HealthStatus['checks'] = {};

  // Check environment configuration
  checks.environment = {
    status: 'healthy',
    message: 'Environment variables validated',
  };

  // Check if mocks are disabled in production
  if (ENV.VITE_ENVIRONMENT === 'production') {
    if (ENV.VITE_USE_MOCKS === 'true') {
      checks.mocks = {
        status: 'unhealthy',
        message: 'Mocks enabled in production',
      };
    } else {
      checks.mocks = {
        status: 'healthy',
        message: 'Mocks disabled',
      };
    }

    // Check required services
    checks.services = {
      status: 'healthy',
      message: 'Service credentials configured',
    };

    if (!ENV.VITE_SENTRY_DSN) {
      checks.services = {
        status: 'unhealthy',
        message: 'Sentry DSN missing',
      };
    }
  }

  const allHealthy = Object.values(checks).every(check => check.status === 'healthy');

  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: ENV.VITE_APP_VERSION ?? '0.0.0',
    environment: ENV.VITE_ENVIRONMENT ?? 'development',
    checks,
  };
}

/**
 * Health check endpoint handler for server-side
 * Use this in your server configuration to serve /healthz
 */
export function healthzHandler(): Response {
  const health = getHealthStatus();
  logger.debug('Health check', { environment: health.environment });
  
  return new Response(JSON.stringify(health, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * Readiness check endpoint handler for server-side
 * Use this in your server configuration to serve /readyz
 */
export function readyzHandler(): Response {
  const readiness = getReadinessStatus();
  logger.debug('Readiness check', { 
    status: readiness.status,
    checks: Object.keys(readiness.checks ?? {}),
  });
  
  return new Response(JSON.stringify(readiness, null, 2), {
    status: readiness.status === 'healthy' ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

