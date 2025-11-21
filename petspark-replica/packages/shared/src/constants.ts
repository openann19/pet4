/**
 * Constants used across PETSPARK applications
 */

// App constants
export const APP_NAME = 'PETSPARK';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Pet Social Networking Platform';

// API constants
export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
export const API_TIMEOUT = 10000; // 10 seconds
export const API_RETRY_ATTEMPTS = 3;

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'petspark_auth_token',
  USER_DATA: 'petspark_user_data',
  THEME: 'petspark_theme',
  LANGUAGE: 'petspark_language',
  ONBOARDING_COMPLETED: 'petspark_onboarding_completed',
  NOTIFICATION_PERMISSION: 'petspark_notification_permission',
} as const;

// Pet constants
export const PET_TYPES = [
  'dog',
  'cat', 
  'bird',
  'rabbit',
  'hamster',
  'fish',
  'reptile',
  'other',
] as const;

export const PET_GENDERS = ['male', 'female', 'unknown'] as const;

export const MAX_PET_IMAGES = 10;
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Social constants
export const MAX_POST_LENGTH = 500;
export const MAX_COMMENT_LENGTH = 300;
export const MAX_MESSAGE_LENGTH = 1000;

// Pagination constants
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Distance constants (in meters)
export const DEFAULT_DISCOVERY_DISTANCE = 10000; // 10km
export const MAX_DISCOVERY_DISTANCE = 100000; // 100km

// Age constants (in years)
export const MIN_PET_AGE = 0;
export const MAX_PET_AGE = 30;

// UI constants
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Validation constants
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

// Notification constants
export const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
  FOLLOW: 'follow',
  MESSAGE: 'message',
  MATCH: 'match',
  SYSTEM: 'system',
} as const;

// Theme constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You need to be logged in to access this feature.',
  FORBIDDEN: 'You dont have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UPLOAD_ERROR: 'Failed to upload file. Please try again.',
  GENERIC_ERROR: 'An unexpected error occurred.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully!',
  PET_CREATED: 'Pet profile created successfully!',
  POST_CREATED: 'Post published successfully!',
  MESSAGE_SENT: 'Message sent successfully!',
  IMAGE_UPLOADED: 'Image uploaded successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
} as const;

// Regex patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  PHONE: /^\+?[\d\s-()]+$/,
  URL: /^https?:\/\/.+/,
} as const;

// Default values
export const DEFAULT_VALUES = {
  AVATAR: '/images/default-avatar.png',
  PET_IMAGE: '/images/default-pet.png',
  BIO: 'No bio provided.',
  LOCATION: 'Unknown location',
} as const;
