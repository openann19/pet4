/**
 * Admin Audit Logger Service
 *
 * Logs all admin actions for audit and compliance purposes.
 * Separate from GDPR audit logs - this is for admin operations.
 */

import type { Pool } from 'pg';
import { createLogger } from '../utils/logger';

const logger = createLogger('AdminAuditLogger');

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
}

export interface AdminAuditLogCreate {
  adminId: string;
  adminName?: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class AdminAuditLogger {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create admin audit log entry
   */
  async log(entry: AdminAuditLogCreate): Promise<void> {
    const client = await this.pool.connect();
    try {
      const id = `admin_audit_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      await client.query(
        `INSERT INTO admin_audit_logs (
          id, "adminId", "adminName", action, "targetType", "targetId",
          details, "ipAddress", "userAgent", "timestamp"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, NOW())`,
        [
          id,
          entry.adminId,
          entry.adminName ?? null,
          entry.action,
          entry.targetType,
          entry.targetId ?? null,
          entry.details ? JSON.stringify(entry.details) : null,
          entry.ipAddress ?? null,
          entry.userAgent ?? null,
        ]
      );

      logger.info('Admin audit log created', {
        id,
        adminId: entry.adminId,
        action: entry.action,
        targetType: entry.targetType,
      });
    } catch (error) {
      // Don't throw - audit logging should not break the main flow
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create admin audit log', err, {
        adminId: entry.adminId,
        action: entry.action,
      });
    } finally {
      client.release();
    }
  }

  /**
   * Get admin audit logs
   */
  async getAuditLogs(options: {
    limit?: number;
    offset?: number;
    adminId?: string;
    action?: string;
    targetType?: string;
  } = {}): Promise<{ logs: AdminAuditLog[]; total: number }> {
    const client = await this.pool.connect();
    try {
      const limit = options.limit ?? 100;
      const offset = options.offset ?? 0;

      let query = 'SELECT * FROM admin_audit_logs WHERE 1=1';
      const params: unknown[] = [];
      let paramCount = 0;

      if (options.adminId) {
        paramCount++;
        query += ` AND "adminId" = $${paramCount}`;
        params.push(options.adminId);
      }

      if (options.action) {
        paramCount++;
        query += ` AND action = $${paramCount}`;
        params.push(options.action);
      }

      if (options.targetType) {
        paramCount++;
        query += ` AND "targetType" = $${paramCount}`;
        params.push(options.targetType);
      }

      query += ` ORDER BY "timestamp" DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await client.query<AdminAuditLog>(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM admin_audit_logs WHERE 1=1';
      const countParams: unknown[] = [];
      let countParamCount = 0;

      if (options.adminId) {
        countParamCount++;
        countQuery += ` AND "adminId" = $${countParamCount}`;
        countParams.push(options.adminId);
      }

      if (options.action) {
        countParamCount++;
        countQuery += ` AND action = $${countParamCount}`;
        countParams.push(options.action);
      }

      if (options.targetType) {
        countParamCount++;
        countQuery += ` AND "targetType" = $${countParamCount}`;
        countParams.push(options.targetType);
      }

      const countResult = await client.query<{ total: string }>(countQuery, countParams);
      const total = Number.parseInt(countResult.rows[0]?.total ?? '0', 10);

      return {
        logs: result.rows.map(this.mapAdminAuditLog),
        total,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get admin audit logs', err, options);
      throw err;
    } finally {
      client.release();
    }
  }

  private mapAdminAuditLog(row: unknown): AdminAuditLog {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      adminId: r.adminId as string,
      adminName: r.adminName as string | null,
      action: r.action as string,
      targetType: r.targetType as string,
      targetId: r.targetId as string | null,
      details: r.details as Record<string, unknown> | null,
      ipAddress: r.ipAddress as string | null,
      userAgent: r.userAgent as string | null,
      timestamp: r.timestamp as Date,
    };
  }
}
