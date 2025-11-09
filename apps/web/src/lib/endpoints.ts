export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },

  // User Management
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    UPLOAD_AVATAR: '/users/avatar',
    PREFERENCES: '/users/preferences',
    NOTIFICATIONS: '/users/notifications',
    SETTINGS: '/users/settings',
    LOCATION: '/users/location',
    LOCATION_NEARBY: '/users/location/nearby',
  },

  // Adoption
  ADOPTION: {
    LISTINGS: '/adoption/listings',
    CREATE_LISTING: '/adoption/listings',
    GET_LISTING: (id: string) => `/adoption/listings/${id}`,
    UPDATE_LISTING: (id: string) => `/adoption/listings/${id}`,
    DELETE_LISTING: (id: string) => `/adoption/listings/${id}`,
    APPLY: '/adoption/applications',
    APPLICATIONS: '/adoption/applications',
    UPDATE_APPLICATION: (id: string) => `/adoption/applications/${id}`,
  },

  // Matching
  MATCHING: {
    PREFERENCES: '/matching/preferences',
    DISCOVER: '/matching/discover',
    SWIPE: '/matching/swipe',
    MATCHES: '/matching/matches',
    SCORE: '/matching/score',
  },

  // Payments
  PAYMENTS: {
    PRODUCTS: '/payments/products',
    CREATE_INTENT: '/payments/create-intent',
    CONFIRM_PAYMENT: '/payments/confirm',
    SUBSCRIPTIONS: '/payments/subscriptions',
    CANCEL_SUBSCRIPTION: (id: string) => `/payments/subscriptions/${id}`,
    ENTITLEMENTS: '/payments/entitlements',
    UPDATE_ENTITLEMENTS: '/payments/entitlements',
    SUBSCRIPTION: '/payments/subscription',
    CREATE_SUBSCRIPTION: '/payments/subscription',
    UPDATE_SUBSCRIPTION: (id: string) => `/payments/subscription/${id}`,
    CONSUMABLES: '/payments/consumables',
  },

  // File Uploads
  UPLOADS: {
    SIGN_URL: '/uploads/sign-url',
    COMPLETE: '/uploads/complete',
    DELETE: (key: string) => `/uploads/${key}`,
  },

  // Chat & Messaging
  CHAT: {
    CONVERSATIONS: '/chat/conversations',
    CONVERSATION: (id: string) => `/chat/conversations/${id}`,
    MESSAGES: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
    SEND_MESSAGE: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
    MARK_READ: (conversationId: string) => `/chat/conversations/${conversationId}/read`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    SETTINGS: '/notifications/settings',
    GEOFENCE: '/notifications/geofence',
    USER_LOCATIONS: '/notifications/user-locations',
  },

  // Community
  COMMUNITY: {
    POSTS: '/community/posts',
    POST: (id: string) => `/community/posts/${id}`,
    CREATE_POST: '/community/posts',
    LIKE_POST: (id: string) => `/community/posts/${id}/like`,
    COMMENT: (postId: string) => `/community/posts/${postId}/comments`,
    LIKE_COMMENT: (postId: string, commentId: string) =>
      `/community/posts/${postId}/comments/${commentId}/like`,
  },

  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    USER: (id: string) => `/admin/users/${id}`,
    RESET_PASSWORD: (userId: string) => `/admin/users/${userId}/reset-password`,
    MODERATION_QUEUE: '/admin/moderation',
    ANALYTICS: '/admin/analytics',
    SETTINGS: '/admin/settings',
    CONFIG_BROADCAST: '/admin/config/broadcast',
    CONFIG_HISTORY: '/admin/config/history',
    SUPPORT_TICKETS: '/admin/support/tickets',
    SUPPORT_TICKET: (id: string) => `/admin/support/tickets/${id}`,
    SUPPORT_TICKET_MESSAGES: (id: string) => `/admin/support/tickets/${id}/messages`,
    SUPPORT_TICKET_STATUS: (id: string) => `/admin/support/tickets/${id}/status`,
    SUPPORT_TICKET_ASSIGN: (id: string) => `/admin/support/tickets/${id}/assign`,
    SUPPORT_STATS: '/admin/support/stats',
  },

  // KYC
  KYC: {
    STATUS: '/kyc/status',
    START_VERIFICATION: '/kyc/start',
    SUBMIT_DOCUMENTS: '/kyc/documents',
    GET_VERIFICATION: (id: string) => `/kyc/verifications/${id}`,
  },

  // GDPR
  GDPR: {
    EXPORT: '/api/gdpr/export',
    DELETE: '/api/gdpr/delete',
    CONSENT: '/api/gdpr/consent',
    CONSENT_STATUS: (userId: string) => `/api/gdpr/consent?userId=${userId}`,
    UPDATE_CONSENT: '/api/gdpr/consent',
  },

  // Blocking
  BLOCKING: {
    BLOCK: '/blocking/block',
    BLOCK_USER: '/blocking/block-user',
    UNBLOCK: (blockerPetId: string, blockedPetId: string) =>
      `/blocking/unblock/${blockerPetId}/${blockedPetId}`,
    UNBLOCK_USER: (blockerUserId: string, blockedUserId: string) =>
      `/blocking/unblock-user/${blockerUserId}/${blockedUserId}`,
    STATUS: (blockerPetId: string, blockedPetId: string) =>
      `/blocking/status/${blockerPetId}/${blockedPetId}`,
    BLOCKED_PETS: (petId: string) => `/blocking/pets/${petId}/blocked`,
    BLOCKED_USERS: (userId: string) => `/blocking/users/${userId}/blocked`,
  },

  // Lost & Found
  LOST_FOUND: {
    CREATE_ALERT: '/alerts/lost',
    QUERY_ALERTS: '/alerts/lost',
    GET_ALERT: (id: string) => `/alerts/lost/${id}`,
    UPDATE_STATUS: (id: string) => `/alerts/lost/${id}/status`,
    INCREMENT_VIEW: (id: string) => `/alerts/lost/${id}/increment-view`,
    CREATE_SIGHTING: '/alerts/sightings',
    GET_SIGHTINGS: '/alerts/sightings',
  },

  // Live Streaming
  STREAMING: {
    CREATE_ROOM: '/live/createRoom',
    END_ROOM: '/live/endRoom',
    QUERY_ACTIVE: '/live/active',
    GET_STREAM: (id: string) => `/live/${id}`,
    JOIN_STREAM: (id: string) => `/live/${id}/join`,
    LEAVE_STREAM: (id: string) => `/live/${id}/leave`,
    SEND_REACTION: (id: string) => `/live/${id}/react`,
    SEND_CHAT: (id: string) => `/live/${id}/chat`,
    GET_CHAT: (id: string) => `/live/${id}/chat`,
    REPORT_STREAM: (id: string) => `/live/${id}/report`,
  },

  // Sync & Offline
  SYNC: {
    QUEUE: '/sync/queue',
    LAST_SYNC_TIME: '/sync/last-sync-time',
    SYNC_ACTION: '/sync/actions',
  },

  // Photos & Moderation
  PHOTOS: {
    LIST: '/photos',
    GET: (id: string) => `/photos/${id}`,
    CREATE: '/photos',
    CHECK_DUPLICATE: '/photos/check-duplicate',
    BY_STATUS: '/photos',
    BY_OWNER: '/photos',
    PUBLIC: '/photos/public',
    RELEASE_HELD: '/photos/release-held',
  },

  // Moderation
  MODERATION: {
    POLICY: '/admin/moderation/policy',
    TASKS: '/admin/moderation/tasks',
    TASK: (id: string) => `/admin/moderation/tasks/${id}`,
    TAKE_TASK: (id: string) => `/admin/moderation/tasks/${id}/take`,
    METRICS: '/admin/moderation/metrics',
  },

  // User Quotas
  QUOTAS: {
    GET: (userId: string) => `/users/${userId}/quota`,
    INCREMENT: (userId: string) => `/users/${userId}/quota/increment`,
  },

  // Audit Logs
  AUDIT: {
    LOGS: '/admin/audit-logs',
    CREATE: '/admin/audit-logs',
  },

  // Events
  EVENTS: {
    CREATE: '/events',
  },

  // Image Uploads
  IMAGES: {
    UPLOAD: '/uploads/images',
  },
} as const;

export function buildUrl(endpoint: string, params?: Record<string, unknown>): string {
  if (!params) return endpoint;

  const url = new URL(endpoint, 'http://dummy-base');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, String(v)));
      } else if (typeof value === 'object') {
        // For complex objects, stringify them
        url.searchParams.append(key, JSON.stringify(value));
      } else if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        // For primitives, convert to string safely
        url.searchParams.append(key, String(value));
      }
      // Skip other types (functions, symbols, etc.)
    }
  });

  return `${url.pathname}${url.search}`;
}
