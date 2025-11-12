import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { PhotoService, ModerationService, KYCService } from './backend-services';
import type { KYCSession, ModerationTask, PhotoRecord, UploadSession } from './backend-types';

const photoService = new PhotoService();
const moderationService = new ModerationService();
const kycService = new KYCService();

const basePhoto: PhotoRecord = {
  id: 'photo-1',
  petId: 'pet-1',
  ownerId: 'owner-1',
  status: 'awaiting_review',
  originalUrl: 'https://cdn/pet.jpg',
  variants: [],
  metadata: {
    fileHash: 'hash',
    contentFingerprint: 'fingerprint',
    originalFilename: 'pet.jpg',
    mimeType: 'image/jpeg',
    fileSize: 1234,
    width: 1024,
    height: 768,
    exifStripped: true,
  },
  safetyCheck: {
    isNSFW: false,
    isViolent: false,
    hasHumanFaces: false,
    humanFaceCount: 0,
    humanFaceDominance: 0,
    isDuplicate: false,
    confidence: {
      nsfw: 0,
      violence: 0,
      animal: 1,
      humanFace: 0,
    },
    flags: [],
    scannedAt: new Date().toISOString(),
  },
  uploadedAt: new Date().toISOString(),
};

const baseTask: ModerationTask = {
  id: 'task-1',
  photoId: basePhoto.id,
  petId: basePhoto.petId,
  ownerId: basePhoto.ownerId,
  priority: 'low',
  status: 'pending',
  createdAt: new Date().toISOString(),
};

const quota = {
  userId: 'owner-1',
  uploadsToday: 0,
  uploadsThisHour: 0,
  totalStorage: 0,
  resetAt: new Date().toISOString(),
};

const policy = {
  requireKYCToPublish: false,
  requireKYCByRegion: {},
  blockHumanDominantPhotos: true,
  humanDominanceThreshold: 0.7,
  breedScoreThreshold: 0.6,
  maxUploadsPerDay: 10,
  maxUploadsPerHour: 5,
  maxStoragePerUser: 1024 * 1024,
  retentionDaysRejected: 30,
  retentionDaysLogs: 365,
  autoApproveThreshold: 0.95,
  enableDuplicateDetection: true,
};

const auditLogSpy = vi.fn();
const notificationSpy = vi.fn();
const eventSpy = vi.fn();

let server: ReturnType<typeof createServer>;

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const body = Buffer.concat(chunks).toString('utf8');
  return body ? (JSON.parse(body) as T) : ({} as T);
}

beforeAll(async () => {
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url || !req.method) {
      res.statusCode = 400;
      res.end();
      return;
    }

    const url = new URL(req.url, 'http://localhost:8080');

    if (
      req.method === 'GET' &&
      url.pathname.startsWith('/users/') &&
      url.pathname.endsWith('/quota')
    ) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: quota }));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/uploads/sign-url') {
      const payload = await readJson<{ userId: string; petId: string }>(req);
      const session: UploadSession = {
        id: 'session-1',
        userId: payload.userId,
        petId: payload.petId,
        uploadUrl: 'https://upload/session-1',
        expiresAt: new Date(Date.now() + 600000).toISOString(),
        maxFileSize: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg'],
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { session } }));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/admin/moderation/policy') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { policy } }));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/photos') {
      const payload = await readJson<{ sessionId: string }>(req);
      const ownerId = payload.sessionId?.includes('owner-1') ? 'owner-1' : basePhoto.ownerId;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { photo: { ...basePhoto, ownerId } } }));
      return;
    }

    if (req.method === 'POST' && url.pathname.endsWith('/quota/increment')) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { success: true } }));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/events') {
      eventSpy();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { success: true } }));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/photos') {
      const ownerId = url.searchParams.get('ownerId');
      const photos = ownerId === basePhoto.ownerId ? [basePhoto] : [];
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { photos } }));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/admin/moderation/tasks') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { task: baseTask } }));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/admin/moderation/tasks') {
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            queue: {
              pending: [baseTask],
              inProgress: [],
              completed: [],
              totalCount: 1,
              averageReviewTime: 0,
            },
          },
        })
      );
      return;
    }

    if (req.method === 'POST' && url.pathname === '/admin/audit-logs') {
      auditLogSpy();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { success: true } }));
      return;
    }

    if (
      req.method === 'POST' &&
      url.pathname.startsWith('/admin/moderation/tasks/') &&
      url.pathname.endsWith('/take')
    ) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { task: { ...baseTask, status: 'in_progress' } } }));
      return;
    }

    if (req.method === 'PATCH' && url.pathname.startsWith('/admin/moderation/tasks/')) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { task: { ...baseTask, status: 'completed' } } }));
      return;
    }

    if (req.method === 'GET' && url.pathname === `/photos/${basePhoto.id}`) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { photo: basePhoto } }));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/notifications') {
      notificationSpy();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { success: true } }));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/admin/moderation/metrics') {
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            metrics: {
              totalReviews: 1,
              approvalRate: 1,
              rejectionRate: 0,
              averageReviewTime: 0,
              queueBacklog: 0,
              topRejectReasons: [],
              reviewsByReviewer: [],
              kycPassRate: 1,
              duplicateRate: 0,
            },
          },
        })
      );
      return;
    }

    if (req.method === 'POST' && url.pathname === '/kyc/start') {
      const payload = await readJson<{ userId: string }>(req);
      const session: KYCSession = {
        id: 'kyc-1',
        userId: payload.userId,
        status: 'pending',
        provider: 'manual',
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        retryCount: 0,
      };
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { session } }));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/kyc/status') {
      if (url.searchParams.get('userId') === 'user-kyc') {
        const session: KYCSession = {
          id: 'kyc-1',
          userId: 'user-kyc',
          status: 'pending',
          provider: 'manual',
          documents: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          retryCount: 0,
        };
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: { session } }));
        return;
      }

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: null }));
      return;
    }

    if (
      (req.method === 'PATCH' || req.method === 'POST') &&
      url.pathname.startsWith('/kyc/verifications/')
    ) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { success: true } }));
      return;
    }

    res.statusCode = 404;
    res.end();
  });

  await new Promise<void>((resolve) => server.listen(8080, resolve));
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

