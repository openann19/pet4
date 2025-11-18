import { createLogger } from './logger';

const logger = createLogger('Retry');

export interface RetryOptions {
  attempts: number;
  delay: number;
  exponentialBackoff?: boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

function ensureError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return new Error(String((error as { message: unknown }).message));
  }

  return new Error('Retry operation failed');
}

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const { attempts, delay, exponentialBackoff = false, onRetry } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (_error) {
      lastError = ensureError(_error);

      if (attempt === attempts) {
        logger.error(`All ${attempts} attempts failed`, lastError);
        throw lastError;
      }

      const currentDelay = exponentialBackoff ? delay * Math.pow(2, attempt - 1) : delay;

      logger.warn(`Attempt ${String(attempt ?? '')}/${String(attempts ?? '')} failed, retrying in ${String(currentDelay ?? '')}ms`, {
        error: lastError.message,
        attempt,
        delay: currentDelay,
      });

      onRetry?.(lastError, attempt);

      await new Promise((resolve) => setTimeout(resolve, currentDelay));
    }
  }

  throw new Error('Retry operation failed without throwing last error');
}
