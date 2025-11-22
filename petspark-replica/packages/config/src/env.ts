/**
 * Environment configuration for PETSPARK
 */

import { z } from 'zod';

// Environment schema validation
const envSchema = z.object({
  // App environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // API configuration
  API_BASE_URL: z.string().url().default('http://localhost:3001/api'),
  API_TIMEOUT: z.coerce.number().default(10000),
  API_RETRY_ATTEMPTS: z.coerce.number().default(3),
  
  // Database configuration
  DATABASE_URL: z.string().url().optional(),
  DATABASE_SSL: z.coerce.boolean().default(true),
  DATABASE_POOL_SIZE: z.coerce.number().default(10),
  
  // Authentication
  JWT_SECRET: z.string().min(32).default('default-jwt-secret-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  
  // File storage
  UPLOAD_MAX_SIZE: z.coerce.number().default(10 * 1024 * 1024), // 10MB
  UPLOAD_ALLOWED_TYPES: z.string().default('image/jpeg,image/png,image/webp'),
  STORAGE_PROVIDER: z.enum(['local', 's3', 'cloudinary']).default('local'),
  
  // Cloud storage (if applicable)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Email service
  EMAIL_SERVICE: z.enum(['sendgrid', 'ses', 'resend']).default('sendgrid'),
  EMAIL_FROM: z.string().email().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  
  // Push notifications
  FCM_SERVER_KEY: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  
  // Analytics
  ANALYTICS_ENABLED: z.coerce.boolean().default(false),
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  
  // Social login
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  
  // Payment processing
  STRIPE_PUBLIC_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Redis (for caching)
  REDIS_URL: z.string().optional(),
  REDIS_TTL: z.coerce.number().default(3600), // 1 hour
  
  // Feature flags
  ENABLE_SIGNUP: z.coerce.boolean().default(true),
  ENABLE_SOCIAL_LOGIN: z.coerce.boolean().default(false),
  ENABLE_PREMIUM_FEATURES: z.coerce.boolean().default(false),
  ENABLE_ANALYTICS: z.coerce.boolean().default(false),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  CORS_CREDENTIALS: z.coerce.boolean().default(true),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'simple']).default('simple'),
});

// Validate and parse environment variables
function validateEnv(): z.infer<typeof envSchema> {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
}

// Export validated environment configuration
export const env = validateEnv();

// Environment helper functions
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

export function isTest(): boolean {
  return env.NODE_ENV === 'test';
}

export function getApiUrl(): string {
  return env.API_BASE_URL;
}

export function getDatabaseConfig() {
  return {
    url: env.DATABASE_URL,
    ssl: env.DATABASE_SSL,
    poolSize: env.DATABASE_POOL_SIZE,
  };
}

export function getUploadConfig() {
  return {
    maxSize: env.UPLOAD_MAX_SIZE,
    allowedTypes: env.UPLOAD_ALLOWED_TYPES.split(','),
    provider: env.STORAGE_PROVIDER,
  };
}

export function getJwtConfig() {
  return {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  };
}

export function getRateLimitConfig() {
  return {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  };
}

export function getCorsConfig() {
  return {
    origin: env.CORS_ORIGIN,
    credentials: env.CORS_CREDENTIALS,
  };
}

export function getFeatureFlags() {
  return {
    signup: env.ENABLE_SIGNUP,
    socialLogin: env.ENABLE_SOCIAL_LOGIN,
    premiumFeatures: env.ENABLE_PREMIUM_FEATURES,
    analytics: env.ENABLE_ANALYTICS,
  };
}

export function getLoggingConfig() {
  return {
    level: env.LOG_LEVEL,
    format: env.LOG_FORMAT,
  };
}
