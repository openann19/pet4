/**
 * Admin Sync Service
 *
 * Handles real-time synchronization of admin actions between web and mobile admin panels.
 * Uses WebSocket channels to broadcast admin actions, config changes, and moderation decisions.
 */

import type { RealtimeClient } from '@/lib/realtime';
import { createLogger } from '@/lib/logger';
import type { _AdminAction } from '@petspark/shared';

const logger = createLogger('AdminSyncService');

export interface AdminSyncEvent {
  type: 'action' | 'config' | 'moderation' | 'user_update' | 'ticket_update';
  action: string;
  adminId: string;
  adminName: string;
  targetType: string;
  targetId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface AdminSyncListener {
  onAdminAction: (event: AdminSyncEvent) => void;
}

class AdminSyncService {
  private realtimeClient: RealtimeClient | null = null;
  private listeners = new Set<AdminSyncListener>();
  private isInitialized = false;

  /**
   * Initialize the service with a realtime client
   */
  initialize(realtimeClient: RealtimeClient): void {
    if (this.isInitialized) {
      logger.warn('Admin sync service already initialized');
      return;
    }

    this.realtimeClient = realtimeClient;

    // Listen for admin action events
    this.realtimeClient.on('admin:action', (data) => {
      this.handleAdminAction(data as AdminSyncEvent);
    });

    this.realtimeClient.on('admin:config:updated', (data) => {
      this.handleConfigUpdate(data as AdminSyncEvent);
    });

    this.realtimeClient.on('admin:moderation:decision', (data) => {
      this.handleModerationDecision(data as AdminSyncEvent);
    });

    this.realtimeClient.on('admin:user:updated', (data) => {
      this.handleUserUpdate(data as AdminSyncEvent);
    });

    this.realtimeClient.on('admin:ticket:updated', (data) => {
      this.handleTicketUpdate(data as AdminSyncEvent);
    });

    this.isInitialized = true;
    logger.info('Admin sync service initialized');
  }

  /**
   * Broadcast an admin action to all connected admin clients
   */
  async broadcastAdminAction(
    action: string,
    adminId: string,
    adminName: string,
    targetType: string,
    targetId: string,
    data: Record<string, unknown> = {}
  ): Promise<void> {
    if (!this.realtimeClient) {
      logger.warn('Realtime client not initialized, cannot broadcast admin action');
      return;
    }

    const event: AdminSyncEvent = {
      type: 'action',
      action,
      adminId,
      adminName,
      targetType,
      targetId,
      data,
      timestamp: new Date().toISOString(),
    };

    try {
      // Emit to WebSocket channel
      await this.realtimeClient.emit('admin:action', event);

      // Also trigger locally for immediate UI updates
      this.realtimeClient.trigger('admin:action', event);

      // Notify local listeners
      this.notifyListeners(event);

      logger.info('Admin action broadcasted', {
        action,
        adminId,
        targetType,
        targetId,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to broadcast admin action', err, {
        action,
        adminId,
        targetType,
        targetId,
      });
    }
  }

  /**
   * Broadcast a config update event
   */
  async broadcastConfigUpdate(
    configType: string,
    adminId: string,
    adminName: string,
    config: Record<string, unknown>
  ): Promise<void> {
    if (!this.realtimeClient) {
      logger.warn('Realtime client not initialized, cannot broadcast config update');
      return;
    }

    const event: AdminSyncEvent = {
      type: 'config',
      action: 'config_updated',
      adminId,
      adminName,
      targetType: 'config',
      targetId: configType,
      data: { configType, config },
      timestamp: new Date().toISOString(),
    };

    try {
      await this.realtimeClient.emit('admin:config:updated', event);
      this.realtimeClient.trigger('admin:config:updated', event);
      this.notifyListeners(event);

      logger.info('Config update broadcasted', { configType, adminId });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to broadcast config update', err, { configType });
    }
  }

