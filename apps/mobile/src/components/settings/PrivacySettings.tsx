/**
 * Mobile Privacy Settings Component
 *
 * Comprehensive privacy settings screen for mobile.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ConsentManager } from '../gdpr/ConsentManager';
import { DataRightsScreen } from '../gdpr/DataRightsScreen';

interface PrivacySettingsProps {
    userId?: string | null;
}

export function PrivacySettings({ userId }: PrivacySettingsProps): React.JSX.Element {
    const [activeSection, setActiveSection] = useState<'overview' | 'consent' | 'data'>('overview');

    if (!userId) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Please log in to manage your privacy settings.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Privacy & Data</Text>
                <Text style={styles.description}>Manage your privacy settings and data rights.</Text>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeSection === 'overview' && styles.activeTab]}
                    onPress={() => setActiveSection('overview')}
                >
                    <Text style={[styles.tabText, activeSection === 'overview' && styles.activeTabText]}>Overview</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeSection === 'consent' && styles.activeTab]}
                    onPress={() => setActiveSection('consent')}
                >
                    <Text style={[styles.tabText, activeSection === 'consent' && styles.activeTabText]}>Consent</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeSection === 'data' && styles.activeTab]}
                    onPress={() => setActiveSection('data')}
                >
                    <Text style={[styles.tabText, activeSection === 'data' && styles.activeTabText]}>Data Rights</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {activeSection === 'overview' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Privacy Overview</Text>
                        <Text style={styles.sectionText}>
                            Manage your privacy settings, data collection preferences, and account data. You have the right to export
                            your data, delete your account, and control how your data is used.
                        </Text>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => setActiveSection('consent')}
                        >
                            <Text style={styles.buttonText}>Manage Consent</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => setActiveSection('data')}
                        >
                            <Text style={styles.buttonText}>Data Rights</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {activeSection === 'consent' && <ConsentManager userId={userId} />}

                {activeSection === 'data' && <DataRightsScreen userId={userId} />}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
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
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tab: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#6366F1',
    },
    tabText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#6366F1',
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 16,
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    sectionText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#6366F1',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 32,
    },
});
