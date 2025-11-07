'use client'

import { createLogger } from '@/lib/logger'

const logger = createLogger('OfflineSwipeQueue')

export interface SwipeAction {
  petId: string
  targetId: string
  action: 'like' | 'pass'
  timestamp: string
}

export interface OfflineSwipeQueue {
  enqueue(action: SwipeAction): Promise<void>
  dequeue(): Promise<SwipeAction | null>
  peek(): Promise<SwipeAction | null>
  clear(): Promise<void>
  size(): Promise<number>
  isEmpty(): Promise<boolean>
}

class LocalStorageSwipeQueue implements OfflineSwipeQueue {
  private readonly storageKey = 'swipe-offline-queue'

  async enqueue(action: SwipeAction): Promise<void> {
    try {
      const queue = await this.getQueue()
      queue.push(action)
      await this.saveQueue(queue)
    } catch (error) {
      logger.error('Failed to enqueue swipe action', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async dequeue(): Promise<SwipeAction | null> {
    try {
      const queue = await this.getQueue()
      if (queue.length === 0) {
        return null
      }
      const action = queue.shift()
      await this.saveQueue(queue)
      return action ? action : null
    } catch (error) {
      logger.error('Failed to dequeue swipe action', error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }

  async peek(): Promise<SwipeAction | null> {
    try {
      const queue = await this.getQueue()
      return queue.length > 0 ? queue[0]! : null
    } catch (error) {
      logger.error('Failed to peek swipe queue', error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.removeItem(this.storageKey)
    } catch (error) {
      logger.error('Failed to clear swipe queue', error instanceof Error ? error : new Error(String(error)))
    }
  }

  async size(): Promise<number> {
    try {
      const queue = await this.getQueue()
      return queue.length
    } catch (error) {
      logger.error('Failed to get queue size', error instanceof Error ? error : new Error(String(error)))
      return 0
    }
  }

  async isEmpty(): Promise<boolean> {
    const size = await this.size()
    return size === 0
  }

  private async getQueue(): Promise<SwipeAction[]> {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) {
        return []
      }
      const parsed = JSON.parse(stored) as SwipeAction[]
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      logger.warn('Failed to parse swipe queue', error instanceof Error ? error : new Error(String(error)))
      return []
    }
  }

  private async saveQueue(queue: SwipeAction[]): Promise<void> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(queue))
    } catch (error) {
      logger.error('Failed to save swipe queue', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }
}

export function createOfflineSwipeQueue(): OfflineSwipeQueue {
  return new LocalStorageSwipeQueue()
}

export const offlineSwipeQueue = createOfflineSwipeQueue()

