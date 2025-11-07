/**
 * Chat API tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { URL } from 'node:url'

import { chatApi } from '@/api/chat-api'
import type { Message, MessageType } from '@/lib/chat-types'
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

const mockMessage: Message = {
  id: 'msg-1',
  roomId: 'room-1',
  senderId: 'user-1',
  type: 'text',
  content: 'Hello',
  status: 'sent',
  createdAt: new Date().toISOString(),
}

beforeAll(async () => {
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url || !req.method) {
      res.statusCode = 400
      res.end()
      return
    }

    const url = new URL(req.url, 'http://localhost:8080')

    if (req.method === 'POST' && url.pathname.includes('/messages')) {
      const payload = await readJson<{ type: MessageType; content: string }>(req)
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 201
      res.end(JSON.stringify({ data: { ...mockMessage, ...payload } }))
      return
    }

    if (req.method === 'GET' && url.pathname.includes('/messages')) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { messages: [mockMessage], nextCursor: undefined } }))
      return
    }

    if (req.method === 'POST' && url.pathname.includes('/read')) {
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 200
      res.end(JSON.stringify({ data: { success: true } }))
      return
    }

    if (req.method === 'POST' && url.pathname.includes('/reactions')) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: mockMessage }))
      return
    }

    if (req.method === 'POST' && url.pathname.includes('/typing')) {
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 200
      res.end(JSON.stringify({ data: { success: true } }))
      return
    }

    if (req.method === 'DELETE' && url.pathname.includes('/messages/')) {
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 200
      res.end(JSON.stringify({ data: { success: true } }))
      return
    }

    if (req.method === 'GET' && url.pathname === '/chat/conversations') {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: [{ id: 'room-1', participants: ['user-1'], updatedAt: new Date().toISOString() }] }))
      return
    }

    if (req.method === 'GET' && url.pathname.includes('/conversations/')) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { id: 'room-1', participants: ['user-1'], createdAt: new Date().toISOString() } }))
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
  await new Promise<void>(resolve => server.close(() => { resolve(); }))
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('ChatAPI.sendMessage', () => {
  it('should send message successfully', async () => {
    const response = await chatApi.sendMessage('room-1', {
      type: 'text',
      content: 'Hello',
    })

    expect(response).toMatchObject({
      id: expect.any(String),
      roomId: 'room-1',
      type: 'text',
      content: 'Hello',
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(
      chatApi.sendMessage('room-1', {
        type: 'text',
        content: 'Hello',
      })
    ).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('ChatAPI.getMessages', () => {
  it('should get messages', async () => {
    const response = await chatApi.getMessages('room-1')

    expect(response).toMatchObject({
      messages: expect.any(Array),
    })
  })

  it('should accept cursor parameter', async () => {
    const response = await chatApi.getMessages('room-1', 'cursor-1')

    expect(response).toMatchObject({
      messages: expect.any(Array),
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(chatApi.getMessages('room-1')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('ChatAPI.markAsRead', () => {
  it('should mark message as read', async () => {
    await expect(chatApi.markAsRead('room-1', 'msg-1')).resolves.not.toThrow()
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(chatApi.markAsRead('room-1', 'msg-1')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('ChatAPI.addReaction', () => {
  it('should add reaction', async () => {
    const message = await chatApi.addReaction('msg-1', {
      reaction: '❤️',
    })

    expect(message).toMatchObject({
      id: expect.any(String),
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(
      chatApi.addReaction('msg-1', {
        reaction: '❤️',
      })
    ).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('ChatAPI.sendTypingIndicator', () => {
  it('should send typing indicator', async () => {
    await expect(
      chatApi.sendTypingIndicator('room-1', {
        userId: 'user-1',
      })
    ).resolves.not.toThrow()
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(
      chatApi.sendTypingIndicator('room-1', {
        userId: 'user-1',
      })
    ).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('ChatAPI.deleteMessage', () => {
  it('should delete message', async () => {
    await expect(chatApi.deleteMessage('msg-1', false)).resolves.not.toThrow()
  })

  it('should delete message for everyone', async () => {
    await expect(chatApi.deleteMessage('msg-1', true)).resolves.not.toThrow()
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(chatApi.deleteMessage('msg-1', false)).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('ChatAPI.getConversations', () => {
  it('should get conversations', async () => {
    const conversations = await chatApi.getConversations()

    expect(Array.isArray(conversations)).toBe(true)
  })

  it('should return empty array on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    const conversations = await chatApi.getConversations()

    expect(conversations).toEqual([])

    global.fetch = originalFetch
  })
})

describe('ChatAPI.getConversation', () => {
  it('should get conversation', async () => {
    const conversation = await chatApi.getConversation('room-1')

    expect(conversation).toMatchObject({
      id: 'room-1',
      participants: expect.any(Array),
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(chatApi.getConversation('room-1')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

