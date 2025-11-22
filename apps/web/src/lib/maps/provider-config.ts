import { useStorage } from '@/hooks/use-storage';
import { createLogger } from '@/lib/logger';
import { isTruthy } from '@petspark/shared';

const logger = createLogger('MapProviderConfig');

interface MapProviderConfig {
  MAP_STYLE_URL: string;
  MAP_TILES_API_KEY: string;
  GEOCODING_API_KEY: string;
  GEOCODING_ENDPOINT: string;
  QUOTA_MONITOR_ENDPOINT: string;
  RATE_LIMIT_ENDPOINT: string;
  CACHE_TTL: string;
  PROVIDER: 'maplibre' | 'mapbox';
}

const DEFAULT_PROVIDER_CONFIG: MapProviderConfig = {
  MAP_STYLE_URL: 'https://api.maptiler.com/maps/streets-v2/style.json?key=',
  MAP_TILES_API_KEY: '',
  GEOCODING_API_KEY: '',
  GEOCODING_ENDPOINT: 'https://api.maptiler.com/geocoding',
  QUOTA_MONITOR_ENDPOINT: '',
  RATE_LIMIT_ENDPOINT: '',
  CACHE_TTL: '300000',
  PROVIDER: 'maplibre',
};

type MapEnv = 'development' | 'staging' | 'production';

function getEnvConfig(): MapProviderConfig {
  const allowedEnvs: readonly MapEnv[] = ['development', 'staging', 'production'];
  const mode = import.meta.env.MODE ?? 'development';
  const env: MapEnv = allowedEnvs.includes(mode as MapEnv) ? (mode as MapEnv) : 'development';

  const baseConfig = {
    MAP_STYLE_URL:
      (import.meta.env.VITE_MAP_STYLE_URL as string | undefined) ??
      DEFAULT_PROVIDER_CONFIG.MAP_STYLE_URL,
    MAP_TILES_API_KEY: (import.meta.env.VITE_MAP_TILES_API_KEY as string | undefined) ?? '',
    GEOCODING_API_KEY: (import.meta.env.VITE_GEOCODING_API_KEY as string | undefined) ?? '',
    GEOCODING_ENDPOINT:
      (import.meta.env.VITE_GEOCODING_ENDPOINT as string | undefined) ??
      DEFAULT_PROVIDER_CONFIG.GEOCODING_ENDPOINT,
    QUOTA_MONITOR_ENDPOINT:
      (import.meta.env.VITE_QUOTA_MONITOR_ENDPOINT as string | undefined) ??
      DEFAULT_PROVIDER_CONFIG.QUOTA_MONITOR_ENDPOINT,
    RATE_LIMIT_ENDPOINT:
      (import.meta.env.VITE_RATE_LIMIT_ENDPOINT as string | undefined) ??
      DEFAULT_PROVIDER_CONFIG.RATE_LIMIT_ENDPOINT,
    CACHE_TTL:
      (import.meta.env.VITE_CACHE_TTL as string | undefined) ?? DEFAULT_PROVIDER_CONFIG.CACHE_TTL,
    PROVIDER: ((import.meta.env.VITE_MAP_PROVIDER as string | undefined) ?? 'maplibre') as
      | 'maplibre'
      | 'mapbox',
  } as const;

  const configs: Record<MapEnv, Partial<MapProviderConfig>> = {
    development: baseConfig,
    staging: baseConfig,
    production: baseConfig,
  };

  return { ...DEFAULT_PROVIDER_CONFIG, ...configs[env] };
}

function isMapProviderConfig(value: unknown): value is MapProviderConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<MapProviderConfig>;
  return (
    typeof candidate.MAP_STYLE_URL === 'string' &&
    typeof candidate.MAP_TILES_API_KEY === 'string' &&
    typeof candidate.GEOCODING_API_KEY === 'string' &&
    typeof candidate.GEOCODING_ENDPOINT === 'string' &&
    (candidate.PROVIDER === 'maplibre' || candidate.PROVIDER === 'mapbox')
  );
}

let cachedAdminConfig: MapProviderConfig | null = null;

export function getAdminMapProviderConfig(): MapProviderConfig {
  if (typeof window === 'undefined') {
    return getEnvConfig();
  }

  try {
    const stored = localStorage.getItem('admin-map-provider-config');
    if (isTruthy(stored)) {
      const parsed = JSON.parse(stored) as unknown;
      if (isMapProviderConfig(parsed)) {
        cachedAdminConfig = parsed;
        return cachedAdminConfig;
      }

      logger.warn('Invalid stored map provider config, falling back to defaults');
    }
  } catch {
    return getEnvConfig();
  }

  return getEnvConfig();
}

export function setAdminMapProviderConfig(config: Partial<MapProviderConfig>): void {
  const current = getAdminMapProviderConfig();
  const updated = { ...current, ...config };

  try {
    localStorage.setItem('admin-map-provider-config', JSON.stringify(updated));
    cachedAdminConfig = updated;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to save map provider config', err);
  }
}

export function useMapProviderConfig(): {
  config: MapProviderConfig;
  updateConfig: (updates: Partial<MapProviderConfig>) => void;
  resetToDefaults: () => void;
} {
  const [adminConfig, setAdminConfig] = useStorage<MapProviderConfig>(
    'admin-map-provider-config',
    getEnvConfig()
  );

  const config = adminConfig ?? getEnvConfig();
  const envConfig = getEnvConfig();

  const updateConfig = (updates: Partial<MapProviderConfig>): void => {
    const newConfig = { ...config, ...updates };
    void setAdminConfig(newConfig).catch((error) => {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to persist admin map provider config', err);
    });
    setAdminMapProviderConfig(newConfig);
  };

  const resetToDefaults = (): void => {
    void setAdminConfig(envConfig).catch((error) => {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to reset admin map provider config', err);
    });
    setAdminMapProviderConfig(envConfig);
  };

  return {
    config,
    updateConfig,
    resetToDefaults,
  };
}

export const mapProviderConfig = getAdminMapProviderConfig();

export function getMapStyleUrl(): string {
  const config = getAdminMapProviderConfig();
  if (config.MAP_STYLE_URL.includes('?key=')) {
    return `${String(config.MAP_STYLE_URL ?? '')}${String(config.MAP_TILES_API_KEY ?? '')}`;
  }
  return config.MAP_STYLE_URL;
}

export function getGeocodingUrl(): string {
  return getAdminMapProviderConfig().GEOCODING_ENDPOINT;
}

export function getGeocodingApiKey(): string {
  return getAdminMapProviderConfig().GEOCODING_API_KEY;
}
