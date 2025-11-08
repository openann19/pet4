/**
 * Health Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthService } from '../health-service';
import { api } from '../api';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock('../config', () => ({
  config: {
    current: {
      BUILD_VERSION: '1.0.0',
      COMMIT_SHA: 'abc123',
      ENV: 'dev',
    },
  },
}));

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(() => {
    service = new HealthService();
    vi.clearAllMocks();
  });

  describe('checkLiveness', () => {
    it('should check liveness endpoint', async () => {
      const mockHealth = {
        status: 'healthy' as const,
        version: '1.0.0',
        commitSha: 'abc123',
        timestamp: new Date().toISOString(),
        uptime: 1000,
        checks: [],
      };

      vi.mocked(api.get).mockResolvedValue(mockHealth);

      const result = await service.checkLiveness();

      expect(result).toEqual(mockHealth);
      expect(api.get).toHaveBeenCalledWith('/healthz');
    });

    it('should throw error on failure', async () => {
      vi.mocked(api.get).mockRejectedValue({
        code: 'HEALTH_ERROR',
        message: 'Health check failed',
        correlationId: 'corr-123',
        timestamp: new Date().toISOString(),
      });

      await expect(service.checkLiveness()).rejects.toThrow();
    });
  });

  describe('checkReadiness', () => {
    it('should check readiness endpoint', async () => {
      const mockReadiness = {
        ready: true,
        dependencies: [
          {
            name: 'database',
            status: 'available' as const,
            latency: 10,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      vi.mocked(api.get).mockResolvedValue(mockReadiness);

      const result = await service.checkReadiness();

      expect(result).toEqual(mockReadiness);
      expect(api.get).toHaveBeenCalledWith('/readyz');
    });
  });

  describe('getVersion', () => {
    it('should fetch version from backend', async () => {
      const mockVersion = {
        version: '1.0.0',
        commitSha: 'abc123',
        buildTime: new Date().toISOString(),
        environment: 'dev',
      };

      vi.mocked(api.get).mockResolvedValue(mockVersion);

      const result = await service.getVersion();

      expect(result).toEqual(mockVersion);
      expect(api.get).toHaveBeenCalledWith('/version');
    });

    it('should fallback to local config on failure', async () => {
      vi.mocked(api.get).mockRejectedValue({
        code: 'VERSION_ERROR',
        message: 'Version fetch failed',
        correlationId: 'corr-123',
        timestamp: new Date().toISOString(),
      });

      const result = await service.getVersion();

      expect(result.version).toBe('1.0.0');
      expect(result.commitSha).toBe('abc123');
      expect(result.environment).toBe('dev');
    });
  });

  describe('getLocalHealth', () => {
    it('should return local health status', () => {
      const health = service.getLocalHealth();

      expect(health.status).toBe('healthy');
      expect(health.version).toBe('1.0.0');
      expect(health.commitSha).toBe('abc123');
      expect(health.checks).toHaveLength(2);
      expect(health.checks[0]?.name).toBe('config');
      expect(health.checks[1]?.name).toBe('api_client');
    });
  });
});
