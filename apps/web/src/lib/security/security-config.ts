import { ENV } from '@/config/env'
import { createLogger } from '@/lib/logger'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('Security')

class SecurityConfigImpl {
  // CORS Configuration
  setupCORS(): void {
    // This would be configured in the backend, but we can validate origins
    const allowedOrigins = [
      ENV.VITE_CORS_ORIGIN ?? 'https://pawfectmatch.com',
      'https://pawfectmatch.com',
      'https://*.pawfectmatch.com'
    ].filter(Boolean)

    logger.info('CORS origins configured', { allowedOrigins })
  }

  // Content Security Policy
  generateCSP(): string {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://api.mapbox.com",
      "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
      "img-src 'self' data: blob: https://*.pawfectmatch.com https://api.mapbox.com",
      "connect-src 'self' https://api.pawfectmatch.com wss://api.pawfectmatch.com https://api.stripe.com https://api.mapbox.com",
      "font-src 'self' https://fonts.gstatic.com",
      "media-src 'self' blob: https://*.pawfectmatch.com",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')

    if (isTruthy(ENV.VITE_CSP_ENABLED)) {
      const meta = document.createElement('meta')
      meta.httpEquiv = 'Content-Security-Policy'
      meta.content = csp
      document.head.appendChild(meta)
    }

    return csp
  }

  // XSS Protection
  sanitizeHTML(html: string): string {
    const div = document.createElement('div')
    div.textContent = html
    return div.innerHTML
  }

  sanitizeUserInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
  }

  // API Key Security
  validateAPIKeys(): void {
    const keys = {
      stripe: ENV.VITE_STRIPE_PUBLIC_KEY,
      mapbox: ENV.VITE_MAPBOX_TOKEN
    }

    Object.entries(keys).forEach(([service, key]) => {
      if (key && this.isKeyExposed(key)) {
        logger.error(`${String(service ?? '')} API key appears to be a secret key - use public key only`, {
          service,
          keyPrefix: key.substring(0, 10)
        })
      }
    })
  }

  private isKeyExposed(key: string): boolean {
    // Check for secret key patterns
    const secretPatterns = [
      /^sk_/, // Stripe secret keys
      /^rk_/, // Restricted keys
      /password/i,
      /secret/i,
      /private/i
    ]

    return secretPatterns.some(pattern => pattern.test(key))
  }

  // Rate Limiting (Client-side tracking)
  private rateLimiters = new Map<string, {
    requests: number[]
    blocked: boolean
  }>()

  checkRateLimit(
    identifier: string,
    maxRequests: number = 100,
    windowMs: number = 60000
  ): boolean {
    const now = Date.now()
    const limiter = this.rateLimiters.get(identifier) || {
      requests: [],
      blocked: false
    }

    // Clean old requests
    limiter.requests = limiter.requests.filter(time => now - time < windowMs)

    // Check if rate limited
    if (limiter.requests.length >= maxRequests) {
      limiter.blocked = true
      logger.warn('Rate limit exceeded', { identifier, requests: limiter.requests.length })
      return false
    }

    // Add current request
    limiter.requests.push(now)
    limiter.blocked = false
    this.rateLimiters.set(identifier, limiter)

    return true
  }

  // Secure Storage
  secureStore(key: string, value: string): void {
    try {
      // Use sessionStorage for sensitive data that shouldn't persist
      if (key.includes('token') || key.includes('secret')) {
        sessionStorage.setItem(key, value)
      } else {
        localStorage.setItem(key, value)
      }
    } catch (error) {
      logger.error('Failed to store data securely', error, { key })
    }
  }

  secureRetrieve(key: string): string | null {
    try {
      return sessionStorage.getItem(key) || localStorage.getItem(key)
    } catch (error) {
      logger.error('Failed to retrieve data securely', error, { key })
      return null
    }
  }

  secureClear(key: string): void {
    try {
      sessionStorage.removeItem(key)
      localStorage.removeItem(key)
    } catch (error) {
      logger.error('Failed to clear data securely', error, { key })
    }
  }

  // Privacy Controls
  anonymizeData<T extends Record<string, unknown>>(
    data: T,
    fields: (keyof T)[]
  ): T {
    const anonymized = { ...data }
    
    fields.forEach(field => {
      if (typeof anonymized[field] === 'string') {
        anonymized[field] = '***REDACTED***' as T[keyof T]
      } else {
        delete anonymized[field]
      }
    })

    return anonymized
  }

  // Input Validation
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  }

  validatePassword(password: string): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // GDPR Compliance
  async exportUserData(userId: string): Promise<Blob> {
    // This would call backend API to get all user data
    const response = await fetch(`/api/users/${String(userId ?? '')}/export`, {
      headers: {
        'Authorization': `Bearer ${String(this.secureRetrieve('access_token') ?? '')}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to export user data')
    }

    return response.blob()
  }

  async deleteUserData(userId: string): Promise<void> {
    // This would call backend API to delete all user data
    const response = await fetch(`/api/users/${String(userId ?? '')}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${String(this.secureRetrieve('access_token') ?? '')}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to delete user data')
    }

    logger.info('User data deletion requested', { userId })
  }
}

export const securityConfig = new SecurityConfigImpl()

// Initialize security on app load
if (typeof window !== 'undefined') {
  securityConfig.setupCORS()
  securityConfig.generateCSP()
  securityConfig.validateAPIKeys()
}

