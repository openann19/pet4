/**
 * Stable Message Reference Hook (WCAG 2.4.8)
 *
 * Hook to ensure message references are stable for screen readers.
 *
 * Location: apps/web/src/hooks/use-stable-message-reference.ts
 */

import { useMemo } from 'react';
import {
  getStableMessageReference,
  type StableMessageReference,
  createStableMessageReference,
  createStableMessageReferenceRelative,
} from '@/core/a11y/fixed-references';

/**
 * Options for stable message reference hook
 */
export interface UseStableMessageReferenceOptions {
  readonly useRelative?: boolean;
  readonly messageId: string;
  readonly timestamp: string | Date;
  readonly senderName: string;
  readonly content?: string;
}

/**
 * Hook to get stable message reference
 */
export function useStableMessageReference(
  options: UseStableMessageReferenceOptions
): StableMessageReference {
  const { useRelative = false, messageId, timestamp, senderName, content } = options;

  return useMemo(() => {
    return getStableMessageReference(messageId, timestamp, senderName, content, useRelative);
  }, [messageId, timestamp, senderName, content, useRelative]);
}

/**
 * Hook to create stable message reference (non-memoized)
 */
export function useStableMessageReferenceDirect(
  messageId: string,
  timestamp: string | Date,
  senderName: string,
  content?: string,
  useRelative = false
): StableMessageReference {
  return useMemo(() => {
    return useRelative
      ? createStableMessageReferenceRelative(messageId, timestamp, senderName, content)
      : createStableMessageReference(messageId, timestamp, senderName, content);
  }, [messageId, timestamp, senderName, content, useRelative]);
}
