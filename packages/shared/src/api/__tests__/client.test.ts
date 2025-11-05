import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApiClient } from '../client.js'
import { ApiError } from '../types.js'

describe('createApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should create a client with default config', () => {
    const client = createApiClient({
      baseUrl: 'https://api.example.com'
    })

    expect(client).toBeDefined()
    expect(typeof client.get).toBe('function')
    expect(typeof client.post).toBe('function')
    expect(typeof client.put).toBe('function')
    expect(typeof client.delete).toBe('function')
  })

  it('should handle GET requests', async () => {
    const mockResponse = { data: 'test' }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockResponse
    })

    const client = createApiClient({
      baseUrl: 'https://api.example.com'
    })

    const result = await client.get('/test')

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    )

    expect(result.data).toEqual(mockResponse)
    expect(result.status).toBe(200)
  })

  it('should handle POST requests with body', async () => {
    const mockResponse = { id: '123' }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      statusText: 'Created',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockResponse
    })

    const client = createApiClient({
      baseUrl: 'https://api.example.com'
    })

    const body = { name: 'test' }
    const result = await client.post('/test', body)

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body)
      })
    )

    expect(result.data).toEqual(mockResponse)
  })

  it('should add Authorization header when apiKey is provided', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({})
    })

    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      apiKey: 'test-key'
    })

    await client.get('/test')

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-key'
        })
      })
    )
  })

  it('should throw ApiError on non-ok responses', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ error: 'Not found' })
    })

    const client = createApiClient({
      baseUrl: 'https://api.example.com'
    })

    await expect(client.get('/test')).rejects.toThrow(ApiError)
    
    try {
      await client.get('/test')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      if (error instanceof ApiError) {
        expect(error.status).toBe(404)
        expect(error.statusText).toBe('Not Found')
      }
    }
  })

  it('should handle timeout', async () => {
    global.fetch = vi.fn().mockImplementation(() => 
      new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => ({})
      }), 100))
    )

    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      timeout: 10
    })

    await expect(client.get('/test')).rejects.toThrow(ApiError)
  })
})

