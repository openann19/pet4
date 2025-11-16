import { createLogger } from './logger';
import { generateCorrelationId } from './utils';
import type {
  ConnectionState,
  EventHandler,
  QueuedMessage,
  WebSocketManagerOptions,
  WebSocketMessage,
  WebSocketNamespace,
} from './websocket-types';
import { extractError } from './websocket-types';

const logger = createLogger('websocket-manager');

export class WebSocketManager {
  private url: string;
  private state: ConnectionState = 'disconnected';
  private messageQueue: QueuedMessage[] = [];
  private eventHandlers = new Map<string, Set<EventHandler>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectInterval: number;
  private heartbeatInterval: number;
  private messageTimeout: number;
  private heartbeatTimer?: number;
  private reconnectTimer?: number;
  private pendingAcknowledgments = new Map<string, number>();
  private ws: WebSocket | null = null;

  constructor(options: WebSocketManagerOptions) {
    this.url = options.url;
    this.reconnectInterval = options.reconnectInterval ?? 3000;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 10;
    this.heartbeatInterval = options.heartbeatInterval ?? 30000;
    this.messageTimeout = options.messageTimeout ?? 5000;
  }

  connect(accessToken?: string): void {
    if (this.isConnectingOrConnected()) {
      return;
    }

    this.state = 'connecting';
    this.logConnectionAttempt(accessToken);

    try {
      if (typeof WebSocket === 'undefined') {
        this.simulateConnection();
        return;
      }

      this.establishBrowserConnection(accessToken);
    } catch (error) {
      this.handleConnectionFailure(error);
    }
  }

  disconnect(): void {
    logger.info('Disconnecting');
    this.ws?.close();
    this.ws = null;
    this.state = 'disconnected';
    this.stopHeartbeat();
    this.clearReconnectTimer();
    this.pendingAcknowledgments.forEach((timer) => window.clearTimeout(timer));
    this.pendingAcknowledgments.clear();
    this.emit('connection', { status: 'disconnected' });
  }

