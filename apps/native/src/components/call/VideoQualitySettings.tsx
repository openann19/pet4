import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { createLogger } from '../../utils/logger';
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('VideoQualitySettings');

type QualityPreset = '4K' | '1080p' | '720p' | '480p';

interface QualityConfig {
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
}

const QUALITY_PRESETS: Record<QualityPreset, QualityConfig> = {
  '4K': { width: 3840, height: 2160, frameRate: 60, bitrate: 20000 },
  '1080p': { width: 1920, height: 1080, frameRate: 30, bitrate: 5000 },
  '720p': { width: 1280, height: 720, frameRate: 30, bitrate: 2500 },
  '480p': { width: 854, height: 480, frameRate: 30, bitrate: 1000 },
};

const STORAGE_KEY = '@video_quality_setting';

export const VideoQualitySettings: React.FC = () => {
  const [selectedQuality, setSelectedQuality] = useState<QualityPreset>('1080p');
  const [networkRecommendation, setNetworkRecommendation] = useState<QualityPreset>('720p');

  useEffect(() => {
    loadSettings();
    checkNetworkQuality();

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      if (isTruthy(state.isConnected)) {
        checkNetworkQuality();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (isTruthy(saved)) {
        setSelectedQuality(saved as QualityPreset);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load quality settings', err);
    }
  };

  const saveSettings = async (quality: QualityPreset) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, quality);
      setSelectedQuality(quality);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to save quality settings', err);
    }
  };

  const checkNetworkQuality = async () => {
    try {
      // Use NetInfo to detect network type and speed
       
      const NetInfo = require('@react-native-community/netinfo')
      const state = await NetInfo.fetch()
      
      if (!state.isConnected) {
        setNetworkRecommendation('480p')
        return
      }

      const connectionType = state.type
      const isWifi = connectionType === 'wifi'
      const isEthernet = connectionType === 'ethernet'
      const isCellular = connectionType === 'cellular'

      // Check if detailed info is available
      const details = state.details as { effectiveType?: string; downlink?: number } | undefined

      if (isWifi || isEthernet) {
        // WiFi/Ethernet: recommend 1080p or 4K
        if (details?.downlink && details.downlink > 10) {
          setNetworkRecommendation('4K')
        } else {
          setNetworkRecommendation('1080p')
        }
      } else if (isTruthy(isCellular)) {
        // Cellular: check connection quality
        if (details?.effectiveType === '4g' && details?.downlink && details.downlink > 5) {
          setNetworkRecommendation('1080p')
        } else if (details?.effectiveType === '4g' || details?.effectiveType === '3g') {
          setNetworkRecommendation('720p')
        } else {
          setNetworkRecommendation('480p')
        }
      } else {
        // Unknown connection: default to 720p
        setNetworkRecommendation('720p')
      }
    } catch (error) {
      logger.error('Failed to check network quality', error instanceof Error ? error : new Error(String(error)))
      // Default to 720p on error
      setNetworkRecommendation('720p')
    }
  };

  const getQualityDescription = (preset: QualityPreset): string => {
    const config = QUALITY_PRESETS[preset];
    return `${String(config.width ?? '')}x${String(config.height ?? '')} @ ${String(config.frameRate ?? '')}fps`;
  };

  const getDataUsage = (preset: QualityPreset): string => {
    const config = QUALITY_PRESETS[preset];
    const mbPerMinute = (config.bitrate * 60) / 8 / 1024;
    return `~${String(mbPerMinute.toFixed(0) ?? '')} MB/min`;
  };

  const renderQualityOption = (preset: QualityPreset, isRecommended: boolean = false) => {
    const isSelected = selectedQuality === preset;
    
    return (
      <Pressable
        key={preset}
        style={[
          styles.qualityOption,
          isSelected && styles.qualityOptionSelected,
        ]}
        onPress={() => saveSettings(preset)}
      >
        <View style={styles.qualityOptionContent}>
          <View style={styles.qualityHeader}>
            <Text style={[
              styles.qualityTitle,
              isSelected && styles.qualityTitleSelected,
            ]}>
              {preset}
            </Text>
            {isRecommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>Recommended</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.qualityDescription}>
            {getQualityDescription(preset)}
          </Text>
          
          <View style={styles.qualityStats}>
            <Text style={styles.qualityStatText}>
              Data usage: {getDataUsage(preset)}
            </Text>
          </View>
        </View>
        
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Video Quality</Text>
        <Text style={styles.subtitle}>
          Choose your preferred video call quality. Higher quality uses more data.
        </Text>

        {/* Network Recommendation */}
        <View style={styles.networkCard}>
          <Text style={styles.networkTitle}>📶 Network Status</Text>
          <Text style={styles.networkText}>
            Based on your current connection, we recommend {networkRecommendation}.
          </Text>
        </View>

        {/* Quality Options */}
        <View style={styles.qualityList}>
          {(Object.keys(QUALITY_PRESETS) as QualityPreset[]).map((preset) =>
            renderQualityOption(preset, preset === networkRecommendation)
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Tips</Text>
          <Text style={styles.infoText}>
            • Quality automatically adjusts if your connection drops{'\n'}
            • Higher quality requires stable Wi-Fi or strong 4G/5G{'\n'}
            • Lower quality works better on mobile data
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 24,
  },
  networkCard: {
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  networkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  networkText: {
    fontSize: 14,
    color: '#1e3a8a',
    lineHeight: 20,
  },
  qualityList: {
    gap: 12,
    marginBottom: 24,
  },
  qualityOption: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  qualityOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  qualityOptionContent: {
    flex: 1,
  },
  qualityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  qualityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  qualityTitleSelected: {
    color: '#1e40af',
  },
  recommendedBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  qualityDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  qualityStats: {
    flexDirection: 'row',
    gap: 12,
  },
  qualityStatText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 22,
  },
});
