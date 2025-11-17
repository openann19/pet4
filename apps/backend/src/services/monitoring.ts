/**
 * Monitoring Service
 *
 * Monitors GDPR operations and sends alerts for anomalies or failures.
 * Tracks metrics and sends notifications for critical events.
 */

import type { Pool } from 'pg';
import { createLogger } from '../utils/logger';

const logger = createLogger('Monitoring');

export interface MonitoringAlert {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  context?: Record<string, unknown>;
  timestamp: Date;
}

export interface MonitoringMetrics {
  exportRequests: number;
  deletionRequests: number;
  consentUpdates: number;
  failures: number;
  averageResponseTime: number;
  lastUpdated: Date;
}

export class MonitoringService {
  private pool: Pool;
  private metrics: MonitoringMetrics;
  private alertHandlers: Array<(alert: MonitoringAlert) => Promise<void>> = [];

  constructor(pool: Pool) {
    this.pool = pool;
    this.metrics = {
      exportRequests: 0,
      deletionRequests: 0,
      consentUpdates: 0,
      failures: 0,
      averageResponseTime: 0,
      lastUpdated: new Date(),
    };

    // Start metrics collection
    this.startMetricsCollection();
  }

  /**
   * Register alert handler
   */
  onAlert(handler: (alert: MonitoringAlert) => Promise<void>): void {
    this.alertHandlers.push(handler);
  }

  /**
   * Send alert
   */
  async sendAlert(alert: MonitoringAlert): Promise<void> {
    logger.warn('Monitoring alert', {
      level: alert.level,
      message: alert.message,
      context: alert.context,
    });

    // Call all alert handlers
    for (const handler of this.alertHandlers) {
      try {
        await handler(alert);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Alert handler failed', err);
      }
    }

    // Store alert in database
    await this.storeAlert(alert);
  }

  /**
   * Track GDPR operation
   */
  trackOperation(
    operation: 'export' | 'delete' | 'consent_update',
    duration: number,
    success: boolean
  ): void {
    switch (operation) {
      case 'export':
        this.metrics.exportRequests++;
        break;
      case 'delete':
        this.metrics.deletionRequests++;
        break;
      case 'consent_update':
        this.metrics.consentUpdates++;
        break;
    }

    if (!success) {
      this.metrics.failures++;
    }

    // Update average response time
    const totalOperations =
      this.metrics.exportRequests +
      this.metrics.deletionRequests +
      this.metrics.consentUpdates;
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (totalOperations - 1) + duration) / totalOperations;

    this.metrics.lastUpdated = new Date();

