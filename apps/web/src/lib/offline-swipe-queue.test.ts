import { describe, it, expect, beforeEach } from 'vitest'
import { offlineSwipeQueue, createOfflineSwipeQueue, type SwipeAction } from '@/lib/offline-swipe-queue'

describe('OfflineSwipeQueue', () => {
  beforeEach(async () => {
    await offlineSwipeQueue.clear()
    localStorage.clear()
  })

  describe('enqueue', () => {
    it('should enqueue a swipe action', async () => {
      const action: SwipeAction = {
        petId: 'pet1',
        targetId: 'pet2',
        action: 'like',
        timestamp: new Date().toISOString()
      }

      await offlineSwipeQueue.enqueue(action)
      const size = await offlineSwipeQueue.size()
      expect(size).toBe(1)
    })
  })

  describe('dequeue', () => {
    it('should dequeue the first action', async () => {
      const action1: SwipeAction = {
        petId: 'pet1',
        targetId: 'pet2',
        action: 'like',
        timestamp: new Date().toISOString()
      }

      const action2: SwipeAction = {
        petId: 'pet1',
        targetId: 'pet3',
        action: 'pass',
        timestamp: new Date().toISOString()
      }

      await offlineSwipeQueue.enqueue(action1)
      await offlineSwipeQueue.enqueue(action2)

      const dequeued = await offlineSwipeQueue.dequeue()
      expect(dequeued).toEqual(action1)

      const size = await offlineSwipeQueue.size()
      expect(size).toBe(1)
    })

    it('should return null when queue is empty', async () => {
      const dequeued = await offlineSwipeQueue.dequeue()
      expect(dequeued).toBeNull()
    })
  })

  describe('peek', () => {
    it('should peek at the first action without removing it', async () => {
      const action: SwipeAction = {
        petId: 'pet1',
        targetId: 'pet2',
        action: 'like',
        timestamp: new Date().toISOString()
      }

      await offlineSwipeQueue.enqueue(action)
      const peeked = await offlineSwipeQueue.peek()
      expect(peeked).toEqual(action)

      const size = await offlineSwipeQueue.size()
      expect(size).toBe(1)
    })

    it('should return null when queue is empty', async () => {
      const peeked = await offlineSwipeQueue.peek()
      expect(peeked).toBeNull()
    })
  })

  describe('size', () => {
    it('should return the correct queue size', async () => {
      const action: SwipeAction = {
        petId: 'pet1',
        targetId: 'pet2',
        action: 'like',
        timestamp: new Date().toISOString()
      }

      await offlineSwipeQueue.enqueue(action)
      const size = await offlineSwipeQueue.size()
      expect(size).toBe(1)
    })

    it('should return 0 for empty queue', async () => {
      const size = await offlineSwipeQueue.size()
      expect(size).toBe(0)
    })
  })

  describe('isEmpty', () => {
    it('should return true for empty queue', async () => {
      const isEmpty = await offlineSwipeQueue.isEmpty()
      expect(isEmpty).toBe(true)
    })

    it('should return false for non-empty queue', async () => {
      const action: SwipeAction = {
        petId: 'pet1',
        targetId: 'pet2',
        action: 'like',
        timestamp: new Date().toISOString()
      }

      await offlineSwipeQueue.enqueue(action)
      const isEmpty = await offlineSwipeQueue.isEmpty()
      expect(isEmpty).toBe(false)
    })
  })

  describe('clear', () => {
    it('should clear all actions from queue', async () => {
      const action: SwipeAction = {
        petId: 'pet1',
        targetId: 'pet2',
        action: 'like',
        timestamp: new Date().toISOString()
      }

      await offlineSwipeQueue.enqueue(action)
      await offlineSwipeQueue.clear()
      const size = await offlineSwipeQueue.size()
      expect(size).toBe(0)
    })
  })

  describe('createOfflineSwipeQueue', () => {
    it('should create a new queue instance', () => {
      const queue = createOfflineSwipeQueue()
      expect(queue).toBeDefined()
      expect(typeof queue.enqueue).toBe('function')
      expect(typeof queue.dequeue).toBe('function')
    })
  })
})

