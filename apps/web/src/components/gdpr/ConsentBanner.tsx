/**
 * Consent Banner Component
 *
 * Displays GDPR cookie/tracking consent banner on first visit.
 * Allows users to accept/reject consent for different categories.
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useConsentManager } from '@/hooks/use-consent-manager';
import { getStorageItem, setStorageItem } from '@/lib/cache/local-storage';
import { createLogger } from '@/lib/logger';
import type { ConsentCategory } from '@petspark/shared';
import { CONSENT_VERSION } from '@petspark/shared';

const logger = createLogger('ConsentBanner');

const CONSENT_BANNER_DISMISSED_KEY = 'gdpr-consent-banner-dismissed';
const CONSENT_BANNER_VERSION_KEY = 'gdpr-consent-banner-version';

interface ConsentBannerProps {
  onConsentChange?: (preferences: Record<string, boolean>) => void;
  showOnMount?: boolean;
}

export function ConsentBanner({ onConsentChange, showOnMount = true }: ConsentBannerProps): React.JSX.Element | null {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const consentManager = useConsentManager({ autoLoad: true });

  // Check if banner should be shown (only on mount)
  useEffect(() => {
    if (!showOnMount) {
      return;
    }

    // Check if banner was already dismissed
    const dismissed = getStorageItem<boolean>(CONSENT_BANNER_DISMISSED_KEY);
    const dismissedVersion = getStorageItem<string>(CONSENT_BANNER_VERSION_KEY);

    // Show banner if not dismissed or if consent version changed
    if (!dismissed || dismissedVersion !== CONSENT_VERSION) {
      setIsVisible(true);
    }
  }, [showOnMount]);

  // Handle accept all
  const handleAcceptAll = async (): Promise<void> => {
    try {
      await consentManager.acceptConsent('analytics');
      await consentManager.acceptConsent('marketing');
      await consentManager.acceptConsent('third_party');

      setStorageItem(CONSENT_BANNER_DISMISSED_KEY, true);
      setStorageItem(CONSENT_BANNER_VERSION_KEY, CONSENT_VERSION);
      setIsVisible(false);

      onConsentChange?.({
        analytics: true,
        marketing: true,
        third_party: true,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to accept all consent', err);
    }
  };

  // Handle reject all
  const _handleRejectAll = async (): Promise<void> => {
    try {
      await consentManager.rejectConsent('analytics');
      await consentManager.rejectConsent('marketing');
      await consentManager.rejectConsent('third_party');

      setStorageItem(CONSENT_BANNER_DISMISSED_KEY, true);
      setStorageItem(CONSENT_BANNER_VERSION_KEY, CONSENT_VERSION);
      setIsVisible(false);

      onConsentChange?.({
        analytics: false,
        marketing: false,
        third_party: false,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to reject all consent', err);
    }
  };

  // Handle accept essential only
  const handleAcceptEssential = async (): Promise<void> => {
    try {
      await consentManager.rejectConsent('analytics');
      await consentManager.rejectConsent('marketing');
      await consentManager.rejectConsent('third_party');

      setStorageItem(CONSENT_BANNER_DISMISSED_KEY, true);
      setStorageItem(CONSENT_BANNER_VERSION_KEY, CONSENT_VERSION);
      setIsVisible(false);

      onConsentChange?.({
        analytics: false,
        marketing: false,
        third_party: false,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to accept essential only', err);
    }
  };

  // Handle manage preferences
  const handleManagePreferences = (): void => {
    setShowPreferences(true);
  };

  // Handle preference change
  const handlePreferenceChange = async (category: ConsentCategory, value: boolean): Promise<void> => {
    try {
      if (value) {
        await consentManager.acceptConsent(category);
      } else {
        await consentManager.rejectConsent(category);
      }

      onConsentChange?.({
        [category]: value,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update preference', err, { category, value });
    }
  };

  // Handle save preferences
  const handleSavePreferences = (): void => {
    setStorageItem(CONSENT_BANNER_DISMISSED_KEY, true);
    setStorageItem(CONSENT_BANNER_VERSION_KEY, CONSENT_VERSION);
    setIsVisible(false);
    setShowPreferences(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Consent Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg p-4 md:p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Cookie Consent</h3>
              <p className="text-sm text-muted-foreground">
                We use cookies to enhance your experience, analyze site usage, and assist in our marketing efforts.
                By clicking &quot;Accept All&quot;, you consent to our use of cookies.{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Learn more
                </a>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleAcceptEssential()}
                aria-label="Accept essential cookies only"
              >
                Essential Only
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleManagePreferences()}
                aria-label="Manage cookie preferences"
              >
                Manage
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => void handleAcceptAll()}
                aria-label="Accept all cookies"
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Dialog */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
            <DialogDescription>
              Manage your cookie preferences. You can enable or disable different types of cookies below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Essential Cookies */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold">Essential Cookies</h4>
                <p className="text-sm text-muted-foreground">
                  These cookies are necessary for the website to function and cannot be switched off.
                </p>
              </div>
              <div className="ml-4">
                <span className="text-sm font-medium text-muted-foreground">Always Active</span>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold">Analytics Cookies</h4>
                <p className="text-sm text-muted-foreground">
                  These cookies help us understand how visitors interact with our website.
                </p>
              </div>
              <div className="ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={consentManager.preferences.analytics}
                    onChange={(e) => {
                      void handlePreferenceChange('analytics', e.target.checked);
                    }}
                    aria-label="Enable analytics cookies"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold">Marketing Cookies</h4>
                <p className="text-sm text-muted-foreground">
                  These cookies are used to deliver relevant advertisements and track campaign performance.
                </p>
              </div>
              <div className="ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={consentManager.preferences.marketing}
                    onChange={(e) => {
                      void handlePreferenceChange('marketing', e.target.checked);
                    }}
                    aria-label="Enable marketing cookies"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>
            </div>

            {/* Third-Party Cookies */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold">Third-Party Cookies</h4>
                <p className="text-sm text-muted-foreground">
                  These cookies are set by third-party services that appear on our pages.
                </p>
              </div>
              <div className="ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={consentManager.preferences.thirdParty}
                    onChange={(e) => {
                      void handlePreferenceChange('third_party', e.target.checked);
                    }}
                    aria-label="Enable third-party cookies"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPreferences(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSavePreferences()}>Save Preferences</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
