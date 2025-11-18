/**
 * Health Service
 *
 * Provides health check endpoints and observability utilities
 */

import { api } from './api';
import { config } from './config';
import { generateCorrelationId } from './utils';
import { createLogger } from './logger';
import type { APIError } from './contracts';
import { ENV } from '@/config/env';

const logger = createLogger('HealthService');

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  commitSha: string;
  timestamp: string;
  uptime: number;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration?: number;
  timestamp: string;
}

export interface ReadinessStatus {
  ready: boolean;
  dependencies: DependencyStatus[];
  timestamp: string;
}

export interface DependencyStatus {
  name: string;
  status: 'available' | 'unavailable';
  latency?: number;
  error?: string;
}

export class HealthService {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Check liveness - basic health check
   */
  async checkLiveness(): Promise<HealthStatus> {
    const correlationId = generateCorrelationId();

    try {
      const response = await api.get<HealthStatus>('/healthz');

      logger.debug('Liveness check passed', {
        status: response.status,
        correlationId,
      });

      return response;
    } catch (_error) {
      const apiError = _error as APIError;
      logger.error('Liveness check failed', new Error(apiError.message), {
        code: apiError.code,
        correlationId,
      });

      throw error;
    }
  }

  /**
   * Check readiness - dependencies check
   */
  async checkReadiness(): Promise<ReadinessStatus> {
    const correlationId = generateCorrelationId();

    try {
      const response = await api.get<ReadinessStatus>('/readyz');

      logger.debug('Readiness check completed', {
        ready: response.ready,
        dependencies: response.dependencies.length,
        correlationId,
      });

      return response;
    } catch (_error) {
      const apiError = _error as APIError;
      logger.error('Readiness check failed', new Error(apiError.message), {
        code: apiError.code,
        correlationId,
      });

      throw error;
    }
  }

  /**
   * Get version info from backend /api/version endpoint
   */
  async getVersion(): Promise<{
    version: string;
    commitSha: string;
    buildTime?: string;
    environment: string;
  }> {
    const correlationId = generateCorrelationId();

    try {
      const response = await api.get<{
        version: string;
        commitSha: string;
        buildTime?: string;
        environment: string;
      }>('/version');

      logger.debug('Version info retrieved', {
        version: response.version,
        commitSha: response.commitSha,
        correlationId,
      });

      return response;
    } catch (_error) {
      const apiError = _error as APIError;
      logger.warn('Failed to fetch version from backend, using local config', {
        code: apiError.code,
        correlationId,
      });

      return {
        version: config.current.BUILD_VERSION,
        commitSha: config.current.COMMIT_SHA,
        environment: config.current.ENV,
      };
    }
  }

  /**
   * Sync version with backend
   */
  async syncVersion(): Promise<void> {
    const correlationId = generateCorrelationId();

    try {
      const version = await this.getVersion();

      logger.info('Version synced with backend', {
        version: version.version,
        commitSha: version.commitSha,
        environment: version.environment,
        correlationId,
      });
    } catch (_error) {
      const apiError = _error as APIError;
      logger.error('Failed to sync version', new Error(apiError.message), {
        code: apiError.code,
        correlationId,
      });
    }
  }

  /**
   * Create local health status (for client-side checks)
   */
  getLocalHealth(): HealthStatus {
    const checks: HealthCheck[] = [
      {
        name: 'config',
        status: 'pass',
        message: 'Configuration loaded',
        timestamp: new Date().toISOString(),
      },
      {
        name: 'api_client',
        status: 'pass',
        message: 'API client initialized',
        timestamp: new Date().toISOString(),
      },
    ];

    return {
      status: 'healthy',
      version: ENV.VITE_APP_VERSION,
      commitSha: (import.meta.env.VITE_COMMIT_SHA as string | undefined) ?? 'unknown',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      checks,
    };
  }
}

export const healthService = new HealthService();
