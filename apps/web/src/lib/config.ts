export type Environment = 'dev' | 'staging' | 'prod';

export interface AppConfig {
  ENV: Environment;
  API_BASE_URL: string;
  WS_URL: string;
  CDN_URL: string;
  MEDIA_UPLOAD_PROVIDER: 'simulated' | 'cloudinary' | 's3';
  AUTH_ISSUER: string;
  SENTRY_DSN: string;
  FEATURE_FLAGS_ENDPOINT: string;
  BUILD_VERSION: string;
  COMMIT_SHA: string;
}

const ENV_CONFIGS: Record<Environment, AppConfig> = {
  dev: {
    ENV: 'dev',
    API_BASE_URL: 'http://localhost:3001/api',
    WS_URL: 'ws://localhost:3000',
    CDN_URL: 'http://localhost:3001/cdn',
    MEDIA_UPLOAD_PROVIDER: 's3',
    AUTH_ISSUER: 'pawfectmatch-dev',
    SENTRY_DSN: '',
    FEATURE_FLAGS_ENDPOINT: 'http://localhost:3001/api/features',
    BUILD_VERSION: '1.0.0-dev',
    COMMIT_SHA: 'local',
  },
  staging: {
    ENV: 'staging',
    API_BASE_URL: 'https://api-staging.pawfectmatch.app/api',
    WS_URL: 'wss://ws-staging.pawfectmatch.app',
    CDN_URL: 'https://cdn-staging.pawfectmatch.app',
    MEDIA_UPLOAD_PROVIDER: 'cloudinary',
    AUTH_ISSUER: 'pawfectmatch-staging',
    SENTRY_DSN: 'https://sentry.io/staging',
    FEATURE_FLAGS_ENDPOINT: 'https://api-staging.pawfectmatch.app/api/features',
    BUILD_VERSION: '1.0.0-rc',
    COMMIT_SHA: import.meta.env.VITE_COMMIT_SHA ?? 'unknown',
  },
  prod: {
    ENV: 'prod',
    API_BASE_URL: 'https://api.pawfectmatch.app/api',
    WS_URL: 'wss://ws.pawfectmatch.app',
    CDN_URL: 'https://cdn.pawfectmatch.app',
    MEDIA_UPLOAD_PROVIDER: 'cloudinary',
    AUTH_ISSUER: 'pawfectmatch',
    SENTRY_DSN: 'https://sentry.io/prod',
    FEATURE_FLAGS_ENDPOINT: 'https://api.pawfectmatch.app/api/features',
    BUILD_VERSION: '1.0.0',
    COMMIT_SHA: import.meta.env.VITE_COMMIT_SHA ?? 'unknown',
  },
};

function detectEnvironment(): Environment {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  if (hostname.includes('staging')) return 'staging';
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) return 'dev';
  return 'prod';
}

let currentConfig: AppConfig = ENV_CONFIGS[detectEnvironment()];

export function getConfig(): AppConfig {
  return currentConfig;
}

export function setEnvironment(env: Environment): void {
  currentConfig = ENV_CONFIGS[env];
}

export const config = {
  get: getConfig,
  setEnv: setEnvironment,
  get current() {
    return getConfig();
  },
};
