/**
 * Matching Config Screen (Mobile)
 *
 * Mobile admin screen for managing matching configuration (weights, hard gates, feature flags).
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
import {
    getMatchingConfig,
    updateMatchingConfig,
    type MatchingConfig,
    type MatchingWeights,
    type HardGatesConfig,
    type FeatureFlags,
} from '../../api/matching-config-api';
import { mobileAdminApi } from '../../api/admin-api';
import { AnimatedCard } from '../../components/AnimatedCard';
import { FadeInView } from '../../components/FadeInView';
import { useStorage } from '../../hooks/use-storage';

const logger = createLogger('MatchingConfigScreen');

const DEFAULT_WEIGHTS: MatchingWeights = {
    temperamentFit: 20,
    energyLevelFit: 10,
    lifeStageProximity: 10,
    sizeCompatibility: 10,
    speciesBreedCompatibility: 15,
    socializationCompatibility: 10,
    intentMatch: 10,
    distance: 10,
    healthVaccinationBonus: 5,
};

const DEFAULT_HARD_GATES: HardGatesConfig = {
    requireVaccination: true,
    requireSpayNeuter: true,
    requireAgeVerification: true,
    maxDistanceKm: 50,
    minAgeMonths: 0,
    maxAgeMonths: 240,
};

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
    MATCH_ALLOW_CROSS_SPECIES: false,
    MATCH_REQUIRE_VACCINATION: true,
    MATCH_DISTANCE_MAX_KM: 50,
    MATCH_AB_TEST_KEYS: [],
    MATCH_AI_HINTS_ENABLED: true,
};

const DEFAULT_CONFIG: MatchingConfig = {
    id: 'default',
    weights: DEFAULT_WEIGHTS,
    hardGates: DEFAULT_HARD_GATES,
    featureFlags: DEFAULT_FEATURE_FLAGS,
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin',
};

export const MatchingConfigScreen: React.FC = () => {
    const navigation = useNavigation();
    const [config, setConfig] = useState<MatchingConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [broadcasting, setBroadcasting] = useState(false);
    const [currentUserId] = useStorage<string>('current-user-id', 'admin');

    // Load config from backend
    const loadConfig = useCallback(async () => {
        setLoading(true);
        try {
            const loadedConfig = await getMatchingConfig();
            if (loadedConfig) {
                setConfig(loadedConfig);
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Failed to load matching config', err);
            Alert.alert('Error', 'Failed to load matching configuration');
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
            const updatedConfig = await updateMatchingConfig(config, currentUserId);
            setConfig(updatedConfig);
            Alert.alert('Success', 'Matching configuration saved successfully');
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Failed to save matching config', err);
            Alert.alert('Error', 'Failed to save matching configuration');
        } finally {
            setSaving(false);
        }
    }, [config, currentUserId]);

    // Save and broadcast
    const handleSaveAndBroadcast = useCallback(async () => {
        setSaving(true);
        setBroadcasting(true);
        try {
            const updatedConfig = await updateMatchingConfig(config, currentUserId);
            setConfig(updatedConfig);

            await mobileAdminApi.broadcastConfig(
                'matching',
                updatedConfig as unknown as Record<string, unknown>
            );

            await mobileAdminApi.createAuditLog({
                adminId: currentUserId,
                action: 'config_broadcast',
                targetType: 'matching_config',
                targetId: updatedConfig.id || 'default',
                details: JSON.stringify({ configType: 'matching' }),
            });

            Alert.alert('Success', 'Matching configuration saved and broadcasted successfully');
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Failed to save and broadcast matching config', err);
            Alert.alert('Error', 'Failed to save and broadcast matching configuration');
        } finally {
            setSaving(false);
            setBroadcasting(false);
        }
    }, [config, currentUserId]);

    const updateWeight = (key: keyof MatchingWeights, value: number): void => {
        setConfig((current) => ({
            ...current,
            weights: {
                ...current.weights,
                [key]: value,
            },
        }));
    };

    const updateHardGate = (key: keyof HardGatesConfig, value: boolean | number): void => {
        setConfig((current) => ({
            ...current,
            hardGates: {
                ...current.hardGates,
                [key]: value,
            },
        }));
    };

    const updateFeatureFlag = (key: keyof FeatureFlags, value: boolean | number | string[]): void => {
        setConfig((current) => ({
            ...current,
            featureFlags: {
                ...current.featureFlags,
                [key]: value,
            },
        }));
    };

    const totalWeight = Object.values(config.weights).reduce((sum, val) => sum + val, 0);
    const isWeightValid = totalWeight === 100;

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.loadingText}>Loading matching configuration...</Text>
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
                    <Text style={styles.headerTitle}>Matching Configuration</Text>
                    <Text style={styles.headerSubtitle}>Manage weights, gates, and feature flags</Text>
                </View>
            </FadeInView>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Weights Section */}
                <FadeInView delay={50}>
                    <AnimatedCard style={styles.section}>
                        <Text style={styles.sectionTitle}>⚖️ Matching Weights</Text>
                        <Text style={styles.sectionDescription}>
                            Total: {totalWeight}% {!isWeightValid && <Text style={styles.errorText}>(Must be 100%)</Text>}
                        </Text>

                        {(Object.keys(config.weights) as Array<keyof MatchingWeights>).map((key) => (
                            <View key={key} style={styles.weightRow}>
                                <View style={styles.weightInfo}>
                                    <Text style={styles.weightLabel}>
                                        {key.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, (c) => c.toUpperCase())}
                                    </Text>
                                </View>
                                <TextInput
                                    style={styles.weightInput}
                                    value={config.weights[key].toString()}
                                    onChangeText={(text) => updateWeight(key, parseInt(text, 10) || 0)}
                                    keyboardType="number-pad"
                                />
                                <Text style={styles.percentText}>%</Text>
                            </View>
                        ))}
                    </AnimatedCard>
                </FadeInView>

                {/* Hard Gates Section */}
                <FadeInView delay={100}>
                    <AnimatedCard style={styles.section}>
                        <Text style={styles.sectionTitle}>🚧 Hard Gates</Text>

                        <View style={styles.switchRow}>
                            <View style={styles.switchInfo}>
                                <Text style={styles.switchLabel}>Require Vaccination</Text>
                                <Text style={styles.switchDescription}>Block matches without vaccinations</Text>
                            </View>
                            <Switch
                                value={config.hardGates.requireVaccination}
                                onValueChange={(val) => updateHardGate('requireVaccination', val)}
                                trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                                thumbColor="#ffffff"
                            />
                        </View>

                        <View style={styles.switchRow}>
                            <View style={styles.switchInfo}>
                                <Text style={styles.switchLabel}>Require Spay/Neuter</Text>
                                <Text style={styles.switchDescription}>Block matches without spay/neuter</Text>
                            </View>
                            <Switch
                                value={config.hardGates.requireSpayNeuter}
                                onValueChange={(val) => updateHardGate('requireSpayNeuter', val)}
                                trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                                thumbColor="#ffffff"
                            />
                        </View>

                        <View style={styles.switchRow}>
                            <View style={styles.switchInfo}>
                                <Text style={styles.switchLabel}>Require Age Verification</Text>
                                <Text style={styles.switchDescription}>Block matches without age verification</Text>
                            </View>
                            <Switch
                                value={config.hardGates.requireAgeVerification}
                                onValueChange={(val) => updateHardGate('requireAgeVerification', val)}
                                trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                                thumbColor="#ffffff"
                            />
                        </View>

                        <View style={styles.inputRow}>
                            <Text style={styles.inputLabel}>Max Distance (km)</Text>
                            <TextInput
                                style={styles.input}
                                value={config.hardGates.maxDistanceKm.toString()}
                                onChangeText={(text) => updateHardGate('maxDistanceKm', parseInt(text, 10) || 50)}
                                keyboardType="number-pad"
                            />
                        </View>
                    </AnimatedCard>
                </FadeInView>

                {/* Feature Flags Section */}
                <FadeInView delay={150}>
                    <AnimatedCard style={styles.section}>
                        <Text style={styles.sectionTitle}>🚩 Feature Flags</Text>

                        <View style={styles.switchRow}>
                            <View style={styles.switchInfo}>
                                <Text style={styles.switchLabel}>Allow Cross-Species</Text>
                                <Text style={styles.switchDescription}>Enable matching between dogs and cats</Text>
                            </View>
                            <Switch
                                value={config.featureFlags.MATCH_ALLOW_CROSS_SPECIES}
                                onValueChange={(val) => updateFeatureFlag('MATCH_ALLOW_CROSS_SPECIES', val)}
                                trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                                thumbColor="#ffffff"
                            />
                        </View>

                        <View style={styles.switchRow}>
                            <View style={styles.switchInfo}>
                                <Text style={styles.switchLabel}>Require Vaccination</Text>
                                <Text style={styles.switchDescription}>Require vaccinations for matching</Text>
                            </View>
                            <Switch
                                value={config.featureFlags.MATCH_REQUIRE_VACCINATION}
                                onValueChange={(val) => updateFeatureFlag('MATCH_REQUIRE_VACCINATION', val)}
                                trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                                thumbColor="#ffffff"
                            />
                        </View>

                        <View style={styles.switchRow}>
                            <View style={styles.switchInfo}>
                                <Text style={styles.switchLabel}>AI Hints Enabled</Text>
                                <Text style={styles.switchDescription}>Enable AI-powered matching hints</Text>
                            </View>
                            <Switch
                                value={config.featureFlags.MATCH_AI_HINTS_ENABLED}
                                onValueChange={(val) => updateFeatureFlag('MATCH_AI_HINTS_ENABLED', val)}
                                trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                                thumbColor="#ffffff"
                            />
                        </View>

                        <View style={styles.inputRow}>
                            <Text style={styles.inputLabel}>Max Distance (km)</Text>
                            <TextInput
                                style={styles.input}
                                value={config.featureFlags.MATCH_DISTANCE_MAX_KM.toString()}
                                onChangeText={(text) =>
                                    updateFeatureFlag('MATCH_DISTANCE_MAX_KM', parseInt(text, 10) || 50)
                                }
                                keyboardType="number-pad"
                            />
                        </View>
                    </AnimatedCard>
                </FadeInView>

                {/* Action Buttons */}
                <FadeInView delay={200}>
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.saveButton, (saving || broadcasting) && styles.buttonDisabled]}
                            onPress={saveConfig}
                            disabled={saving || broadcasting || !isWeightValid}
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
                                (saving || broadcasting || !isWeightValid) && styles.buttonDisabled,
                            ]}
                            onPress={handleSaveAndBroadcast}
                            disabled={saving || broadcasting || !isWeightValid}
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
    section: {
        marginBottom: 16,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 16,
    },
    errorText: {
        color: '#ef4444',
        fontWeight: '600',
    },
    weightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    weightInfo: {
        flex: 1,
    },
    weightLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    weightInput: {
        width: 60,
        height: 40,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 8,
        backgroundColor: '#ffffff',
        fontSize: 15,
        textAlign: 'center',
        marginLeft: 8,
    },
    percentText: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 4,
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
        marginBottom: 4,
    },
    switchDescription: {
        fontSize: 13,
        color: '#6b7280',
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#374151',
    },
    input: {
        width: 100,
        height: 40,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#ffffff',
        fontSize: 15,
        textAlign: 'right',
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