afterEach(() => {
  auditLogSpy.mockReset();
  notificationSpy.mockReset();
  eventSpy.mockReset();
});

describe('PhotoService', () => {
  it('creates upload sessions via backend', async () => {
    const session = await photoService.createUploadSession('owner-1', 'pet-1');
    expect(session).toMatchObject({ id: 'session-1', status: 'pending' });
  });

  it('processes uploads through backend pipeline', async () => {
    const photo = await photoService.processUpload('session-owner-1', {
      size: 1024,
      type: 'image/jpeg',
      data: 'encoded-data',
    });

    expect(photo).toMatchObject({ id: basePhoto.id, ownerId: basePhoto.ownerId });
    expect(eventSpy).toHaveBeenCalled();
  });

  it('fetches owner photos from backend', async () => {
    const photos = await photoService.getPhotosByOwner(basePhoto.ownerId);
    expect(photos).toHaveLength(1);
    expect(photos[0]?.id).toBe(basePhoto.id);
  });

  it('creates moderation tasks remotely', async () => {
    const task = await photoService.createModerationTask(basePhoto);
    expect(task).toMatchObject({ id: baseTask.id, status: baseTask.status });
  });
});

describe('ModerationService', () => {
  it('fetches moderation queue', async () => {
    const queue = await moderationService.getQueue();
    expect(queue.pending).toHaveLength(1);
    expect(queue.totalCount).toBe(1);
  });

  it('assigns tasks and records audit log', async () => {
    const task = await moderationService.takeTask(baseTask.id, 'moderator-1');
    expect(task.status).toBe('in_progress');
    expect(auditLogSpy).toHaveBeenCalled();
  });

  it('submits moderation decisions and notifies user', async () => {
    const task = await moderationService.makeDecision(
      baseTask.id,
      'approve',
      undefined,
      undefined,
      'moderator-1',
      'Moderator'
    );

    expect(task.status).toBe('completed');
    expect(notificationSpy).toHaveBeenCalled();
  });

  it('retrieves metrics from backend', async () => {
    const metrics = await moderationService.getMetrics();
    expect(metrics).toMatchObject({ totalReviews: 1, approvalRate: 1 });
  });
});

describe('KYCService', () => {
  it('creates sessions through backend', async () => {
    const session = await kycService.createSession('user-kyc');
    expect(session).toMatchObject({ id: 'kyc-1', status: 'pending' });
  });

  it('retrieves latest session for user', async () => {
    const session = await kycService.getUserSession('user-kyc');
    expect(session).not.toBeNull();
    expect(session?.id).toBe('kyc-1');
  });
});
