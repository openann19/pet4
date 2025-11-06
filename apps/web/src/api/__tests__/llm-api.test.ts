/**
 * LLM API tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { URL } from 'node:url'

import { llmApi } from '@/api/llm-api'
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

beforeAll(async () => {
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url || !req.method) {
      res.statusCode = 400
      res.end()
      return
    }

    const url = new URL(req.url, 'http://localhost:8080')

    if (req.method === 'POST' && url.pathname === '/llm/chat') {
      const payload = await readJson<{ prompt: string | Record<string, unknown>; model?: string; jsonMode?: boolean }>(req)
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          data: {
            response: typeof payload.prompt === 'string' ? `Response to: ${payload.prompt}` : 'Response',
            model: payload.model || 'default',
            tokensUsed: 100,
          },
        })
      )
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

describe('LLMAPI.call', () => {
  it('should call LLM with string prompt', async () => {
    const response = await llmApi.call('What is the weather?')

    expect(typeof response).toBe('string')
    expect(response.length).toBeGreaterThan(0)
  })

  it('should call LLM with object prompt', async () => {
    const response = await llmApi.call({ question: 'What is the weather?' })

    expect(typeof response).toBe('string')
  })

  it('should accept model parameter', async () => {
    const response = await llmApi.call('Hello', 'gpt-4')

    expect(typeof response).toBe('string')
  })

  it('should accept jsonMode parameter', async () => {
    const response = await llmApi.call('Hello', undefined, true)

    expect(typeof response).toBe('string')
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(llmApi.call('Hello')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

