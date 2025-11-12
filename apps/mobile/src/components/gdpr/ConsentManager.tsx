/**
 * Mobile Consent Manager Component
 *
 * Manages user consent preferences for GDPR compliance on mobile.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useConsentManager } from '../../hooks/use-consent-manager';
import type { ConsentCategory } from '@petspark/shared';

interface ConsentManagerProps {
    userId?: string | null;
    onConsentChange?: (preferences: Record<string, boolean>) => void;
}

export function ConsentManager({ userId, onConsentChange }: ConsentManagerProps): React.JSX.Element {
    const consentManager = useConsentManager({ userId: userId ?? null, autoLoad: true });
    const [isSaving, setIsSaving] = useState(false);

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
            Alert.alert('Error', `Failed to update consent: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.title}>Consent Management</Text>
                <Text style={styles.description}>Manage your consent preferences for data collection and usage.</Text>
            </View>

            {/* Essential Cookies */}
            <View style={styles.card}>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Essential Cookies</Text>
                    <Text style={styles.cardDescription}>
                        These cookies are necessary for the app to function and cannot be switched off.
                    </Text>
                </View>
                <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>Always Active</Text>
                </View>
            </View>

            {/* Analytics Cookies */}
            <View style={styles.card}>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Analytics Cookies</Text>
                    <Text style={styles.cardDescription}>
                        These cookies help us understand how you use our app to improve our services.
                    </Text>
                </View>
                <Switch
                    value={consentManager.preferences.analytics}
                    onValueChange={(value) => {
                        void handlePreferenceChange('analytics', value);
                    }}
                    disabled={isSaving}
                />
            </View>

            {/* Marketing Cookies */}
            <View style={styles.card}>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Marketing Cookies</Text>
                    <Text style={styles.cardDescription}>
                        These cookies are used to deliver relevant advertisements and track campaign performance.
                    </Text>
                </View>
                <Switch
                    value={consentManager.preferences.marketing}
                    onValueChange={(value) => {
                        void handlePreferenceChange('marketing', value);
                    }}
                    disabled={isSaving}
                />
            </View>

            {/* Third-Party Cookies */}
            <View style={styles.card}>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Third-Party Cookies</Text>
                    <Text style={styles.cardDescription}>
                        These cookies are set by third-party services that appear in our app.
                    </Text>
                </View>
                <Switch
                    value={consentManager.preferences.thirdParty}
                    onValueChange={(value) => {
                        void handlePreferenceChange('third_party', value);
                    }}
                    disabled={isSaving}
                />
            </View>

            <TouchableOpacity
                style={styles.linkButton}
                onPress={() => {
                    Alert.alert('Privacy Policy', 'Opening privacy policy...');
                }}
            >
                <Text style={styles.linkText}>View Privacy Policy</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    section: {
        padding: 16,
        backgroundColor: 'var(--color-bg-overlay)',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
    },
    card: {
        backgroundColor: 'var(--color-bg-overlay)',
        borderRadius: 12,
        padding: 16,
        margin: 16,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: 'var(--color-fg)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    cardContent: {
        flex: 1,
        marginRight: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        color: '#6B7280',
    },
    switchContainer: {
        alignItems: 'flex-end',
    },
    switchLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    linkButton: {
        padding: 16,
        alignItems: 'center',
    },
    linkText: {
        fontSize: 14,
        color: '#6366F1',
        fontWeight: '500',
    },
});
