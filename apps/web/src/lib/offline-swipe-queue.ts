'use client';

import { createLogger } from '@/lib/logger';

const logger = createLogger('OfflineSwipeQueue');

export interface SwipeAction {
  petId: string;
  targetId: string;
  action: 'like' | 'pass';
  timestamp: string;
}

export interface OfflineSwipeQueue {
  enqueue(action: SwipeAction): void;
  dequeue(): SwipeAction | null;
  peek(): SwipeAction | null;
  clear(): void;
  size(): number;
  isEmpty(): boolean;
}

class LocalStorageSwipeQueue implements OfflineSwipeQueue {
  private readonly storageKey = 'swipe-offline-queue';

  enqueue(action: SwipeAction): void {
    try {
      const queue = this.getQueue();
      queue.push(action);
      this.saveQueue(queue);
    } catch (error) {
      logger.error(
        'Failed to enqueue swipe action',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  dequeue(): SwipeAction | null {
    try {
      const queue = this.getQueue();
      if (queue.length === 0) {
        return null;
      }
      const action = queue.shift();
      this.saveQueue(queue);
      return action ? action : null;
    } catch (error) {
      logger.error(
        'Failed to dequeue swipe action',
        error instanceof Error ? error : new Error(String(error))
      );
      return null;
    }
  }

  peek(): SwipeAction | null {
    try {
      const queue = this.getQueue();
      return queue.length > 0 ? queue[0]! : null;
    } catch (error) {
      logger.error(
        'Failed to peek swipe queue',
        error instanceof Error ? error : new Error(String(error))
      );
      return null;
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      logger.error(
        'Failed to clear swipe queue',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  size(): number {
    try {
      const queue = this.getQueue();
      return queue.length;
    } catch (error) {
      logger.error(
        'Failed to get queue size',
        error instanceof Error ? error : new Error(String(error))
      );
      return 0;
    }
  }

  isEmpty(): boolean {
    const queueSize = this.size();
    return queueSize === 0;
  }

  private getQueue(): SwipeAction[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return [];
      }
      const parsed = JSON.parse(stored) as SwipeAction[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      logger.warn(
        'Failed to parse swipe queue',
        error instanceof Error ? error : new Error(String(error))
      );
      return [];
    }
  }

  private saveQueue(queue: SwipeAction[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(queue));
    } catch (error) {
      logger.error(
        'Failed to save swipe queue',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
}

export function createOfflineSwipeQueue(): OfflineSwipeQueue {
  return new LocalStorageSwipeQueue();
}

export const offlineSwipeQueue = createOfflineSwipeQueue();
