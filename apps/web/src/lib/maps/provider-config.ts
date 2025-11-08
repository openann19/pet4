import { useStorage } from '@/hooks/use-storage';
import { createLogger } from '@/lib/logger';

const logger = createLogger('MapProviderConfig');

interface MapProviderConfig {
  MAP_STYLE_URL: string;
  MAP_TILES_API_KEY: string;
  GEOCODING_API_KEY: string;
  GEOCODING_ENDPOINT: string;
  PROVIDER: 'maplibre' | 'mapbox';
}

const DEFAULT_PROVIDER_CONFIG: MapProviderConfig = {
  MAP_STYLE_URL: 'https://api.maptiler.com/maps/streets-v2/style.json?key=',
  MAP_TILES_API_KEY: '',
  GEOCODING_API_KEY: '',
  GEOCODING_ENDPOINT: 'https://api.maptiler.com/geocoding',
  PROVIDER: 'maplibre',
};

function getEnvConfig(): MapProviderConfig {
  const env = import.meta.env.MODE || 'development';

  const configs: Record<string, Partial<MapProviderConfig>> = {
    development: {
      MAP_STYLE_URL: import.meta.env['VITE_MAP_STYLE_URL'] || DEFAULT_PROVIDER_CONFIG.MAP_STYLE_URL,
      MAP_TILES_API_KEY: import.meta.env['VITE_MAP_TILES_API_KEY'] || '',
      GEOCODING_API_KEY: import.meta.env['VITE_GEOCODING_API_KEY'] || '',
      GEOCODING_ENDPOINT:
        import.meta.env['VITE_GEOCODING_ENDPOINT'] || DEFAULT_PROVIDER_CONFIG.GEOCODING_ENDPOINT,
      PROVIDER: (import.meta.env['VITE_MAP_PROVIDER'] || 'maplibre') as 'maplibre' | 'mapbox',
    },
    staging: {
      MAP_STYLE_URL: import.meta.env['VITE_MAP_STYLE_URL'] || DEFAULT_PROVIDER_CONFIG.MAP_STYLE_URL,
      MAP_TILES_API_KEY: import.meta.env['VITE_MAP_TILES_API_KEY'] || '',
      GEOCODING_API_KEY: import.meta.env['VITE_GEOCODING_API_KEY'] || '',
      GEOCODING_ENDPOINT:
        import.meta.env['VITE_GEOCODING_ENDPOINT'] || DEFAULT_PROVIDER_CONFIG.GEOCODING_ENDPOINT,
      PROVIDER: (import.meta.env['VITE_MAP_PROVIDER'] || 'maplibre') as 'maplibre' | 'mapbox',
    },
    production: {
      MAP_STYLE_URL: import.meta.env['VITE_MAP_STYLE_URL'] || DEFAULT_PROVIDER_CONFIG.MAP_STYLE_URL,
      MAP_TILES_API_KEY: import.meta.env['VITE_MAP_TILES_API_KEY'] || '',
      GEOCODING_API_KEY: import.meta.env['VITE_GEOCODING_API_KEY'] || '',
      GEOCODING_ENDPOINT:
        import.meta.env['VITE_GEOCODING_ENDPOINT'] || DEFAULT_PROVIDER_CONFIG.GEOCODING_ENDPOINT,
      PROVIDER: (import.meta.env['VITE_MAP_PROVIDER'] || 'maplibre') as 'maplibre' | 'mapbox',
    },
  };

  return { ...DEFAULT_PROVIDER_CONFIG, ...configs[env] };
}

let cachedAdminConfig: MapProviderConfig | null = null;

export function getAdminMapProviderConfig(): MapProviderConfig {
  if (typeof window === 'undefined') {
    return getEnvConfig();
  }

  try {
    const stored = localStorage.getItem('admin-map-provider-config');
    if (stored) {
      cachedAdminConfig = JSON.parse(stored);
      return cachedAdminConfig || getEnvConfig();
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

  const config = adminConfig || getEnvConfig();
  const envConfig = getEnvConfig();

  const updateConfig = (updates: Partial<MapProviderConfig>): void => {
    const newConfig = { ...config, ...updates };
    setAdminConfig(newConfig);
    setAdminMapProviderConfig(newConfig);
  };

  const resetToDefaults = (): void => {
    setAdminConfig(envConfig);
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
    return `${config.MAP_STYLE_URL}${config.MAP_TILES_API_KEY}`;
  }
  return config.MAP_STYLE_URL;
}

export function getGeocodingUrl(): string {
  return getAdminMapProviderConfig().GEOCODING_ENDPOINT;
}

export function getGeocodingApiKey(): string {
  return getAdminMapProviderConfig().GEOCODING_API_KEY;
}
