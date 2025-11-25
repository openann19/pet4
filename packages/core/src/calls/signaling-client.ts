// packages/core/src/calls/signaling-client.ts

import type { CallSignal, SignalingConfig } from './call-types'

export type CallSignalHandler = (signal: CallSignal) => void | Promise<void>
export type SignalingConnectionState = 'disconnected' | 'connecting' | 'connected'

export interface CallSignalingClientOptions {
  reconnect?: boolean
  reconnectDelayMs?: number
}

export class CallSignalingClient {
  private ws: WebSocket | null = null
  private readonly config: SignalingConfig
  private readonly handlers = new Set<CallSignalHandler>()
  private state: SignalingConnectionState = 'disconnected'
  private reconnectEnabled: boolean
  private reconnectDelayMs: number
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null

  constructor(config: SignalingConfig, options: CallSignalingClientOptions = {}) {
    this.config = config
    this.reconnectEnabled = options.reconnect ?? true
    this.reconnectDelayMs = options.reconnectDelayMs ?? 2_000
  }

  get connectionState(): SignalingConnectionState {
    return this.state
  }

  connect(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return
    }

    const url = this.buildUrl()
    this.state = 'connecting'
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.state = 'connected'
    }

    this.ws.onclose = () => {
      this.state = 'disconnected'
      this.ws = null
      if (this.reconnectEnabled) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = () => {
      // surface via onclose
    }

    this.ws.onmessage = evt => {
      try {
        const raw = JSON.parse(String(evt.data)) as CallSignal
        if (!raw || typeof raw.type !== 'string') {
          return
        }
        for (const handler of this.handlers) {
          void handler(raw)
        }
      } catch {
        // ignore malformed payloads
      }
    }
  }

  disconnect(): void {
    this.reconnectEnabled = false
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.state = 'disconnected'
  }

  send(signal: CallSignal): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Signaling WebSocket is not connected')
    }
    this.ws.send(JSON.stringify(signal))
  }

  onSignal(handler: CallSignalHandler): () => void {
    this.handlers.add(handler)
    return () => {
      this.handlers.delete(handler)
    }
  }

  /**
   * Internal helper for tests to inspect selected internals without
   * exposing them as part of the public API surface.
   */
  getDebugInternalsForTests(): {
    handlers: Set<CallSignalHandler>
    buildUrl: () => string
  } {
    return {
      handlers: this.handlers,
      buildUrl: () => this.buildUrl(),
    }
  }

  private buildUrl(): string {
    const { url, token, userId } = this.config
    const u = new URL(url)
    u.searchParams.set('userId', userId)
    if (token) {
      u.searchParams.set('token', token)
    }
    return u.toString()
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return
    }
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null
      this.connect()
    }, this.reconnectDelayMs)
  }
}
