/**
 * Config Management Screen (Mobile)
 *
 * Mobile admin screen for managing all configuration types (Business, Matching, Map, API).
 */

import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { createLogger } from '../../utils/logger';
import { mobileAdminApi } from '../../api/admin-api';
import { AnimatedCard } from '../../components/AnimatedCard';
import { FadeInView } from '../../components/FadeInView';
import { getBusinessConfig } from '../../api/business-config-api';
import { getMatchingConfig } from '../../api/matching-config-api';
import { getMapConfig } from '../../api/map-config-api';
import { getAPIConfig } from '../../api/api-config-api';

const logger = createLogger('ConfigManagementScreen');

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
  const navigation = useNavigation();
  const [broadcasting, setBroadcasting] = useState<Record<ConfigType, boolean>>({
    business: false,
    matching: false,
    map: false,
    api: false,
  });

  const handleEdit = (configType: ConfigType): void => {
    switch (configType) {
      case 'business':
        navigation.navigate('BusinessConfig' as never);
        break;
      case 'matching':
        navigation.navigate('MatchingConfig' as never);
        break;
      case 'map':
        navigation.navigate('MapSettings' as never);
        break;
      case 'api':
        navigation.navigate('APIConfig' as never);
        break;
    }
  };

  const handleBroadcast = async (configType: ConfigType) => {
    setBroadcasting((prev) => ({ ...prev, [configType]: true }));
    try {
      // Load current config and broadcast it
      let config: Record<string, unknown> = {};
      try {
        switch (configType) {
          case 'business': {
            const businessConfig = await getBusinessConfig();
            if (businessConfig) {
              config = businessConfig as unknown as Record<string, unknown>;
            }
            break;
          }
          case 'matching': {
            const matchingConfig = await getMatchingConfig();
            if (matchingConfig) {
              config = matchingConfig as unknown as Record<string, unknown>;
            }
            break;
          }
          case 'map': {
            const mapConfig = await getMapConfig();
            if (mapConfig) {
              config = mapConfig as unknown as Record<string, unknown>;
            }
            break;
          }
          case 'api': {
            const apiConfig = await getAPIConfig();
            if (apiConfig) {
              config = apiConfig as unknown as Record<string, unknown>;
            }
            break;
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to load config for broadcast', err, { configType });
        Alert.alert('Error', 'Failed to load configuration. Please edit and save first.');
        return;
      }

      await mobileAdminApi.broadcastConfig(configType, config);
      Alert.alert('Success', 'Configuration broadcasted successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to broadcast config', err, { context: 'handleBroadcast', configType });
      Alert.alert('Error', 'Failed to broadcast configuration');
    } finally {
      setBroadcasting((prev) => ({ ...prev, [configType]: false }));
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
                <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item.type)}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.broadcastButton,
                    broadcasting[item.type] && styles.broadcastButtonDisabled,
                  ]}
                  onPress={() => handleBroadcast(item.type)}
                  disabled={broadcasting[item.type]}
                >
                  <Text style={styles.broadcastButtonText}>
                    {broadcasting[item.type] ? 'Broadcasting...' : 'Broadcast'}
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
