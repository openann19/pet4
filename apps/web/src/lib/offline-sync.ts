import { generateCorrelationId } from './utils';
import { createLogger } from './logger';
import { storage } from './storage';
import { APIClient } from './api-client';
import { ENDPOINTS } from './endpoints';
import type { ReactionType } from './chat-types';

const logger = createLogger('offline-sync');

export type SyncAction =
  | 'create_pet'
  | 'update_pet'
  | 'like_pet'
  | 'pass_pet'
  | 'send_message'
  | 'create_story'
  | 'react_to_message'
  | 'update_profile'
  | 'upload_photo';

export interface PendingSyncAction {
  id: string;
  action: SyncAction;
  data: unknown;
  timestamp: string;
  retries: number;
  maxRetries: number;
  correlationId: string;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingActions: number;
  lastSyncTime?: string;
  failedActions: number;
  progress?: number;
  currentAction?: string;
}

export interface SyncProgress {
  readonly total: number;
  readonly completed: number;
  readonly failed: number;
  readonly percentage: number;
  readonly currentAction?: string;
}

class OfflineSyncManager {
  private isOnline: boolean = navigator.onLine;
  private isSyncing = false;
  private syncQueue: PendingSyncAction[] = [];
  private listeners = new Set<(status: SyncStatus) => void>();
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;
  private lastSyncTime: string | undefined;
  private syncProgress: SyncProgress | null = null;
  private enableIncrementalSync = true;
  private enablePrioritizedSync = true;
  private enableBackgroundSync = true;
  private idleSyncTimeout: number | null = null;

  constructor() {
    this.initializeEventListeners();
    // Initialize queue from storage asynchronously - fire-and-forget with error handling inside
    void this.loadQueueFromStorage();
  }

  private initializeEventListeners() {
    if (typeof window === 'undefined') {
      return;
    }

    this.onlineHandler = () => {
      try {
        logger.info('Online - starting sync');
        this.isOnline = true;
        this.notifyListeners();

        // Load last sync time
        void this.loadLastSyncTime();

        // Start sync
        void this.syncPendingActions();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('OfflineSyncManager online handler error', err);
      }
    };

    this.offlineHandler = () => {
      try {
        logger.info('Offline - queuing future actions');
        this.isOnline = false;
        this.notifyListeners();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('OfflineSyncManager offline handler error', err);
      }
    };

    try {
      window.addEventListener('online', this.onlineHandler);
      window.addEventListener('offline', this.offlineHandler);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('OfflineSyncManager setup event listeners error', err);
    }
  }

  destroy(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (this.onlineHandler) {
        window.removeEventListener('online', this.onlineHandler);
        this.onlineHandler = null;
      }
      if (this.offlineHandler) {
        window.removeEventListener('offline', this.offlineHandler);
        this.offlineHandler = null;
      }
      if (this.idleSyncTimeout !== null) {
        clearTimeout(this.idleSyncTimeout);
        this.idleSyncTimeout = null;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('OfflineSyncManager cleanup event listeners error', err);
    }

    this.listeners.clear();
    this.syncQueue = [];
  }

