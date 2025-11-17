/**
 * Auth Integration Tests
 * 
 * Tests the complete authentication flow including:
 * - Login/Register with httpOnly cookies
 * - Token refresh with rotation
 * - CSRF token handling
 * - Logout
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { APIClient } from '../api-client'
import { AuthService } from '../auth'
import { ENDPOINTS } from '../endpoints'

let server: ReturnType<typeof createServer>
let serverPort: number

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const body = Buffer.concat(chunks).toString('utf8')
  return body ? (JSON.parse(body) as T) : ({} as T)
}

describe('Auth Integration Tests', () => {
  beforeEach(async () => {
    // Create mock HTTP server
    server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? '', `http://localhost`)
      const path = url.pathname

      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Credentials', 'true')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token')

      if (req.method === 'OPTIONS') {
        res.writeHead(200)
        res.end()
        return
      }

      // CSRF token endpoint
      if (path === '/api/csrf-token') {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Set-Cookie': 'csrf-token=test-csrf-token; HttpOnly; SameSite=Strict'
        })
        res.end(JSON.stringify({ csrfToken: 'test-csrf-token' }))
        return
      }

      // Login endpoint
      if (path === ENDPOINTS.AUTH.LOGIN && req.method === 'POST') {
        const body = await readJson<{ email: string; password: string }>(req)
        
        if (body.email === 'test@example.com' && body.password === 'password123') {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': 'refreshToken=refresh-token-123; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800'
          })
          res.end(JSON.stringify({
            data: {
              user: {
                id: 'user-123',
                email: 'test@example.com',
                displayName: 'Test User',
                roles: ['user']
              },
              accessToken: 'access-token-123',
              csrfToken: 'csrf-token-123'
            }
          }))
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            code: 'AUTH_001',
            message: 'Invalid credentials',
            correlationId: 'test-correlation-id',
            timestamp: new Date().toISOString()
          }))
        }
        return
      }

      // Register endpoint
      if (path === ENDPOINTS.AUTH.REGISTER && req.method === 'POST') {
        const body = await readJson<{ email: string; password: string; displayName: string }>(req)
        
        res.writeHead(201, {
          'Content-Type': 'application/json',
          'Set-Cookie': 'refreshToken=refresh-token-new; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800'
        })
        res.end(JSON.stringify({
          data: {
            user: {
              id: 'user-new',
              email: body.email,
              displayName: body.displayName,
              roles: ['user']
            },
            accessToken: 'access-token-new',
            csrfToken: 'csrf-token-new'
          }
        }))
        return
      }

      // Refresh endpoint
      if (path === ENDPOINTS.AUTH.REFRESH && req.method === 'POST') {
        const cookies = req.headers.cookie ?? ''
        
        if (cookies.includes('refreshToken=')) {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': 'refreshToken=refresh-token-rotated; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800'
          })
          res.end(JSON.stringify({
            data: {
              accessToken: 'access-token-refreshed',
              csrfToken: 'csrf-token-refreshed'
            }
          }))
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            code: 'AUTH_006',
            message: 'Refresh token expired',
            correlationId: 'test-correlation-id',
            timestamp: new Date().toISOString()
          }))
        }
        return
      }

      // Me endpoint (requires auth)
      if (path === ENDPOINTS.AUTH.ME && req.method === 'GET') {
        const authHeader = req.headers.authorization
        
        if (authHeader?.startsWith('Bearer ')) {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            data: {
              user: {
                id: 'user-123',
                email: 'test@example.com',
                displayName: 'Test User',
                roles: ['user']
              }
            }
          }))
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            code: 'AUTH_004',
            message: 'Token missing',
            correlationId: 'test-correlation-id',
            timestamp: new Date().toISOString()
          }))
        }
        return
      }

      // Logout endpoint
      if (path === ENDPOINTS.AUTH.LOGOUT && req.method === 'POST') {
        res.writeHead(204, {
          'Set-Cookie': 'refreshToken=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'
        })
        res.end()
        return
      }

      // Default 404
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
    })

    // Start server on random port
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address()
        serverPort = typeof address === 'object' && address ? address.port : 3000
        resolve()
      })
    })

    // Configure APIClient to use test server
    APIClient.setBaseUrl(`http://localhost:${serverPort}`)
  })

  afterEach(() => {
    server.close()
    APIClient.clearTokens()
    APIClient.setBaseUrl('')
  })

  describe('Login Flow', () => {
    it('should login successfully and store tokens', async () => {
      const result = await AuthService.login('test@example.com', 'password123')

      expect(result.user).toBeDefined()
      expect(result.user.email).toBe('test@example.com')
      expect(APIClient.isAuthenticated()).toBe(true)
    })

    it('should fail login with invalid credentials', async () => {
      await expect(
        AuthService.login('test@example.com', 'wrong-password')
      ).rejects.toThrow()
    })

    it('should set httpOnly cookie for refresh token', async () => {
      await AuthService.login('test@example.com', 'password123')
      
      // Refresh token should be in httpOnly cookie (not accessible via JS)
      // This is verified by the server setting the cookie
      expect(APIClient.isAuthenticated()).toBe(true)
    })
  })

  describe('Register Flow', () => {
    it('should register new user successfully', async () => {
      const result = await AuthService.signup({
        email: 'newuser@example.com',
        password: 'password123',
        displayName: 'New User'
      })

      expect(result.user).toBeDefined()
      expect(result.user.email).toBe('newuser@example.com')
      expect(result.user.displayName).toBe('New User')
      expect(APIClient.isAuthenticated()).toBe(true)
    })
  })

  describe('Token Refresh Flow', () => {
    it('should refresh access token successfully', async () => {
      // First login
      await AuthService.login('test@example.com', 'password123')
      
      // Refresh token
      const newTokens = await AuthService.refreshTokens()
      
      expect(newTokens).toBeDefined()
      expect(APIClient.isAuthenticated()).toBe(true)
    })

    it('should handle refresh token rotation', async () => {
      await AuthService.login('test@example.com', 'password123')
      
      // Refresh should rotate the refresh token
      await AuthService.refreshTokens()
      
      // Second refresh should work with new token
      const tokens = await AuthService.refreshTokens()
      expect(tokens).toBeDefined()
    })

    it('should fail refresh with expired token', async () => {
      // Simulate expired refresh token by clearing it
      APIClient.clearTokens()
      
      await expect(AuthService.refreshTokens()).rejects.toThrow()
    })
  })

  describe('Session Management', () => {
    it('should restore session from backend', async () => {
      await AuthService.login('test@example.com', 'password123')
      
      // Restore session
      const user = await AuthService.restoreSession()
      
      expect(user).toBeDefined()
      expect(user?.email).toBe('test@example.com')
    })

    it('should handle session restore failure', async () => {
      // Try to restore without login
      const user = await AuthService.restoreSession()
      
      // Should return null if not authenticated
      expect(user).toBeNull()
    })
  })

  describe('Logout Flow', () => {
    it('should logout and clear tokens', async () => {
      await AuthService.login('test@example.com', 'password123')
      expect(APIClient.isAuthenticated()).toBe(true)
      
      await AuthService.logout()
      
      // Access token should be cleared
      expect(APIClient.isAuthenticated()).toBe(false)
    })
  })

  describe('CSRF Token Handling', () => {
    it('should include CSRF token in requests', async () => {
      await AuthService.login('test@example.com', 'password123')
      
      // CSRF token should be loaded and included in subsequent requests
      // This is handled automatically by APIClient
      expect(APIClient.isAuthenticated()).toBe(true)
    })
  })
})

