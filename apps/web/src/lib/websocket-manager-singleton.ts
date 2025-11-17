import { WebSocketManager } from './websocket-manager'

let wsManager: WebSocketManager | null = null

export const getWebSocketManager = (): WebSocketManager => {
  wsManager ??= new WebSocketManager({
    url: 'ws://localhost:3000',
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
    messageTimeout: 5000,
  })
  return wsManager
}

export const initializeWebSocket = (accessToken: string): void => {
  getWebSocketManager().connect(accessToken)
}

export const disconnectWebSocket = (): void => {
  wsManager?.disconnect()
}
