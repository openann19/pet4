/**
 * Photo Moderation API tests
 * Exercises photo moderation operations with mocked services.
 */
import type {
  PhotoModerationMetadata,
  PhotoModerationRecord,
} from '@/core/domain/photo-moderation';
import { photoModerationAPI } from '@/api/photo-moderation-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the services
vi.mock('@/core/services/photo-moderation-storage', () => ({
  photoModerationStorage: {
    createRecord: vi.fn(),
    getRecord: vi.fn(),
    updateRecord: vi.fn(),
    getRecordsByStatus: vi.fn(),
  },
}));

vi.mock('@/core/services/photo-moderation-queue', () => ({
  photoModerationQueue: {
    enqueue: vi.fn(),
    updateStatus: vi.fn(),
    dequeue: vi.fn(),
    getStats: vi.fn(),
  },
}));

vi.mock('@/core/services/photo-scanning', () => ({
  photoScanningService: {
    scanPhoto: vi.fn(),
    shouldAutoApprove: vi.fn(),
    shouldQuarantine: vi.fn(),
  },
}));

vi.mock('@/core/services/photo-moderation-events', () => ({
  photoModerationEvents: {
    emitStateChange: vi.fn(),
  },
}));

vi.mock('@/core/services/photo-moderation-audit', () => ({
  photoModerationAudit: {
    logEvent: vi.fn(),
    getPhotoAuditLogs: vi.fn(),
  },
}));

vi.mock('@/lib/kyc-service', () => ({
  getKYCStatus: vi.fn(),
}));

import { photoModerationStorage } from '@/core/services/photo-moderation-storage';
import { photoModerationQueue } from '@/core/services/photo-moderation-queue';
import { photoScanningService } from '@/core/services/photo-scanning';
import { photoModerationEvents } from '@/core/services/photo-moderation-events';
import { photoModerationAudit } from '@/core/services/photo-moderation-audit';
import { getKYCStatus } from '@/lib/kyc-service';

const mockMetadata: PhotoModerationMetadata = {
  photoId: 'photo-1',
  uploadedBy: 'user-1',
  uploadedAt: new Date().toISOString(),
  contentType: 'image/jpeg',
  sizeBytes: 1024,
  width: 1920,
  height: 1080,
};

