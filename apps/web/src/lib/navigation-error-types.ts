export type NavigationErrorType =
  | 'chunk-load-error'
  | 'hydration-mismatch'
  | '404'
  | '500'
  | 'data-fetch-error'
  | 'unknown';

export interface NavigationError {
  type: NavigationErrorType;
  error: Error;
  fromPath: string;
  toPath: string;
  timestamp: string;
  componentStack?: string;
  metadata?: Record<string, unknown>;
}

export interface NavigationErrorReport {
  error: NavigationError;
  userAgent: string;
  url: string;
  timestamp: string;
}
