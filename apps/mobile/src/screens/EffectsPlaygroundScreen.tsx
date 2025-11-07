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
import { useSendWarp } from '@mobile/effects/chat/bubbles/use-send-warp'
import { useSwipeReplyElastic } from '@mobile/effects/chat/gestures/use-swipe-reply-elastic'
import { useGlassMorphZoom } from '@mobile/effects/chat/media/use-glass-morph-zoom'
import { AdditiveBloom } from '@mobile/effects/chat/shaders/additive-bloom'
import { ChromaticAberrationFX } from '@mobile/effects/chat/shaders/chromatic-aberration'
import { RibbonFX } from '@mobile/effects/chat/shaders/ribbon-fx'
import { colors } from '@mobile/theme/colors'
import React, { useCallback, useState } from 'react'
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import { withTiming } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

const CANVAS_WIDTH = 300
const CANVAS_HEIGHT = 200

export function EffectsPlaygroundScreen(): React.ReactElement {
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader
          title="Effects Playground"
          description="Interactive demos for Skia effects with timing controls."
        />

        {/* Reduced Motion Toggle */}
        <FeatureCard title="Settings" subtitle="Accessibility">
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Reduced Motion</Text>
            <Switch
              value={reducedMotion}
              onValueChange={setReducedMotion}
              trackColor={{ false: colors.surface, true: colors.primary }}
              thumbColor={colors.textPrimary}
            />
          </View>
        </FeatureCard>

        {/* Send Warp Section */}
        <FeatureCard title="Send Warp" subtitle="AdditiveBloom glow trail">
          <View style={styles.canvasContainer}>
            <View style={styles.canvasWrapper}>
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
            <TouchableOpacity style={styles.button} onPress={handleSendWarp}>
              <Text style={styles.buttonText}>Trigger Send</Text>
            </TouchableOpacity>
          </View>
        </FeatureCard>

        {/* Media Zoom Section */}
        <FeatureCard title="Media Zoom" subtitle="ChromaticAberrationFX on open">
          <View style={styles.canvasContainer}>
            <View style={styles.canvasWrapper}>
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
              <TouchableOpacity style={styles.button} onPress={handleMediaZoom}>
                <Text style={styles.buttonText}>Open</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleMediaClose}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </FeatureCard>

        {/* Reply Ribbon Section */}
        <FeatureCard title="Reply Ribbon" subtitle="RibbonFX for swipe-to-reply">
          <View style={styles.canvasContainer}>
            <View style={styles.canvasWrapper}>
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
            >
              <Text style={styles.buttonText}>Animate Ribbon</Text>
            </TouchableOpacity>
          </View>
        </FeatureCard>

        {/* Reset Button */}
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>Reset All</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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