  send(namespace: WebSocketNamespace, event: string, data: unknown): string {
    const message: WebSocketMessage = {
      id: generateCorrelationId(),
      namespace,
      event,
      data,
      timestamp: Date.now(),
      correlationId: generateCorrelationId(),
    };

    if (this.state !== 'connected') {
      this.queueMessage(message);
      return message.id;
    }

    this.sendMessage(message);
    return message.id;
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set<EventHandler>());
    }
    this.eventHandlers.get(event)!.add(handler);

    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(event);
        }
      }
    };
  }

  getState(): ConnectionState {
    return this.state;
  }

  private sendMessage(message: WebSocketMessage): void {
    logger.debug('Sending message', {
      messageId: message.id,
      event: message.event,
      namespace: message.namespace,
    });

    const timeoutTimer = window.setTimeout(() => {
      logger.warn('Message timeout', { messageId: message.id, event: message.event });
      this.emit('message_timeout', { messageId: message.id, event: message.event });
      this.handleMessageFailure(message);
    }, this.messageTimeout);

    this.pendingAcknowledgments.set(message.id, timeoutTimer);

    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        // Wait for server acknowledgment (handled via receiveMessage)
      } catch (error) {
        const normalizedError = extractError(error);
        logger.error('Failed to send WebSocket message', {
          message: normalizedError.message,
          stack: normalizedError.stack,
        });
        this.handleMessageFailure(message);
      }
    } else {
      // Fallback: acknowledge immediately if WebSocket not available
      this.handleAcknowledgment(message.id);
    }
  }

  private handleAcknowledgment(messageId: string): void {
    const timer = this.pendingAcknowledgments.get(messageId);
    if (timer) {
      window.clearTimeout(timer);
      this.pendingAcknowledgments.delete(messageId);
      logger.debug('Message acknowledged', { messageId });
      this.emit('message_acknowledged', { messageId });
    }
  }

  private handleMessageFailure(message: WebSocketMessage): void {
    const queuedMessage: QueuedMessage = {
      ...message,
      retries: 0,
      maxRetries: 3,
    };
    this.queueMessage(queuedMessage);
  }

  private queueMessage(message: WebSocketMessage | QueuedMessage): void {
    const queuedMessage: QueuedMessage =
      'retries' in message ? message : { ...message, retries: 0, maxRetries: 3 };

    this.messageQueue.push(queuedMessage);
    logger.debug('Message queued', {
      messageId: queuedMessage.id,
      queueLength: this.messageQueue.length,
    });
  }

  private flushMessageQueue(): void {
    if (this.state !== 'connected' || this.messageQueue.length === 0) {
      return;
    }

    logger.debug('Flushing message queue', { queueLength: this.messageQueue.length });
    const queue = [...this.messageQueue];
    this.messageQueue = [];

    queue.forEach((message) => {
      if (message.retries >= message.maxRetries) {
        logger.error('Message exceeded max retries', {
          messageId: message.id,
          event: message.event,
        });
        this.emit('message_failed', { messageId: message.id, event: message.event });
        return;
      }

      message.retries++;
      this.sendMessage(message);
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      if (this.state === 'connected') {
        logger.debug('Sending heartbeat');
        this.send('/notifications', 'heartbeat', { timestamp: Date.now() });
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== undefined) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  private logConnectionAttempt(accessToken?: string): void {
    const preview = accessToken ? `${accessToken.slice(0, 10)}…` : 'anonymous';
    logger.info('Connecting', { url: this.url, tokenPreview: preview });
  }

  private isConnectingOrConnected(): boolean {
    return this.state === 'connected' || this.state === 'connecting';
  }

  private establishBrowserConnection(accessToken?: string): void {
    const ws = new WebSocket(this.buildConnectionUrl(accessToken));
    this.ws = ws;

    ws.onopen = () => this.onWebSocketOpen();
    ws.onerror = (event) => this.onWebSocketError(event);
    ws.onclose = () => this.onWebSocketClose();
  }

  private onWebSocketOpen(): void {
    this.state = 'connected';
    this.reconnectAttempts = 0;
    logger.info('WebSocket connected successfully');
    this.startHeartbeat();
    this.flushMessageQueue();
    this.emit('connection', { status: 'connected' });
  }

  private onWebSocketError(event: Event): void {
    const candidateError = (event as ErrorEvent).error ?? new Error('Unknown WebSocket error');
    const normalizedError = extractError(candidateError);
    logger.error('WebSocket connection error', {
      message: normalizedError.message,
      stack: normalizedError.stack,
    });
    this.state = 'disconnected';
    this.emit('connection', { status: 'error', error: normalizedError });
    this.reconnect();
  }

  private onWebSocketClose(): void {
    logger.warn('WebSocket connection closed');
    this.state = 'disconnected';
    this.ws = null;
    this.emit('connection', { status: 'disconnected' });
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnect();
    }
  }

  private simulateConnection(): void {
    logger.warn('WebSocket not available, using simulated connection');
    this.state = 'connected';
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    this.flushMessageQueue();
    this.emit('connection', { status: 'connected' });
  }

  private handleConnectionFailure(error: unknown): void {
    const normalizedError = extractError(error);
    logger.error('Failed to establish WebSocket connection', {
      message: normalizedError.message,
      stack: normalizedError.stack,
    });
    this.state = 'disconnected';
    this.emit('connection', { status: 'error', error: normalizedError });
    this.reconnect();
  }

  private buildConnectionUrl(accessToken?: string): string {
    if (!accessToken) {
      return this.url;
    }
    return `${this.url}?token=${encodeURIComponent(accessToken)}`;
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached', { attempts: this.reconnectAttempts });
      this.emit('connection', { status: 'failed', attempts: this.reconnectAttempts });
      return;
    }

    this.state = 'reconnecting';
    this.reconnectAttempts++;

    const backoffDelay = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    logger.info('Reconnecting', { backoffDelay, attempt: this.reconnectAttempts });

    this.reconnectTimer = window.setTimeout(() => {
      logger.info('Attempting reconnection');
      this.connect();
    }, backoffDelay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== undefined) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  private emit(event: string, data: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          const normalizedError = extractError(error);
          logger.error('Error in event handler', {
            message: normalizedError.message,
            stack: normalizedError.stack,
            event,
          });
        }
      });
    }
  }

  receiveMessage(namespace: WebSocketNamespace, event: string, data: unknown): void {
    logger.debug('Received message', { namespace, event });
    this.emit(`${namespace}:${event}`, data);
    this.emit(event, data);
  }

  handleConnectionDrop(): void {
    logger.warn('Connection dropped');
    this.state = 'disconnected';
    this.stopHeartbeat();
    this.emit('connection', { status: 'disconnected', reason: 'network' });
    this.reconnect();
  }
}

let wsManager: WebSocketManager | null = null;

export function getWebSocketManager(): WebSocketManager {
  wsManager ??= new WebSocketManager({
    url: 'ws://localhost:3000',
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
    messageTimeout: 5000,
  });
  return wsManager;
}

export function initializeWebSocket(accessToken: string): void {
  const manager = getWebSocketManager();
  manager.connect(accessToken);
}

export function disconnectWebSocket(): void {
  if (wsManager) {
    wsManager.disconnect();
  }
}
