/**
 * Message queue + acknowledgment management for WebSocketManager.
 */

import type { ConnectionState, QueuedMessage, WebSocketMessage } from './websocket-types'
import { extractError } from './websocket-types'

interface MessageControllerDeps {
  readonly logger: Pick<Console, 'debug' | 'info' | 'warn' | 'error'>
  readonly emit: (event: string, data: unknown) => void
  readonly getState: () => ConnectionState
  readonly getWebSocket: () => WebSocket | null
  readonly messageTimeout: number
}

const MAX_RETRIES = 3

export class WebSocketMessageController {
  private readonly messageQueue: QueuedMessage[] = []
  private readonly pendingAcknowledgments = new Map<string, number>()

  constructor(private readonly deps: MessageControllerDeps) {}

  sendOrQueue(message: WebSocketMessage): void {
    const entry = this.toQueuedMessage(message)
    if (this.deps.getState() !== 'connected') {
      this.enqueue(entry)
      return
    }
    this.dispatch(entry)
  }

  flushQueue(): void {
    if (this.deps.getState() !== 'connected' || this.messageQueue.length === 0) {
      return
    }
    const queued = [...this.messageQueue]
    this.messageQueue.length = 0
    queued.forEach((entry) => this.dispatch(entry))
  }

  clearPendingAcks(): void {
    this.pendingAcknowledgments.forEach((timer) => window.clearTimeout(timer))
    this.pendingAcknowledgments.clear()
    this.messageQueue.length = 0
  }

  private dispatch(entry: QueuedMessage): void {
    this.deps.logger.debug('Sending message', {
      messageId: entry.id,
      event: entry.event,
      namespace: entry.namespace,
    })

    const timeoutId = window.setTimeout(() => {
      this.deps.logger.warn('Message timeout', { messageId: entry.id, event: entry.event })
      this.deps.emit('message_timeout', { messageId: entry.id, event: entry.event })
      this.handleMessageFailure(entry)
    }, this.deps.messageTimeout)
    this.pendingAcknowledgments.set(entry.id, timeoutId)

    const socket = this.deps.getWebSocket()
    if (socket?.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify(entry))
        return
      } catch (error) {
        const normalizedError = extractError(error)
        this.deps.logger.error('Failed to send WebSocket message', {
          message: normalizedError.message,
          stack: normalizedError.stack,
        })
        this.handleMessageFailure(entry)
        return
      }
    }

    this.resolveAcknowledgment(entry.id)
  }

  private handleMessageFailure(entry: QueuedMessage): void {
    this.resolveAcknowledgment(entry.id)
    if (entry.retries >= entry.maxRetries) {
      this.deps.logger.error('Message exceeded max retries', {
        messageId: entry.id,
        event: entry.event,
      })
      this.deps.emit('message_failed', { messageId: entry.id, event: entry.event })
      return
    }

    const retryEntry: QueuedMessage = { ...entry, retries: entry.retries + 1 }
    this.messageQueue.push(retryEntry)
  }

  private enqueue(entry: QueuedMessage): void {
    this.messageQueue.push(entry)
    this.deps.logger.debug('Message queued', {
      messageId: entry.id,
      queueLength: this.messageQueue.length,
    })
  }

  private resolveAcknowledgment(messageId: string): void {
    const timer = this.pendingAcknowledgments.get(messageId)
    if (timer) {
      window.clearTimeout(timer)
      this.pendingAcknowledgments.delete(messageId)
      this.deps.logger.debug('Message acknowledged', { messageId })
      this.deps.emit('message_acknowledged', { messageId })
    }
  }

  private toQueuedMessage(message: WebSocketMessage | QueuedMessage): QueuedMessage {
    if ('retries' in message) {
      return message
    }
    return { ...message, retries: 0, maxRetries: MAX_RETRIES }
  }
}
