/**
 * Shared WebSocket types and helpers.
 */

export type WebSocketNamespace = '/chat' | '/presence' | '/notifications'

export interface WebSocketMessage {
  readonly id: string
  readonly namespace: WebSocketNamespace
  readonly event: string
  readonly data: unknown
  readonly timestamp: number
  readonly correlationId: string
}

export interface QueuedMessage extends WebSocketMessage {
  retries: number
  maxRetries: number
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

export interface WebSocketManagerOptions {
  readonly url: string
  readonly reconnectInterval?: number
  readonly maxReconnectAttempts?: number
  readonly heartbeatInterval?: number
  readonly messageTimeout?: number
}

export type EventHandler = (data: unknown) => void

export const extractError = (value: unknown): Error =>
  value instanceof Error ? value : new Error(String(value))
