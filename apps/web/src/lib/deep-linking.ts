/**
 * Deep Linking System
 * 
 * Handles universal links (iOS) and app links (Android) for routing
 * to correct screens when app is closed, backgrounded, or foreground.
 */

import { createLogger } from './logger'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('deep-linking')

export interface DeepLinkRoute {
  path: string
  params: Record<string, string>
  query: Record<string, string>
}

export type DeepLinkHandler = (route: DeepLinkRoute) => Promise<void> | void

export interface DeepLinkConfig {
  baseUrl: string
  routes: Map<string, DeepLinkHandler>
  defaultRoute?: string
  onUnhandledRoute?: (route: DeepLinkRoute) => void
}

class DeepLinkManager {
  private config: DeepLinkConfig
  private isInitialized = false
  private pendingRoute: DeepLinkRoute | null = null
  private appState: 'closed' | 'background' | 'foreground' = 'foreground'

  constructor(config: DeepLinkConfig) {
    this.config = config
  }

  initialize(): void {
    if (isTruthy(this.isInitialized)) {
      return
    }

    this.isInitialized = true

    // Handle initial URL if app opened from link
    if (typeof window !== 'undefined') {
      this.handleCurrentUrl()

      // Listen for URL changes (popstate for browser, focus for app)
      window.addEventListener('popstate', () => { this.handleCurrentUrl(); })
      
      // Listen for app focus (when coming from background)
      window.addEventListener('focus', () => {
        this.appState = 'foreground'
        this.processPendingRoute()
      })

      window.addEventListener('blur', () => {
        this.appState = 'background'
      })

      // Listen for visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.appState = 'foreground'
          this.processPendingRoute()
        } else {
          this.appState = 'background'
        }
      })
    }
  }

  private handleCurrentUrl(): void {
    if (typeof window === 'undefined') {
      return
    }

    const url = new URL(window.location.href)
    const route = this.parseUrl(url)

    if (isTruthy(route)) {
      this.handleRoute(route)
    }
  }

  private parseUrl(url: URL): DeepLinkRoute | null {
    try {
      const baseUrl = new URL(this.config.baseUrl)
      if (url.origin !== baseUrl.origin) {
        return null
      }

      const path = url.pathname
      const params: Record<string, string> = {}
      const query: Record<string, string> = {}

      // Parse query parameters
      url.searchParams.forEach((value, key) => {
        query[key] = value
      })

      // Parse path parameters (e.g., /chat/:id -> { id: "123" })
      const pathParts = path.split('/').filter(Boolean)
      
      // Try to match routes
      for (const [routePath] of this.config.routes.entries()) {
        const routeParts = routePath.split('/').filter(Boolean)
        
        if (routeParts.length === pathParts.length) {
          let matches = true
          const extractedParams: Record<string, string> = {}

          for (let i = 0; i < routeParts.length; i++) {
            const routePart = routeParts[i]
            const pathPart = pathParts[i]

            if (!routePart) {
              matches = false
              break
            }

            if (routePart.startsWith(':')) {
              // Parameter
              const paramName = routePart.slice(1)
              if (isTruthy(pathPart)) {
                extractedParams[paramName] = decodeURIComponent(pathPart)
              }
            } else if (routePart !== pathPart) {
              matches = false
              break
            }
          }

          if (isTruthy(matches)) {
            return {
              path: routePath,
              params: { ...extractedParams, ...params },
              query
            }
          }
        }
      }

      // If no route matched, return generic route
      return {
        path,
        params,
        query
      }
    } catch (error) {
      logger.error('Failed to parse URL', error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }

  async handleRoute(route: DeepLinkRoute): Promise<void> {
    const handler = this.config.routes.get(route.path)

    if (isTruthy(handler)) {
      try {
        await handler(route)
        logger.info('Deep link handled', { path: route.path, appState: this.appState })
      } catch (error) {
        logger.error('Deep link handler failed', error instanceof Error ? error : new Error(String(error)))
      }
    } else {
      // Try default route
      if (isTruthy(this.config.defaultRoute)) {
        const defaultHandler = this.config.routes.get(this.config.defaultRoute)
        if (isTruthy(defaultHandler)) {
          try {
            await defaultHandler(route)
            return
          } catch (error) {
            logger.error('Default route handler failed', error instanceof Error ? error : new Error(String(error)))
          }
        }
      }

      // Unhandled route
      if (isTruthy(this.config.onUnhandledRoute)) {
        this.config.onUnhandledRoute(route)
      } else {
        logger.warn('Unhandled deep link', { path: route.path })
      }
    }
  }

  private processPendingRoute(): void {
    if (this.pendingRoute && this.appState === 'foreground') {
      const route = this.pendingRoute
      this.pendingRoute = null
      this.handleRoute(route)
    }
  }

  navigate(route: DeepLinkRoute): void {
    if (this.appState === 'foreground') {
      this.handleRoute(route)
    } else {
      // Store for when app becomes foreground
      this.pendingRoute = route
    }
  }

  registerRoute(path: string, handler: DeepLinkHandler): void {
    this.config.routes.set(path, handler)
  }

  unregisterRoute(path: string): void {
    this.config.routes.delete(path)
  }

  getAppState(): 'closed' | 'background' | 'foreground' {
    return this.appState
  }

  destroy(): void {
    this.isInitialized = false
    this.pendingRoute = null
  }
}

// Common route handlers
export const createChatRouteHandler = (onNavigate: (chatId: string) => void): DeepLinkHandler => {
  return async (route: DeepLinkRoute): Promise<void> => {
    const chatId = route.params['id'] || route.query['chatId']
    if (isTruthy(chatId)) {
      onNavigate(chatId)
    }
  }
}

export const createMatchRouteHandler = (onNavigate: (matchId: string) => void): DeepLinkHandler => {
  return async (route: DeepLinkRoute): Promise<void> => {
    const matchId = route.params['id'] || route.query['matchId']
    if (isTruthy(matchId)) {
      onNavigate(matchId)
    }
  }
}

export const createProfileRouteHandler = (onNavigate: (profileId: string) => void): DeepLinkHandler => {
  return async (route: DeepLinkRoute): Promise<void> => {
    const profileId = route.params['id'] || route.query['profileId']
    if (isTruthy(profileId)) {
      onNavigate(profileId)
    }
  }
}

export const createAdoptionRouteHandler = (onNavigate: (listingId: string) => void): DeepLinkHandler => {
  return async (route: DeepLinkRoute): Promise<void> => {
    const listingId = route.params['id'] || route.query['listingId']
    if (isTruthy(listingId)) {
      onNavigate(listingId)
    }
  }
}

// Singleton instance
let managerInstance: DeepLinkManager | null = null

export function createDeepLinkManager(config: DeepLinkConfig): DeepLinkManager {
  if (isTruthy(managerInstance)) {
    managerInstance.destroy()
  }
  managerInstance = new DeepLinkManager(config)
  managerInstance.initialize()
  return managerInstance
}

export function getDeepLinkManager(): DeepLinkManager | null {
  return managerInstance
}
