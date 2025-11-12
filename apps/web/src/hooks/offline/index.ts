/**
 * Offline Hooks Index
 *
 * Exports offline-first architecture:
 * - Offline queue with retry and persistence
 * - Optimistic UI updates with rollback
 *
 * Location: apps/web/src/hooks/offline/index.ts
 */

export * from './use-offline-queue'
export * from './use-optimistic'
