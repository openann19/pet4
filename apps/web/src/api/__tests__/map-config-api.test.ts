/**
 * Map Config API tests
 * Tests map configuration management functionality
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { getMapConfig, updateMapConfig, type MapConfig } from '@/api/map-config-api';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

let server: ReturnType<typeof createServer>;

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    const bufferChunk: Buffer = typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer);
    chunks.push(bufferChunk);
  }
  const body = Buffer.concat(chunks).toString('utf8');
  return body ? (JSON.parse(body) as T) : ({} as T);
}

const mockMapConfig: MapConfig = {
  settings: {
    PRIVACY_GRID_METERS: 100,
    DEFAULT_RADIUS_KM: 5,
    MAX_RADIUS_KM: 50,
    MIN_RADIUS_KM: 1,
    UNITS: 'metric',
    COUNTRY_BIAS: 'US',
    ENABLE_PRECISE_LOCATION: true,
    PRECISE_LOCATION_TIMEOUT_MINUTES: 30,
    ENABLE_GEOFENCING: true,
    ENABLE_LOST_PET_ALERTS: true,
    ENABLE_PLAYDATE_PLANNING: true,
    ENABLE_PLACE_DISCOVERY: true,
    AUTO_CENTER_ON_LOCATION: true,
    SHOW_DISTANCE_LABELS: true,
    CLUSTER_MARKERS: true,
    MAX_MARKERS_VISIBLE: 100,
  },
  categorySettings: {
    categories: [
      {
        id: 'park',
        name: 'Park',
        icon: 'tree',
        color: 'green',
      },
    ],
    defaultCategory: 'park',
    enableUserSubmittedPlaces: true,
    requireModeration: true,
  },
  providerConfig: {
    provider: 'mapbox',
    apiKey: 'test-key',
  },
};

beforeAll(async () => {
  server = createServer((req: IncomingMessage, res: ServerResponse) => {
    void (async () => {
      if (!req.url || !req.method) {
        res.statusCode = 400;
        res.end();
        return;
      }

      const url = new URL(req.url, 'http://localhost:8080');

      // GET /admin/config/map
      if (req.method === 'GET' && url.pathname === '/admin/config/map') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: { config: mockMapConfig } }));
        return;
      }

      // PUT /admin/config/map
      if (req.method === 'PUT' && url.pathname === '/admin/config/map') {
        const payload = await readJson<{ config: MapConfig; updatedBy: string }>(req);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: { config: payload.config } }));
        return;
      }

      res.statusCode = 404;
      res.end();
    })();
  });

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        process.env.TEST_API_PORT = String(address.port);
      }
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('MapConfigAPI', () => {
  describe('getMapConfig', () => {
    it('should return map configuration', async () => {
      const config = await getMapConfig();

      expect(config).not.toBeNull();
      expect(config).toHaveProperty('settings');
      expect(config).toHaveProperty('categorySettings');
    });

    it('should have valid settings', async () => {
      const config = await getMapConfig();

      expect(config?.settings).toMatchObject({
        PRIVACY_GRID_METERS: expect.any(Number),
        DEFAULT_RADIUS_KM: expect.any(Number),
        MAX_RADIUS_KM: expect.any(Number),
        MIN_RADIUS_KM: expect.any(Number),
        UNITS: expect.stringMatching(/^(metric|imperial)$/),
      });
    });

    it('should have valid category settings', async () => {
      const config = await getMapConfig();

      expect(config?.categorySettings).toMatchObject({
        categories: expect.any(Array),
        defaultCategory: expect.any(String),
        enableUserSubmittedPlaces: expect.any(Boolean),
        requireModeration: expect.any(Boolean),
      });
    });

    it('should throw on error', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(getMapConfig()).rejects.toThrow();

      global.fetch = originalFetch;
    });
  });

  describe('updateMapConfig', () => {
    it('should update map configuration', async () => {
      const updatedConfig: MapConfig = {
        ...mockMapConfig,
        settings: {
          ...mockMapConfig.settings,
          DEFAULT_RADIUS_KM: 10,
        },
      };

      const result = await updateMapConfig(updatedConfig, 'admin-1');

      expect(result).toHaveProperty('settings');
      expect(result.settings.DEFAULT_RADIUS_KM).toBe(10);
    });

    it('should update provider config', async () => {
      const updatedConfig: MapConfig = {
        ...mockMapConfig,
        providerConfig: {
          provider: 'google',
          apiKey: 'new-key',
        },
      };

      const result = await updateMapConfig(updatedConfig, 'admin-1');

      expect(result.providerConfig).toBeDefined();
      expect(result.providerConfig?.provider).toBe('google');
    });

    it('should update category settings', async () => {
      const updatedConfig: MapConfig = {
        ...mockMapConfig,
        categorySettings: {
          ...mockMapConfig.categorySettings,
          enableUserSubmittedPlaces: false,
        },
      };

      const result = await updateMapConfig(updatedConfig, 'admin-1');

      expect(result.categorySettings.enableUserSubmittedPlaces).toBe(false);
    });

    it('should throw on error', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(updateMapConfig(mockMapConfig, 'admin-1')).rejects.toThrow();

      global.fetch = originalFetch;
    });
  });
});
