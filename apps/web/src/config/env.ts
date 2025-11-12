import { z } from 'zod';
import { createLogger } from '@/lib/logger';

const logger = createLogger('env');

const isProd = import.meta.env.PROD === true;

/**
 * Only validate *public* client vars (VITE_*). Never reference server secrets here.
 * Any server-only secret must live in server code (not in /src/config/env.ts).
 */
const httpsUrl = z
  .string()
  .url('Invalid URL')
  .superRefine((value, ctx) => {
    if (isProd && !value.startsWith('https://')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Must be https:// in production' });
    }
  });

const wssUrl = z
  .string()
  .url('Invalid WebSocket URL')
  .superRefine((value, ctx) => {
    if (isProd && !value.startsWith('wss://')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Must be wss:// in production' });
    }
  });

const schema = z
  .object({
    VITE_API_URL: isProd ? httpsUrl : httpsUrl.default('http://localhost:3000'),
    VITE_WS_URL: isProd ? wssUrl.optional() : wssUrl.optional().default('ws://localhost:3001'),
    VITE_API_TIMEOUT: z.coerce.number().positive().default(30000),
    VITE_USE_MOCKS: z.enum(['true', 'false']).default('false'),
    VITE_ENABLE_MAPS: z.coerce.boolean().default(false),
    VITE_MAPBOX_TOKEN: z.string().optional(), // public token; optional unless maps enabled in prod
  })
  .superRefine((vals, ctx) => {
    if (isProd && vals.VITE_ENABLE_MAPS && !vals.VITE_MAPBOX_TOKEN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'VITE_MAPBOX_TOKEN is required in production when VITE_ENABLE_MAPS=true.',
        path: ['VITE_MAPBOX_TOKEN'],
      });
    }
  });

const parsed = schema.safeParse(import.meta.env);

if (!parsed.success) {
  if (isProd) {
    logger.error('Invalid web env', new Error('Web environment validation failed'), {
      errors: parsed.error.flatten(),
    });
    throw new Error('Web environment validation failed.');
  }
  logger.warn('Dev env warnings', { errors: parsed.error.flatten() });
}

type Env = z.infer<typeof schema>;

export type Environment = Env;

// Use parsed result if successful, otherwise use defaults in development
export const env = parsed.success ? parsed.data : schema.parse({
  VITE_API_URL: 'http://localhost:3000',
  VITE_WS_URL: 'ws://localhost:3001',
  VITE_API_TIMEOUT: '30000',
  VITE_USE_MOCKS: 'false',
  VITE_ENABLE_MAPS: 'false',
});
export const ENV = env;

export const flags = {
  mocks: env.VITE_USE_MOCKS === 'true',
  maps: Boolean(env.VITE_ENABLE_MAPS),
} as const;
