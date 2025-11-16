/**
 * System Config Screen (Mobile)
 *
 * Mobile admin screen for managing system configuration (feature flags, system settings, platform settings).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput,
    ActivityIndicator,
    Alert,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { createLogger } from '../../utils/logger';
import { mobileAdminApi } from '../../api/admin-api';
import { getSystemConfig, updateSystemConfig, type SystemConfig as SystemConfigType } from '../../api/system-config-api';
import { AnimatedCard } from '../../components/AnimatedCard';
import { FadeInView } from '../../components/FadeInView';
import { useStorage } from '../../hooks/use-storage';

const logger = createLogger('SystemConfigScreen');

interface FeatureFlags {
    enableChat: boolean;
    enableVisualAnalysis: boolean;
    enableMatching: boolean;
    enableReporting: boolean;
    enableVerification: boolean;
}

interface SystemSettings {
    maxReportsPerUser: number;
    autoModeration: boolean;
    requireVerification: boolean;
    matchDistanceRadius: number;
    messagingEnabled: boolean;
}

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
    enableChat: true,
    enableVisualAnalysis: true,
    enableMatching: true,
    enableReporting: true,
    enableVerification: true,
};

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
    maxReportsPerUser: 10,
    autoModeration: false,
    requireVerification: false,
    matchDistanceRadius: 50,
    messagingEnabled: true,
};

export const SystemConfigScreen: React.FC = () => {
    const navigation = useNavigation();
    const [config, setConfig] = useState<SystemConfigType>({
        featureFlags: DEFAULT_FEATURE_FLAGS,
        systemSettings: DEFAULT_SYSTEM_SETTINGS,
        maintenanceMode: false,
        registrationEnabled: true,
        moderationEnabled: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [broadcasting, setBroadcasting] = useState(false);
    const [currentUserId] = useStorage<string>('current-user-id', 'admin');

    // Load config from backend
    const loadConfig = useCallback(async () => {
        setLoading(true);
        try {
            const loadedConfig = await getSystemConfig();
            if (loadedConfig) {
                setConfig({
                    featureFlags: { ...DEFAULT_FEATURE_FLAGS, ...loadedConfig.featureFlags },
                    systemSettings: { ...DEFAULT_SYSTEM_SETTINGS, ...loadedConfig.systemSettings },
                    maintenanceMode: loadedConfig.maintenanceMode ?? false,
                    registrationEnabled: loadedConfig.registrationEnabled ?? true,
                    moderationEnabled: loadedConfig.moderationEnabled ?? true,
                });
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Failed to load system config', err);
            Alert.alert('Error', 'Failed to load system configuration');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadConfig();
    }, [loadConfig]);

    // Save config to backend
    const saveConfig = useCallback(async () => {
        setSaving(true);
        try {
            const updatedConfig = await updateSystemConfig(config, currentUserId);
            setConfig(updatedConfig);
            Alert.alert('Success', 'System configuration saved successfully');
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Failed to save system config', err);
            Alert.alert('Error', 'Failed to save system configuration');
        } finally {
            setSaving(false);
        }
    }, [config, currentUserId]);

    // Save and broadcast
    const handleSaveAndBroadcast = useCallback(async () => {
        setSaving(true);
        setBroadcasting(true);
        try {
            // Save config first
            const updatedConfig = await updateSystemConfig(config, currentUserId);
            setConfig(updatedConfig);

            // Broadcast config
            await mobileAdminApi.broadcastConfig('system', updatedConfig as unknown as Record<string, unknown>);

            // Log audit entry
            await mobileAdminApi.createAuditLog({
                adminId: currentUserId,
                action: 'config_broadcast',
                targetType: 'system_config',
                targetId: 'system-config',
                details: JSON.stringify({ configType: 'system' }),
            });

            Alert.alert('Success', 'System configuration saved and broadcasted successfully');
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Failed to save and broadcast system config', err);
            Alert.alert('Error', 'Failed to save and broadcast system configuration');
        } finally {
            setSaving(false);
            setBroadcasting(false);
        }
    }, [config, currentUserId]);

    const updateFeatureFlag = (key: keyof FeatureFlags, value: boolean): void => {
        setConfig((current) => ({
            ...current,
            featureFlags: {
                ...current.featureFlags,
                [key]: value,
            },
        }));
    };

    const updateSystemSetting = (key: keyof SystemSettings, value: number | boolean): void => {
        setConfig((current) => ({
            ...current,
            systemSettings: {
                ...current.systemSettings,
                [key]: value,
            },
        }));
    };

    const updatePlatformSetting = (key: 'maintenanceMode' | 'registrationEnabled' | 'moderationEnabled', value: boolean): void => {
        setConfig((current) => ({
            ...current,
            [key]: value,
        }));
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.loadingText}>Loading system configuration...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FadeInView delay={0}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>System Configuration</Text>
                    <Text style={styles.headerSubtitle}>Manage feature flags and system settings</Text>
                </View>
            </FadeInView>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Feature Flags Section */}
                <FadeInView delay={50}>
                    <AnimatedCard style={styles.section}>
                        <Text style={styles.sectionTitle}>🚩 Feature Flags</Text>

                        <SettingSwitch
                            label="Chat System"
                            description="Allow users to send messages to matched pets"
                            value={config.featureFlags.enableChat}
                            onValueChange={(value) => updateFeatureFlag('enableChat', value)}
                        />

                        <SettingSwitch
                            label="AI Visual Analysis"
                            description="Enable AI-powered pet photo analysis"
                            value={config.featureFlags.enableVisualAnalysis}
                            onValueChange={(value) => updateFeatureFlag('enableVisualAnalysis', value)}
                        />

                        <SettingSwitch
                            label="Matching System"
                            description="Allow users to swipe and match with pets"
                            value={config.featureFlags.enableMatching}
                            onValueChange={(value) => updateFeatureFlag('enableMatching', value)}
                        />

                        <SettingSwitch
                            label="Reporting System"
                            description="Allow users to report inappropriate content"
                            value={config.featureFlags.enableReporting}
                            onValueChange={(value) => updateFeatureFlag('enableReporting', value)}
                        />

                        <SettingSwitch
                            label="Verification System"
                            description="Require users to verify their identity"
                            value={config.featureFlags.enableVerification}
                            onValueChange={(value) => updateFeatureFlag('enableVerification', value)}
                        />
                    </AnimatedCard>
                </FadeInView>

                {/* System Settings Section */}
                <FadeInView delay={100}>
                    <AnimatedCard style={styles.section}>
                        <Text style={styles.sectionTitle}>⚙️ System Settings</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Max Reports Per User (Daily)</Text>
                            <TextInput
                                style={styles.input}
                                value={config.systemSettings.maxReportsPerUser.toString()}
                                onChangeText={(text) =>
                                    updateSystemSetting('maxReportsPerUser', parseInt(text, 10) || 0)
                                }
                                keyboardType="number-pad"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Match Distance Radius (km)</Text>
                            <TextInput
                                style={styles.input}
                                value={config.systemSettings.matchDistanceRadius.toString()}
                                onChangeText={(text) =>
                                    updateSystemSetting('matchDistanceRadius', parseInt(text, 10) || 0)
                                }
                                keyboardType="number-pad"
                            />
                        </View>

                        <SettingSwitch
                            label="Auto Moderation"
                            description="Automatically flag inappropriate content using AI"
                            value={config.systemSettings.autoModeration}
                            onValueChange={(value) => updateSystemSetting('autoModeration', value)}
                        />

                        <SettingSwitch
                            label="Require Verification"
                            description="Require all users to verify their identity"
                            value={config.systemSettings.requireVerification}
                            onValueChange={(value) => updateSystemSetting('requireVerification', value)}
                        />

                        <SettingSwitch
                            label="Messaging Enabled"
                            description="Allow users to send and receive messages"
                            value={config.systemSettings.messagingEnabled}
                            onValueChange={(value) => updateSystemSetting('messagingEnabled', value)}
                        />
                    </AnimatedCard>
                </FadeInView>

                {/* Platform Settings Section */}
                <FadeInView delay={150}>
                    <AnimatedCard style={styles.section}>
                        <Text style={styles.sectionTitle}>🌐 Platform Settings</Text>

                        <SettingSwitch
                            label="Maintenance Mode"
                            description="Put the platform in maintenance mode"
                            value={config.maintenanceMode ?? false}
                            onValueChange={(value) => updatePlatformSetting('maintenanceMode', value)}
                        />

                        <SettingSwitch
                            label="Registration Enabled"
                            description="Allow new user registrations"
                            value={config.registrationEnabled ?? true}
                            onValueChange={(value) => updatePlatformSetting('registrationEnabled', value)}
                        />

                        <SettingSwitch
                            label="Moderation Enabled"
                            description="Enable content moderation"
                            value={config.moderationEnabled ?? true}
                            onValueChange={(value) => updatePlatformSetting('moderationEnabled', value)}
                        />
                    </AnimatedCard>
                </FadeInView>

                {/* Action Buttons */}
                <FadeInView delay={200}>
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.saveButton, (saving || broadcasting) && styles.buttonDisabled]}
                            onPress={saveConfig}
                            disabled={saving || broadcasting}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.broadcastButton,
                                (saving || broadcasting) && styles.buttonDisabled,
                            ]}
                            onPress={handleSaveAndBroadcast}
                            disabled={saving || broadcasting}
                        >
                            {broadcasting ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Text style={styles.broadcastButtonText}>Save & Broadcast</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </FadeInView>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

interface SettingSwitchProps {
    label: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
}

const SettingSwitch: React.FC<SettingSwitchProps> = ({ label, description, value, onValueChange }) => {
    return (
        <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>{label}</Text>
                <Text style={styles.switchDescription}>{description}</Text>
            </View>
            <Switch value={value} onValueChange={onValueChange} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280',
    },
    header: {
        padding: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        marginBottom: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#6366f1',
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6b7280',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 16,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        height: 44,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#ffffff',
        fontSize: 15,
        color: '#111827',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingVertical: 8,
    },
    switchInfo: {
        flex: 1,
        marginRight: 16,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 4,
    },
    switchDescription: {
        fontSize: 13,
        color: '#6b7280',
    },
    actions: {
        gap: 12,
        marginTop: 8,
    },
    saveButton: {
        backgroundColor: '#374151',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    broadcastButton: {
        backgroundColor: '#6366f1',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    broadcastButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

