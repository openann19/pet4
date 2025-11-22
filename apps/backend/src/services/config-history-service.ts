/**
 * Config History Service
 *
 * Tracks configuration changes with full history and versioning.
 * Enables audit trail and rollback capabilities.
 */

import type { Pool } from 'pg';
import { createLogger } from '../utils/logger';
import type { ConfigType } from './admin-config-service';

const logger = createLogger('ConfigHistoryService');

export interface ConfigHistoryEntry {
  id: string;
  configId: string;
  configType: ConfigType;
  version: number;
  previousVersion: number | null;
  changedBy: string;
  changedByName: string | null;
  changes: Record<string, unknown>;
  previousConfig: Record<string, unknown> | null;
  newConfig: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
}

export interface ConfigHistoryCreate {
  configId: string;
  configType: ConfigType;
  version: number;
  previousVersion: number | null;
  changedBy: string;
  changedByName?: string;
  changes: Record<string, unknown>;
  previousConfig: Record<string, unknown> | null;
  newConfig: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class ConfigHistoryService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create history entry for config change
   */
  async createHistoryEntry(data: ConfigHistoryCreate): Promise<ConfigHistoryEntry> {
    const client = await this.pool.connect();
    try {
      const id = `history_${data.configType}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      await client.query(
        `INSERT INTO config_history (
          id, "configId", "configType", version, "previousVersion",
          "changedBy", "changedByName", changes, "previousConfig", "newConfig",
          "ipAddress", "userAgent", "timestamp"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11, $12, NOW())`,
        [
          id,
          data.configId,
          data.configType,
          data.version,
          data.previousVersion ?? null,
          data.changedBy,
          data.changedByName ?? null,
          JSON.stringify(data.changes),
          data.previousConfig ? JSON.stringify(data.previousConfig) : null,
          JSON.stringify(data.newConfig),
          data.ipAddress ?? null,
          data.userAgent ?? null,
        ]
      );

      const entry = await this.getHistoryEntry(id);
      if (!entry) {
        throw new Error('Failed to retrieve created history entry');
      }

      logger.info('Config history entry created', {
        id,
        configType: data.configType,
        version: data.version,
        changedBy: data.changedBy,
      });

      return entry;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create history entry', err, {
        configType: data.configType,
        version: data.version,
      });
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get history entry by ID
   */
  async getHistoryEntry(id: string): Promise<ConfigHistoryEntry | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT
          id, "configId" as "configId", "configType" as "configType",
          version, "previousVersion" as "previousVersion",
          "changedBy" as "changedBy", "changedByName" as "changedByName",
          changes, "previousConfig" as "previousConfig", "newConfig" as "newConfig",
          "ipAddress" as "ipAddress", "userAgent" as "userAgent",
          "timestamp" as "timestamp"
        FROM config_history
        WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapHistoryEntry(result.rows[0] as Record<string, unknown>);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get history entry', err, { id });
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get history for a specific config type
   */
  async getConfigHistory(
    configType: ConfigType,
    limit = 50
  ): Promise<ConfigHistoryEntry[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT
          id, "configId" as "configId", "configType" as "configType",
          version, "previousVersion" as "previousVersion",
          "changedBy" as "changedBy", "changedByName" as "changedByName",
          changes, "previousConfig" as "previousConfig", "newConfig" as "newConfig",
          "ipAddress" as "ipAddress", "userAgent" as "userAgent",
          "timestamp" as "timestamp"
        FROM config_history
        WHERE "configType" = $1
        ORDER BY "timestamp" DESC, version DESC
        LIMIT $2`,
        [configType, limit]
      );

      return result.rows.map((row) => this.mapHistoryEntry(row as Record<string, unknown>));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get config history', err, { configType });
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get history for a specific config ID
   */
  async getConfigHistoryById(
    configId: string,
    limit = 50
  ): Promise<ConfigHistoryEntry[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT
          id, "configId" as "configId", "configType" as "configType",
          version, "previousVersion" as "previousVersion",
          "changedBy" as "changedBy", "changedByName" as "changedByName",
          changes, "previousConfig" as "previousConfig", "newConfig" as "newConfig",
          "ipAddress" as "ipAddress", "userAgent" as "userAgent",
          "timestamp" as "timestamp"
        FROM config_history
        WHERE "configId" = $1
        ORDER BY "timestamp" DESC, version DESC
        LIMIT $2`,
        [configId, limit]
      );

      return result.rows.map((row) => this.mapHistoryEntry(row as Record<string, unknown>));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get config history by ID', err, { configId });
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Map database row to ConfigHistoryEntry
   */
  private mapHistoryEntry(row: Record<string, unknown>): ConfigHistoryEntry {
    return {
      id: String(row.id),
      configId: String(row.configId),
      configType: row.configType as ConfigType,
      version: Number(row.version),
      previousVersion: row.previousVersion ? Number(row.previousVersion) : null,
      changedBy: String(row.changedBy),
      changedByName: row.changedByName ? String(row.changedByName) : null,
      changes: row.changes as Record<string, unknown>,
      previousConfig: row.previousConfig
        ? (row.previousConfig as Record<string, unknown>)
        : null,
      newConfig: row.newConfig as Record<string, unknown>,
      ipAddress: row.ipAddress ? String(row.ipAddress) : null,
      userAgent: row.userAgent ? String(row.userAgent) : null,
      timestamp: row.timestamp as Date,
    };
  }
}
