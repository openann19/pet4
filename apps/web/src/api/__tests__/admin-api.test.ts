/**
 * Admin API tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { URL } from 'node:url'

import { adminApi } from '@/api/admin-api'
import type { AuditLogEntry, SystemStats } from '@/api/admin-api'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

let server: ReturnType<typeof createServer>

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const body = Buffer.concat(chunks).toString('utf8')
  return body ? (JSON.parse(body) as T) : ({} as T)
}

const mockSystemStats: SystemStats = {
  totalUsers: 1000,
  activeUsers: 500,
  totalPets: 2000,
  totalMatches: 5000,
  totalMessages: 10000,
  pendingReports: 5,
  pendingVerifications: 10,
  resolvedReports: 100,
}

const mockAuditLog: AuditLogEntry = {
  id: 'audit-1',
  adminId: 'admin-1',
  action: 'moderate_content',
  targetType: 'post',
  targetId: 'post-1',
  details: 'Content moderated',
  timestamp: new Date().toISOString(),
  ipAddress: '127.0.0.1',
}

beforeAll(async () => {
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url || !req.method) {
      res.statusCode = 400
      res.end()
      return
    }

    const url = new URL(req.url, 'http://localhost:8080')

    if (req.method === 'GET' && url.pathname === '/admin/analytics') {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: mockSystemStats }))
      return
    }

    if (req.method === 'POST' && url.pathname === '/admin/settings/audit') {
      const payload = await readJson<Omit<AuditLogEntry, 'id' | 'timestamp'>>(req)
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 201
      res.end(JSON.stringify({ data: { ...payload, id: 'audit-1', timestamp: new Date().toISOString() } }))
      return
    }

    if (req.method === 'GET' && url.pathname === '/admin/settings/audit') {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: [mockAuditLog] }))
      return
    }

    if (req.method === 'POST' && url.pathname === '/admin/settings/moderate') {
      const payload = await readJson<{ taskId: string; action: string; reason?: string }>(req)
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 200
      res.end(JSON.stringify({ data: { success: true, taskId: payload.taskId } }))
      return
    }

    res.statusCode = 404
    res.end()
  })

  await new Promise<void>(resolve => {
    server.listen(0, () => {
      const address = server.address()
      if (address && typeof address === 'object') {
        process.env['TEST_API_PORT'] = String(address.port)
      }
      resolve()
    })
  })
})

afterAll(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()))
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('AdminAPI.getSystemStats', () => {
  it('should return system statistics', async () => {
    const stats = await adminApi.getSystemStats()

    expect(stats).toMatchObject({
      totalUsers: expect.any(Number),
      activeUsers: expect.any(Number),
      totalPets: expect.any(Number),
      totalMatches: expect.any(Number),
      totalMessages: expect.any(Number),
      pendingReports: expect.any(Number),
      pendingVerifications: expect.any(Number),
      resolvedReports: expect.any(Number),
    })
  })

  it('should return default stats on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    const stats = await adminApi.getSystemStats()

    expect(stats).toMatchObject({
      totalUsers: 0,
      activeUsers: 0,
      totalPets: 0,
      totalMatches: 0,
      totalMessages: 0,
      pendingReports: 0,
      pendingVerifications: 0,
      resolvedReports: 0,
    })

    global.fetch = originalFetch
  })
})

describe('AdminAPI.createAuditLog', () => {
  it('should create audit log entry', async () => {
    const entry = {
      adminId: 'admin-1',
      action: 'moderate_content',
      targetType: 'post',
      targetId: 'post-1',
      details: 'Content moderated',
      ipAddress: '127.0.0.1',
    }

    await expect(adminApi.createAuditLog(entry)).resolves.not.toThrow()
  })

  it('should not throw on failure', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    const entry = {
      adminId: 'admin-1',
      action: 'moderate_content',
      targetType: 'post',
      targetId: 'post-1',
    }

    await expect(adminApi.createAuditLog(entry)).resolves.not.toThrow()

    global.fetch = originalFetch
  })
})

describe('AdminAPI.getAuditLogs', () => {
  it('should return audit logs', async () => {
    const logs = await adminApi.getAuditLogs(100)

    expect(Array.isArray(logs)).toBe(true)
    if (logs.length > 0) {
      expect(logs[0]).toMatchObject({
        id: expect.any(String),
        adminId: expect.any(String),
        action: expect.any(String),
        targetType: expect.any(String),
        targetId: expect.any(String),
        timestamp: expect.any(String),
      })
    }
  })

  it('should return empty array on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    const logs = await adminApi.getAuditLogs(100)

    expect(logs).toEqual([])

    global.fetch = originalFetch
  })

  it('should accept limit parameter', async () => {
    const logs = await adminApi.getAuditLogs(50)

    expect(Array.isArray(logs)).toBe(true)
  })
})

describe('AdminAPI.moderatePhoto', () => {
  it('should moderate photo successfully', async () => {
    await expect(
      adminApi.moderatePhoto('task-1', 'approve', 'Photo is appropriate')
    ).resolves.not.toThrow()
  })

  it('should moderate photo without reason', async () => {
    await expect(adminApi.moderatePhoto('task-1', 'reject')).resolves.not.toThrow()
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(adminApi.moderatePhoto('task-1', 'approve')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

