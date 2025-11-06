/**
 * Config Management Screen (Mobile)
 * 
 * Mobile admin screen for managing all configuration types (Business, Matching, Map, API).
 */

import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedCard } from '../components/AnimatedCard';
import { FadeInView } from '../components/FadeInView';

type ConfigType = 'business' | 'matching' | 'map' | 'api';

interface ConfigItem {
  type: ConfigType;
  name: string;
  description: string;
  icon: string;
}

const configItems: ConfigItem[] = [
  {
    type: 'business',
    name: 'Business Config',
    description: 'Prices, limits, and experiments',
    icon: '💰',
  },
  {
    type: 'matching',
    name: 'Matching Config',
    description: 'Weights, gates, and feature flags',
    icon: '🎯',
  },
  {
    type: 'map',
    name: 'Map Settings',
    description: 'Map features and provider config',
    icon: '🗺️',
  },
  {
    type: 'api',
    name: 'API Configuration',
    description: 'API keys and service endpoints',
    icon: '🔑',
  },
];

export const ConfigManagementScreen: React.FC = () => {
  const [selectedConfig, setSelectedConfig] = useState<ConfigType | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);

  const handleBroadcast = async (configType: ConfigType) => {
    setBroadcasting(true);
    try {
      // TODO: Implement broadcast API call
      // await adminApi.broadcastConfig(configType, config);
    } catch (error) {
      console.error('Failed to broadcast config:', error);
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FadeInView delay={0}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Configuration</Text>
          <Text style={styles.headerSubtitle}>Manage system configurations</Text>
        </View>
      </FadeInView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {configItems.map((item, index) => (
          <FadeInView key={item.type} delay={index * 50}>
            <AnimatedCard style={styles.configCard}>
              <View style={styles.configHeader}>
                <View style={styles.configIcon}>
                  <Text style={styles.iconText}>{item.icon}</Text>
                </View>
                <View style={styles.configInfo}>
                  <Text style={styles.configName}>{item.name}</Text>
                  <Text style={styles.configDescription}>{item.description}</Text>
                </View>
              </View>
              <View style={styles.configActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setSelectedConfig(item.type)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.broadcastButton,
                    broadcasting && styles.broadcastButtonDisabled,
                  ]}
                  onPress={() => handleBroadcast(item.type)}
                  disabled={broadcasting}
                >
                  <Text style={styles.broadcastButtonText}>
                    {broadcasting ? 'Broadcasting...' : 'Broadcast'}
                  </Text>
                </TouchableOpacity>
              </View>
            </AnimatedCard>
          </FadeInView>
        ))}
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
  configCard: {
    marginBottom: 16,
    padding: 16,
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  configIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  configInfo: {
    flex: 1,
  },
  configName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  configDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  configActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  editButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  broadcastButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#6366f1',
  },
  broadcastButtonDisabled: {
    opacity: 0.5,
  },
  broadcastButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

