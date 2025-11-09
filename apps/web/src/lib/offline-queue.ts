import { useStorage } from '@/hooks/use-storage';
import { createLogger } from './logger';

const logger = createLogger('offline-queue');

export interface QueuedAction {
  id: string;
  type: 'like' | 'pass' | 'message' | 'upload' | 'update_profile' | 'delete';
  payload: unknown;
  timestamp: number;
  retries: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'failed' | 'success';
}

export interface OfflineQueueState {
  actions: QueuedAction[];
  processing: boolean;
}

class OfflineQueueManager {
  private isOnline: boolean = navigator.onLine;
  private listeners = new Set<(online: boolean) => void>();
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') {
      return;
    }

    this.onlineHandler = () => {
      try {
        this.isOnline = true;
        this.notifyListeners(true);
        void this.processQueue();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('OfflineQueueManager online handler error', err);
      }
    };

    this.offlineHandler = () => {
      try {
        this.isOnline = false;
        this.notifyListeners(false);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('OfflineQueueManager offline handler error', err);
      }
    };

    try {
      window.addEventListener('online', this.onlineHandler);
      window.addEventListener('offline', this.offlineHandler);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('OfflineQueueManager setup event listeners error', err);
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
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('OfflineQueueManager cleanup event listeners error', err);
    }

    this.listeners.clear();
  }

  onNetworkChange(callback: (online: boolean) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(online: boolean) {
    this.listeners.forEach((callback) => callback(online));
  }

  async enqueue(
    action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries' | 'status'>
  ): Promise<string> {
    const id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queuedAction: QueuedAction = {
      ...action,
      id,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
    };

    const currentQueue = this.getQueue();
    currentQueue.actions.push(queuedAction);
    this.saveQueue(currentQueue);

    if (this.isOnline) {
      void this.processQueue();
    }

    return id;
  }

  private getQueue(): OfflineQueueState {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return { actions: [], processing: false };
    }
    try {
      const stored = localStorage.getItem('offline_queue');
      if (!stored) {
        return { actions: [], processing: false };
      }
      return JSON.parse(stored) as OfflineQueueState;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('OfflineQueueManager getQueue error', err);
      return { actions: [], processing: false };
    }
  }

  private saveQueue(state: OfflineQueueState): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem('offline_queue', JSON.stringify(state));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('OfflineQueueManager saveQueue error', err);
      // Silently fail - queue will be lost but app continues
    }
  }

  async processQueue() {
    if (!this.isOnline) return;

    const queue = this.getQueue();
    if (queue.processing || queue.actions.length === 0) return;

    queue.processing = true;
    this.saveQueue(queue);

    const pendingActions = queue.actions.filter(
      (a) => a.status === 'pending' || a.status === 'failed'
    );

    for (const action of pendingActions) {
      try {
        action.status = 'processing';
        this.saveQueue(queue);

        await this.executeAction(action);

        action.status = 'success';
        queue.actions = queue.actions.filter((a) => a.id !== action.id);
      } catch (error) {
        action.retries++;
        if (action.retries >= action.maxRetries) {
          action.status = 'failed';
        } else {
          action.status = 'pending';
        }
        logger.error(
          `Action ${action.id} failed (retry ${action.retries}/${action.maxRetries})`,
          error instanceof Error ? error : new Error(String(error))
        );
      }

      this.saveQueue(queue);
    }

    queue.processing = false;
    this.saveQueue(queue);
  }

  private async executeAction(action: QueuedAction): Promise<void> {
    return new Promise((resolve, _reject) => {
      setTimeout(() => {
        logger.debug(`Executing action: ${action.type}`, { actionId: action.id });
        resolve();
      }, 1000);
    });
  }

  getQueueStatus(): { pending: number; failed: number; total: number } {
    const queue = this.getQueue();
    const pending = queue.actions.filter(
      (a) => a.status === 'pending' || a.status === 'processing'
    ).length;
    const failed = queue.actions.filter((a) => a.status === 'failed').length;
    return { pending, failed, total: queue.actions.length };
  }

  async retryFailed(): Promise<void> {
    const queue = this.getQueue();
    queue.actions.forEach((action) => {
      if (action.status === 'failed') {
        action.status = 'pending';
        action.retries = 0;
      }
    });
    this.saveQueue(queue);
    await this.processQueue();
  }

  clearQueue(): void {
    this.saveQueue({ actions: [], processing: false });
  }

  isConnected(): boolean {
    return this.isOnline;
  }
}

export const offlineQueue = new OfflineQueueManager();

export function destroyOfflineQueue(): void {
  offlineQueue.destroy();
}

export const useOfflineQueue = () => {
  const [isOnline, _setIsOnline] = useStorage<boolean>('app-online-status', navigator.onLine);

  const enqueueAction = async (
    type: QueuedAction['type'],
    payload: unknown,
    maxRetries = 3
  ): Promise<string> => {
    return offlineQueue.enqueue({ type, payload, maxRetries });
  };

  const retryFailed = async () => {
    return offlineQueue.retryFailed();
  };

  const getStatus = () => {
    return offlineQueue.getQueueStatus();
  };

  return {
    isOnline,
    enqueueAction,
    retryFailed,
    getStatus,
    processQueue: () => {
      void offlineQueue.processQueue();
    },
    clearQueue: () => offlineQueue.clearQueue(),
  };
};
