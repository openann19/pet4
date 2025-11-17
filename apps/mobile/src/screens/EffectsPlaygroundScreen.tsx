/**
 * Effects Playground Screen
 *
 * Interactive demo for all three Skia effects with timing controls.
 * Allows real-time tweaking of animation parameters.
 *
 * Location: apps/mobile/src/screens/EffectsPlaygroundScreen.tsx
 */

import { FeatureCard } from '@mobile/components/FeatureCard'
import { SectionHeader } from '@mobile/components/SectionHeader'
import { RouteErrorBoundary } from '@mobile/components/RouteErrorBoundary'
import { useSendWarp } from '@mobile/effects/chat/bubbles/use-send-warp'
import { useSwipeReplyElastic } from '@mobile/effects/chat/gestures/use-swipe-reply-elastic'
import { useGlassMorphZoom } from '@mobile/effects/chat/media/use-glass-morph-zoom'
import { AdditiveBloom } from '@mobile/effects/chat/shaders/additive-bloom'
import { ChromaticAberrationFX } from '@mobile/effects/chat/shaders/chromatic-aberration'
import { RibbonFX } from '@mobile/effects/chat/shaders/ribbon-fx'
import { getTranslations } from '@mobile/i18n/translations'
import { colors } from '@mobile/theme/colors'
import { createLogger } from '@mobile/utils/logger'
import React, { useCallback, useState } from 'react'
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import { withTiming } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

const logger = createLogger('EffectsPlaygroundScreen')

// Default language (can be made dynamic later)
const language = 'en'
const t = getTranslations(language)

const CANVAS_WIDTH = 300
const CANVAS_HEIGHT = 200

