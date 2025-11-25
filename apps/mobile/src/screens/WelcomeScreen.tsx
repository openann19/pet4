/**
 * Mobile Welcome Screen
 * Location: apps/mobile/src/screens/WelcomeScreen.tsx
 *
 * Matches web WelcomeScreen hierarchy with mobile-appropriate patterns
 */

import React, { useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { Animated, FadeInUp, FadeInDown } from '@petspark/motion'
import * as Haptics from 'expo-haptics'
import { EnhancedButton } from '../components/enhanced/EnhancedButton'
import { colors } from '../theme/colors'
import { typography, spacing } from '../theme/typography'
import { useReducedMotionSV } from '@petspark/motion'

export interface WelcomeScreenProps {
  onGetStarted: () => void
  onSignIn: () => void
}

export function WelcomeScreen({
  onGetStarted,
  onSignIn,
}: WelcomeScreenProps): React.JSX.Element {
  const reducedMotion = useReducedMotionSV()

  const handleGetStarted = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onGetStarted()
  }, [onGetStarted])

  const handleSignIn = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSignIn()
  }, [onSignIn])

  // Compute animation durations based on reduced motion
  const titleDelay = reducedMotion.value ? 0 : 100
  const subtitleDelay = reducedMotion.value ? 0 : 200
  const featuresDelay = reducedMotion.value ? 0 : 300
  const buttonsDelay = reducedMotion.value ? 0 : 400
  const footerDelay = reducedMotion.value ? 0 : 500

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Logo / Icon */}
        <Animated.View
          entering={FadeInUp.duration(reducedMotion.value ? 0 : 400).delay(titleDelay)}
          style={styles.logoContainer}
        >
          <View style={styles.logo}>
            <Text style={styles.logoText}>🐾</Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View
          entering={FadeInUp.duration(reducedMotion.value ? 0 : 400).delay(titleDelay)}
        >
          <Text style={styles.title}>Welcome to PetSpark</Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View
          entering={FadeInDown.duration(reducedMotion.value ? 0 : 400).delay(subtitleDelay)}
        >
          <Text style={styles.subtitle}>
            Connect with pet lovers, find perfect matches, and build your community
          </Text>
        </Animated.View>

        {/* Features / Proof Points */}
        <Animated.View
          entering={FadeInDown.duration(reducedMotion.value ? 0 : 400).delay(featuresDelay)}
          style={styles.features}
        >
          <FeatureItem text="Find perfect matches for your pets" />
          <FeatureItem text="Connect with local pet community" />
          <FeatureItem text="Share photos & stories" />
        </Animated.View>

        {/* Primary CTA */}
        <Animated.View
          entering={FadeInDown.duration(reducedMotion.value ? 0 : 400).delay(buttonsDelay)}
          style={styles.buttonsContainer}
        >
          <EnhancedButton
            title="Get Started"
            onPress={handleGetStarted}
            variant="default"
            size="lg"
            style={styles.primaryButton}
            hapticFeedback={true}
            testID="welcome-get-started"
          />

          {/* Secondary CTA */}
          <EnhancedButton
            title="Sign In"
            onPress={handleSignIn}
            variant="outline"
            size="lg"
            style={styles.secondaryButton}
            hapticFeedback={true}
            testID="welcome-sign-in"
          />
        </Animated.View>

        {/* Footer / Legal */}
        <Animated.View
          entering={FadeInDown.duration(reducedMotion.value ? 0 : 400).delay(footerDelay)}
          style={styles.footer}
        >
          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text>
            {' and '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </View>
    </ScrollView>
  )
}

function FeatureItem({ text }: { text: string }): React.JSX.Element {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>✓</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    ...typography.h1,
    fontSize: 40,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  features: {
    width: '100%',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: {
    ...typography.h3,
    color: colors.primary,
  },
  featureText: {
    ...typography['body-sm'],
    color: colors.textPrimary,
    flex: 1,
  },
  buttonsContainer: {
    width: '100%',
    gap: spacing.md,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  link: {
    color: colors.primary,
    ...typography.caption,
    fontWeight: '600' as const,
  },
})

export default WelcomeScreen