  /**
   * Broadcast a moderation decision
   */
  async broadcastModerationDecision(
    action: string,
    adminId: string,
    adminName: string,
    targetType: string,
    targetId: string,
    decision: Record<string, unknown>
  ): Promise<void> {
    if (!this.realtimeClient) {
      logger.warn('Realtime client not initialized, cannot broadcast moderation decision');
      return;
    }

    const event: AdminSyncEvent = {
      type: 'moderation',
      action,
      adminId,
      adminName,
      targetType,
      targetId,
      data: decision,
      timestamp: new Date().toISOString(),
    };

    try {
      await this.realtimeClient.emit('admin:moderation:decision', event);
      this.realtimeClient.trigger('admin:moderation:decision', event);
      this.notifyListeners(event);

      logger.info('Moderation decision broadcasted', {
        action,
        adminId,
        targetType,
        targetId,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to broadcast moderation decision', err, {
        action,
        targetType,
        targetId,
      });
    }
  }

  /**
   * Broadcast a user update
   */
  async broadcastUserUpdate(
    action: string,
    adminId: string,
    adminName: string,
    userId: string,
    updates: Record<string, unknown>
  ): Promise<void> {
    if (!this.realtimeClient) {
      logger.warn('Realtime client not initialized, cannot broadcast user update');
      return;
    }

    const event: AdminSyncEvent = {
      type: 'user_update',
      action,
      adminId,
      adminName,
      targetType: 'user',
      targetId: userId,
      data: updates,
      timestamp: new Date().toISOString(),
    };

    try {
      await this.realtimeClient.emit('admin:user:updated', event);
      this.realtimeClient.trigger('admin:user:updated', event);
      this.notifyListeners(event);

      logger.info('User update broadcasted', { action, adminId, userId });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to broadcast user update', err, { action, userId });
    }
  }

  /**
   * Broadcast a support ticket update
   */
  async broadcastTicketUpdate(
    action: string,
    adminId: string,
    adminName: string,
    ticketId: string,
    updates: Record<string, unknown>
  ): Promise<void> {
    if (!this.realtimeClient) {
      logger.warn('Realtime client not initialized, cannot broadcast ticket update');
      return;
    }

    const event: AdminSyncEvent = {
      type: 'ticket_update',
      action,
      adminId,
      adminName,
      targetType: 'ticket',
      targetId: ticketId,
      data: updates,
      timestamp: new Date().toISOString(),
    };

    try {
      await this.realtimeClient.emit('admin:ticket:updated', event);
      this.realtimeClient.trigger('admin:ticket:updated', event);
      this.notifyListeners(event);

      logger.info('Ticket update broadcasted', { action, adminId, ticketId });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to broadcast ticket update', err, { action, ticketId });
    }
  }

  /**
   * Subscribe to admin sync events
   */
  subscribe(listener: AdminSyncListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Handle incoming admin action event
   */
  private handleAdminAction(event: AdminSyncEvent): void {
    this.notifyListeners(event);
    logger.info('Admin action received', {
      action: event.action,
      adminId: event.adminId,
      targetType: event.targetType,
    });
  }

  /**
   * Handle incoming config update event
   */
  private handleConfigUpdate(event: AdminSyncEvent): void {
    this.notifyListeners(event);
    logger.info('Config update received', {
      configType: event.targetId,
      adminId: event.adminId,
    });
  }

  /**
   * Handle incoming moderation decision event
   */
  private handleModerationDecision(event: AdminSyncEvent): void {
    this.notifyListeners(event);
    logger.info('Moderation decision received', {
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
    });
  }

  /**
   * Handle incoming user update event
   */
  private handleUserUpdate(event: AdminSyncEvent): void {
    this.notifyListeners(event);
    logger.info('User update received', {
      action: event.action,
      userId: event.targetId,
    });
  }

  /**
   * Handle incoming ticket update event
   */
  private handleTicketUpdate(event: AdminSyncEvent): void {
    this.notifyListeners(event);
    logger.info('Ticket update received', {
      action: event.action,
      ticketId: event.targetId,
    });
  }

  /**
   * Notify all listeners of an event
   */
  private notifyListeners(event: AdminSyncEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener.onAdminAction(event);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Error notifying admin sync listener', err);
      }
    });
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.realtimeClient !== null;
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    this.listeners.clear();
    this.realtimeClient = null;
    this.isInitialized = false;
    logger.info('Admin sync service disconnected');
  }
}

export const adminSyncService = new AdminSyncService();