function EffectsPlaygroundScreenContent(): React.ReactElement {
  const [reducedMotion, setReducedMotion] = useState(false)

  // Send Warp
  const sendWarp = useSendWarp({
    enabled: true,
    onComplete: () => {
      // Reset for replay
    },
  })

  // Media Zoom
  const mediaZoom = useGlassMorphZoom({
    enabled: true,
    blurRadius: 12,
  })

  // Swipe Reply
  const swipeReply = useSwipeReplyElastic({
    enabled: true,
    onThresholdCross: () => {
      // Demo threshold cross
    },
    onReply: () => {
      // Demo reply
    },
  })

  const handleSendWarp = useCallback(() => {
    sendWarp.bloomCenterX.value = CANVAS_WIDTH / 2
    sendWarp.bloomCenterY.value = CANVAS_HEIGHT / 2
    sendWarp.trigger()
  }, [sendWarp])

  const handleMediaZoom = useCallback(() => {
    mediaZoom.aberrationCenter.value = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
    mediaZoom.open()
  }, [mediaZoom])

  const handleMediaClose = useCallback(() => {
    mediaZoom.close()
  }, [mediaZoom])

  const handleReset = useCallback(() => {
    sendWarp.translateX.value = 0
    sendWarp.opacity.value = 1
    sendWarp.glowOpacity.value = 0
    sendWarp.bloomIntensity.value = 0

    mediaZoom.scale.value = 1
    mediaZoom.opacity.value = 0
    mediaZoom.aberrationRadius.value = 0
    mediaZoom.aberrationIntensity.value = 0

    swipeReply.translateX.value = 0
    swipeReply.ribbonProgress.value = 0
    swipeReply.ribbonAlpha.value = 0
  }, [sendWarp, mediaZoom, swipeReply])

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
      accessible
      accessibilityLabel={t.effectsPlayground.title}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        accessible
        accessibilityLabel={`${t.effectsPlayground.title}. ${t.effectsPlayground.description}`}
      >
        <SectionHeader
          title={t.effectsPlayground.title}
          description={t.effectsPlayground.description}
        />

        {/* Reduced Motion Toggle */}
        <FeatureCard
          title={t.effectsPlayground.settings}
          subtitle={t.effectsPlayground.accessibility}
          accessible
          accessibilityLabel={`${t.effectsPlayground.settings}. ${t.effectsPlayground.accessibility}`}
        >
          <View style={styles.settingRow}>
            <Text
              style={styles.settingLabel}
              accessible
              accessibilityLabel={t.effectsPlayground.reducedMotion}
            >
              {t.effectsPlayground.reducedMotion}
            </Text>
            <Switch
              value={reducedMotion}
              onValueChange={setReducedMotion}
              trackColor={{ false: colors.surface, true: colors.primary }}
              thumbColor={colors.textPrimary}
              accessible
              accessibilityLabel={t.effectsPlayground.reducedMotion}
              accessibilityRole="switch"
              accessibilityState={{ checked: reducedMotion }}
            />
          </View>
        </FeatureCard>

        {/* Send Warp Section */}
        <FeatureCard
          title={t.effectsPlayground.sendWarp}
          subtitle={t.effectsPlayground.sendWarpSubtitle}
          accessible
          accessibilityLabel={`${t.effectsPlayground.sendWarp}. ${t.effectsPlayground.sendWarpSubtitle}`}
        >
          <View style={styles.canvasContainer}>
            <View style={styles.canvasWrapper} accessible={false}>
              <AdditiveBloom
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                centerX={sendWarp.bloomCenterX}
                centerY={sendWarp.bloomCenterY}
                radius={sendWarp.bloomRadius}
                intensity={sendWarp.bloomIntensity}
                color={[0.3, 0.75, 1]}
              />
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSendWarp}
              accessible
              accessibilityRole="button"
              accessibilityLabel={t.effectsPlayground.triggerSend}
              accessibilityHint="Triggers the send warp animation"
            >
              <Text style={styles.buttonText}>{t.effectsPlayground.triggerSend}</Text>
            </TouchableOpacity>
          </View>
        </FeatureCard>

        {/* Media Zoom Section */}
        <FeatureCard
          title={t.effectsPlayground.mediaZoom}
          subtitle={t.effectsPlayground.mediaZoomSubtitle}
          accessible
          accessibilityLabel={`${t.effectsPlayground.mediaZoom}. ${t.effectsPlayground.mediaZoomSubtitle}`}
        >
          <View style={styles.canvasContainer}>
            <View style={styles.canvasWrapper} accessible={false}>
              <ChromaticAberrationFX
                uri="https://via.placeholder.com/300x200"
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                center={mediaZoom.aberrationCenter}
                radius={mediaZoom.aberrationRadius}
                intensity={mediaZoom.aberrationIntensity}
                borderRadius={12}
              />
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.button}
                onPress={handleMediaZoom}
                accessible
                accessibilityRole="button"
                accessibilityLabel={t.effectsPlayground.open}
                accessibilityHint="Opens the media zoom animation"
              >
                <Text style={styles.buttonText}>{t.effectsPlayground.open}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={handleMediaClose}
                accessible
                accessibilityRole="button"
                accessibilityLabel={t.effectsPlayground.close}
                accessibilityHint="Closes the media zoom animation"
              >
                <Text style={styles.buttonText}>{t.effectsPlayground.close}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </FeatureCard>

        {/* Reply Ribbon Section */}
        <FeatureCard
          title={t.effectsPlayground.replyRibbon}
          subtitle={t.effectsPlayground.replyRibbonSubtitle}
          accessible
          accessibilityLabel={`${t.effectsPlayground.replyRibbon}. ${t.effectsPlayground.replyRibbonSubtitle}`}
        >
          <View style={styles.canvasContainer}>
            <View style={styles.canvasWrapper} accessible={false}>
              <RibbonFX
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                p0={swipeReply.ribbonP0}
                p1={swipeReply.ribbonP1}
                thickness={swipeReply.ribbonThickness}
                glow={swipeReply.ribbonGlow}
                progress={swipeReply.ribbonProgress}
                color={[0.2, 0.8, 1.0]}
                alpha={swipeReply.ribbonAlpha}
              />
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                swipeReply.ribbonP0.value = { x: 50, y: 100 }
                swipeReply.ribbonP1.value = { x: 250, y: 100 }
                swipeReply.ribbonProgress.value = withTiming(1, { duration: 180 })
                swipeReply.ribbonAlpha.value = withTiming(1, { duration: 180 })
              }}
              accessible
              accessibilityRole="button"
              accessibilityLabel={t.effectsPlayground.animateRibbon}
              accessibilityHint="Animates the reply ribbon effect"
            >
              <Text style={styles.buttonText}>{t.effectsPlayground.animateRibbon}</Text>
            </TouchableOpacity>
          </View>
        </FeatureCard>

        {/* Reset Button */}
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleReset}
          accessible
          accessibilityRole="button"
          accessibilityLabel={t.effectsPlayground.resetAll}
          accessibilityHint="Resets all effects to initial state"
        >
          <Text style={styles.resetButtonText}>{t.effectsPlayground.resetAll}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

export function EffectsPlaygroundScreen(): React.ReactElement {
  return (
    <RouteErrorBoundary
      onError={(error) => {
        logger.warn('EffectsPlaygroundScreen error', {
          error: error instanceof Error ? error.message : String(error),
        })
      }}
    >
      <EffectsPlaygroundScreenContent />
    </RouteErrorBoundary>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  canvasContainer: {
    marginTop: 12,
  },
  canvasWrapper: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    alignSelf: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: colors.danger,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 24,
    alignSelf: 'center',
  },
  resetButtonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
})
