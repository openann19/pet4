/**
 * Map Settings Screen (Mobile)
 * 
 * Mobile admin screen for configuring map settings and provider configuration.
 */

import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedCard } from '../components/AnimatedCard';
import { FadeInView } from '../components/FadeInView';
import logger from '@/core/logger';

export const MapSettingsScreen: React.FC = () => {
  const [privacyGridMeters, setPrivacyGridMeters] = useState(1000);
  const [defaultRadiusKm, setDefaultRadiusKm] = useState(10);
  const [maxRadiusKm, setMaxRadiusKm] = useState(100);
  const [enablePreciseLocation, setEnablePreciseLocation] = useState(true);
  const [enableGeofencing, setEnableGeofencing] = useState(true);
  const [enableLostPetAlerts, setEnableLostPetAlerts] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);

  const handleBroadcast = async () => {
    setBroadcasting(true);
    try {
      // TODO: Implement broadcast API call
      // await adminApi.broadcastConfig('map', { ...settings });
    } catch (error) {
      logger.error('Failed to broadcast:', error);
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FadeInView delay={0}>
        <View style={styles.header}>
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
                <Text style={styles.settingDescription}>
                  Grid size for location privacy
                </Text>
              </View>
              <TextInput
                style={styles.input}
                value={privacyGridMeters.toString()}
                onChangeText={(text) => { setPrivacyGridMeters(parseInt(text) || 1000); }}
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
                value={defaultRadiusKm.toString()}
                onChangeText={(text) => { setDefaultRadiusKm(parseInt(text) || 10); }}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Max Radius (km)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={maxRadiusKm.toString()}
                onChangeText={(text) => { setMaxRadiusKm(parseInt(text) || 100); }}
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
                <Text style={styles.settingDescription}>
                  Enable precise location tracking
                </Text>
              </View>
              <Switch
                value={enablePreciseLocation}
                onValueChange={setEnablePreciseLocation}
                trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Geofencing</Text>
                <Text style={styles.settingDescription}>
                  Enable geofence notifications
                </Text>
              </View>
              <Switch
                value={enableGeofencing}
                onValueChange={setEnableGeofencing}
                trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Lost Pet Alerts</Text>
                <Text style={styles.settingDescription}>
                  Enable lost pet alert system
                </Text>
              </View>
              <Switch
                value={enableLostPetAlerts}
                onValueChange={setEnableLostPetAlerts}
                trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                thumbColor="#ffffff"
              />
            </View>
          </AnimatedCard>
        </FadeInView>

        <FadeInView delay={250}>
          <TouchableOpacity
            style={[styles.broadcastButton, broadcasting && styles.broadcastButtonDisabled]}
            onPress={handleBroadcast}
            disabled={broadcasting}
          >
            <Text style={styles.broadcastButtonText}>
              {broadcasting ? 'Broadcasting...' : 'Broadcast Settings'}
            </Text>
          </TouchableOpacity>
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
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  broadcastButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  broadcastButtonDisabled: {
    opacity: 0.6,
  },
  broadcastButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

