import { createLogger } from './logger'

const logger = createLogger('push-notifications')

export interface PushNotification {
  id: string
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: Record<string, unknown>
  tag?: string
  requireInteraction?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export interface DeepLinkRoute {
  path: string
  params?: Record<string, string>
}

class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null
  private permission: NotificationPermission = 'default'

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      logger.warn('Push notifications not supported')
      return false
    }

    this.permission = Notification.permission

    try {
      this.registration = await navigator.serviceWorker.ready
      return true
    } catch (error) {
      logger.error('Service worker initialization failed', error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false
    }

    if (this.permission === 'granted') {
      return true
    }

    try {
      this.permission = await Notification.requestPermission()
      return this.permission === 'granted'
    } catch (error) {
      logger.error('Permission request failed', error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  async showNotification(notification: PushNotification): Promise<void> {
    if (!this.registration || this.permission !== 'granted') {
      logger.warn('Cannot show notification: registration or permission missing')
      return
    }

    try {
      const options: NotificationOptions & { 
        image?: string
        actions?: Array<{ action: string; title: string; icon?: string }>
      } = {
        body: notification.body,
        icon: notification.icon || '/icon-192.png',
        badge: notification.badge || '/badge-72.png',
        image: notification.image,
        data: notification.data,
        tag: notification.tag,
        requireInteraction: notification.requireInteraction,
        actions: notification.actions
      }
      await this.registration.showNotification(notification.title, options)
    } catch (error) {
      logger.error('Failed to show notification', error instanceof Error ? error : new Error(String(error)))
    }
  }

  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
  }

  getPermission(): NotificationPermission {
    return this.permission
  }

  hasPermission(): boolean {
    return this.permission === 'granted'
  }
}

export const pushNotifications = new PushNotificationManager()

class DeepLinkManager {
  private routes: Map<string, (params: Record<string, string>) => void> = new Map()
  private initialized: boolean = false

  initialize() {
    if (this.initialized) return

    this.handleInitialUrl()
    
    window.addEventListener('popstate', () => {
      this.handleCurrentUrl()
    })

    this.initialized = true
  }

  private handleInitialUrl() {
    const url = new URL(window.location.href)
    this.processUrl(url)
  }

  private handleCurrentUrl() {
    const url = new URL(window.location.href)
    this.processUrl(url)
  }

  private processUrl(url: URL) {
    const path = url.pathname
    const params: Record<string, string> = {}
    
    url.searchParams.forEach((value, key) => {
      params[key] = value
    })

    const handler = this.routes.get(path)
    if (handler) {
      handler(params)
    }
  }

  registerRoute(path: string, handler: (params: Record<string, string>) => void) {
    this.routes.set(path, handler)
  }

  navigate(path: string, params?: Record<string, string>) {
    const url = new URL(path, window.location.origin)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }

    window.history.pushState({}, '', url.toString())
    this.processUrl(url)
  }

  parseDeepLink(urlString: string): DeepLinkRoute | null {
    try {
      const url = new URL(urlString)
      const params: Record<string, string> = {}
      
      url.searchParams.forEach((value, key) => {
        params[key] = value
      })

      return {
        path: url.pathname,
        params
      }
    } catch (error) {
      logger.error('Invalid deep link', error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }

  handlePushNotificationClick(data: Record<string, unknown>) {
    if (data.url && typeof data.url === 'string') {
      const route = this.parseDeepLink(data.url)
      if (route) {
        this.navigate(route.path, route.params)
      }
    } else if (data.path && typeof data.path === 'string') {
      const params = data.params && typeof data.params === 'object' ? data.params as Record<string, unknown> : {}
      const stringParams: Record<string, string> = {}
      for (const [key, value] of Object.entries(params)) {
        stringParams[key] = String(value)
      }
      this.navigate(data.path, stringParams)
    }
  }
}

export const deepLinks = new DeepLinkManager()

export const initializePushAndDeepLinks = async () => {
  await pushNotifications.initialize()
  deepLinks.initialize()
}

export const sendMatchNotification = async (petName: string, petId: string) => {
  await pushNotifications.showNotification({
    id: `match_${petId}`,
    title: 'New Match! 🎉',
    body: `You matched with ${petName}!`,
    icon: '/icon-192.png',
    tag: 'match',
    data: {
      type: 'match',
      petId,
      url: `/matches?pet=${petId}`
    },
    actions: [
      {
        action: 'view',
        title: 'View Match'
      },
      {
        action: 'chat',
        title: 'Start Chat'
      }
    ]
  })
}

export const sendMessageNotification = async (senderName: string, message: string, chatId: string) => {
  await pushNotifications.showNotification({
    id: `message_${chatId}_${Date.now()}`,
    title: `Message from ${senderName}`,
    body: message,
    icon: '/icon-192.png',
    tag: 'message',
    data: {
      type: 'message',
      chatId,
      url: `/chat?room=${chatId}`
    },
    actions: [
      {
        action: 'reply',
        title: 'Reply'
      },
      {
        action: 'view',
        title: 'View Chat'
      }
    ]
  })
}
