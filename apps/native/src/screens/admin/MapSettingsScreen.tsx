/**
 * Map Settings Screen (Mobile)
 *
 * Mobile admin screen for configuring map settings and provider configuration.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { createLogger } from '../../utils/logger';
import { getMapConfig, updateMapConfig, type MapConfig, type MapSettings } from '../../api/map-config-api';
import { mobileAdminApi } from '../../api/admin-api';
import { AnimatedCard } from '../../components/AnimatedCard';
import { FadeInView } from '../../components/FadeInView';
import { useStorage } from '../../hooks/use-storage';

const logger = createLogger('MapSettingsScreen');

const DEFAULT_MAP_SETTINGS: MapSettings = {
  PRIVACY_GRID_METERS: 1000,
  DEFAULT_RADIUS_KM: 10,
  MAX_RADIUS_KM: 100,
  MIN_RADIUS_KM: 1,
  UNITS: 'metric',
  COUNTRY_BIAS: 'US',
  ENABLE_PRECISE_LOCATION: true,
  PRECISE_LOCATION_TIMEOUT_MINUTES: 60,
  ENABLE_GEOFENCING: true,
  ENABLE_LOST_PET_ALERTS: true,
  ENABLE_PLAYDATE_PLANNING: true,
  ENABLE_PLACE_DISCOVERY: true,
  AUTO_CENTER_ON_LOCATION: true,
  SHOW_DISTANCE_LABELS: true,
  CLUSTER_MARKERS: true,
  MAX_MARKERS_VISIBLE: 50,
};

export const MapSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [mapSettings, setMapSettings] = useState<MapSettings>(DEFAULT_MAP_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [currentUserId] = useStorage<string>('current-user-id', 'admin');

  // Load config from backend
  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const config = await getMapConfig();
      if (config) {
        setMapSettings(config.settings);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load map config', err);
      Alert.alert('Error', 'Failed to load map configuration');
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
      const config: MapConfig = {
        settings: mapSettings,
        categorySettings: {
          categories: [],
          defaultCategory: 'park',
          enableUserSubmittedPlaces: true,
          requireModeration: true,
        },
      };
      await updateMapConfig(config, currentUserId);
      Alert.alert('Success', 'Map configuration saved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to save map config', err);
      Alert.alert('Error', 'Failed to save map configuration');
    } finally {
      setSaving(false);
    }
  }, [mapSettings, currentUserId]);

  const handleBroadcast = async () => {
    setBroadcasting(true);
    try {
      // Save config first
      await saveConfig();

      const config: MapConfig = {
        settings: mapSettings,
        categorySettings: {
          categories: [],
          defaultCategory: 'park',
          enableUserSubmittedPlaces: true,
          requireModeration: true,
        },
      };

      await mobileAdminApi.broadcastConfig('map', config as unknown as Record<string, unknown>);

      await mobileAdminApi.createAuditLog({
        adminId: currentUserId,
        action: 'config_broadcast',
        targetType: 'map_config',
        targetId: 'map-settings',
        details: JSON.stringify({ configType: 'map' }),
      });

      Alert.alert('Success', 'Map configuration saved and broadcasted successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to broadcast map settings', err);
      Alert.alert('Error', 'Failed to broadcast map configuration');
    } finally {
      setBroadcasting(false);
    }
  };

  const updateSetting = <K extends keyof MapSettings>(key: K, value: MapSettings[K]): void => {
    setMapSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading map configuration...</Text>
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
          <Text style={styles.headerTitle}>Map Configuration</Text>
          <Text style={styles.headerSubtitle}>Configure map features and settings</Text>
        </View>
      </FadeInView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <FadeInView delay={100}>
          <AnimatedCard style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy Settings</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Privacy Grid (meters)</Text>
                <Text style={styles.settingDescription}>Grid size for location privacy</Text>
              </View>
              <TextInput
                style={styles.input}
                value={mapSettings.PRIVACY_GRID_METERS.toString()}
                onChangeText={(text) =>
                  updateSetting('PRIVACY_GRID_METERS', parseInt(text, 10) || 1000)
                }
                keyboardType="numeric"
              />
            </View>
          </AnimatedCard>
        </FadeInView>

        <FadeInView delay={150}>
          <AnimatedCard style={styles.section}>
            <Text style={styles.sectionTitle}>Radius Settings</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Default Radius (km)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={mapSettings.DEFAULT_RADIUS_KM.toString()}
                onChangeText={(text) => updateSetting('DEFAULT_RADIUS_KM', parseInt(text, 10) || 10)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Max Radius (km)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={mapSettings.MAX_RADIUS_KM.toString()}
                onChangeText={(text) => updateSetting('MAX_RADIUS_KM', parseInt(text, 10) || 100)}
                keyboardType="numeric"
              />
            </View>
          </AnimatedCard>
        </FadeInView>

        <FadeInView delay={200}>
          <AnimatedCard style={styles.section}>
            <Text style={styles.sectionTitle}>Feature Flags</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Precise Location</Text>
                <Text style={styles.settingDescription}>Enable precise location tracking</Text>
              </View>
              <Switch
                value={mapSettings.ENABLE_PRECISE_LOCATION}
                onValueChange={(val) => updateSetting('ENABLE_PRECISE_LOCATION', val)}
                trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Geofencing</Text>
                <Text style={styles.settingDescription}>Enable geofence notifications</Text>
              </View>
              <Switch
                value={mapSettings.ENABLE_GEOFENCING}
                onValueChange={(val) => updateSetting('ENABLE_GEOFENCING', val)}
                trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Lost Pet Alerts</Text>
                <Text style={styles.settingDescription}>Enable lost pet alert system</Text>
              </View>
              <Switch
                value={mapSettings.ENABLE_LOST_PET_ALERTS}
                onValueChange={(val) => updateSetting('ENABLE_LOST_PET_ALERTS', val)}
                trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                thumbColor="#ffffff"
              />
            </View>
          </AnimatedCard>
        </FadeInView>

        <FadeInView delay={250}>
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
              onPress={handleBroadcast}
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
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6b7280',
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