const mockRecord: PhotoModerationRecord = {
  photoId: 'photo-1',
  status: 'pending',
  metadata: mockMetadata,
  kycRequired: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('PhotoModerationAPI.submitPhoto', () => {
  it('should submit photo for moderation', async () => {
    vi.mocked(photoModerationStorage.createRecord).mockResolvedValue(mockRecord);
    vi.mocked(photoModerationQueue.enqueue).mockResolvedValue(undefined);
    vi.mocked(photoScanningService.scanPhoto).mockResolvedValue({
      nsfwScore: 0.1,
      toxicityScore: 0.1,
      contentFingerprint: 'fingerprint-1',
      detectedIssues: [],
      requiresManualReview: false,
      scannedAt: new Date().toISOString(),
    });
    vi.mocked(photoScanningService.shouldAutoApprove).mockReturnValue(false);
    vi.mocked(photoScanningService.shouldQuarantine).mockReturnValue(false);
    vi.mocked(photoModerationStorage.updateRecord).mockResolvedValue(mockRecord);
    vi.mocked(photoModerationQueue.updateStatus).mockResolvedValue(undefined);
    vi.mocked(photoModerationEvents.emitStateChange).mockResolvedValue(undefined);

    const record = await photoModerationAPI.submitPhoto({
      photoId: 'photo-1',
      photoUrl: 'https://example.com/photo.jpg',
      metadata: mockMetadata,
    });

    expect(record).toMatchObject({
      photoId: 'photo-1',
    });
    expect(photoModerationStorage.createRecord).toHaveBeenCalled();
    expect(photoModerationQueue.enqueue).toHaveBeenCalled();
  });

  it('should throw on error', async () => {
    vi.mocked(photoModerationStorage.createRecord).mockRejectedValue(new Error('Storage error'));

    await expect(
      photoModerationAPI.submitPhoto({
        photoId: 'photo-1',
        photoUrl: 'https://example.com/photo.jpg',
        metadata: mockMetadata,
      })
    ).rejects.toThrow();
  });
});

describe('PhotoModerationAPI.updateStatus', () => {
  it('should update status', async () => {
    vi.mocked(photoModerationStorage.getRecord).mockResolvedValue(mockRecord);
    vi.mocked(photoModerationStorage.updateRecord).mockResolvedValue({
      ...mockRecord,
      status: 'approved',
    });
    vi.mocked(photoModerationQueue.updateStatus).mockResolvedValue(undefined);
    vi.mocked(photoModerationAudit.logEvent).mockResolvedValue({
      auditId: 'audit-1',
      photoId: 'photo-1',
      action: 'approve',
      performedBy: 'admin-1',
      performedAt: new Date().toISOString(),
      previousStatus: 'pending',
      newStatus: 'approved',
      metadata: {},
    });
    vi.mocked(photoModerationEvents.emitStateChange).mockResolvedValue(undefined);

    const record = await photoModerationAPI.updateStatus({
      photoId: 'photo-1',
      action: 'approve',
      performedBy: 'admin-1',
      status: 'approved',
    });

    expect(record).toMatchObject({
      status: 'approved',
    });
  });

  it('should throw on invalid transition', async () => {
    vi.mocked(photoModerationStorage.getRecord).mockResolvedValue({
      ...mockRecord,
      status: 'approved',
    });

    await expect(
      photoModerationAPI.updateStatus({
        photoId: 'photo-1',
        action: 'approve',
        performedBy: 'admin-1',
        status: 'pending',
      })
    ).rejects.toThrow();
  });

  it('should throw on error', async () => {
    vi.mocked(photoModerationStorage.getRecord).mockRejectedValue(new Error('Storage error'));

    await expect(
      photoModerationAPI.updateStatus({
        photoId: 'photo-1',
        action: 'approve',
        performedBy: 'admin-1',
        status: 'approved',
      })
    ).rejects.toThrow();
  });
});

describe('PhotoModerationAPI.getStatus', () => {
  it('should return status', async () => {
    vi.mocked(photoModerationStorage.getRecord).mockResolvedValue(mockRecord);
    vi.mocked(getKYCStatus).mockResolvedValue('verified');

    const result = await photoModerationAPI.getStatus('photo-1', 'user-1');

    expect(result).toMatchObject({
      record: expect.any(Object),
      isVisible: expect.any(Boolean),
      requiresKYC: expect.any(Boolean),
    });
  });

  it('should throw on missing record', async () => {
    vi.mocked(photoModerationStorage.getRecord).mockResolvedValue(null);

    await expect(photoModerationAPI.getStatus('photo-999', 'user-1')).rejects.toThrow();
  });

  it('should throw on error', async () => {
    vi.mocked(photoModerationStorage.getRecord).mockRejectedValue(new Error('Storage error'));

    await expect(photoModerationAPI.getStatus('photo-1', 'user-1')).rejects.toThrow();
  });
});

describe('PhotoModerationAPI.isPhotoVisible', () => {
  it('should return visibility', async () => {
    vi.mocked(photoModerationStorage.getRecord).mockResolvedValue(mockRecord);
    vi.mocked(getKYCStatus).mockResolvedValue('verified');

    const visible = await photoModerationAPI.isPhotoVisible('photo-1', 'user-1');

    expect(typeof visible).toBe('boolean');
  });

  it('should return false on error', async () => {
    vi.mocked(photoModerationStorage.getRecord).mockRejectedValue(new Error('Storage error'));

    const visible = await photoModerationAPI.isPhotoVisible('photo-1', 'user-1');

    expect(visible).toBe(false);
  });
});

describe('PhotoModerationAPI.getPendingPhotos', () => {
  it('should return pending photos', async () => {
    vi.mocked(photoModerationStorage.getRecordsByStatus).mockResolvedValue([mockRecord]);

    const photos = await photoModerationAPI.getPendingPhotos();

    expect(Array.isArray(photos)).toBe(true);
  });

  it('should throw on error', async () => {
    vi.mocked(photoModerationStorage.getRecordsByStatus).mockRejectedValue(
      new Error('Storage error')
    );

    await expect(photoModerationAPI.getPendingPhotos()).rejects.toThrow();
  });
});

describe('PhotoModerationAPI.getQuarantinedPhotos', () => {
  it('should return quarantined photos', async () => {
    vi.mocked(photoModerationStorage.getRecordsByStatus).mockResolvedValue([
      { ...mockRecord, status: 'quarantined' },
    ]);

    const photos = await photoModerationAPI.getQuarantinedPhotos();

    expect(Array.isArray(photos)).toBe(true);
  });

  it('should throw on error', async () => {
    vi.mocked(photoModerationStorage.getRecordsByStatus).mockRejectedValue(
      new Error('Storage error')
    );

    await expect(photoModerationAPI.getQuarantinedPhotos()).rejects.toThrow();
  });
});

describe('PhotoModerationAPI.getQueueStats', () => {
  it('should return queue stats', async () => {
    vi.mocked(photoModerationQueue.getStats).mockResolvedValue({
      pending: 10,
      scanning: 2,
      heldForKYC: 1,
      quarantined: 3,
      total: 16,
    });

    const stats = await photoModerationAPI.getQueueStats();

    expect(stats).toMatchObject({
      pending: expect.any(Number),
      total: expect.any(Number),
    });
  });

  it('should throw on error', async () => {
    vi.mocked(photoModerationQueue.getStats).mockRejectedValue(new Error('Queue error'));

    await expect(photoModerationAPI.getQueueStats()).rejects.toThrow();
  });
});

describe('PhotoModerationAPI.getAuditLogs', () => {
  it('should return audit logs', async () => {
    vi.mocked(photoModerationAudit.getPhotoAuditLogs).mockResolvedValue([]);

    const logs = await photoModerationAPI.getAuditLogs('photo-1');

    expect(Array.isArray(logs)).toBe(true);
  });

  it('should throw on error', async () => {
    vi.mocked(photoModerationAudit.getPhotoAuditLogs).mockRejectedValue(new Error('Audit error'));

    await expect(photoModerationAPI.getAuditLogs('photo-1')).rejects.toThrow();
  });
});
