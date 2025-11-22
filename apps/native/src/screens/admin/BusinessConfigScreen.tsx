/**
 * Business Config Screen (Mobile)
 *
 * Mobile admin screen for managing business configuration (prices, limits, experiments).
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { createLogger } from '../../utils/logger';
import { getBusinessConfig, updateBusinessConfig, type BusinessConfig } from '../../api/business-config-api';
import { mobileAdminApi } from '../../api/admin-api';
import { AnimatedCard } from '../../components/AnimatedCard';
import { FadeInView } from '../../components/FadeInView';
import { useStorage } from '../../hooks/use-storage';

const logger = createLogger('BusinessConfigScreen');

const DEFAULT_CONFIG: BusinessConfig = {
    id: 'default',
    version: '1',
    prices: {
        premium: { monthly: 9.99, yearly: 99.99, currency: 'USD' },
        elite: { monthly: 19.99, yearly: 199.99, currency: 'USD' },
        boost: { price: 2.99, currency: 'USD' },
        superLike: { price: 0.99, currency: 'USD' },
    },
    limits: {
        free: { swipeDailyCap: 5, adoptionListingLimit: 1 },
        premium: { boostsPerWeek: 1, superLikesPerDay: 0 },
        elite: { boostsPerWeek: 2, superLikesPerDay: 10 },
    },
    experiments: {},
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin',
};

export const BusinessConfigScreen: React.FC = () => {
    const navigation = useNavigation();
    const [config, setConfig] = useState<BusinessConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [broadcasting, setBroadcasting] = useState(false);
    const [currentUserId] = useStorage<string>('current-user-id', 'admin');

    // Load config from backend
    const loadConfig = useCallback(async () => {
        setLoading(true);
        try {
            const loadedConfig = await getBusinessConfig();
            if (loadedConfig) {
                setConfig(loadedConfig);
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Failed to load business config', err);
            Alert.alert('Error', 'Failed to load business configuration');
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
            const updatedConfig = await updateBusinessConfig(config, currentUserId);
            setConfig(updatedConfig);
            Alert.alert('Success', 'Business configuration saved successfully');
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Failed to save business config', err);
            Alert.alert('Error', 'Failed to save business configuration');
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
            const updatedConfig = await updateBusinessConfig(config, currentUserId);
            setConfig(updatedConfig);

            // Broadcast config
            await mobileAdminApi.broadcastConfig('business', updatedConfig as unknown as Record<string, unknown>);

            // Log audit entry
            await mobileAdminApi.createAuditLog({
                adminId: currentUserId,
                action: 'config_broadcast',
                targetType: 'business_config',
                targetId: updatedConfig.id || 'default',
                details: JSON.stringify({ configType: 'business' }),
            });

            Alert.alert('Success', 'Business configuration saved and broadcasted successfully');
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Failed to save and broadcast business config', err);
            Alert.alert('Error', 'Failed to save and broadcast business configuration');
        } finally {
            setSaving(false);
            setBroadcasting(false);
        }
    }, [config, currentUserId]);

    const updatePrice = (path: string[], value: number): void => {
        setConfig((current) => {
            const newConfig = { ...current };
            let currentObj: Record<string, unknown> = newConfig as Record<string, unknown>;
            for (let i = 0; i < path.length - 1; i++) {
                const key = path[i];
                if (key === undefined) return current;
                const next = currentObj[key];
                if (typeof next === 'object' && next !== null && !Array.isArray(next)) {
                    currentObj = next as Record<string, unknown>;
                } else {
                    return current;
                }
            }
            const lastKey = path[path.length - 1];
            if (lastKey !== undefined) {
                currentObj[lastKey] = value;
            }
            return newConfig as BusinessConfig;
        });
    };

    const updateLimit = (path: string[], value: number): void => {
        setConfig((current) => {
            const newConfig = { ...current };
            let currentObj: Record<string, unknown> = newConfig as Record<string, unknown>;
            for (let i = 0; i < path.length - 1; i++) {
                const key = path[i];
                if (key === undefined) return current;
                const next = currentObj[key];
                if (typeof next === 'object' && next !== null && !Array.isArray(next)) {
                    currentObj = next as Record<string, unknown>;
                } else {
                    return current;
                }
            }
            const lastKey = path[path.length - 1];
            if (lastKey !== undefined) {
                currentObj[lastKey] = value;
            }
            return newConfig as BusinessConfig;
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.loadingText}>Loading business configuration...</Text>
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
                    <Text style={styles.headerTitle}>Business Configuration</Text>
                    <Text style={styles.headerSubtitle}>Manage prices, limits, and experiments</Text>
                </View>
            </FadeInView>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Prices Section */}
                <FadeInView delay={50}>
                    <AnimatedCard style={styles.section}>
                        <Text style={styles.sectionTitle}>💰 Prices</Text>

                        <View style={styles.subsection}>
                            <Text style={styles.subsectionTitle}>Premium Plan</Text>
                            <View style={styles.inputRow}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Monthly (USD)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={config.prices.premium.monthly.toString()}
                                        onChangeText={(text) =>
                                            updatePrice(['prices', 'premium', 'monthly'], parseFloat(text) || 0)
                                        }
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Yearly (USD)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={config.prices.premium.yearly.toString()}
                                        onChangeText={(text) =>
                                            updatePrice(['prices', 'premium', 'yearly'], parseFloat(text) || 0)
                                        }
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.subsection}>
                            <Text style={styles.subsectionTitle}>Elite Plan</Text>
                            <View style={styles.inputRow}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Monthly (USD)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={config.prices.elite.monthly.toString()}
                                        onChangeText={(text) =>
                                            updatePrice(['prices', 'elite', 'monthly'], parseFloat(text) || 0)
                                        }
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Yearly (USD)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={config.prices.elite.yearly.toString()}
                                        onChangeText={(text) =>
                                            updatePrice(['prices', 'elite', 'yearly'], parseFloat(text) || 0)
                                        }
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.subsection}>
                            <Text style={styles.subsectionTitle}>Consumables</Text>
                            <View style={styles.inputRow}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Boost (USD)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={config.prices.boost.price.toString()}
                                        onChangeText={(text) =>
                                            updatePrice(['prices', 'boost', 'price'], parseFloat(text) || 0)
                                        }
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Super Like (USD)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={config.prices.superLike.price.toString()}
                                        onChangeText={(text) =>
                                            updatePrice(['prices', 'superLike', 'price'], parseFloat(text) || 0)
                                        }
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>
                        </View>
                    </AnimatedCard>
                </FadeInView>

                {/* Limits Section */}
                <FadeInView delay={100}>
                    <AnimatedCard style={styles.section}>
                        <Text style={styles.sectionTitle}>⚙️ Limits</Text>

                        <View style={styles.subsection}>
                            <Text style={styles.subsectionTitle}>Free Plan</Text>
                            <View style={styles.inputRow}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Daily Swipe Cap</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={config.limits.free.swipeDailyCap.toString()}
                                        onChangeText={(text) =>
                                            updateLimit(['limits', 'free', 'swipeDailyCap'], parseInt(text, 10) || 0)
                                        }
                                        keyboardType="number-pad"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Adoption Listings</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={config.limits.free.adoptionListingLimit.toString()}
                                        onChangeText={(text) =>
                                            updateLimit(
                                                ['limits', 'free', 'adoptionListingLimit'],
                                                parseInt(text, 10) || 0
                                            )
                                        }
                                        keyboardType="number-pad"
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.subsection}>
                            <Text style={styles.subsectionTitle}>Premium Plan</Text>
                            <View style={styles.inputRow}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Boosts/Week</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={config.limits.premium.boostsPerWeek.toString()}
                                        onChangeText={(text) =>
                                            updateLimit(
                                                ['limits', 'premium', 'boostsPerWeek'],
                                                parseInt(text, 10) || 0
                                            )
                                        }
                                        keyboardType="number-pad"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Super Likes/Day</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={config.limits.premium.superLikesPerDay.toString()}
                                        onChangeText={(text) =>
                                            updateLimit(
                                                ['limits', 'premium', 'superLikesPerDay'],
                                                parseInt(text, 10) || 0
                                            )
                                        }
                                        keyboardType="number-pad"
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.subsection}>
                            <Text style={styles.subsectionTitle}>Elite Plan</Text>
                            <View style={styles.inputRow}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Boosts/Week</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={config.limits.elite.boostsPerWeek.toString()}
                                        onChangeText={(text) =>
                                            updateLimit(
                                                ['limits', 'elite', 'boostsPerWeek'],
                                                parseInt(text, 10) || 0
                                            )
                                        }
                                        keyboardType="number-pad"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Super Likes/Day</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={config.limits.elite.superLikesPerDay.toString()}
                                        onChangeText={(text) =>
                                            updateLimit(
                                                ['limits', 'elite', 'superLikesPerDay'],
                                                parseInt(text, 10) || 0
                                            )
                                        }
                                        keyboardType="number-pad"
                                    />
                                </View>
                            </View>
                        </View>
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
    subsection: {
        marginBottom: 24,
    },
    subsectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 12,
    },
    inputGroup: {
        flex: 1,
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
