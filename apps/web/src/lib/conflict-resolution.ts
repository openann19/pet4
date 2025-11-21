/**
 * Conflict Resolution (Web)
 *
 * Handles data conflicts in offline-first architecture.
 * Features:
 * - Last-write-wins strategy
 * - Merge strategies for complex data
 * - User intervention for conflicts
 * - Conflict history and audit trail
 *
 * Location: apps/web/src/lib/conflict-resolution.ts
 */

import { createLogger } from './logger';

const logger = createLogger('conflict-resolution');

/**
 * Conflict resolution strategy
 */
export type ConflictResolutionStrategy =
  | 'last-write-wins'
  | 'first-write-wins'
  | 'merge'
  | 'user-intervention'
  | 'server-wins'
  | 'client-wins';

/**
 * Conflict metadata
 */
export interface ConflictMetadata {
  readonly clientVersion: number;
  readonly serverVersion: number;
  readonly clientTimestamp: number;
  readonly serverTimestamp: number;
  readonly clientId: string;
  readonly serverId: string;
}

/**
 * Conflict
 */
export interface Conflict<T = unknown> {
  readonly id: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly clientData: T;
  readonly serverData: T;
  readonly metadata: ConflictMetadata;
  readonly strategy: ConflictResolutionStrategy;
  readonly createdAt: number;
  readonly resolvedAt?: number;
  readonly resolvedBy?: string;
  readonly resolution?: T;
}

/**
 * Conflict resolution options
 */
export interface ConflictResolutionOptions {
  readonly strategy?: ConflictResolutionStrategy;
  readonly enableUserIntervention?: boolean;
  readonly enableAuditTrail?: boolean;
  readonly maxHistorySize?: number;
}

/**
 * Conflict resolution result
 */
export interface ConflictResolutionResult<T = unknown> {
  readonly resolved: boolean;
  readonly data?: T;
  readonly requiresUserIntervention?: boolean;
  readonly conflict?: Conflict<T>;
}

/**
 * Conflict history entry
 */
export interface ConflictHistoryEntry<T = unknown> {
  readonly conflict: Conflict<T>;
  readonly resolution: T;
  readonly resolvedAt: number;
  readonly resolvedBy: string;
  readonly strategy: ConflictResolutionStrategy;
}

/**
 * Conflict resolver
 */
export class ConflictResolver<T = unknown> {
  private readonly strategy: ConflictResolutionStrategy;
  private readonly enableUserIntervention: boolean;
  private readonly enableAuditTrail: boolean;
  private readonly maxHistorySize: number;
  private readonly history: ConflictHistoryEntry<T>[] = [];

  constructor(options: ConflictResolutionOptions = {}) {
    this.strategy = options.strategy ?? 'last-write-wins';
    this.enableUserIntervention = options.enableUserIntervention ?? false;
    this.enableAuditTrail = options.enableAuditTrail ?? true;
    this.maxHistorySize = options.maxHistorySize ?? 100;
  }

  /**
   * Resolve conflict
   */
  resolve(conflict: Conflict<T>): ConflictResolutionResult<T> {
    logger.debug('Resolving conflict', {
      id: conflict.id,
      resourceType: conflict.resourceType,
      strategy: this.strategy,
    });

    let resolved = false;
    let data: T | undefined;
    let requiresUserIntervention = false;

    switch (this.strategy) {
      case 'last-write-wins':
        data = this.resolveLastWriteWins(conflict);
        resolved = true;
        break;

      case 'first-write-wins':
        data = this.resolveFirstWriteWins(conflict);
        resolved = true;
        break;

      case 'server-wins':
        data = conflict.serverData;
        resolved = true;
        break;

      case 'client-wins':
        data = conflict.clientData;
        resolved = true;
        break;

      case 'merge':
        try {
          data = this.resolveMerge(conflict);
          resolved = true;
        } catch (error) {
          logger.warn('Merge resolution failed, falling back to user intervention', {
            error: error instanceof Error ? error : new Error(String(error)),
          });
          requiresUserIntervention = true;
        }
        break;

      case 'user-intervention':
        requiresUserIntervention = true;
        break;

      default:
        logger.warn('Unknown conflict resolution strategy', { strategy: this.strategy });
        requiresUserIntervention = true;
    }

    if (resolved && data !== undefined) {
      this.addToHistory(conflict, data);
    }

    return {
      resolved,
      data,
      requiresUserIntervention,
      conflict: requiresUserIntervention ? conflict : undefined,
    };
  }

