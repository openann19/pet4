/**
 * Audit Logger Service
 *
 * Logs all GDPR operations for compliance and auditing purposes.
 * Stores audit logs in database with immutable records.
 */

import type { Pool } from 'pg';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuditLogger');

export interface AuditLog {
  id: string;
  userId: string;
  action: 'export' | 'delete' | 'consent_read' | 'consent_update';
  resource: string;
  status: 'success' | 'failure';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  error?: string;
  timestamp: Date;
}

export interface AuditLogCreate {
  userId: string;
  action: AuditLog['action'];
  resource: string;
  status: AuditLog['status'];
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

export class AuditLogger {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create audit log entry
   */
  async log(entry: AuditLogCreate): Promise<void> {
    const client = await this.pool.connect();
    try {
      const id = `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      await client.query(
        `INSERT INTO audit_logs (
          id, "userId", action, resource, status,
          "ipAddress", "userAgent", metadata, error, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          id,
          entry.userId,
          entry.action,
          entry.resource,
          entry.status,
          entry.ipAddress ?? null,
          entry.userAgent ?? null,
          entry.metadata ? JSON.stringify(entry.metadata) : null,
          entry.error ?? null,
        ]
      );

      logger.info('Audit log created', {
        id,
        userId: entry.userId,
        action: entry.action,
        status: entry.status,
      });
    } catch (error) {
      // Don't throw - audit logging should not break the main flow
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create audit log', err, {
        userId: entry.userId,
        action: entry.action,
      });
    } finally {
      client.release();
    }
  }

  /**
   * Log GDPR data export
   */
  async logExport(
    userId: string,
    status: 'success' | 'failure',
    options: {
      ipAddress?: string;
      userAgent?: string;
      error?: string;
      recordCount?: number;
    } = {}
  ): Promise<void> {
    await this.log({
      userId,
      action: 'export',
      resource: `user:${userId}`,
      status,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      metadata: options.recordCount !== undefined ? { recordCount: options.recordCount } : undefined,
      error: options.error,
    });
  }

  /**
   * Log GDPR data deletion
   */
  async logDeletion(
    userId: string,
    status: 'success' | 'failure',
    options: {
      ipAddress?: string;
      userAgent?: string;
      error?: string;
      collections?: string[];
      recordCount?: number;
    } = {}
  ): Promise<void> {
    await this.log({
      userId,
      action: 'delete',
      resource: `user:${userId}`,
      status,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      metadata:
        options.collections !== undefined || options.recordCount !== undefined
          ? {
              collections: options.collections,
              recordCount: options.recordCount,
            }
          : undefined,
      error: options.error,
    });
  }

  /**
   * Log consent read
   */
  async logConsentRead(
    userId: string,
    status: 'success' | 'failure',
    options: {
      ipAddress?: string;
      userAgent?: string;
      error?: string;
    } = {}
  ): Promise<void> {
    await this.log({
      userId,
      action: 'consent_read',
      resource: `user:${userId}:consents`,
      status,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      error: options.error,
    });
  }

  /**
   * Log consent update
   */
  async logConsentUpdate(
    userId: string,
    category: string,
    status: 'success' | 'failure',
    options: {
      ipAddress?: string;
      userAgent?: string;
      error?: string;
      consentStatus?: string;
    } = {}
  ): Promise<void> {
    await this.log({
      userId,
      action: 'consent_update',
      resource: `user:${userId}:consent:${category}`,
      status,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      metadata: options.consentStatus ? { consentStatus: options.consentStatus } : undefined,
      error: options.error,
    });
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      action?: AuditLog['action'];
    } = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const client = await this.pool.connect();
    try {
      const limit = options.limit ?? 100;
      const offset = options.offset ?? 0;

      let query = 'SELECT * FROM audit_logs WHERE "userId" = $1';
      const params: unknown[] = [userId];

      if (options.action) {
        query += ' AND action = $2';
        params.push(options.action);
      }

      query += ' ORDER BY timestamp DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);

      const result = await client.query<AuditLog>(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE "userId" = $1';
      const countParams: unknown[] = [userId];
      if (options.action) {
        countQuery += ' AND action = $2';
        countParams.push(options.action);
      }
      const countResult = await client.query<{ total: string }>(countQuery, countParams);
      const total = Number.parseInt(countResult.rows[0]?.total ?? '0', 10);

      return {
        logs: result.rows.map(this.mapAuditLog),
        total,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user audit logs', err, { userId });
      throw err;
    } finally {
      client.release();
    }
  }

  private mapAuditLog(row: unknown): AuditLog {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      userId: r.userId as string,
      action: r.action as AuditLog['action'],
      resource: r.resource as string,
      status: r.status as AuditLog['status'],
      ipAddress: r.ipAddress as string | undefined,
      userAgent: r.userAgent as string | undefined,
      metadata: r.metadata as Record<string, unknown> | undefined,
      error: r.error as string | undefined,
      timestamp: r.timestamp as Date,
    };
  }
}
