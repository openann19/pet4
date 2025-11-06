import { z } from 'zod'

// Environment variable schema with validation
const envSchema = z.object({
  // API Configuration
  VITE_API_URL: z.string().url('Invalid API URL'),
  VITE_WS_URL: z.string().url('Invalid WebSocket URL'),
  VITE_API_TIMEOUT: z.coerce.number().positive().default(30000),

  // Authentication
  VITE_JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  VITE_JWT_EXPIRY: z.string().default('7d'),
  VITE_REFRESH_TOKEN_EXPIRY: z.string().default('30d'),

  // Mock Control (CRITICAL)
  VITE_USE_MOCKS: z.enum(['true', 'false']).default('false'),

  // Feature Flags
  VITE_ENABLE_KYC: z.coerce.boolean().default(true),
  VITE_ENABLE_PAYMENTS: z.coerce.boolean().default(true),
  VITE_ENABLE_LIVE_STREAMING: z.coerce.boolean().default(true),

  // External Services
  VITE_MAPBOX_TOKEN: z.string().startsWith('pk.', 'Invalid Mapbox token'),
  VITE_STRIPE_PUBLIC_KEY: z.string().startsWith('pk_', 'Invalid Stripe public key'),
  VITE_SENTRY_DSN: z.preprocess(
    (val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    },
    z.string().url('Invalid Sentry DSN').optional()
  ),
  VITE_SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),

  // Security
  VITE_CORS_ORIGIN: z.string().optional(),
  VITE_CSP_ENABLED: z.coerce.boolean().default(true),

  // Optional
  VITE_APP_VERSION: z.string().default('1.0.0'),
  VITE_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development')
})

// Parse and validate environment
function parseEnv() {
  try {
    return envSchema.parse(import.meta.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue =>
        `❌ ${issue.path.join('.')}: ${issue.message}`
      ).join('\n')

      throw new Error(`
❌ ENVIRONMENT VALIDATION FAILED

${issues}

Required environment variables are missing or invalid.
See apps/web/.env.example for the complete configuration.
`)
    }
    throw error
  }
}

export const ENV = parseEnv()

// Production validation
if (ENV.VITE_ENVIRONMENT === 'production') {
  if (ENV.VITE_USE_MOCKS === 'true') {
    throw new Error('❌ PRODUCTION BLOCKER: VITE_USE_MOCKS must be false in production')
  }

  // Validate required production services
  const requiredInProd = [
    ENV.VITE_MAPBOX_TOKEN,
    ENV.VITE_STRIPE_PUBLIC_KEY,
    ENV.VITE_SENTRY_DSN
  ]

  if (requiredInProd.some(val => !val)) {
    throw new Error('❌ PRODUCTION BLOCKER: Missing required service credentials')
  }
}

export type Environment = typeof ENV
