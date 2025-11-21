// Type definitions for interceptors
interface ApiRequestConfig {
  method?: string;
  url?: string;
  data?: unknown;
  headers?: Record<string, string>;
}

interface ApiResponse {
  status: number;
  config: ApiRequestConfig;
  data: unknown;
}

interface ApiError {
  response?: {
    status?: number;
    data: unknown;
  };
  message: string;
}

// Common path patterns
const POST_ID_PATTERN = '/posts/:id';
const CHAT_ROOM_ID_PATTERN = '/chat/rooms/:id';
const EVENT_ID_PATTERN = '/events/:id';

/**
 * API configuration for PETSPARK
 */

export const API_CONFIG = {
  // Base configuration
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3001/api',
  timeout: parseInt(process.env.API_TIMEOUT || '10000', 10),
  retryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS || '3', 10),
  
  // Headers
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'PETSPARK/1.0.0',
  },
  
  // Endpoints
  endpoints: {
    // Authentication
    auth: {
      login: '/auth/login',
      logout: '/auth/logout',
      register: '/auth/register',
      refresh: '/auth/refresh',
      verify: '/auth/verify',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password',
      changePassword: '/auth/change-password',
      enable2FA: '/auth/2fa/enable',
      disable2FA: '/auth/2fa/disable',
      verify2FA: '/auth/2fa/verify',
      refreshToken: '/auth/refresh',
      me: '/auth/me',
    },
    
    // Users
    users: {
      profile: '/users/profile',
      update: '/users/profile',
      updateProfile: '/users/profile',
      avatar: '/users/avatar',
      uploadAvatar: '/users/avatar',
      settings: '/users/settings',
      preferences: '/users/preferences',
      search: '/users/search',
      suggestions: '/users/suggestions',
      follow: '/users/follow',
      unfollow: '/users/unfollow',
      followers: '/users/followers',
      following: '/users/following',
      blocked: '/users/blocked',
      block: '/users/block',
      unblock: '/users/unblock',
    },
    
    // Pets
    pets: {
      list: '/pets',
      create: '/pets',
      update: '/pets/:id',
      delete: '/pets/:id',
      get: '/pets/:id',
      images: '/pets/:id/images',
      uploadImage: '/pets/:id/images',
      deleteImage: '/pets/:id/images/:imageId',
      search: '/pets/search',
      nearby: '/pets/nearby',
      popular: '/pets/popular',
      recommendations: '/pets/recommendations',
      verify: '/pets/:id/verify',
      report: '/pets/:id/report',
    },
    
    // Posts
    posts: {
      list: '/posts',
      create: '/posts',
      update: POST_ID_PATTERN,
      delete: POST_ID_PATTERN,
      get: POST_ID_PATTERN,
      like: '/posts/:id/like',
      unlike: '/posts/:id/unlike',
      comments: '/posts/:id/comments',
      addComment: '/posts/:id/comments',
      updateComment: '/posts/:id/comments/:commentId',
      deleteComment: '/posts/:id/comments/:commentId',
      likeComment: '/posts/:id/comments/:commentId/like',
      unlikeComment: '/posts/:id/comments/:commentId/unlike',
      share: '/posts/:id/share',
      report: '/posts/:id/report',
      feed: '/posts/feed',
      trending: '/posts/trending',
    },
    
    // Chat
    chat: {
      rooms: '/chat/rooms',
      createRoom: '/chat/rooms',
      updateRoom: CHAT_ROOM_ID_PATTERN,
      deleteRoom: CHAT_ROOM_ID_PATTERN,
      getRoom: CHAT_ROOM_ID_PATTERN,
      joinRoom: '/chat/rooms/:id/join',
      leaveRoom: '/chat/rooms/:id/leave',
      messages: '/chat/rooms/:id/messages',
      sendMessage: '/chat/rooms/:id/messages',
      updateMessage: '/chat/rooms/:id/messages/:messageId',
      deleteMessage: '/chat/rooms/:id/messages/:messageId',
      markAsRead: '/chat/rooms/:id/read',
      typing: '/chat/rooms/:id/typing',
      online: '/chat/online',
      search: '/chat/search',
      unread: '/chat/unread',
    },
    
    // Discovery
    discovery: {
      pets: '/discovery/pets',
      users: '/discovery/users',
      filters: '/discovery/filters',
      saveFilters: '/discovery/filters',
      swipe: '/discovery/swipe',
      matches: '/discovery/matches',
      superLike: '/discovery/super-like',
      boost: '/discovery/boost',
      rewind: '/discovery/rewind',
    },
    
    // Notifications
    notifications: {
      list: '/notifications',
      markAsRead: '/notifications/:id/read',
      markAllAsRead: '/notifications/read-all',
      delete: '/notifications/:id',
      settings: '/notifications/settings',
      updateSettings: '/notifications/settings',
      pushToken: '/notifications/push-token',
      test: '/notifications/test',
    },
    
    // Media
    media: {
      upload: '/media/upload',
      uploadMultiple: '/media/upload-multiple',
      process: '/media/process',
      resize: '/media/resize',
      optimize: '/media/optimize',
      delete: '/media/:id',
      get: '/media/:id',
      gallery: '/media/gallery',
      search: '/media/search',
    },
    
    // Location
    location: {
      update: '/location/update',
      nearby: '/location/nearby',
      search: '/location/search',
      autocomplete: '/location/autocomplete',
      geocode: '/location/geocode',
      reverseGeocode: '/location/reverse-geocode',
    },
    
    // Events
    events: {
      list: '/events',
      create: '/events',
      update: EVENT_ID_PATTERN,
      delete: EVENT_ID_PATTERN,
      get: EVENT_ID_PATTERN,
      attend: '/events/:id/attend',
      unattend: '/events/:id/unattend',
      interested: '/events/:id/interested',
      notInterested: '/events/:id/not-interested',
      nearby: '/events/nearby',
      search: '/events/search',
    },
    
    // Premium
    premium: {
      subscribe: '/premium/subscribe',
      cancel: '/premium/cancel',
      update: '/premium/update',
      status: '/premium/status',
      features: '/premium/features',
      usage: '/premium/usage',
      billing: '/premium/billing',
      invoices: '/premium/invoices',
      paymentMethods: '/premium/payment-methods',
      addPaymentMethod: '/premium/payment-methods',
      removePaymentMethod: '/premium/payment-methods/:id',
    },
    
    // Admin
    admin: {
      dashboard: '/admin/dashboard',
      users: '/admin/users',
      pets: '/admin/pets',
      posts: '/admin/posts',
      reports: '/admin/reports',
      analytics: '/admin/analytics',
      settings: '/admin/settings',
      logs: '/admin/logs',
      maintenance: '/admin/maintenance',
      notifications: '/admin/notifications',
    },
    
    // Health
    health: {
      check: '/health',
      readiness: '/health/ready',
      liveness: '/health/live',
      version: '/health/version',
      metrics: '/health/metrics',
    },
  } as const,
  
  // HTTP methods
  methods: {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
    HEAD: 'HEAD',
    OPTIONS: 'OPTIONS',
  } as const,
  
  // Status codes
  statusCodes: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
  } as const,
  
  // Error codes
  errorCodes: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
    CONFLICT_ERROR: 'CONFLICT_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  } as const,
  
  // Request/response interceptors
  interceptors: {
    request: {
      auth: (config: ApiRequestConfig) => {
        // Add auth token to request
        const token = localStorage.getItem('petspark_auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      logging: (config: ApiRequestConfig) => {
        // Log outgoing requests
        console.warn(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data);
        return config;
      },
    },
    response: {
      logging: (response: ApiResponse) => {
        // Log incoming responses
        console.warn(`[API] ${response.status} ${response.config.url}`, response.data);
        return response;
      },
      error: (error: ApiError) => {
        // Handle errors globally
        console.error('[API] Error:', error.response?.data || error.message);
        
        // Handle auth errors
        if (error.response?.status === 401) {
          // Redirect to login or refresh token
          localStorage.removeItem('petspark_auth_token');
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      },
    },
  },
  
  // Query parameters
  queryParams: {
    pagination: {
      page: 'page',
      pageSize: 'pageSize',
      limit: 'limit',
      offset: 'offset',
    },
    sorting: {
      sortBy: 'sortBy',
      sortOrder: 'sortOrder',
      order: 'order',
    },
    filtering: {
      search: 'search',
      filter: 'filter',
      category: 'category',
      type: 'type',
      status: 'status',
    },
    fields: {
      fields: 'fields',
      include: 'include',
      exclude: 'exclude',
    },
  },
  
  // Response formats
  responseFormats: {
    json: 'application/json',
    formData: 'multipart/form-data',
    urlEncoded: 'application/x-www-form-urlencoded',
    text: 'text/plain',
    html: 'text/html',
    xml: 'application/xml',
  },
  
  // Cache configuration
  cache: {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    endpoints: {
      '/pets': 10 * 60 * 1000, // 10 minutes
      '/users/profile': 60 * 1000, // 1 minute
      '/posts/feed': 2 * 60 * 1000, // 2 minutes
      '/discovery/pets': 30 * 1000, // 30 seconds
    },
  },
  
  // WebSocket configuration
  websocket: {
    url: process.env.WEBSOCKET_URL || 'ws://localhost:3001',
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
  },
} as const;

// Helper functions
export function getEndpoint(path: string): string {
  return `${API_CONFIG.baseUrl}${path}`;
}

export function getAuthEndpoint(endpoint: string): string {
  return getEndpoint(API_CONFIG.endpoints.auth[endpoint as keyof typeof API_CONFIG.endpoints.auth]);
}

export function getUserEndpoint(endpoint: string): string {
  return getEndpoint(API_CONFIG.endpoints.users[endpoint as keyof typeof API_CONFIG.endpoints.users]);
}

export function getPetEndpoint(endpoint: string): string {
  return getEndpoint(API_CONFIG.endpoints.pets[endpoint as keyof typeof API_CONFIG.endpoints.pets]);
}

export function getPostEndpoint(endpoint: string): string {
  return getEndpoint(API_CONFIG.endpoints.posts[endpoint as keyof typeof API_CONFIG.endpoints.posts]);
}

export function getChatEndpoint(endpoint: string): string {
  return getEndpoint(API_CONFIG.endpoints.chat[endpoint as keyof typeof API_CONFIG.endpoints.chat]);
}

export function getDiscoveryEndpoint(endpoint: string): string {
  return getEndpoint(API_CONFIG.endpoints.discovery[endpoint as keyof typeof API_CONFIG.endpoints.discovery]);
}

export function getNotificationEndpoint(endpoint: string): string {
  return getEndpoint(API_CONFIG.endpoints.notifications[endpoint as keyof typeof API_CONFIG.endpoints.notifications]);
}

export function getMediaEndpoint(endpoint: string): string {
  return getEndpoint(API_CONFIG.endpoints.media[endpoint as keyof typeof API_CONFIG.endpoints.media]);
}

export function getLocationEndpoint(endpoint: string): string {
  return getEndpoint(API_CONFIG.endpoints.location[endpoint as keyof typeof API_CONFIG.endpoints.location]);
}

export function getEventEndpoint(endpoint: string): string {
  return getEndpoint(API_CONFIG.endpoints.events[endpoint as keyof typeof API_CONFIG.endpoints.events]);
}

export function getPremiumEndpoint(endpoint: string): string {
  return getEndpoint(API_CONFIG.endpoints.premium[endpoint as keyof typeof API_CONFIG.endpoints.premium]);
}

export function getAdminEndpoint(endpoint: string): string {
  return getEndpoint(API_CONFIG.endpoints.admin[endpoint as keyof typeof API_CONFIG.endpoints.admin]);
}

export function getHealthEndpoint(endpoint: string): string {
  return getEndpoint(API_CONFIG.endpoints.health[endpoint as keyof typeof API_CONFIG.endpoints.health]);
}

export function buildUrl(endpoint: string, params?: Record<string, unknown>): string {
  const url = new URL(endpoint, API_CONFIG.baseUrl);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  return url.toString();
}

export function buildPathWithParams(path: string, params: Record<string, string | number>): string {
  let result = path;
  
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, String(value));
  });
  
  return result;
}
