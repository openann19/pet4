/**
 * Consent Manager Component
 *
 * Handles GDPR/CCPA consent management for cookies and data processing
 */

import { useState, useEffect, useCallback } from 'react'
import { createLogger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

const logger = createLogger('ConsentManager')

export interface ConsentPreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

interface ConsentManagerProps {
  onConsentChange?: (preferences: ConsentPreferences) => void
  showOnlyIfNeeded?: boolean
}

const DEFAULT_CONSENT: ConsentPreferences = {
  necessary: true, // Always required
  analytics: false,
  marketing: false,
  functional: false
}

const CONSENT_STORAGE_KEY = 'petspark:consent-preferences'
const CONSENT_VERSION = '1.0'

export function ConsentManager({ onConsentChange, showOnlyIfNeeded = true }: ConsentManagerProps) {
  const [showBanner, setShowBanner] = useState(false)
  const [preferences, setPreferences] = useState<ConsentPreferences>(DEFAULT_CONSENT)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadConsentPreferences()
  }, [])

  const loadConsentPreferences = useCallback(() => {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as { preferences: ConsentPreferences; version: string }
        if (parsed.version === CONSENT_VERSION) {
          setPreferences(parsed.preferences)
          setShowBanner(false)
          setIsLoading(false)
          return
        }
      }
    } catch (error) {
      logger.warn('Failed to load consent preferences', { error })
    }

    // Check if user is in EU or California
    const needsConsent = checkIfConsentNeeded()
    setShowBanner(needsConsent || !showOnlyIfNeeded)
    setIsLoading(false)
  }, [showOnlyIfNeeded])

  const checkIfConsentNeeded = (): boolean => {
    // Check timezone and IP-based detection (simplified)
    // In production, use a proper geolocation service
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const euTimezones = ['Europe/', 'Africa/Casablanca', 'Africa/Cairo']
    const isEU = euTimezones.some(tz => timezone.startsWith(tz))

    // Check for California (simplified - use proper geolocation in production)
    const isCalifornia = timezone === 'America/Los_Angeles'

    return isEU || isCalifornia
  }

  const handlePreferenceChange = (key: keyof ConsentPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
  }

  const handleAcceptAll = () => {
    const allAccepted: ConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    }
    saveConsent(allAccepted)
  }

  const handleRejectAll = () => {
    saveConsent(DEFAULT_CONSENT)
  }

  const handleSavePreferences = () => {
    saveConsent(preferences)
  }

  const saveConsent = (consentPrefs: ConsentPreferences) => {
    try {
      const data = {
        preferences: consentPrefs,
        version: CONSENT_VERSION,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(data))
      setPreferences(consentPrefs)
      setShowBanner(false)
      onConsentChange?.(consentPrefs)
      logger.debug('Consent preferences saved', { preferences: consentPrefs })
    } catch (error) {
      logger.error('Failed to save consent preferences', error instanceof Error ? error : new Error(String(error)))
    }
  }

  if (isLoading || !showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Cookie & Privacy Preferences</CardTitle>
          <CardDescription>
            We use cookies and similar technologies to provide, protect, and improve our services.
            You can choose to accept all, reject all, or customize your preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="necessary"
                checked={preferences.necessary}
                disabled
              />
              <label htmlFor="necessary" className="text-sm font-medium cursor-pointer">
                Necessary Cookies (Required)
              </label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Essential for the website to function properly. Cannot be disabled.
            </p>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="analytics"
                checked={preferences.analytics}
                onCheckedChange={(checked) => handlePreferenceChange('analytics', checked === true)}
              />
              <label htmlFor="analytics" className="text-sm font-medium cursor-pointer">
                Analytics Cookies
              </label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Help us understand how visitors interact with our website.
            </p>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="marketing"
                checked={preferences.marketing}
                onCheckedChange={(checked) => handlePreferenceChange('marketing', checked === true)}
              />
              <label htmlFor="marketing" className="text-sm font-medium cursor-pointer">
                Marketing Cookies
              </label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Used to deliver personalized advertisements and track campaign performance.
            </p>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="functional"
                checked={preferences.functional}
                onCheckedChange={(checked) => handlePreferenceChange('functional', checked === true)}
              />
              <label htmlFor="functional" className="text-sm font-medium cursor-pointer">
                Functional Cookies
              </label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Enable enhanced functionality and personalization.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-4">
            <Button onClick={handleAcceptAll} variant="default" size="sm">
              Accept All
            </Button>
            <Button onClick={handleRejectAll} variant="outline" size="sm">
              Reject All
            </Button>
            <Button onClick={handleSavePreferences} variant="default" size="sm">
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Hook to get current consent preferences
 */
export function useConsentPreferences(): ConsentPreferences {
  const [preferences, setPreferences] = useState<ConsentPreferences>(DEFAULT_CONSENT)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as { preferences: ConsentPreferences; version: string }
        if (parsed.version === CONSENT_VERSION) {
          setPreferences(parsed.preferences)
        }
      }
    } catch (error) {
      logger.warn('Failed to load consent preferences', { error })
    }
  }, [])

  return preferences
}
