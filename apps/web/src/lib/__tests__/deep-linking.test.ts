/**
 * Tests for Deep Linking System
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  createDeepLinkManager,
  getDeepLinkManager,
  createChatRouteHandler,
  createMatchRouteHandler,
  type DeepLinkRoute
} from '../deep-linking'
import { isTruthy, isDefined } from '@/core/guards';

describe('Deep Linking System', () => {
  beforeEach(() => {
    // Clear any existing manager
    const existing = getDeepLinkManager()
    if (isTruthy(existing)) {
      existing.destroy()
    }
    
    // Mock window.location
    delete (window as { location?: unknown }).location
    window.location = {
      href: 'https://pawfectmatch.app/',
      origin: 'https://pawfectmatch.app',
      pathname: '/',
      search: '',
      searchParams: new URLSearchParams()
    } as unknown as Location
  })

  afterEach(() => {
    const manager = getDeepLinkManager()
    if (isTruthy(manager)) {
      manager.destroy()
    }
  })

  describe('Route Parsing', () => {
    it('should parse URL with path parameters', () => {
      const chatHandler = vi.fn()
      const routes = new Map([
        ['/chat/:id', chatHandler]
      ])

      const manager = createDeepLinkManager({
        baseUrl: 'https://pawfectmatch.app',
        routes
      })

      // Test navigation directly
      manager.navigate({
        path: '/chat/:id',
        params: { id: '123' },
        query: {}
      })

      expect(chatHandler).toHaveBeenCalled()
      const call = chatHandler.mock.calls[0]?.[0] as DeepLinkRoute
      expect(call).toBeDefined()
      expect(call?.params['id']).toBe('123')
    })

    it('should parse query parameters', () => {
      const chatHandler = vi.fn()
      const routes = new Map([
        ['/chat/:id', chatHandler]
      ])

      const manager = createDeepLinkManager({
        baseUrl: 'https://pawfectmatch.app',
        routes
      })

      // Test navigation with query params
      manager.navigate({
        path: '/chat/:id',
        params: { id: '123' },
        query: { messageId: '456' }
      })

      expect(chatHandler).toHaveBeenCalled()
      const call = chatHandler.mock.calls[0]?.[0] as DeepLinkRoute
      expect(call).toBeDefined()
      expect(call?.query['messageId']).toBe('456')
    })
  })

  describe('Route Handlers', () => {
    it('should handle chat route', async () => {
      const onNavigate = vi.fn()
      const handler = createChatRouteHandler(onNavigate)
      
      await handler({
        path: '/chat/:id',
        params: { id: '123' },
        query: {}
      })

      expect(onNavigate).toHaveBeenCalledWith('123')
    })

    it('should handle match route', async () => {
      const onNavigate = vi.fn()
      const handler = createMatchRouteHandler(onNavigate)
      
      await handler({
        path: '/match/:id',
        params: { id: '456' },
        query: {}
      })

      expect(onNavigate).toHaveBeenCalledWith('456')
    })

    it('should handle route with query parameter fallback', async () => {
      const onNavigate = vi.fn()
      const handler = createChatRouteHandler(onNavigate)
      
      await handler({
        path: '/chat',
        params: {},
        query: { chatId: '789' }
      })

      expect(onNavigate).toHaveBeenCalledWith('789')
    })
  })

  describe('Unhandled Routes', () => {
    it('should call onUnhandledRoute for unknown routes', () => {
      const onUnhandled = vi.fn()
      const routes = new Map()

      const manager = createDeepLinkManager({
        baseUrl: 'https://pawfectmatch.app',
        routes,
        onUnhandledRoute: onUnhandled
      })

      manager.navigate({
        path: '/unknown',
        params: {},
        query: {}
      })

      expect(onUnhandled).toHaveBeenCalled()
    })
  })

  describe('Route Registration', () => {
    it('should register new routes', () => {
      const handler = vi.fn()
      const routes = new Map()

      const manager = createDeepLinkManager({
        baseUrl: 'https://pawfectmatch.app',
        routes
      })

      manager.registerRoute('/test', handler)
      manager.navigate({
        path: '/test',
        params: {},
        query: {}
      })

      expect(handler).toHaveBeenCalled()
    })

    it('should unregister routes', () => {
      const handler = vi.fn()
      const routes = new Map([
        ['/test', handler]
      ])

      const manager = createDeepLinkManager({
        baseUrl: 'https://pawfectmatch.app',
        routes
      })

      manager.unregisterRoute('/test')
      manager.navigate({
        path: '/test',
        params: {},
        query: {}
      })

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('App State', () => {
    it('should track app state', () => {
      const routes = new Map()
      const manager = createDeepLinkManager({
        baseUrl: 'https://pawfectmatch.app',
        routes
      })

      expect(manager.getAppState()).toBe('foreground')
    })
  })

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const routes = new Map()
      const manager1 = createDeepLinkManager({
        baseUrl: 'https://pawfectmatch.app',
        routes
      })

      const manager2 = getDeepLinkManager()
      expect(manager2).toBe(manager1)
    })
  })
})
