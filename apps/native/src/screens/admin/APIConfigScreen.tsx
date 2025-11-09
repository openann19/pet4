/**
 * API Config Screen (Mobile)
 *
 * Mobile admin screen for managing API configuration (keys, endpoints, etc.).
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
import { getAPIConfig, updateAPIConfig, type APIConfig } from '../../api/api-config-api';
import { mobileAdminApi } from '../../api/admin-api';
import { AnimatedCard } from '../../components/AnimatedCard';
import { FadeInView } from '../../components/FadeInView';
import { useStorage } from '../../hooks/use-storage';

const logger = createLogger('APIConfigScreen');

const DEFAULT_CONFIG: APIConfig = {
    maps: {
        provider: 'openstreetmap',
        apiKey: '',
        enabled: true,
        rateLimit: 100,
    },
    ai: {
        provider: 'spark',
        apiKey: '',
        model: 'gpt-4o',
        enabled: true,
        maxTokens: 1000,
        temperature: 0.7,
    },
    kyc: {
        provider: 'manual',
        apiKey: '',
        enabled: true,
        autoApprove: false,
        requireDocuments: true,
    },
    photoModeration: {
        provider: 'spark',
        apiKey: '',
        enabled: true,
        autoReject: false,
        confidenceThreshold: 0.8,
    },
    sms: {
        provider: 'disabled',
        apiKey: '',
        apiSecret: '',
        enabled: false,
        fromNumber: '',
    },
    email: {
        provider: 'disabled',
        apiKey: '',
        enabled: false,
        fromEmail: '',
        fromName: 'PawfectMatch',
    },
    storage: {
        provider: 'local',
        apiKey: '',
        apiSecret: '',
        bucket: '',
        region: 'us-east-1',
        enabled: true,
    },
    analytics: {
        provider: 'disabled',
        apiKey: '',
        enabled: false,
    },
    livekit: {
        apiKey: '',
        apiSecret: '',
        wsUrl: '',
        enabled: false,
    },
};

export const APIConfigScreen: React.FC = () => {
    const navigation = useNavigation();
    const [config, setConfig] = useState<APIConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [broadcasting, setBroadcasting] = useState(false);
    const [selectedSection, setSelectedSection] = useState<
        'maps' | 'ai' | 'kyc' | 'photoModeration' | 'sms' | 'email' | 'storage' | 'analytics' | 'livekit'
    >('maps');
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
    const [currentUserId] = useStorage<string>('current-user-id', 'admin');

    // Load config from backend
    const loadConfig = useCallback(async () => {
        setLoading(true);
        try {
            const loadedConfig = await getAPIConfig();
            if (loadedConfig) {
                setConfig(loadedConfig);
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Failed to load API config', err);
            Alert.alert('Error', 'Failed to load API configuration');
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
            const updatedConfig = await updateAPIConfig(config, currentUserId);
            setConfig(updatedConfig);
            Alert.alert('Success', 'API configuration saved successfully');
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Failed to save API config', err);
            Alert.alert('Error', 'Failed to save API configuration');
        } finally {
            setSaving(false);
        }
    }, [config, currentUserId]);

    // Save and broadcast
    const handleSaveAndBroadcast = useCallback(async () => {
        setSaving(true);
        setBroadcasting(true);
        try {
            const updatedConfig = await updateAPIConfig(config, currentUserId);
            setConfig(updatedConfig);

            await mobileAdminApi.broadcastConfig('api', updatedConfig as unknown as Record<string, unknown>);

            await mobileAdminApi.createAuditLog({
                adminId: currentUserId,
                action: 'config_broadcast',
                targetType: 'api_config',
                targetId: 'api-config',
                details: JSON.stringify({ configType: 'api' }),
            });

            Alert.alert('Success', 'API configuration saved and broadcasted successfully');
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Failed to save and broadcast API config', err);
            Alert.alert('Error', 'Failed to save and broadcast API configuration');
        } finally {
            setSaving(false);
            setBroadcasting(false);
        }
    }, [config, currentUserId]);

    const updateConfig = (
        section: keyof APIConfig,
        field: string,
        value: string | boolean | number
    ): void => {
        setConfig((current) => ({
            ...current,
            [section]: {
                ...current[section],
                [field]: value,
            },
        }));
    };

    const toggleSecret = (key: string): void => {
        setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.loadingText}>Loading API configuration...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const sections: Array<{
        key: keyof APIConfig;
        label: string;
        icon: string;
    }> = [
            { key: 'maps', label: 'Maps', icon: '🗺️' },
            { key: 'ai', label: 'AI', icon: '🤖' },
            { key: 'kyc', label: 'KYC', icon: '🆔' },
            { key: 'photoModeration', label: 'Moderation', icon: '👁️' },
            { key: 'sms', label: 'SMS', icon: '📱' },
            { key: 'email', label: 'Email', icon: '📧' },
            { key: 'storage', label: 'Storage', icon: '💾' },
            { key: 'analytics', label: 'Analytics', icon: '📊' },
            { key: 'livekit', label: 'LiveKit', icon: '🎥' },
        ];

    const currentSection = config[selectedSection];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FadeInView delay={0}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>API Configuration</Text>
                    <Text style={styles.headerSubtitle}>Configure external service integrations</Text>
                </View>
            </FadeInView>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Section Tabs */}
                <FadeInView delay={50}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
                        {sections.map((section) => (
                            <TouchableOpacity
                                key={section.key}
                                style={[
                                    styles.tab,
                                    selectedSection === section.key && styles.tabActive,
                                ]}
                                onPress={() => setSelectedSection(section.key)}
                            >
                                <Text style={styles.tabIcon}>{section.icon}</Text>
                                <Text
                                    style={[
                                        styles.tabText,
                                        selectedSection === section.key && styles.tabTextActive,
                                    ]}
                                >
                                    {section.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </FadeInView>

                {/* Selected Section Content */}
                <FadeInView delay={100}>
                    <AnimatedCard style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {sections.find((s) => s.key === selectedSection)?.icon}{' '}
                            {sections.find((s) => s.key === selectedSection)?.label}
                        </Text>

                        {currentSection &&
                            Object.entries(currentSection).map(([key, value]) => {
                                const secretKey = `${selectedSection}.${key}`;
                                const isSecret = key.toLowerCase().includes('key') || key.toLowerCase().includes('secret');
                                const isBoolean = typeof value === 'boolean';
                                const isNumber = typeof value === 'number';
                                const isString = typeof value === 'string';

                                if (isBoolean) {
                                    return (
                                        <View key={key} style={styles.switchRow}>
                                            <View style={styles.switchInfo}>
                                                <Text style={styles.switchLabel}>
                                                    {key.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, (c) => c.toUpperCase())}
                                                </Text>
                                            </View>
                                            <Switch
                                                value={value as boolean}
                                                onValueChange={(val) => updateConfig(selectedSection, key, val)}
                                                trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                                                thumbColor="#ffffff"
                                            />
                                        </View>
                                    );
                                }

                                if (isNumber) {
                                    return (
                                        <View key={key} style={styles.inputRow}>
                                            <Text style={styles.inputLabel}>
                                                {key.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, (c) => c.toUpperCase())}
                                            </Text>
                                            <TextInput
                                                style={styles.input}
                                                value={value.toString()}
                                                onChangeText={(text) =>
                                                    updateConfig(selectedSection, key, parseFloat(text) || 0)
                                                }
                                                keyboardType="decimal-pad"
                                            />
                                        </View>
                                    );
                                }

                                if (isString) {
                                    return (
                                        <View key={key} style={styles.inputRow}>
                                            <View style={styles.inputLabelContainer}>
                                                <Text style={styles.inputLabel}>
                                                    {key.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, (c) => c.toUpperCase())}
                                                </Text>
                                                {isSecret && (
                                                    <TouchableOpacity
                                                        onPress={() => toggleSecret(secretKey)}
                                                        style={styles.eyeButton}
                                                    >
                                                        <Text style={styles.eyeButtonText}>
                                                            {showSecrets[secretKey] ? '👁️' : '👁️‍🗨️'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                            <TextInput
                                                style={styles.input}
                                                value={value as string}
                                                onChangeText={(text) => updateConfig(selectedSection, key, text)}
                                                secureTextEntry={isSecret && !showSecrets[secretKey]}
                                                autoCapitalize="none"
                                            />
                                        </View>
                                    );
                                }

                                return null;
                            })}
                    </AnimatedCard>
                </FadeInView>

                {/* Action Buttons */}
                <FadeInView delay={150}>
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
                            style={[styles.broadcastButton, (saving || broadcasting) && styles.buttonDisabled]}
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
    tabs: {
        marginBottom: 16,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 8,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    tabActive: {
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
    },
    tabIcon: {
        fontSize: 16,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    tabTextActive: {
        color: '#ffffff',
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
    inputRow: {
        marginBottom: 16,
    },
    inputLabelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        flex: 1,
    },
    eyeButton: {
        padding: 4,
    },
    eyeButtonText: {
        fontSize: 18,
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingVertical: 8,
    },
    switchInfo: {
        flex: 1,
        marginRight: 16,
    },
    switchLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#111827',
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
