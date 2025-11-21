/**
 * Admin moderation API client
 *
 * Provides typed helpers to interact with server-side moderation endpoints.
 */

import { env } from '@/config/env';
import type { MessageReport } from '@/lib/chat-types';
import type { Report, ReportResolution } from '@/lib/contracts';
import { createLogger } from '@/lib/logger';

const logger = createLogger('admin.api');

interface RawMessageReport {
  readonly id: string;
  readonly messageId: string;
  readonly roomId: string;
  readonly reporterId: string;
  readonly reportedUserId: string;
  readonly reason: string;
  readonly description?: string;
  readonly status: 'OPEN' | 'RESOLVED' | 'DISMISSED' | (string & {});
  readonly action?: string;
  readonly createdAt: string;
  readonly reviewedBy?: string;
  readonly reviewedAt?: string;
  readonly notes?: string;
}

interface RawReport {
  readonly id: string;
  readonly reporterId: string;
  readonly reportedEntityType: 'user' | 'pet' | 'message';
  readonly reportedEntityId: string;
  readonly reason: string;
  readonly details: string;
  readonly status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  readonly assignedTo?: string;
  readonly resolution?: {
    readonly action: string;
    readonly notes: string;
    readonly resolvedBy: string;
  };
  readonly createdAt: string;
  readonly resolvedAt?: string;
}

const BASE_URL = `${env.VITE_API_URL}/admin`;

function mapStatus(status: RawMessageReport['status']): MessageReport['status'] {
  switch (status) {
    case 'OPEN':
      return 'pending';
    case 'RESOLVED':
      return 'resolved';
    case 'DISMISSED':
      return 'dismissed';
    default:
      return status.toLowerCase() as MessageReport['status'];
  }
}

function normaliseMessageReport(raw: RawMessageReport): MessageReport {
  const reason = ['spam', 'harassment', 'inappropriate', 'other'].includes(raw.reason)
    ? (raw.reason as MessageReport['reason'])
    : 'other';

  const report: MessageReport = {
    id: raw.id,
    messageId: raw.messageId,
    roomId: raw.roomId,
    reportedBy: raw.reporterId,
    reportedUserId: raw.reportedUserId,
    reason,
    status: mapStatus(raw.status),
    createdAt: raw.createdAt,
  };

  if (raw.description !== undefined) {
    report.description = raw.description;
  }
  if (raw.reviewedBy !== undefined) {
    report.reviewedBy = raw.reviewedBy;
  }
  if (raw.reviewedAt !== undefined) {
    report.reviewedAt = raw.reviewedAt;
  }
  if (raw.action !== undefined) {
    const action = ['warning', 'mute', 'suspend', 'no_action'].includes(raw.action)
      ? (raw.action as MessageReport['action'])
      : undefined;
    if (action) {
      report.action = action;
    }
  }

  return report;
}

function normaliseReport(raw: RawReport): Report {
  const reason: Report['reason'] = [
    'spam',
    'inappropriate',
    'fake',
    'harassment',
    'other',
  ].includes(raw.reason)
    ? (raw.reason as Report['reason'])
    : 'other';

  const report: Report = {
    id: raw.id,
    reporterId: raw.reporterId,
    reportedEntityType: raw.reportedEntityType,
    reportedEntityId: raw.reportedEntityId,
    reason,
    details: raw.details,
    status: raw.status,
    createdAt: raw.createdAt,
  };

  if (raw.assignedTo !== undefined) {
    report.assignedTo = raw.assignedTo;
  }
  if (raw.resolution !== undefined) {
    const action: ReportResolution['action'] = [
      'warn',
      'suspend',
      'ban',
      'remove_content',
      'no_action',
    ].includes(raw.resolution.action)
      ? (raw.resolution.action as ReportResolution['action'])
      : 'no_action';
    report.resolution = {
      action,
      notes: raw.resolution.notes,
      resolvedBy: raw.resolution.resolvedBy,
    };
  }
  if (raw.resolvedAt !== undefined) {
    report.resolvedAt = raw.resolvedAt;
  }

  return report;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    ...init,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const error = new Error(`Admin API ${path} failed with ${res.status}: ${body}`);
    logger.error('Admin API request failed', error, { path, status: res.status });
    throw error;
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export const adminModerationApi = {
  async listReports(): Promise<MessageReport[]> {
    const payload = await request<RawMessageReport[]>('/reports');
    return payload.map(normaliseMessageReport);
  },

  async resolveReport(reportId: string, notes?: string): Promise<MessageReport> {
    const payload = await request<RawMessageReport>(`/reports/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    return normaliseMessageReport(payload);
  },

  async dismissReport(reportId: string, notes?: string): Promise<MessageReport> {
    const payload = await request<RawMessageReport>(`/reports/${reportId}/dismiss`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    return normaliseMessageReport(payload);
  },
};

/**
 * General admin reports API for all report types (user, pet, message)
 */
export const adminReportsApi = {
  /**
   * List all reports (user, pet, message)
   */
  async listReports(): Promise<Report[]> {
    const payload = await request<RawReport[]>('/reports/all');
    return payload.map(normaliseReport);
  },

  /**
   * Get a single report by ID
   */
  async getReport(reportId: string): Promise<Report> {
    const payload = await request<RawReport>(`/reports/${reportId}`);
    return normaliseReport(payload);
  },

  /**
   * Resolve a report with an action
   */
  async resolveReport(
    reportId: string,
    resolution: {
      action: ReportResolution['action'];
      notes: string;
    }
  ): Promise<Report> {
    const payload = await request<RawReport>(`/reports/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(resolution),
    });
    return normaliseReport(payload);
  },

  /**
   * Dismiss a report (no action needed)
   */
  async dismissReport(reportId: string, notes?: string): Promise<Report> {
    const payload = await request<RawReport>(`/reports/${reportId}/dismiss`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    return normaliseReport(payload);
  },
};
