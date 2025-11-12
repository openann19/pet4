/**
 * Mobile Data Rights Screen
 *
 * Allows users to export and delete their data (GDPR Rights).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { gdprService } from '../../lib/gdpr-service';
import { createLogger } from '../../lib/logger';

const logger = createLogger('DataRightsScreen');

interface DataRightsScreenProps {
    userId: string;
    onDeletionComplete?: () => void;
}

export function DataRightsScreen({ userId, onDeletionComplete }: DataRightsScreenProps): React.JSX.Element {
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const [deletionError, setDeletionError] = useState<string | null>(null);

    const handleExport = async (): Promise<void> => {
        try {
            setIsExporting(true);
            setExportError(null);

            const exportData = await gdprService.exportUserData({
                userId,
                format: 'json',
            });

            // Save to file
            const fileName = `petspark-data-export-${userId}-${new Date().toISOString().split('T')[0]}.json`;
            const fileUri = `${FileSystem.documentDirectory}${fileName}`;
            await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));

            // Share file
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Export Complete', `Data exported to: ${fileUri}`);
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Failed to export user data', { error: err.message, userId });
            setExportError(err.message);
            Alert.alert('Export Failed', err.message);
        } finally {
            setIsExporting(false);
        }
    };

    const handleDelete = (): void => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        void (async () => {
                            try {
                                setIsDeleting(true);
                                setDeletionError(null);

                                const result = await gdprService.deleteUserData({
                                    userId,
                                    confirmDeletion: true,
                                    reason: 'User requested account deletion',
                                });

                                if (result.success) {
                                    Alert.alert('Account Deleted', 'Your account has been deleted successfully.', [
                                        {
                                            text: 'OK',
                                            onPress: () => {
                                                onDeletionComplete?.();
                                            },
                                        },
                                    ]);
                                } else {
                                    const errorMessage = `Deletion completed with errors: ${result.errors.map((e) => e.error).join(', ')}`;
                                    setDeletionError(errorMessage);
                                    Alert.alert('Deletion Failed', errorMessage);
                                }
                            } catch (error) {
                                const err = error instanceof Error ? error : new Error(String(error));
                                logger.error('Failed to delete user data', { error: err.message, userId });
                                setDeletionError(err.message);
                                Alert.alert('Deletion Failed', err.message);
                            } finally {
                                setIsDeleting(false);
                            }
                        })();
                    },
                },
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.title}>Data Rights</Text>
                <Text style={styles.description}>Manage your data export and deletion rights.</Text>
            </View>

            {/* Data Export */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Export Your Data</Text>
                <Text style={styles.cardDescription}>
                    Download a copy of all your data stored in our system. The export will include:
                </Text>
                <View style={styles.list}>
                    <Text style={styles.listItem}>• User profile information</Text>
                    <Text style={styles.listItem}>• Pet profiles</Text>
                    <Text style={styles.listItem}>• Matches and swipe history</Text>
                    <Text style={styles.listItem}>• Chat messages</Text>
                    <Text style={styles.listItem}>• Community posts and comments</Text>
                    <Text style={styles.listItem}>• Payment history</Text>
                    <Text style={styles.listItem}>• Verification data</Text>
                    <Text style={styles.listItem}>• Consent records</Text>
                </View>
                {exportError && <Text style={styles.error}>{exportError}</Text>}
                <TouchableOpacity
                    style={[styles.button, styles.exportButton]}
                    onPress={() => {
                        void handleExport();
                    }}
                    disabled={isExporting}
                >
                    {isExporting ? (
                        <ActivityIndicator color="var(--color-bg-overlay)" />
                    ) : (
                        <Text style={styles.buttonText}>Export My Data</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Data Deletion */}
            <View style={[styles.card, styles.dangerCard]}>
                <Text style={[styles.cardTitle, styles.dangerText]}>Delete Account</Text>
                <Text style={styles.cardDescription}>
                    Permanently delete your account and all associated data. This action cannot be undone.
                </Text>
                <Text style={styles.warning}>
                    Warning: Deleting your account will permanently remove all your data including profiles, matches, messages,
                    and payment history.
                </Text>
                {deletionError && <Text style={styles.error}>{deletionError}</Text>}
                <TouchableOpacity
                    style={[styles.button, styles.deleteButton]}
                    onPress={handleDelete}
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <ActivityIndicator color="var(--color-bg-overlay)" />
                    ) : (
                        <Text style={styles.buttonText}>Delete My Account</Text>
                    )}
                </TouchableOpacity>
            </View>
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
        shadowColor: 'var(--color-fg)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    dangerCard: {
        borderWidth: 1,
        borderColor: '#DC2626',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    dangerText: {
        color: '#DC2626',
    },
    cardDescription: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
    },
    warning: {
        fontSize: 12,
        color: '#DC2626',
        marginBottom: 12,
        fontWeight: '500',
    },
    list: {
        marginBottom: 16,
    },
    listItem: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    button: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },
    exportButton: {
        backgroundColor: '#6366F1',
    },
    deleteButton: {
        backgroundColor: '#DC2626',
    },
    buttonText: {
        color: 'var(--color-bg-overlay)',
        fontSize: 16,
        fontWeight: '600',
    },
    error: {
        color: '#DC2626',
        fontSize: 12,
        marginBottom: 8,
    },
});
