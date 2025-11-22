/**
 * Consent Settings Component
 *
 * Displays and manages user consent preferences.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useConsentManager } from '@/hooks/use-consent-manager';
import { createLogger } from '@/lib/logger';
import type { ConsentCategory } from '@petspark/shared';

const logger = createLogger('ConsentSettings');

interface ConsentSettingsProps {
    userId?: string | null;
    onConsentChange?: (preferences: Record<string, boolean>) => void;
}

export function ConsentSettings({ userId, onConsentChange }: ConsentSettingsProps): React.JSX.Element {
    const consentManager = useConsentManager({ userId, autoLoad: true });
    const [isSaving, setIsSaving] = useState(false);

    // Handle preference change
    const handlePreferenceChange = async (category: ConsentCategory, value: boolean): Promise<void> => {
        try {
            setIsSaving(true);
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
        } finally {
            setIsSaving(false);
        }
    };

    // Get consent status for a category
    const _getConsentStatus = (category: ConsentCategory): 'accepted' | 'rejected' | 'pending' => {
        if (category === 'essential') {
            return 'accepted';
        }
        return consentManager.hasConsent(category) ? 'accepted' : 'rejected';
    };

    // Get consent record for a category
    const getConsentRecord = (category: ConsentCategory) => {
        return consentManager.consents.find((c) => c.category === category);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Consent Management</h2>
                <p className="text-muted-foreground mt-2">
                    Manage your consent preferences for data collection and usage.
                </p>
            </div>

            {/* Essential Cookies */}
            <Card>
                <CardHeader>
                    <CardTitle>Essential Cookies</CardTitle>
                    <CardDescription>
                        These cookies are necessary for the website to function and cannot be switched off.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground">
                                Essential cookies are required for core functionality such as authentication and security.
                            </p>
                        </div>
                        <div className="ml-4">
                            <span className="text-sm font-medium text-muted-foreground">Always Active</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Analytics Cookies */}
            <Card>
                <CardHeader>
                    <CardTitle>Analytics Cookies</CardTitle>
                    <CardDescription>
                        These cookies help us understand how visitors interact with our website.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-2">
                                We use analytics cookies to collect information about how you use our website. This helps us improve
                                our services and provide a better user experience.
                            </p>
                            {getConsentRecord('analytics') && (
                                <p className="text-xs text-muted-foreground">
                                    Last updated: {new Date(getConsentRecord('analytics')?.acceptedAt ?? '').toLocaleDateString()}
                                </p>
                            )}
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
                                    disabled={isSaving}
                                    aria-label="Enable analytics cookies"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50" />
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Marketing Cookies */}
            <Card>
                <CardHeader>
                    <CardTitle>Marketing Cookies</CardTitle>
                    <CardDescription>
                        These cookies are used to deliver relevant advertisements and track campaign performance.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-2">
                                Marketing cookies help us deliver personalized advertisements and measure the effectiveness of our
                                campaigns.
                            </p>
                            {getConsentRecord('marketing') && (
                                <p className="text-xs text-muted-foreground">
                                    Last updated: {new Date(getConsentRecord('marketing')?.acceptedAt ?? '').toLocaleDateString()}
                                </p>
                            )}
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
                                    disabled={isSaving}
                                    aria-label="Enable marketing cookies"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50" />
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Third-Party Cookies */}
            <Card>
                <CardHeader>
                    <CardTitle>Third-Party Cookies</CardTitle>
                    <CardDescription>
                        These cookies are set by third-party services that appear on our pages.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-2">
                                Third-party cookies are set by external services to provide additional functionality and features.
                            </p>
                            {getConsentRecord('third_party') && (
                                <p className="text-xs text-muted-foreground">
                                    Last updated: {new Date(getConsentRecord('third_party')?.acceptedAt ?? '').toLocaleDateString()}
                                </p>
                            )}
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
                                    disabled={isSaving}
                                    aria-label="Enable third-party cookies"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50" />
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Consent History */}
            {consentManager.consents.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Consent History</CardTitle>
                        <CardDescription>View your consent history and changes over time.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {consentManager.consents.map((consent) => (
                                <div key={consent.id} className="flex items-center justify-between p-2 border rounded">
                                    <div>
                                        <p className="text-sm font-medium capitalize">{consent.category.replace('_', ' ')}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Status: {consent.status} | Version: {consent.version}
                                        </p>
                                        {consent.acceptedAt && (
                                            <p className="text-xs text-muted-foreground">
                                                Accepted: {new Date(consent.acceptedAt).toLocaleString()}
                                            </p>
                                        )}
                                        {consent.rejectedAt && (
                                            <p className="text-xs text-muted-foreground">
                                                Rejected: {new Date(consent.rejectedAt).toLocaleString()}
                                            </p>
                                        )}
                                        {consent.withdrawnAt && (
                                            <p className="text-xs text-muted-foreground">
                                                Withdrawn: {new Date(consent.withdrawnAt).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Privacy Policy Link */}
            <div className="text-center text-sm text-muted-foreground">
                <p>
                    For more information, please read our{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Privacy Policy
                    </a>
                    .
                </p>
            </div>
        </div>
    );
}
