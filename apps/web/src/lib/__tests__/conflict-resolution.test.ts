/**
 * Tests for conflict resolution utilities
 *
 * Coverage target: >= 95% statements/branches/functions/lines
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ConflictResolver,
  createConflictResolver,
  createConflict,
  resolveWithUserIntervention,
  type Conflict,
  type ConflictResolutionStrategy,
} from '../conflict-resolution';

vi.mock('../logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('conflict-resolution', () => {
  const createTestConflict = <T>(
    clientData: T,
    serverData: T,
    strategy: ConflictResolutionStrategy = 'last-write-wins'
  ): Conflict<T> => {
    return createConflict(
      'test-resource',
      'test-id',
      clientData,
      serverData,
      {
        clientVersion: 1,
        clientTimestamp: 1000,
        clientId: 'client-1',
      },
      {
        serverVersion: 2,
        serverTimestamp: 2000,
        serverId: 'server-1',
      },
      strategy
    );
  };

  describe('ConflictResolver', () => {
    describe('last-write-wins strategy', () => {
      it('should use server data when server timestamp is newer', () => {
        const resolver = new ConflictResolver({ strategy: 'last-write-wins' });
        const conflict = createTestConflict('client', 'server', 'last-write-wins');

        const result = resolver.resolve(conflict);

        expect(result.resolved).toBe(true);
        expect(result.data).toBe('server');
        expect(result.requiresUserIntervention).toBe(false);
      });

      it('should use client data when client timestamp is newer', () => {
        const conflict = createConflict(
          'test-resource',
          'test-id',
          'client',
          'server',
          {
            clientVersion: 1,
            clientTimestamp: 2000,
            clientId: 'client-1',
          },
          {
            serverVersion: 2,
            serverTimestamp: 1000,
            serverId: 'server-1',
          },
          'last-write-wins'
        );

        const resolver = new ConflictResolver({ strategy: 'last-write-wins' });
        const result = resolver.resolve(conflict);

        expect(result.resolved).toBe(true);
        expect(result.data).toBe('client');
      });
    });

    describe('first-write-wins strategy', () => {
      it('should use client data when client timestamp is older', () => {
        const conflict = createConflict(
          'test-resource',
          'test-id',
          'client',
          'server',
          {
            clientVersion: 1,
            clientTimestamp: 1000,
            clientId: 'client-1',
          },
          {
            serverVersion: 2,
            serverTimestamp: 2000,
            serverId: 'server-1',
          },
          'first-write-wins'
        );

        const resolver = new ConflictResolver({ strategy: 'first-write-wins' });
        const result = resolver.resolve(conflict);

        expect(result.resolved).toBe(true);
        expect(result.data).toBe('client');
      });

      it('should use server data when server timestamp is older', () => {
        const conflict = createConflict(
          'test-resource',
          'test-id',
          'client',
          'server',
          {
            clientVersion: 1,
            clientTimestamp: 2000,
            clientId: 'client-1',
          },
          {
            serverVersion: 2,
            serverTimestamp: 1000,
            serverId: 'server-1',
          },
          'first-write-wins'
        );

        const resolver = new ConflictResolver({ strategy: 'first-write-wins' });
        const result = resolver.resolve(conflict);

        expect(result.resolved).toBe(true);
        expect(result.data).toBe('server');
      });
    });

    describe('server-wins strategy', () => {
      it('should always use server data', () => {
        const resolver = new ConflictResolver({ strategy: 'server-wins' });
        const conflict = createTestConflict('client', 'server', 'server-wins');

        const result = resolver.resolve(conflict);

        expect(result.resolved).toBe(true);
        expect(result.data).toBe('server');
      });
    });

    describe('client-wins strategy', () => {
      it('should always use client data', () => {
        const resolver = new ConflictResolver({ strategy: 'client-wins' });
        const conflict = createTestConflict('client', 'server', 'client-wins');

        const result = resolver.resolve(conflict);

        expect(result.resolved).toBe(true);
        expect(result.data).toBe('client');
      });
    });

    describe('merge strategy', () => {
      it('should merge objects', () => {
        const resolver = new ConflictResolver({ strategy: 'merge' });
        const conflict = createTestConflict(
          { a: 1, b: 2 },
          { b: 3, c: 4 },
          'merge'
        );

        const result = resolver.resolve(conflict);

        expect(result.resolved).toBe(true);
        expect(result.data).toEqual({ a: 1, b: 3, c: 4 });
      });

      it('should fall back to last-write-wins for primitives', () => {
        const resolver = new ConflictResolver({ strategy: 'merge' });
        const conflict = createTestConflict('client', 'server', 'merge');

        const result = resolver.resolve(conflict);

        expect(result.resolved).toBe(true);
        expect(result.data).toBe('server');
      });
    });

    describe('user-intervention strategy', () => {
      it('should require user intervention', () => {
        const resolver = new ConflictResolver({ strategy: 'user-intervention' });
        const conflict = createTestConflict('client', 'server', 'user-intervention');

        const result = resolver.resolve(conflict);

        expect(result.resolved).toBe(false);
        expect(result.requiresUserIntervention).toBe(true);
        expect(result.conflict).toBe(conflict);
      });
    });

    describe('history', () => {
      it('should add resolved conflicts to history when audit trail is enabled', () => {
        const resolver = new ConflictResolver({
          strategy: 'server-wins',
          enableAuditTrail: true,
        });
        const conflict = createTestConflict('client', 'server', 'server-wins');

        resolver.resolve(conflict);

        const history = resolver.getHistory();
        expect(history.length).toBe(1);
        expect(history[0]?.conflict.id).toBe(conflict.id);
        expect(history[0]?.resolution).toBe('server');
      });

      it('should not add to history when audit trail is disabled', () => {
        const resolver = new ConflictResolver({
          strategy: 'server-wins',
          enableAuditTrail: false,
        });
        const conflict = createTestConflict('client', 'server', 'server-wins');

        resolver.resolve(conflict);

        const history = resolver.getHistory();
        expect(history.length).toBe(0);
      });

      it('should trim history when exceeding max size', () => {
        const resolver = new ConflictResolver({
          strategy: 'server-wins',
          enableAuditTrail: true,
          maxHistorySize: 2,
        });

        resolver.resolve(createTestConflict('client1', 'server1', 'server-wins'));
        resolver.resolve(createTestConflict('client2', 'server2', 'server-wins'));
        resolver.resolve(createTestConflict('client3', 'server3', 'server-wins'));

        const history = resolver.getHistory();
        expect(history.length).toBe(2);
        expect(history[0]?.conflict.clientData).toBe('client2');
        expect(history[1]?.conflict.clientData).toBe('client3');
      });

      it('should clear history', () => {
        const resolver = new ConflictResolver({
          strategy: 'server-wins',
          enableAuditTrail: true,
        });

        resolver.resolve(createTestConflict('client', 'server', 'server-wins'));
        expect(resolver.getHistory().length).toBe(1);

        resolver.clearHistory();
        expect(resolver.getHistory().length).toBe(0);
      });
    });
  });

  describe('createConflictResolver', () => {
    it('should create resolver with default options', () => {
      const resolver = createConflictResolver();

      expect(resolver).toBeInstanceOf(ConflictResolver);
    });

    it('should create resolver with custom options', () => {
      const resolver = createConflictResolver({
        strategy: 'client-wins',
        enableUserIntervention: true,
      });

      const conflict = createTestConflict('client', 'server', 'client-wins');
      const result = resolver.resolve(conflict);

      expect(result.data).toBe('client');
    });
  });

  describe('createConflict', () => {
    it('should create conflict with all required fields', () => {
      const conflict = createConflict(
        'resource-type',
        'resource-id',
        'client-data',
        'server-data',
        {
          clientVersion: 1,
          clientTimestamp: 1000,
          clientId: 'client-1',
        },
        {
          serverVersion: 2,
          serverTimestamp: 2000,
          serverId: 'server-1',
        },
        'last-write-wins'
      );

      expect(conflict.resourceType).toBe('resource-type');
      expect(conflict.resourceId).toBe('resource-id');
      expect(conflict.clientData).toBe('client-data');
      expect(conflict.serverData).toBe('server-data');
      expect(conflict.strategy).toBe('last-write-wins');
      expect(conflict.metadata.clientVersion).toBe(1);
      expect(conflict.metadata.serverVersion).toBe(2);
      expect(conflict.id).toContain('conflict-resource-type-resource-id');
    });
  });

  describe('resolveWithUserIntervention', () => {
    it('should return result requiring user intervention', async () => {
      const conflict = createTestConflict('client', 'server', 'user-intervention');
      const onResolve = vi.fn().mockResolvedValue(undefined);

      const result = await resolveWithUserIntervention(conflict, onResolve);

      expect(result.resolved).toBe(false);
      expect(result.requiresUserIntervention).toBe(true);
      expect(result.conflict).toBe(conflict);
      expect(onResolve).not.toHaveBeenCalled();
    });
  });
});
