import { describe, it, expect, vi } from 'vitest'
import { enqueue, flushPendingUploads } from '../src/lib/upload-queue'
import { storage } from '../src/lib/storage'

vi.mock('../src/lib/storage', () => {
  const mem = new Map<string, string>()
  return {
    storage: {
      get: (k: string) => (mem.has(k) ? JSON.parse(mem.get(k)!) : null),
      set: (k: string, v: unknown) => mem.set(k, JSON.stringify(v)),
      delete: (k: string) => mem.delete(k),
    },
  }
})

describe('upload queue', () => {
  it('backs off on failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    enqueue({ id: '1', uri: 'file://x', endpoint: 'https://api/upload' })
    await flushPendingUploads()
    const q = (storage.get as unknown as (key: string) => unknown)('upload-queue/v1')
    expect(q).toBeDefined()
    if (q && typeof q === 'object' && Array.isArray(q)) {
      expect(q.length).toBe(1)
      expect((q[0] as { tries: number }).tries).toBe(1)
      expect((q[0] as { nextAt: number }).nextAt).toBeGreaterThan(Date.now())
    }
  })
})
