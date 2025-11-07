import { useStorage } from '@/hooks/useStorage'
import { createLogger } from './logger'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('offline-queue')

export interface QueuedAction {
  id: string
  type: 'like' | 'pass' | 'message' | 'upload' | 'update_profile' | 'delete'
  payload: unknown
  timestamp: number
  retries: number
  maxRetries: number
  status: 'pending' | 'processing' | 'failed' | 'success'
}

export interface OfflineQueueState {
  actions: QueuedAction[]
  processing: boolean
}

class OfflineQueueManager {
  private isOnline: boolean = navigator.onLine
  private listeners: Set<(online: boolean) => void> = new Set()

  constructor() {
    this.init()
  }

  private init() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.notifyListeners(true)
      this.processQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.notifyListeners(false)
    })
  }

  onNetworkChange(callback: (online: boolean) => void) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notifyListeners(online: boolean) {
    this.listeners.forEach(callback => { callback(online); })
  }

  async enqueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries' | 'status'>): Promise<string> {
    const id = `action_${String(Date.now() ?? '')}_${String(Math.random().toString(36).substr(2, 9) ?? '')}`
    const queuedAction: QueuedAction = {
      ...action,
      id,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending'
    }

    const currentQueue = await this.getQueue()
    currentQueue.actions.push(queuedAction)
    await this.saveQueue(currentQueue)

    if (isTruthy(this.isOnline)) {
      this.processQueue()
    }

    return id
  }

  private async getQueue(): Promise<OfflineQueueState> {
    const stored = localStorage.getItem('offline_queue')
    if (!stored) {
      return { actions: [], processing: false }
    }
    return JSON.parse(stored)
  }

  private async saveQueue(state: OfflineQueueState): Promise<void> {
    localStorage.setItem('offline_queue', JSON.stringify(state))
  }

  async processQueue() {
    if (!this.isOnline) return

    const queue = await this.getQueue()
    if (queue.processing || queue.actions.length === 0) return

    queue.processing = true
    await this.saveQueue(queue)

    const pendingActions = queue.actions.filter(a => a.status === 'pending' || a.status === 'failed')
    
    for (const action of pendingActions) {
      try {
        action.status = 'processing'
        await this.saveQueue(queue)

        await this.executeAction(action)

        action.status = 'success'
        queue.actions = queue.actions.filter(a => a.id !== action.id)
      } catch (error) {
        action.retries++
        if (action.retries >= action.maxRetries) {
          action.status = 'failed'
        } else {
          action.status = 'pending'
        }
        logger.error(`Action ${String(action.id ?? '')} failed (retry ${String(action.retries ?? '')}/${String(action.maxRetries ?? '')})`, error instanceof Error ? error : new Error(String(error)))
      }

      await this.saveQueue(queue)
    }

    queue.processing = false
    await this.saveQueue(queue)
  }

  private async executeAction(action: QueuedAction): Promise<void> {
    return new Promise((resolve, _reject) => {
      setTimeout(() => {
        logger.debug(`Executing action: ${String(action.type ?? '')}`, { actionId: action.id })
        resolve()
      }, 1000)
    })
  }

  async getQueueStatus(): Promise<{ pending: number; failed: number; total: number }> {
    const queue = await this.getQueue()
    const pending = queue.actions.filter(a => a.status === 'pending' || a.status === 'processing').length
    const failed = queue.actions.filter(a => a.status === 'failed').length
    return { pending, failed, total: queue.actions.length }
  }

  async retryFailed(): Promise<void> {
    const queue = await this.getQueue()
    queue.actions.forEach(action => {
      if (action.status === 'failed') {
        action.status = 'pending'
        action.retries = 0
      }
    })
    await this.saveQueue(queue)
    await this.processQueue()
  }

  async clearQueue(): Promise<void> {
    await this.saveQueue({ actions: [], processing: false })
  }

  isConnected(): boolean {
    return this.isOnline
  }
}

export const offlineQueue = new OfflineQueueManager()

export const useOfflineQueue = () => {
  const [isOnline, _setIsOnline] = useStorage<boolean>('app-online-status', navigator.onLine)

  const enqueueAction = async (
    type: QueuedAction['type'],
    payload: unknown,
    maxRetries: number = 3
  ): Promise<string> => {
    return offlineQueue.enqueue({ type, payload, maxRetries })
  }

  const retryFailed = async () => {
    return offlineQueue.retryFailed()
  }

  const getStatus = async () => {
    return offlineQueue.getQueueStatus()
  }

  return {
    isOnline,
    enqueueAction,
    retryFailed,
    getStatus,
    processQueue: () => offlineQueue.processQueue(),
    clearQueue: () => offlineQueue.clearQueue()
  }
}
