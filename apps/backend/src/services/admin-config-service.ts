/**
 * Admin Config Service
 *
 * Manages system configurations (business, matching, map, api, system).
 * Handles CRUD operations with versioning and history tracking.
 */

import type { Pool } from 'pg';
import { createLogger } from '../utils/logger';

const logger = createLogger('AdminConfigService');

export type ConfigType = 'business' | 'matching' | 'map' | 'api' | 'system';

export interface AdminConfig {
  id: string;
  configType: ConfigType;
  version: number;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
  isActive: boolean;
}

export interface AdminConfigCreate {
  configType: ConfigType;
  config: Record<string, unknown>;
  updatedBy: string;
}

export interface AdminConfigUpdate {
  config: Record<string, unknown>;
  updatedBy: string;
}

export class AdminConfigService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Get active configuration by type
   */
  async getConfig(configType: ConfigType): Promise<AdminConfig | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT
          id, "configType" as "configType", version, config,
          "createdAt" as "createdAt", "updatedAt" as "updatedAt",
          "updatedBy" as "updatedBy", "isActive" as "isActive"
        FROM admin_configs
        WHERE "configType" = $1 AND "isActive" = true
        ORDER BY version DESC
        LIMIT 1`,
        [configType]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapAdminConfig(result.rows[0] as Record<string, unknown>);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get config', err, { configType });
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Create or update configuration
   * If config exists, deactivates old one and creates new version
   */
  async upsertConfig(data: AdminConfigCreate): Promise<AdminConfig> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Deactivate existing active config
      await client.query(
        `UPDATE admin_configs
        SET "isActive" = false
        WHERE "configType" = $1 AND "isActive" = true`,
        [data.configType]
      );

      // Get next version number
      const versionResult = await client.query<{ version: number }>(
        `SELECT COALESCE(MAX(version), 0) + 1 as version
        FROM admin_configs
        WHERE "configType" = $1`,
        [data.configType]
      );
      const nextVersion = versionResult.rows[0]?.version ?? 1;

      // Create new config
      const id = `config_${data.configType}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const configJson = JSON.stringify(data.config);

      await client.query(
        `INSERT INTO admin_configs (
          id, "configType", version, config,
          "updatedBy", "isActive", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4::jsonb, $5, true, NOW(), NOW())`,
        [id, data.configType, nextVersion, configJson, data.updatedBy]
      );

      await client.query('COMMIT');

      const newConfig = await this.getConfig(data.configType);
      if (!newConfig) {
        throw new Error('Failed to retrieve created config');
      }

      logger.info('Config created/updated', {
        id,
        configType: data.configType,
        version: nextVersion,
        updatedBy: data.updatedBy,
      });

      return newConfig;
    } catch (error) {
      await client.query('ROLLBACK');
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to upsert config', err, { configType: data.configType });
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Update configuration (creates new version)
   */
  async updateConfig(
    configType: ConfigType,
    data: AdminConfigUpdate
  ): Promise<AdminConfig> {
    const existing = await this.getConfig(configType);
    if (!existing) {
      // Create new config if it doesn't exist
      return this.upsertConfig({
        configType,
        config: data.config,
        updatedBy: data.updatedBy,
      });
    }

    // Merge with existing config
    const mergedConfig = {
      ...existing.config,
      ...data.config,
    };

    return this.upsertConfig({
      configType,
      config: mergedConfig,
      updatedBy: data.updatedBy,
    });
  }

  /**
   * Get all configurations (for admin dashboard)
   */
  async getAllConfigs(): Promise<AdminConfig[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT
          id, "configType" as "configType", version, config,
          "createdAt" as "createdAt", "updatedAt" as "updatedAt",
          "updatedBy" as "updatedBy", "isActive" as "isActive"
        FROM admin_configs
        WHERE "isActive" = true
        ORDER BY "configType", version DESC`
      );

      return result.rows.map((row) => this.mapAdminConfig(row as Record<string, unknown>));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get all configs', err);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Map database row to AdminConfig
   */
  private mapAdminConfig(row: Record<string, unknown>): AdminConfig {
    return {
      id: String(row.id),
      configType: row.configType as ConfigType,
      version: Number(row.version),
      config: row.config as Record<string, unknown>,
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
      updatedBy: String(row.updatedBy),
      isActive: Boolean(row.isActive),
    };
  }
}
