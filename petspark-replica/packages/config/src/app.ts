/**
 * Application configuration for PETSPARK
 */

export const APP_CONFIG = {
  // App metadata
  name: 'PETSPARK',
  version: '1.0.0',
  description: 'Pet Social Networking Platform',
  author: 'PETSPARK Team',
  homepage: 'https://petspark.app',
  
  // App URLs
  urls: {
    web: 'https://petspark.app',
    api: process.env.API_BASE_URL || 'http://localhost:3001/api',
    support: 'https://support.petspark.app',
    privacy: 'https://petspark.app/privacy',
    terms: 'https://petspark.app/terms',
  },
  
  // Social media links
  social: {
    twitter: 'https://twitter.com/petspark',
    instagram: 'https://instagram.com/petspark',
    facebook: 'https://facebook.com/petspark',
    youtube: 'https://youtube.com/@petspark',
    tiktok: 'https://tiktok.com/@petspark',
  },
  
  // Contact information
  contact: {
    email: 'support@petspark.app',
    phone: '+1-800-PETSPARK',
    address: '123 Pet Street, San Francisco, CA 94102',
  },
  
  // Business hours
  businessHours: {
    weekdays: '9:00 AM - 6:00 PM',
    weekends: '10:00 AM - 4:00 PM',
    timezone: 'America/Los_Angeles',
  },
  
  // App store links
  appStores: {
    ios: 'https://apps.apple.com/app/petspark',
    android: 'https://play.google.com/store/apps/details?id=com.petspark',
  },
  
  // Legal information
  legal: {
    companyName: 'PETSPARK Inc.',
    companyNumber: '123456789',
    vatNumber: 'US123456789',
    copyright: `© ${new Date().getFullYear()} PETSPARK Inc. All rights reserved.`,
  },
  
  // Feature configuration
  features: {
    maxPetsPerUser: 10,
    maxImagesPerPet: 10,
    maxPostLength: 500,
    maxCommentLength: 300,
    maxMessageLength: 1000,
    maxChatParticipants: 50,
    maxDiscoveryDistance: 100000, // 100km in meters
    maxAgeRange: [0, 30], // years
  },
  
  // Pagination
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    pageSizes: [10, 20, 50, 100],
  },
  
  // Upload limits
  uploads: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedVideoTypes: ['video/mp4', 'video/webm'],
    maxImagesPerPost: 10,
    maxVideosPerPost: 5,
  },
  
  // Cache configuration
  cache: {
    defaultTTL: 3600, // 1 hour in seconds
    shortTTL: 300, // 5 minutes
    longTTL: 86400, // 24 hours
    maxCacheSize: 100, // MB
  },
  
  // Rate limiting
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: {
      anonymous: 50,
      authenticated: 200,
      premium: 500,
    },
    endpoints: {
      login: 5,
      signup: 3,
      upload: 10,
      message: 100,
    },
  },
  
  // Notification settings
  notifications: {
    push: {
      enabled: true,
      batchSize: 100,
      retryAttempts: 3,
      retryDelay: 5000, // 5 seconds
    },
    email: {
      enabled: true,
      batchSize: 50,
      retryAttempts: 3,
      retryDelay: 10000, // 10 seconds
    },
    inApp: {
      maxUnread: 1000,
      retentionDays: 30,
    },
  },
  
  // Security settings
  security: {
    password: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
    },
    session: {
      maxLength: 24 * 60 * 60 * 1000, // 24 hours
      refreshLength: 30 * 24 * 60 * 60 * 1000, // 30 days
      maxConcurrentSessions: 5,
    },
    twoFactor: {
      enabled: false,
      issuer: 'PETSPARK',
      window: 1, // allow 1 step before/after for time drift
    },
  },
  
  // Analytics configuration
  analytics: {
    enabled: process.env.NODE_ENV === 'production',
    samplingRate: 0.1, // 10% of users
    batchSize: 100,
    flushInterval: 30000, // 30 seconds
    retentionDays: 365,
  },
  
  // Performance configuration
  performance: {
    imageOptimization: {
      enabled: true,
      quality: 80,
      formats: ['webp', 'jpeg'],
      sizes: [400, 800, 1200, 1600],
    },
    compression: {
      enabled: true,
      level: 6, // gzip compression level
      threshold: 1024, // only compress files > 1KB
    },
    caching: {
      staticAssets: 365 * 24 * 60 * 60, // 1 year
      apiResponses: 5 * 60, // 5 minutes
      userContent: 24 * 60 * 60, // 24 hours
    },
  },
  
  // Monitoring configuration
  monitoring: {
    enabled: process.env.NODE_ENV === 'production',
    errorReporting: {
      enabled: true,
      sampleRate: 0.1, // 10% of errors
      maxBreadcrumbs: 20,
    },
    performance: {
      enabled: true,
      sampleRate: 0.01, // 1% of transactions
      maxTransactions: 1000,
    },
    healthChecks: {
      interval: 60000, // 1 minute
      timeout: 5000, // 5 seconds
      retries: 3,
    },
  },
  
  // Development configuration
  development: {
    mockData: {
      enabled: process.env.NODE_ENV === 'development',
      userCount: 100,
      petCount: 300,
      postCount: 1000,
    },
    debugging: {
      enabled: process.env.NODE_ENV === 'development',
      verboseLogging: false,
      slowQueryThreshold: 1000, // ms
    },
    hotReload: {
      enabled: process.env.NODE_ENV === 'development',
      port: 5173,
      proxy: {
        '/api': 'http://localhost:3001',
      },
    },
  },
} as const;

// Helper functions
export function getAppUrl(): string {
  return APP_CONFIG.urls.web;
}

export function getApiUrl(): string {
  return APP_CONFIG.urls.api;
}

export function getSupportUrl(): string {
  return APP_CONFIG.urls.support;
}

export function getSocialLinks() {
  return APP_CONFIG.social;
}

export function getContactInfo() {
  return APP_CONFIG.contact;
}

export function getBusinessHours() {
  return APP_CONFIG.businessHours;
}

export function getAppStoreLinks() {
  return APP_CONFIG.appStores;
}

export function getLegalInfo() {
  return APP_CONFIG.legal;
}

export function getFeatureConfig() {
  return APP_CONFIG.features;
}

export function getPaginationConfig() {
  return APP_CONFIG.pagination;
}

export function getUploadConfig() {
  return APP_CONFIG.uploads;
}

export function getCacheConfig() {
  return APP_CONFIG.cache;
}

export function getRateLimitingConfig() {
  return APP_CONFIG.rateLimiting;
}

export function getNotificationConfig() {
  return APP_CONFIG.notifications;
}

export function getSecurityConfig() {
  return APP_CONFIG.security;
}

export function getAnalyticsConfig() {
  return APP_CONFIG.analytics;
}

export function getPerformanceConfig() {
  return APP_CONFIG.performance;
}

export function getMonitoringConfig() {
  return APP_CONFIG.monitoring;
}

export function getDevelopmentConfig() {
  return APP_CONFIG.development;
}
