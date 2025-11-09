/**
 * Fixed Reference Points Utilities (WCAG 2.4.8)
 *
 * Ensures content references are stable and don't change unexpectedly:
 * - Message IDs remain consistent
 * - Timestamps have stable format
 * - Screen reader references don't change on re-render
 *
 * Location: apps/web/src/core/a11y/fixed-references.ts
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('fixed-references');

/**
 * Stable message reference
 */
export interface StableMessageReference {
  readonly stableId: string;
  readonly stableTimestamp: string;
  readonly ariaLabel: string;
  readonly ariaDescription?: string;
}

/**
 * Generate stable ID from message ID
 */
export function generateStableId(messageId: string): string {
  // Ensure ID is stable and doesn't change
  // Use message ID as base, add prefix for clarity
  return `message-${messageId}`;
}

/**
 * Format timestamp for stable reference
 */
export function formatStableTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

  if (Number.isNaN(date.getTime())) {
    logger.warn('Invalid timestamp', new Error('Invalid date'), { timestamp });
    return 'Invalid date';
  }

  // Format: "January 15, 2024 at 3:45 PM"
  // This format is stable and doesn't change on re-render
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  return date.toLocaleDateString('en-US', options);
}

/**
 * Format relative timestamp for stable reference
 */
export function formatStableRelativeTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

  if (Number.isNaN(date.getTime())) {
    logger.warn('Invalid timestamp', new Error('Invalid date'), { timestamp });
    return 'Invalid date';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Use stable format that doesn't change frequently
  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    // Use absolute date for older messages
    return formatStableTimestamp(date);
  }
}

/**
 * Create stable message reference
 */
export function createStableMessageReference(
  messageId: string,
  timestamp: string | Date,
  senderName: string,
  content?: string
): StableMessageReference {
  const stableId = generateStableId(messageId);
  const stableTimestamp = formatStableTimestamp(timestamp);
  const ariaLabel = `Message from ${senderName} at ${stableTimestamp}`;
  const ariaDescription = content ? `Message content: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}` : undefined;

  return {
    stableId,
    stableTimestamp,
    ariaLabel,
    ariaDescription,
  };
}

/**
 * Create stable message reference with relative timestamp
 */
export function createStableMessageReferenceRelative(
  messageId: string,
  timestamp: string | Date,
  senderName: string,
  content?: string
): StableMessageReference {
  const stableId = generateStableId(messageId);
  const stableTimestamp = formatStableRelativeTimestamp(timestamp);
  const ariaLabel = `Message from ${senderName}, ${stableTimestamp}`;
  const ariaDescription = content ? `Message content: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}` : undefined;

  return {
    stableId,
    stableTimestamp,
    ariaLabel,
    ariaDescription,
  };
}

/**
 * Memoize stable references to prevent unnecessary re-renders
 */
const referenceCache = new Map<string, StableMessageReference>();

/**
 * Get or create stable message reference (memoized)
 */
export function getStableMessageReference(
  messageId: string,
  timestamp: string | Date,
  senderName: string,
  content?: string,
  useRelative = false
): StableMessageReference {
  const cacheKey = `${messageId}-${typeof timestamp === 'string' ? timestamp : timestamp.getTime()}-${senderName}`;

  if (referenceCache.has(cacheKey)) {
    return referenceCache.get(cacheKey)!;
  }

  const reference = useRelative
    ? createStableMessageReferenceRelative(messageId, timestamp, senderName, content)
    : createStableMessageReference(messageId, timestamp, senderName, content);

  referenceCache.set(cacheKey, reference);

  return reference;
}

/**
 * Clear reference cache (useful for testing)
 */
export function clearReferenceCache(): void {
  referenceCache.clear();
}