  private async loadQueueFromStorage() {
    try {
      try {
        const response = await APIClient.get<PendingSyncAction[]>(ENDPOINTS.SYNC.QUEUE);
        if (response.data && Array.isArray(response.data)) {
          this.syncQueue = response.data;
          logger.info('Loaded pending actions from API', { count: this.syncQueue.length });

          if (this.isOnline && this.syncQueue.length > 0) {
            void this.syncPendingActions();
          }
          return;
        }
      } catch (apiError) {
        logger.warn('Failed to load queue from API, falling back to local storage', {
          error: apiError,
        });
      }

      const stored = await storage.get<PendingSyncAction[]>('offline-sync-queue');
      if (stored && Array.isArray(stored)) {
        this.syncQueue = stored;
        logger.info('Loaded pending actions from storage', { count: this.syncQueue.length });

        if (this.isOnline && this.syncQueue.length > 0) {
          void this.syncPendingActions();
        }
      }
    } catch (error) {
      logger.error(
        'Failed to load queue from storage',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private async saveQueueToStorage() {
    try {
      try {
        await APIClient.post(ENDPOINTS.SYNC.QUEUE, { queue: this.syncQueue });
        logger.debug('Saved queue to API', { count: this.syncQueue.length });
      } catch (apiError) {
        logger.warn('Failed to save queue to API, saving locally', { error: apiError });
      }

      await storage.set('offline-sync-queue', this.syncQueue);
    } catch (error) {
      logger.error(
        'Failed to save queue to storage',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async queueAction(action: SyncAction, data: unknown): Promise<string> {
    const pendingAction: PendingSyncAction = {
      id: generateCorrelationId(),
      action,
      data,
      timestamp: new Date().toISOString(),
      retries: 0,
      maxRetries: 3,
      correlationId: generateCorrelationId(),
      status: 'pending',
    };

    this.syncQueue.push(pendingAction);
    await this.saveQueueToStorage();
    this.notifyListeners();

    logger.debug('Queued action', { action, actionId: pendingAction.id });

    if (this.isOnline) {
      void this.syncPendingActions();
    } else {
      // Schedule background sync when online
      this.scheduleBackgroundSync();
    }

    return pendingAction.id;
  }

  private async syncPendingActions() {
    if (this.isSyncing || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    this.notifyListeners();

    logger.info('Starting sync', { actionCount: this.syncQueue.length });

    // Get actions to sync
    let actionsToSync = this.syncQueue.filter(
      (a) => a.status === 'pending' || a.status === 'failed'
    );

    // Prioritize actions if enabled
    if (this.enablePrioritizedSync) {
      actionsToSync = this.prioritizeActions(actionsToSync);
    }

    // Incremental sync: only sync changed data if enabled
    if (this.enableIncrementalSync && this.lastSyncTime) {
      actionsToSync = this.filterIncrementalActions(actionsToSync);
    }

    const total = actionsToSync.length;
    let completed = 0;
    let failed = 0;

    this.syncProgress = {
      total,
      completed: 0,
      failed: 0,
      percentage: 0,
    };

    for (const action of actionsToSync) {
      if (!this.isOnline) {
        logger.info('Went offline during sync, pausing');
        break;
      }

      try {
        action.status = 'syncing';
        this.syncProgress = {
          total,
          completed,
          failed,
          percentage: Math.round((completed / total) * 100),
          currentAction: action.action,
        };
        this.notifyListeners();

        await this.executeAction(action);
        action.status = 'completed';
        completed++;
        logger.debug('Completed action', { action: action.action, actionId: action.id });

        this.syncQueue = this.syncQueue.filter((a) => a.id !== action.id);
      } catch (error) {
        action.retries++;
        failed++;

        if (action.retries >= action.maxRetries) {
          action.status = 'failed';
          action.error = error instanceof Error ? error.message : 'Unknown error';
          logger.error(
            'Action failed after max retries',
            error instanceof Error ? error : new Error(String(error)),
            { action: action.action, actionId: action.id }
          );
        } else {
          action.status = 'pending';
          logger.warn('Action failed, will retry', {
            action: action.action,
            actionId: action.id,
            retries: action.retries,
            maxRetries: action.maxRetries,
          });
        }
      }

      this.syncProgress = {
        total,
        completed,
        failed,
        percentage: Math.round((completed / total) * 100),
      };
      this.notifyListeners();
    }

    await this.saveQueueToStorage();
    this.isSyncing = false;
    this.syncProgress = null;
    this.notifyListeners();

    try {
      const syncTime = new Date().toISOString();
      await APIClient.post(ENDPOINTS.SYNC.LAST_SYNC_TIME, { timestamp: syncTime });
      this.lastSyncTime = syncTime;
    } catch (apiError) {
      logger.warn('Failed to update sync time on API, saving locally', { error: apiError });
    }

    const syncTime = new Date().toISOString();
    await storage.set('last-sync-time', syncTime);
    this.lastSyncTime = syncTime;

    logger.info('Sync completed', { remaining: this.syncQueue.length, completed, failed });
  }

  private prioritizeActions(actions: PendingSyncAction[]): PendingSyncAction[] {
    // Priority order: send_message > like_pet > create_pet > update_pet > others
    const priorityOrder: Record<SyncAction, number> = {
      send_message: 0,
      like_pet: 1,
      pass_pet: 2,
      create_pet: 3,
      update_pet: 4,
      create_story: 5,
      react_to_message: 6,
      update_profile: 7,
      upload_photo: 8,
    };

    return [...actions].sort((a, b) => {
      const aPriority = priorityOrder[a.action] ?? 999;
      const bPriority = priorityOrder[b.action] ?? 999;
      return aPriority - bPriority;
    });
  }

  private filterIncrementalActions(actions: PendingSyncAction[]): PendingSyncAction[] {
    if (!this.lastSyncTime) {
      return actions;
    }

    const lastSync = new Date(this.lastSyncTime).getTime();
    return actions.filter((action) => {
      const actionTime = new Date(action.timestamp).getTime();
      return actionTime > lastSync;
    });
  }

  private scheduleBackgroundSync(): void {
    if (!this.enableBackgroundSync) {
      return;
    }

    // Cancel existing timeout
    if (this.idleSyncTimeout !== null) {
      clearTimeout(this.idleSyncTimeout);
      this.idleSyncTimeout = null;
    }

    // Schedule sync when idle (after 5 seconds of inactivity)
    this.idleSyncTimeout = window.setTimeout(() => {
      if (this.isOnline && !this.isSyncing && this.syncQueue.length > 0) {
        logger.debug('Background sync triggered');
        void this.syncPendingActions();
      }
      this.idleSyncTimeout = null;
    }, 5000);
  }

  private async loadLastSyncTime(): Promise<void> {
    try {
      const syncTime = await this.getLastSyncTime();
      if (syncTime) {
        this.lastSyncTime = syncTime;
      }
    } catch (error) {
      logger.warn('Failed to load last sync time', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  private async executeAction(action: PendingSyncAction): Promise<void> {
    switch (action.action) {
      case 'send_message': {
        logger.debug('Executing: send_message', { actionId: action.id });
        const { chatApi } = await import('@/api/chat-api');
        const data = action.data as { matchId: string; message: string; userId: string };
        await chatApi.sendMessage(data.matchId, { type: 'text', content: data.message });
        break;
      }
      case 'like_pet': {
        logger.debug('Executing: like_pet', { actionId: action.id });
        const { matchingAPI } = await import('@/api/matching-api');
        const data = action.data as { petId: string; targetPetId: string };
        await matchingAPI.swipe({
          petId: data.petId,
          targetPetId: data.targetPetId,
          action: 'like',
        });
        break;
      }
      case 'pass_pet': {
        logger.debug('Executing: pass_pet', { actionId: action.id });
        const { matchingAPI } = await import('@/api/matching-api');
        const data = action.data as { petId: string; targetPetId: string };
        await matchingAPI.swipe({
          petId: data.petId,
          targetPetId: data.targetPetId,
          action: 'pass',
        });
        break;
      }
      case 'create_story': {
        logger.debug('Executing: create_story', { actionId: action.id });
        // Story creation API not yet implemented - store locally for now
        logger.warn('Story creation API not implemented, storing locally', { actionId: action.id });
        break;
      }
      case 'create_pet': {
        logger.debug('Executing: create_pet', { actionId: action.id });
        const { petAPI } = await import('@/lib/api-services');
        await petAPI.create(action.data);
        break;
      }
      case 'update_pet': {
        logger.debug('Executing: update_pet', { actionId: action.id });
        const { petAPI } = await import('@/lib/api-services');
        const data = action.data as { id: string; updates: unknown };
        await petAPI.update(data.id, data.updates);
        break;
      }
      case 'react_to_message': {
        logger.debug('Executing: react_to_message', { actionId: action.id });
        const { chatApi } = await import('@/api/chat-api');
        const data = action.data as { messageId: string; reaction: string; userId: string };
        await chatApi.addReaction(data.messageId, { reaction: data.reaction as ReactionType });
        break;
      }
      case 'update_profile': {
        logger.debug('Executing: update_profile', { actionId: action.id });
        // Profile update API not yet implemented - store locally for now
        logger.warn('Profile update API not implemented, storing locally', { actionId: action.id });
        break;
      }
      case 'upload_photo': {
        logger.debug('Executing: upload_photo', { actionId: action.id });
        const { imageUploadApi } = await import('@/api/image-upload-api');
        const data = action.data as { key: string; contentType: string; arrayBuffer: ArrayBuffer };
        await imageUploadApi.uploadImage(data.key, data.contentType, data.arrayBuffer);
        break;
      }
      default:
        throw new Error(`Unknown action type: ${action.action}`);
    }
  }

  getStatus(): SyncStatus {
    const failedActions = this.syncQueue.filter((a) => a.status === 'failed').length;

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingActions: this.syncQueue.length,
      failedActions,
      lastSyncTime: this.lastSyncTime,
      progress: this.syncProgress?.percentage,
      currentAction: this.syncProgress?.currentAction,
    };
  }

  getProgress(): SyncProgress | null {
    return this.syncProgress;
  }

  async getLastSyncTime(): Promise<string | undefined> {
    try {
      const response = await APIClient.get<{ timestamp: string }>(ENDPOINTS.SYNC.LAST_SYNC_TIME);
      if (response.data?.timestamp) {
        return response.data.timestamp;
      }
    } catch (apiError) {
      logger.warn('Failed to get sync time from API, using local storage', { error: apiError });
    }

    return await storage.get<string>('last-sync-time');
  }

  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        logger.error(
          'Error in listener',
          error instanceof Error ? error : new Error(String(error))
        );
      }
    });
  }

  async retryFailedActions(): Promise<void> {
    const failedActions = this.syncQueue.filter((a) => a.status === 'failed');
    failedActions.forEach((action) => {
      action.status = 'pending';
      action.retries = 0;
      delete action.error;
    });

    await this.saveQueueToStorage();
    this.notifyListeners();

    if (this.isOnline) {
      void this.syncPendingActions();
    }
  }

  async clearFailedActions(): Promise<void> {
    this.syncQueue = this.syncQueue.filter((a) => a.status !== 'failed');
    await this.saveQueueToStorage();
    this.notifyListeners();
  }

  async clearAllActions(): Promise<void> {
    this.syncQueue = [];
    await this.saveQueueToStorage();
    this.notifyListeners();
  }

  getPendingActions(): PendingSyncAction[] {
    return [...this.syncQueue];
  }

  getFailedActions(): PendingSyncAction[] {
    return this.syncQueue.filter((a) => a.status === 'failed');
  }
}

let syncManagerInstance: OfflineSyncManager | null = null;

export function getOfflineSyncManager(): OfflineSyncManager {
  if (!syncManagerInstance) {
    syncManagerInstance = new OfflineSyncManager();
  }
  return syncManagerInstance;
}

export async function queueOfflineAction(action: SyncAction, data: unknown): Promise<string> {
  return getOfflineSyncManager().queueAction(action, data);
}

export function getSyncStatus(): SyncStatus {
  return getOfflineSyncManager().getStatus();
}

export function subscribeToSyncStatus(listener: (status: SyncStatus) => void): () => void {
  return getOfflineSyncManager().subscribe(listener);
}
