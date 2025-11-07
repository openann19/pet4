import { z } from 'zod'

// Environment variable schema with validation
const envSchema = z.object({
  // API Configuration
  VITE_API_URL: z.string().url('Invalid API URL'),
  VITE_WS_URL: z.string().url('Invalid WebSocket URL'),
  VITE_API_TIMEOUT: z.coerce.number().positive().default(30000),

  // Mock Control (CRITICAL)
  VITE_USE_MOCKS: z.enum(['true', 'false']).default('false'),

  // Feature Flags
  VITE_ENABLE_KYC: z.coerce.boolean().default(true),
  VITE_ENABLE_PAYMENTS: z.coerce.boolean().default(true),
  VITE_ENABLE_LIVE_STREAMING: z.coerce.boolean().default(true),

  // External Services (public tokens only)
  VITE_MAPBOX_TOKEN: z
    .string()
    .startsWith('pk.', 'Invalid Mapbox token')
    .optional(),
  VITE_STRIPE_PUBLIC_KEY: z
    .string()
    .startsWith('pk_', 'Invalid Stripe public key')
    .optional(),
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

  // Optional metadata
  VITE_APP_VERSION: z.string().default('1.0.0'),
  VITE_ENVIRONMENT: z
    .enum(['development', 'staging', 'production'])
    .default('development')
})

// Parse and validate environment
function parseEnv() {
  try {
    return envSchema.parse(import.meta.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue =>
        `❌ ${String(issue.path.join('.') ?? '')}: ${String(issue.message ?? '')}`
      ).join('\n')

      throw new Error(`
❌ ENVIRONMENT VALIDATION FAILED

${String(issues ?? '')}

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
  const missing: string[] = []

  if (!ENV.VITE_MAPBOX_TOKEN) {
    missing.push('VITE_MAPBOX_TOKEN')
  }
  if (!ENV.VITE_STRIPE_PUBLIC_KEY) {
    missing.push('VITE_STRIPE_PUBLIC_KEY')
  }
  if (!ENV.VITE_SENTRY_DSN) {
    missing.push('VITE_SENTRY_DSN')
  }

  if (missing.length > 0) {
    throw new Error(
      `❌ PRODUCTION BLOCKER: Missing required public service credentials: ${missing.join(', ')}`
    )
  }
}

export type Environment = typeof ENV
