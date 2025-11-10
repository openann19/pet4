/**
 * Video Quality Settings Component - Mobile Implementation
 *
 * Allows users to configure video call quality settings
 * Location: apps/mobile/src/components/call/VideoQualitySettings.tsx
 */

import React, { useEffect, useState, useCallback } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { useStorage } from '@/hooks/use-storage'
import { createLogger } from '@/utils/logger'
import { useTheme } from '@/hooks/use-theme'
import { PremiumCard } from '@/components/enhanced/PremiumCard'

const logger = createLogger('VideoQualitySettings')

type QualityPreset = '4K' | '1080p' | '720p' | '480p'

interface QualityConfig {
  width: number
  height: number
  frameRate: number
  bitrate: number
}

const QUALITY_PRESETS: Record<QualityPreset, QualityConfig> = {
  '4K': { width: 3840, height: 2160, frameRate: 60, bitrate: 20000 },
  '1080p': { width: 1920, height: 1080, frameRate: 30, bitrate: 5000 },
  '720p': { width: 1280, height: 720, frameRate: 30, bitrate: 2500 },
  '480p': { width: 854, height: 480, frameRate: 30, bitrate: 1000 },
}

const STORAGE_KEY = '@video_quality_setting'

export const VideoQualitySettings: React.FC = () => {
  const { theme } = useTheme()
  const [selectedQuality, setSelectedQuality] = useStorage<QualityPreset>(
    STORAGE_KEY,
    '1080p'
  )
  const [networkRecommendation, setNetworkRecommendation] = useState<QualityPreset>('720p')

  useEffect(() => {
    checkNetworkQuality()

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        checkNetworkQuality()
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const checkNetworkQuality = useCallback(async (): Promise<void> => {
    try {
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
      } else if (isCellular) {
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
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to check network quality', err)
      // Default to 720p on error
      setNetworkRecommendation('720p')
    }
  }, [])

  const getQualityDescription = useCallback((preset: QualityPreset): string => {
    const config = QUALITY_PRESETS[preset]
    return `${config.width}x${config.height} @ ${config.frameRate}fps`
  }, [])

  const getDataUsage = useCallback((preset: QualityPreset): string => {
    const config = QUALITY_PRESETS[preset]
    const mbPerMinute = (config.bitrate * 60) / 8 / 1024
    return `~${mbPerMinute.toFixed(0)} MB/min`
  }, [])

  const renderQualityOption = useCallback(
    (preset: QualityPreset) => {
      const isSelected = selectedQuality === preset
      const isRecommended = preset === networkRecommendation

      return (
        <Pressable
          key={preset}
          onPress={() => setSelectedQuality(preset)}
          accessibilityRole="button"
          accessibilityLabel={`${preset} quality${isRecommended ? ', recommended' : ''}`}
          accessibilityState={{ selected: isSelected }}
        >
          <PremiumCard
            variant={isSelected ? 'elevated' : 'default'}
            style={StyleSheet.flatten([
              styles.qualityOption,
              isSelected && {
                borderWidth: 2,
                borderColor: theme.colors.primary,
              },
            ])}
          >
            <View style={styles.qualityOptionContent}>
              <View style={styles.qualityHeader}>
                <Text style={[styles.qualityTitle, { color: theme.colors.textPrimary }]}>
                  {preset}
                </Text>
                {isRecommended && (
                  <View style={[styles.recommendedBadge, { backgroundColor: theme.colors.success }]}>
                    <Text style={styles.recommendedText}>Recommended</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.qualityDescription, { color: theme.colors.textSecondary }]}>
                {getQualityDescription(preset)}
              </Text>

              <View style={styles.qualityStats}>
                <Text style={[styles.qualityStatText, { color: theme.colors.textSecondary }]}>
                  Data usage: {getDataUsage(preset)}
                </Text>
              </View>
            </View>

            {isSelected && (
              <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </PremiumCard>
        </Pressable>
      )
    },
    [
      selectedQuality,
      networkRecommendation,
      getQualityDescription,
      getDataUsage,
      setSelectedQuality,
      theme,
    ]
  )

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Video Quality</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Choose your preferred video call quality. Higher quality uses more data.
      </Text>

      {/* Network Recommendation */}
      <View
        style={[
          styles.networkCard,
          { backgroundColor: theme.colors.info + '20', borderLeftColor: theme.colors.info },
        ]}
      >
        <Text style={[styles.networkTitle, { color: theme.colors.info }]}>📶 Network Status</Text>
        <Text style={[styles.networkText, { color: theme.colors.textPrimary }]}>
          Based on your current connection, we recommend {networkRecommendation}.
        </Text>
      </View>

      {/* Quality Options */}
      <View style={styles.qualityList}>
        {(Object.keys(QUALITY_PRESETS) as QualityPreset[]).map(renderQualityOption)}
      </View>

      {/* Info Card */}
      <View
        style={[
          styles.infoCard,
          { backgroundColor: theme.colors.warning + '20', borderLeftColor: theme.colors.warning },
        ]}
      >
        <Text style={[styles.infoTitle, { color: theme.colors.warning }]}>💡 Tips</Text>
        <Text style={[styles.infoText, { color: theme.colors.textPrimary }]}>
          • Quality automatically adjusts if your connection drops{'\n'}• Higher quality requires
          stable Wi-Fi or strong 4G/5G{'\n'}• Lower quality works better on mobile data
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  networkCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
  },
  networkTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  networkText: {
    fontSize: 14,
    lineHeight: 20,
  },
  qualityList: {
    gap: 12,
    marginBottom: 24,
  },
  qualityOption: {
    position: 'relative',
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
  },
  recommendedBadge: {
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
    marginBottom: 4,
  },
  qualityStats: {
    flexDirection: 'row',
    gap: 12,
  },
  qualityStatText: {
    fontSize: 12,
  },
  checkmark: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
})
