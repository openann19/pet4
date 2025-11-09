/**
 * Admin Integration Tests
 *
 * Integration tests for admin features across web and mobile platforms.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adminSyncService } from '@/core/services/admin-sync-service';
import { configBroadcastService } from '@/core/services/config-broadcast-service';
import { RealtimeClient } from '@/lib/realtime';
import type { AdminSyncEvent, AdminSyncListener } from '@/core/services/admin-sync-service';

// The RealtimeClient mock is already set up in test/setup.ts
// We can use it directly or create a new instance (mock will be used)

describe('Admin Integration Tests', () => {
  let realtimeClient: RealtimeClient;
  let mockListener: AdminSyncListener;

  beforeEach(() => {
    // Create new instance - the mock from setup.ts will be used
    realtimeClient = new RealtimeClient();
    realtimeClient.setAccessToken('test-token');
    realtimeClient.connect();

    mockListener = {
      onAdminAction: vi.fn() as (event: AdminSyncEvent) => void,
    };
    adminSyncService.disconnect();
    configBroadcastService.resetVersions();
  });

  describe('Admin Sync Service', () => {
    it('should initialize successfully', () => {
      adminSyncService.initialize(realtimeClient);
      expect(adminSyncService.isReady()).toBe(true);
    });

    it('should broadcast admin actions', async () => {
      adminSyncService.initialize(realtimeClient);
      const unsubscribe = adminSyncService.subscribe(mockListener);

      await adminSyncService.broadcastAdminAction(
        'user_suspended',
        'admin-123',
        'Admin User',
        'user',
        'user-456',
        { reason: 'Violation of terms' }
      );

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockListener.onAdminAction).toHaveBeenCalled();
      const calls = (mockListener.onAdminAction as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const event = calls[0]?.[0] as AdminSyncEvent | undefined;
      if (!event) {
        throw new Error('Event is undefined');
      }
      expect(event.action).toBe('user_suspended');
      expect(event.adminId).toBe('admin-123');
      expect(event.targetId).toBe('user-456');

      unsubscribe();
    });

    it('should broadcast config updates', async () => {
      adminSyncService.initialize(realtimeClient);
      const unsubscribe = adminSyncService.subscribe(mockListener);

      await adminSyncService.broadcastConfigUpdate('business', 'admin-123', 'Admin User', {
        prices: { premium: 9.99 },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockListener.onAdminAction).toHaveBeenCalled();
      const calls = (mockListener.onAdminAction as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const event = calls[0]?.[0] as AdminSyncEvent | undefined;
      if (!event) {
        throw new Error('Event is undefined');
      }
      expect(event.type).toBe('config');
      expect(event.action).toBe('config_updated');
      expect(event.targetId).toBe('business');

      unsubscribe();
    });

    it('should broadcast moderation decisions', async () => {
      adminSyncService.initialize(realtimeClient);
      const unsubscribe = adminSyncService.subscribe(mockListener);

      await adminSyncService.broadcastModerationDecision(
        'approve',
        'admin-123',
        'Admin User',
        'photo',
        'photo-789',
        { reason: 'Approved' }
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockListener.onAdminAction).toHaveBeenCalled();
      const calls = (mockListener.onAdminAction as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const event = calls[0]?.[0] as AdminSyncEvent | undefined;
      if (!event) {
        throw new Error('Event is undefined');
      }
      expect(event.type).toBe('moderation');
      expect(event.action).toBe('approve');
      expect(event.targetId).toBe('photo-789');

      unsubscribe();
    });

    it('should broadcast user updates', async () => {
      adminSyncService.initialize(realtimeClient);
      const unsubscribe = adminSyncService.subscribe(mockListener);

      await adminSyncService.broadcastUserUpdate(
        'password_reset',
        'admin-123',
        'Admin User',
        'user-456',
        { method: 'email' }
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockListener.onAdminAction).toHaveBeenCalled();
      const calls = (mockListener.onAdminAction as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const event = calls[0]?.[0] as AdminSyncEvent | undefined;
      if (!event) {
        throw new Error('Event is undefined');
      }
      expect(event.type).toBe('user_update');
      expect(event.action).toBe('password_reset');
      expect(event.targetId).toBe('user-456');

      unsubscribe();
    });

    it('should broadcast ticket updates', async () => {
      adminSyncService.initialize(realtimeClient);
      const unsubscribe = adminSyncService.subscribe(mockListener);

      await adminSyncService.broadcastTicketUpdate(
        'status_changed',
        'admin-123',
        'Admin User',
        'ticket-101',
        { status: 'resolved' }
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockListener.onAdminAction).toHaveBeenCalled();
      const calls = (mockListener.onAdminAction as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const event = calls[0]?.[0] as AdminSyncEvent | undefined;
      if (!event) {
        throw new Error('Event is undefined');
      }
      expect(event.type).toBe('ticket_update');
      expect(event.action).toBe('status_changed');
      expect(event.targetId).toBe('ticket-101');

      unsubscribe();
    });

    it('should handle multiple listeners', async () => {
      adminSyncService.initialize(realtimeClient);
      const listener1: AdminSyncListener = {
        onAdminAction: vi.fn() as (event: AdminSyncEvent) => void,
      };
      const listener2: AdminSyncListener = {
        onAdminAction: vi.fn() as (event: AdminSyncEvent) => void,
      };

      const unsubscribe1 = adminSyncService.subscribe(listener1);
      const unsubscribe2 = adminSyncService.subscribe(listener2);

      await adminSyncService.broadcastAdminAction(
        'test_action',
        'admin-123',
        'Admin User',
        'test',
        'test-123',
        {}
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(listener1.onAdminAction).toHaveBeenCalled();
      expect(listener2.onAdminAction).toHaveBeenCalled();

      unsubscribe1();
      unsubscribe2();
    });

    it('should unsubscribe listeners correctly', async () => {
      adminSyncService.initialize(realtimeClient);
      const unsubscribe = adminSyncService.subscribe(mockListener);

      await adminSyncService.broadcastAdminAction(
        'test_action',
        'admin-123',
        'Admin User',
        'test',
        'test-123',
        {}
      );

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockListener.onAdminAction).toHaveBeenCalledTimes(1);

      unsubscribe();

      await adminSyncService.broadcastAdminAction(
        'test_action_2',
        'admin-123',
        'Admin User',
        'test',
        'test-456',
        {}
      );

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockListener.onAdminAction).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('Config Broadcast Service', () => {
    it('should broadcast config updates', async () => {
      configBroadcastService.initialize(realtimeClient);
      const unsubscribe = configBroadcastService.subscribe({
        onConfigUpdate: vi.fn(),
      });

      const result = await configBroadcastService.broadcastConfig(
        'business',
        { prices: { premium: 9.99 } },
        'admin-123'
      );

      expect(result.success).toBe(true);
      expect(result.version).toBeGreaterThan(0);

      unsubscribe();
    });

    it('should track config versions', async () => {
      configBroadcastService.initialize(realtimeClient);

      const result1 = await configBroadcastService.broadcastConfig(
        'business',
        { prices: { premium: 9.99 } },
        'admin-123'
      );

      const result2 = await configBroadcastService.broadcastConfig(
        'business',
        { prices: { premium: 19.99 } },
        'admin-123'
      );

      expect(result2.version).toBeGreaterThan(result1.version);
    });

    it('should handle different config types', async () => {
      configBroadcastService.initialize(realtimeClient);

      const businessResult = await configBroadcastService.broadcastConfig(
        'business',
        { prices: {} },
        'admin-123'
      );

      const matchingResult = await configBroadcastService.broadcastConfig(
        'matching',
        { weights: {} },
        'admin-123'
      );

      expect(businessResult.success).toBe(true);
      expect(matchingResult.success).toBe(true);
      expect(businessResult.version).toBe(1);
      expect(matchingResult.version).toBe(1); // Different types have separate versions
    });
  });

  describe('Cross-Platform Sync', () => {
    it('should sync admin actions between web and mobile', async () => {
      adminSyncService.initialize(realtimeClient);

      const webListener = { onAdminAction: vi.fn() };
      const mobileListener = { onAdminAction: vi.fn() };

      const unsubscribeWeb = adminSyncService.subscribe(webListener);
      const unsubscribeMobile = adminSyncService.subscribe(mobileListener);

      // Simulate action from web admin panel
      await adminSyncService.broadcastAdminAction(
        'user_suspended',
        'admin-web-123',
        'Web Admin',
        'user',
        'user-456',
        { reason: 'Terms violation' }
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Both listeners should receive the event
      expect(webListener.onAdminAction).toHaveBeenCalled();
      expect(mobileListener.onAdminAction).toHaveBeenCalled();

      const webCalls = (webListener.onAdminAction as ReturnType<typeof vi.fn>).mock.calls;
      const mobileCalls = (mobileListener.onAdminAction as ReturnType<typeof vi.fn>).mock.calls;
      expect(webCalls.length).toBeGreaterThan(0);
      expect(mobileCalls.length).toBeGreaterThan(0);
      const webEvent = webCalls[0]?.[0] as AdminSyncEvent | undefined;
      const mobileEvent = mobileCalls[0]?.[0] as AdminSyncEvent | undefined;
      if (!webEvent || !mobileEvent) {
        throw new Error('Event is undefined');
      }
      expect(webEvent.action).toBe(mobileEvent.action);
      expect(webEvent.targetId).toBe(mobileEvent.targetId);

      unsubscribeWeb();
      unsubscribeMobile();
    });

    it('should sync config updates across platforms', async () => {
      adminSyncService.initialize(realtimeClient);
      configBroadcastService.initialize(realtimeClient);

      const webListener = { onAdminAction: vi.fn() };
      const mobileListener = { onAdminAction: vi.fn() };

      const unsubscribeWeb = adminSyncService.subscribe(webListener);
      const unsubscribeMobile = adminSyncService.subscribe(mobileListener);

      // Simulate config update from web
      await configBroadcastService.broadcastConfig(
        'business',
        { prices: { premium: 9.99 } },
        'admin-web-123'
      );

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Both should receive config update events
      expect(webListener.onAdminAction).toHaveBeenCalled();
      expect(mobileListener.onAdminAction).toHaveBeenCalled();

      unsubscribeWeb();
      unsubscribeMobile();
    });
  });

  describe('Error Handling', () => {
    it('should handle uninitialized service gracefully', async () => {
      adminSyncService.disconnect();

      // Should not throw when service is not initialized
      await expect(
        adminSyncService.broadcastAdminAction('test', 'admin-123', 'Admin', 'test', 'test-123', {})
      ).resolves.not.toThrow();
    });

    it('should handle listener errors gracefully', async () => {
      adminSyncService.initialize(realtimeClient);

      const errorListener: AdminSyncListener = {
        onAdminAction: vi.fn(() => {
          throw new Error('Listener error');
        }) as (event: AdminSyncEvent) => void,
      };

      const unsubscribe = adminSyncService.subscribe(errorListener);

      // Should not throw even if listener errors
      await expect(
        adminSyncService.broadcastAdminAction('test', 'admin-123', 'Admin', 'test', 'test-123', {})
      ).resolves.not.toThrow();

      unsubscribe();
    });
  });
});
