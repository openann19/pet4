/**
 * Lazy-loaded exports for heavy streaming components
 * These components are code-split to reduce initial bundle size
 */

import { lazy } from 'react';
import type { LiveStreamRoom as LiveStreamRoomType } from './LiveStreamRoom';

/**
 * LiveStreamRoom - Heavy component with video streaming capabilities
 * Lazy loaded to reduce initial bundle size
 *
 * Usage:
 * ```tsx
 * import { LiveStreamRoom } from '@/components/streaming/lazy-exports'
 * import { Suspense } from 'react'
 *
 * <Suspense fallback={<LoadingSpinner />}>
 *   <LiveStreamRoom streamId={id} isHost={true} onClose={handleClose} />
 * </Suspense>
 * ```
 */
export const LiveStreamRoom = lazy(() =>
  import('./LiveStreamRoom').then((module) => ({
    default: module.LiveStreamRoom,
  })) as Promise<{ default: typeof LiveStreamRoomType }>
);