    // Check for anomalies
    this.checkAnomalies(operation, duration, success);
  }

  /**
   * Get current metrics
   */
  getMetrics(): MonitoringMetrics {
    return { ...this.metrics };
  }

  /**
   * Check for anomalies and send alerts
   */
  private async checkAnomalies(
    operation: 'export' | 'delete' | 'consent_update',
    duration: number,
    success: boolean
  ): Promise<void> {
    // Alert on failures
    if (!success) {
      await this.sendAlert({
        level: 'error',
        message: `GDPR ${operation} operation failed`,
        context: { operation, duration },
        timestamp: new Date(),
      });
    }

    // Alert on slow operations
    const slowThreshold = 5000; // 5 seconds
    if (duration > slowThreshold) {
      await this.sendAlert({
        level: 'warning',
        message: `GDPR ${operation} operation took ${duration}ms (threshold: ${slowThreshold}ms)`,
        context: { operation, duration, threshold: slowThreshold },
        timestamp: new Date(),
      });
    }

    // Alert on high failure rate
    const failureRate = this.metrics.failures / (this.metrics.exportRequests + this.metrics.deletionRequests + this.metrics.consentUpdates);
    if (failureRate > 0.1 && this.metrics.failures > 5) {
      await this.sendAlert({
        level: 'critical',
        message: `High GDPR operation failure rate: ${(failureRate * 100).toFixed(2)}%`,
        context: {
          failureRate,
          failures: this.metrics.failures,
          totalOperations: this.metrics.exportRequests + this.metrics.deletionRequests + this.metrics.consentUpdates,
        },
        timestamp: new Date(),
      });
    }

    // Alert on unusual deletion activity
    if (operation === 'delete' && this.metrics.deletionRequests > 10) {
      await this.sendAlert({
        level: 'warning',
        message: `Unusual deletion activity: ${this.metrics.deletionRequests} deletion requests`,
        context: { deletionRequests: this.metrics.deletionRequests },
        timestamp: new Date(),
      });
    }
  }

  /**
   * Store alert in database
   */
  private async storeAlert(alert: MonitoringAlert): Promise<void> {
    const client = await this.pool.connect();
    try {
      const id = `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      await client.query(
        `INSERT INTO monitoring_alerts (
          id, level, message, context, timestamp
        ) VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (id) DO NOTHING`,
        [
          id,
          alert.level,
          alert.message,
          alert.context ? JSON.stringify(alert.context) : null,
        ]
      );
    } catch (error) {
      // Don't throw - monitoring should not break the main flow
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to store alert', err);
    } finally {
      client.release();
    }
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    // Collect metrics from database every 5 minutes
    setInterval(async () => {
      try {
        await this.collectMetricsFromDatabase();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to collect metrics from database', err);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Collect metrics from database
   */
  private async collectMetricsFromDatabase(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Get metrics from audit logs
      const result = await client.query<{
        action: string;
        status: string;
        count: string;
      }>(
        `SELECT
          action,
          status,
          COUNT(*) as count
        FROM audit_logs
        WHERE timestamp > NOW() - INTERVAL '1 hour'
        GROUP BY action, status`
      );

      // Reset metrics
      this.metrics = {
        exportRequests: 0,
        deletionRequests: 0,
        consentUpdates: 0,
        failures: 0,
        averageResponseTime: 0,
        lastUpdated: new Date(),
      };

      // Update metrics from database
      for (const row of result.rows) {
        const count = Number.parseInt(row.count, 10);
        const isFailure = row.status === 'failure';

        switch (row.action) {
          case 'export':
            this.metrics.exportRequests += count;
            if (isFailure) {
              this.metrics.failures += count;
            }
            break;
          case 'delete':
            this.metrics.deletionRequests += count;
            if (isFailure) {
              this.metrics.failures += count;
            }
            break;
          case 'consent_update':
            this.metrics.consentUpdates += count;
            if (isFailure) {
              this.metrics.failures += count;
            }
            break;
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to collect metrics from database', err);
    } finally {
      client.release();
    }
  }
}

/**
 * Create email alert handler (example implementation)
 */
export function createEmailAlertHandler(_config: {
  from: string;
  to: string[];
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
}): (alert: MonitoringAlert) => Promise<void> {
  return async (alert: MonitoringAlert) => {
    // In production, implement email sending using nodemailer or similar
    logger.info('Email alert would be sent', {
      to: _config.to,
      level: alert.level,
      message: alert.message,
    });

    // Example implementation:
    // const transporter = nodemailer.createTransport({
    //   host: config.smtpHost,
    //   port: config.smtpPort,
    //   auth: {
    //     user: config.smtpUser,
    //     pass: config.smtpPassword,
    //   },
    // });
    // await transporter.sendMail({
    //   from: config.from,
    //   to: config.to.join(', '),
    //   subject: `[${alert.level.toUpperCase()}] GDPR Monitoring Alert`,
    //   text: alert.message,
    //   html: `<p>${alert.message}</p><pre>${JSON.stringify(alert.context, null, 2)}</pre>`,
    // });
  };
}

/**
 * Create Slack alert handler (example implementation)
 */
export function createSlackAlertHandler(_config: {
  webhookUrl: string;
}): (alert: MonitoringAlert) => Promise<void> {
  return async (alert: MonitoringAlert) => {
    // In production, implement Slack webhook sending
    logger.info('Slack alert would be sent', {
      level: alert.level,
      message: alert.message,
    });

    // Example implementation:
    // await fetch(config.webhookUrl, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     text: `[${alert.level.toUpperCase()}] ${alert.message}`,
    //     attachments: [
    //       {
    //         color: alert.level === 'critical' ? 'danger' : alert.level === 'error' ? 'warning' : 'good',
    //         fields: Object.entries(alert.context ?? {}).map(([key, value]) => ({
    //           title: key,
    //           value: String(value),
    //           short: true,
    //         })),
    //       },
    //     ],
    //   }),
    // });
  };
}