  /**
   * Resolve using last-write-wins strategy
   */
  private resolveLastWriteWins<T>(conflict: Conflict<T>): T {
    const clientTime = conflict.metadata.clientTimestamp;
    const serverTime = conflict.metadata.serverTimestamp;

    if (clientTime > serverTime) {
      logger.debug('Client data is newer - using client data', {
        clientTime,
        serverTime,
      });
      return conflict.clientData;
    } else {
      logger.debug('Server data is newer - using server data', {
        clientTime,
        serverTime,
      });
      return conflict.serverData;
    }
  }

  /**
   * Resolve using first-write-wins strategy
   */
  private resolveFirstWriteWins<T>(conflict: Conflict<T>): T {
    const clientTime = conflict.metadata.clientTimestamp;
    const serverTime = conflict.metadata.serverTimestamp;

    if (clientTime < serverTime) {
      logger.debug('Client data is older - using client data', {
        clientTime,
        serverTime,
      });
      return conflict.clientData;
    } else {
      logger.debug('Server data is older - using server data', {
        clientTime,
        serverTime,
      });
      return conflict.serverData;
    }
  }

  /**
   * Resolve using merge strategy
   */
  private resolveMerge<T>(conflict: Conflict<T>): T {
    // Simple merge: prefer non-null values from server, fallback to client
    if (typeof conflict.clientData === 'object' && conflict.clientData !== null) {
      if (typeof conflict.serverData === 'object' && conflict.serverData !== null) {
        // Merge objects
        return {
          ...conflict.clientData,
          ...conflict.serverData,
        } as T;
      }
    }

    // For primitives or incompatible types, fall back to last-write-wins
    logger.warn('Cannot merge incompatible types, falling back to last-write-wins');
    return this.resolveLastWriteWins(conflict);
  }

  /**
   * Add to history
   */
  private addToHistory(conflict: Conflict<T>, resolution: T): void {
    if (!this.enableAuditTrail) {
      return;
    }

    const entry: ConflictHistoryEntry<T> = {
      conflict,
      resolution,
      resolvedAt: Date.now(),
      resolvedBy: 'system',
      strategy: this.strategy,
    };

    this.history.push(entry);

    // Trim history if exceeds max size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    logger.debug('Conflict resolution added to history', {
      conflictId: conflict.id,
      strategy: this.strategy,
    });
  }

  /**
   * Get conflict history
   */
  getHistory(): readonly ConflictHistoryEntry<T>[] {
    return [...this.history];
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history.length = 0;
    logger.debug('Conflict history cleared');
  }
}

/**
 * Create conflict resolver
 */
export function createConflictResolver<T = unknown>(
  options: ConflictResolutionOptions = {}
): ConflictResolver<T> {
  return new ConflictResolver<T>(options);
}

/**
 * Resolve conflict with user intervention
 */
export function resolveWithUserIntervention<T>(
  conflict: Conflict<T>,
  _onResolve: (data: T) => Promise<void>
): Promise<ConflictResolutionResult<T>> {
  logger.debug('Requesting user intervention for conflict', {
    id: conflict.id,
    resourceType: conflict.resourceType,
  });

  // This would typically show a UI dialog to the user
  // For now, we'll return a result indicating user intervention is required
  return Promise.resolve({
    resolved: false,
    requiresUserIntervention: true,
    conflict,
  });
}

/**
 * Create conflict from data
 */
export function createConflict<T>(
  resourceType: string,
  resourceId: string,
  clientData: T,
  serverData: T,
  clientMetadata: Omit<ConflictMetadata, 'serverVersion' | 'serverTimestamp' | 'serverId'>,
  serverMetadata: Omit<ConflictMetadata, 'clientVersion' | 'clientTimestamp' | 'clientId'>,
  strategy: ConflictResolutionStrategy = 'last-write-wins'
): Conflict<T> {
  const metadata: ConflictMetadata = {
    clientVersion: clientMetadata.clientVersion,
    serverVersion: serverMetadata.serverVersion,
    clientTimestamp: clientMetadata.clientTimestamp,
    serverTimestamp: serverMetadata.serverTimestamp,
    clientId: clientMetadata.clientId,
    serverId: serverMetadata.serverId,
  };

  return {
    id: `conflict-${resourceType}-${resourceId}-${Date.now()}`,
    resourceType,
    resourceId,
    clientData,
    serverData,
    metadata,
    strategy,
    createdAt: Date.now(),
  };
}
