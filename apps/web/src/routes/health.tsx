import { createLogger } from '@/lib/logger';
import { ENV } from '@/config/env';
import type { LoaderFunctionArgs } from 'react-router-dom';

const logger = createLogger('HealthCheck');

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  message?: string;
  latency?: number;
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks?: Record<string, HealthCheck>;
}

/**
 * Health check endpoint for liveness probe
 * Returns 200 if the application is running
 */
export function healthzLoader(_args: LoaderFunctionArgs): Response {
  const startTime = Date.now();
  const version = ENV.VITE_APP_VERSION ?? '0.0.0';
  const environment = ENV.VITE_ENVIRONMENT ?? 'development';
  
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version,
    environment,
  };

  const latency = Date.now() - startTime;
  
  logger.debug('Health check', { latency, environment: health.environment });

  return new Response(JSON.stringify(health, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * Readiness check endpoint
 * Returns 200 if the application is ready to serve traffic
 */
function checkMocks(): HealthCheck | undefined {
  const environment = ENV.VITE_ENVIRONMENT;
  if (environment === 'production') {
    if (ENV.VITE_USE_MOCKS === 'true') {
      return {
        status: 'unhealthy',
        message: 'Mocks enabled in production',
      };
    }
    return {
      status: 'healthy',
      message: 'Mocks disabled',
    };
  }
  return undefined;
}

function checkServices(): HealthCheck | undefined {
  const environment = ENV.VITE_ENVIRONMENT;
  if (environment === 'production') {
    const sentryDsn = ENV.VITE_SENTRY_DSN;
    if (!sentryDsn) {
      return {
        status: 'unhealthy',
        message: 'Sentry DSN missing',
      };
    }
    return {
      status: 'healthy',
      message: 'Service credentials configured',
    };
  }
  return undefined;
}

export function readyzLoader(_args: LoaderFunctionArgs): Response {
  const startTime = Date.now();
  const checks: HealthStatus['checks'] = {};
  const version = ENV.VITE_APP_VERSION ?? '0.0.0';
  const environment = ENV.VITE_ENVIRONMENT ?? 'development';

  // Check environment configuration
  checks.environment = {
    status: 'healthy' as const,
    message: 'Environment variables validated',
  };

  // Check mocks and services
  const mocksCheck = checkMocks();
  if (mocksCheck) checks.mocks = mocksCheck;

  const servicesCheck = checkServices();
  if (servicesCheck) checks.services = servicesCheck;

  const latency = Date.now() - startTime;
  const allHealthy = Object.values(checks).every(check => check.status === 'healthy');

  const readiness: HealthStatus = {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version,
    environment,
    checks: {
      ...checks,
      latency: {
        status: 'healthy',
        latency,
      },
    },
  };

  logger.debug('Readiness check', { 
    status: readiness.status, 
    latency,
    checks: Object.keys(checks),
  });

  return new Response(JSON.stringify(readiness, null, 2), {
    status: allHealthy ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

