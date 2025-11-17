import { isTruthy, isDefined } from '@petspark/shared';

/**
 * Build-time guards to prevent mock code from reaching production
 */

// Note: spark type is declared in vite-env.d.ts
// Production builds should not use legacy KV mocks - this is enforced via runtime guards below

// Feature flag validation
const VITE_USE_MOCKS = import.meta.env.VITE_USE_MOCKS;

if (VITE_USE_MOCKS === 'true' && import.meta.env.PROD) {
  throw new Error(`
  ❌ PRODUCTION BLOCKER: VITE_USE_MOCKS=true detected in production build

  Required Action:
  1. Set VITE_USE_MOCKS=false in production environment
  2. Ensure all API calls use real endpoints
  3. Remove legacy KV imports from production bundle

  Build will fail until this is resolved.
  `);
}

// Environment validation for production
if (import.meta.env.PROD) {
  const requiredEnvVars = [
    'VITE_API_URL',
    'VITE_WS_URL',
    'VITE_STRIPE_PUBLIC_KEY',
    'VITE_MAPBOX_TOKEN',
  ] as const;

  const missing = requiredEnvVars.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(`
  ❌ PRODUCTION BLOCKER: Missing required environment variables

  Missing: ${String(missing.join(', ') ?? '')}

  Required for production:
  ${requiredEnvVars.map((key) => `- ${key}=<value>`).join('\n')}
  `);
  }
}

export const BUILD_CONFIG = {
  useMocks: VITE_USE_MOCKS === 'true' && !import.meta.env.PROD,
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
  isProd: import.meta.env.PROD,
} as const;

// Runtime validation
if (BUILD_CONFIG.useMocks && BUILD_CONFIG.isProd) {
  throw new Error('Mock usage detected in production runtime - build validation failed');
}
