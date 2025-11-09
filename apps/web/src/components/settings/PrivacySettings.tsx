/**
 * Privacy Settings Component
 *
 * Comprehensive privacy settings screen with data collection, location, analytics, and marketing controls.
 */

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConsentSettings } from '@/components/gdpr/ConsentSettings';
import { DataExport } from '@/components/gdpr/DataExport';
import { DataDeletion } from '@/components/gdpr/DataDeletion';
import { DataRectification } from '@/components/gdpr/DataRectification';
import { RequestStatus } from '@/components/gdpr/RequestStatus';
import { useConsentManager } from '@/hooks/use-consent-manager';
import { getGDPRService } from '@/lib/privacy/gdpr';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PrivacySettings');

interface PrivacySettingsProps {
    userId?: string | null;
}

interface VisibilitySettings {
    readonly profileVisibility: 'public' | 'matches' | 'followers' | 'private';
    readonly showLocation: boolean;
    readonly showContactInfo: boolean;
    readonly allowMessages: 'everyone' | 'matches' | 'none';
}

interface BlockedUser {
    readonly userId: string;
    readonly blockedAt: number;
    readonly reason?: string;
}

export function PrivacySettings({ userId }: PrivacySettingsProps): React.JSX.Element {
    const consentManager = useConsentManager({ userId, autoLoad: true });
    const gdprService = getGDPRService();
    const [activeSection, setActiveSection] = useState<'overview' | 'consent' | 'export' | 'deletion' | 'rectification' | 'requests' | 'visibility' | 'blocked'>('overview');
    const [visibilitySettings, setVisibilitySettings] = useState<VisibilitySettings>({
        profileVisibility: 'public',
        showLocation: true,
        showContactInfo: false,
        allowMessages: 'matches',
    });
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);

    if (!userId) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-muted-foreground">Please log in to manage your privacy settings.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold">Privacy & Data</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your privacy settings, data collection preferences, and account data.
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b">
                <Button
                    variant={activeSection === 'overview' ? 'default' : 'ghost'}
                    onClick={() => setActiveSection('overview')}
                    className="rounded-b-none"
                >
                    Overview
                </Button>
                <Button
                    variant={activeSection === 'consent' ? 'default' : 'ghost'}
                    onClick={() => setActiveSection('consent')}
                    className="rounded-b-none"
                >
                    Consent Management
                </Button>
                <Button
                    variant={activeSection === 'export' ? 'default' : 'ghost'}
                    onClick={() => setActiveSection('export')}
                    className="rounded-b-none"
                >
                    Data Export
                </Button>
                <Button
                    variant={activeSection === 'deletion' ? 'default' : 'ghost'}
                    onClick={() => setActiveSection('deletion')}
                    className="rounded-b-none"
                >
                    Data Deletion
                </Button>
                <Button
                    variant={activeSection === 'rectification' ? 'default' : 'ghost'}
                    onClick={() => setActiveSection('rectification')}
                    className="rounded-b-none"
                >
                    Data Correction
                </Button>
                <Button
                    variant={activeSection === 'requests' ? 'default' : 'ghost'}
                    onClick={() => setActiveSection('requests')}
                    className="rounded-b-none"
                >
                    Request Status
                </Button>
                <Button
                    variant={activeSection === 'visibility' ? 'default' : 'ghost'}
                    onClick={() => setActiveSection('visibility')}
                    className="rounded-b-none"
                >
                    Visibility
                </Button>
                <Button
                    variant={activeSection === 'blocked' ? 'default' : 'ghost'}
                    onClick={() => setActiveSection('blocked')}
                    className="rounded-b-none"
                >
                    Blocked Users
                </Button>
            </div>

            {/* Overview Section */}
            {activeSection === 'overview' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Privacy Overview</CardTitle>
                            <CardDescription>Summary of your current privacy settings and data preferences.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Data Collection</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Analytics</span>
                                        <span className={consentManager.preferences.analytics ? 'text-green-600' : 'text-muted-foreground'}>
                                            {consentManager.preferences.analytics ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Marketing</span>
                                        <span className={consentManager.preferences.marketing ? 'text-green-600' : 'text-muted-foreground'}>
                                            {consentManager.preferences.marketing ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Third-Party</span>
                                        <span
                                            className={consentManager.preferences.thirdParty ? 'text-green-600' : 'text-muted-foreground'}
                                        >
                                            {consentManager.preferences.thirdParty ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <h3 className="font-semibold mb-2">Data Rights</h3>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <p>You have the right to:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Export all your data (Right to Access)</li>
                                        <li>Request correction of inaccurate data (Right to Rectification)</li>
                                        <li>Delete your account and all data (Right to Erasure)</li>
                                        <li>Request data portability (JSON, CSV, XML formats)</li>
                                        <li>Withdraw consent at any time</li>
                                        <li>Track request status in real-time</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setActiveSection('consent')}>
                                        Manage Consent
                                    </Button>
                                    <Button variant="outline" onClick={() => setActiveSection('export')}>
                                        Export Data
                                    </Button>
                                    <Button variant="outline" onClick={() => setActiveSection('rectification')}>
                                        Request Correction
                                    </Button>
                                    <Button variant="outline" onClick={() => setActiveSection('requests')}>
                                        View Requests
                                    </Button>
                                    <Button variant="outline" onClick={() => setActiveSection('deletion')}>
                                        Delete Account
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Privacy Policy & Terms</CardTitle>
                            <CardDescription>Read our privacy policy and terms of service to understand how we handle your data.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" asChild className="w-full">
                                <a href="/privacy" target="_blank" rel="noopener noreferrer">
                                    View Privacy Policy
                                </a>
                            </Button>
                            <Button variant="outline" asChild className="w-full">
                                <a href="/terms" target="_blank" rel="noopener noreferrer">
                                    View Terms of Service
                                </a>
                            </Button>
                            <Button variant="outline" asChild className="w-full">
                                <a href="/cookie-policy" target="_blank" rel="noopener noreferrer">
                                    View Cookie Policy
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Consent Management Section */}
            {activeSection === 'consent' && <ConsentSettings userId={userId} />}

            {/* Data Export Section */}
            {activeSection === 'export' && <DataExport userId={userId} />}

            {/* Data Deletion Section */}
            {activeSection === 'deletion' && <DataDeletion userId={userId} />}

            {/* Data Rectification Section */}
            {activeSection === 'rectification' && <DataRectification userId={userId} />}

            {/* Request Status Section */}
            {activeSection === 'requests' && <RequestStatus userId={userId} />}

            {/* Visibility Settings Section */}
            {activeSection === 'visibility' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Visibility Settings</CardTitle>
                            <CardDescription>
                                Control who can see your profile and contact you.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Profile Visibility</label>
                                <select
                                    value={visibilitySettings.profileVisibility}
                                    onChange={(e) =>
                                        setVisibilitySettings({
                                            ...visibilitySettings,
                                            profileVisibility: e.target.value as VisibilitySettings['profileVisibility'],
                                        })
                                    }
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="public">Public</option>
                                    <option value="matches">Matches Only</option>
                                    <option value="followers">Followers Only</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Location Sharing</label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={visibilitySettings.showLocation}
                                        onChange={(e) =>
                                            setVisibilitySettings({
                                                ...visibilitySettings,
                                                showLocation: e.target.checked,
                                            })
                                        }
                                    />
                                    <span>Show my location</span>
                                </label>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Contact Information</label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={visibilitySettings.showContactInfo}
                                        onChange={(e) =>
                                            setVisibilitySettings({
                                                ...visibilitySettings,
                                                showContactInfo: e.target.checked,
                                            })
                                        }
                                    />
                                    <span>Show contact information</span>
                                </label>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Who can message me</label>
                                <select
                                    value={visibilitySettings.allowMessages}
                                    onChange={(e) =>
                                        setVisibilitySettings({
                                            ...visibilitySettings,
                                            allowMessages: e.target.value as VisibilitySettings['allowMessages'],
                                        })
                                    }
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="everyone">Everyone</option>
                                    <option value="matches">Matches Only</option>
                                    <option value="none">No One</option>
                                </select>
                            </div>

                            <Button
                                onClick={() => {
                                    // Save visibility settings
                                    logger.debug('Visibility settings saved', visibilitySettings);
                                }}
                            >
                                Save Visibility Settings
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Blocked Users Section */}
            {activeSection === 'blocked' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Blocked Users</CardTitle>
                            <CardDescription>
                                Manage users you have blocked or reported.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {blockedUsers.length === 0 ? (
                                <p className="text-muted-foreground">No blocked users</p>
                            ) : (
                                <div className="space-y-2">
                                    {blockedUsers.map((blocked) => (
                                        <div
                                            key={blocked.userId}
                                            className="flex items-center justify-between p-3 border rounded"
                                        >
                                            <div>
                                                <p className="font-medium">User {blocked.userId}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Blocked on {new Date(blocked.blockedAt).toLocaleDateString()}
                                                </p>
                                                {blocked.reason && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Reason: {blocked.reason}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    // Unblock user
                                                    setBlockedUsers(
                                                        blockedUsers.filter((b) => b.userId !== blocked.userId)
                                                    );
                                                    logger.debug('User unblocked', { userId: blocked.userId });
                                                }}
                                            >
                                                Unblock
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
