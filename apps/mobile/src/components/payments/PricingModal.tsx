import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  type ViewStyle,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { PremiumModal } from '@/components/enhanced/overlays/PremiumModal'
import { PremiumButton } from '@/components/enhanced/PremiumButton'
import { PremiumCard } from '@/components/enhanced/PremiumCard'
import { useTheme } from '@/hooks/use-theme'
import { springConfigs } from '@/effects/reanimated/transitions'
import { createLogger } from '@/utils/logger'

const logger = createLogger('PricingModal')

const AnimatedView = Animated.View

interface PlanCardProps {
  plan: Plan
  isSelected: boolean
  isCurrent: boolean
  billingPeriod: 'monthly' | 'yearly'
  savings: string | null
  price: string
  onSelect: (planId: string) => void
  theme: ReturnType<typeof useTheme>['theme']
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isSelected,
  isCurrent,
  billingPeriod,
  savings,
  price,
  onSelect,
  theme,
}) => {
  const planScale = useSharedValue(1)

  const planAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: planScale.value }],
  }))

  const handlePlanPressIn = () => {
    planScale.value = withSpring(0.98, springConfigs.smooth)
  }

  const handlePlanPressOut = () => {
    planScale.value = withSpring(1, springConfigs.smooth)
  }

  return (
    <Pressable
      onPress={() => onSelect(plan.id)}
      onPressIn={handlePlanPressIn}
      onPressOut={handlePlanPressOut}
      accessibilityRole="button"
      accessibilityLabel={`Select ${plan.name} plan`}
      accessibilityState={{ selected: isSelected }}
    >
      <AnimatedView style={planAnimatedStyle}>
        <PremiumCard
          variant={isSelected ? 'elevated' : 'default'}
          style={StyleSheet.flatten([
            styles.planCard,
            isSelected && StyleSheet.flatten([styles.planCardSelected, { borderColor: plan.color }]),
            plan.popular && styles.planCardPopular,
          ])}
        >
          {plan.popular && (
            <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
              <Text style={styles.popularText}>MOST POPULAR</Text>
            </View>
          )}

          <View style={styles.planHeader}>
            <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
            {isCurrent && (
              <View style={[styles.currentBadge, { backgroundColor: theme.colors.success }]}>
                <Text style={styles.currentText}>Current</Text>
              </View>
            )}
          </View>

          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: theme.colors.textPrimary }]}>{price}</Text>
            {plan.priceMonthly > 0 && (
              <Text style={[styles.billingPeriod, { color: theme.colors.textSecondary }]}>
                /{billingPeriod === 'monthly' ? 'month' : 'year'}
              </Text>
            )}
          </View>

          {savings && (
            <View
              style={[
                styles.savingsContainer,
                { backgroundColor: theme.colors.warning + '20' },
              ]}
            >
              <Text style={[styles.savingsText, { color: theme.colors.warning }]}>
                {savings}
              </Text>
            </View>
          )}

          <View style={styles.featuresContainer}>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={[styles.checkmark, { color: theme.colors.success }]}>✓</Text>
                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {isSelected && (
            <View style={[styles.selectedIndicator, { backgroundColor: plan.color }]}>
              <Text style={styles.selectedText}>✓ Selected</Text>
            </View>
          )}
        </PremiumCard>
      </AnimatedView>
    </Pressable>
  )
}

interface Plan {
  id: string
  name: string
  price: string
  priceMonthly: number
  features: string[]
  popular?: boolean
  color: string
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    priceMonthly: 0,
    features: [
      'Basic matching',
      '5 likes per day',
      'Chat with matches',
      'View profiles',
      'Community posts',
    ],
    color: '#6b7280',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$9.99',
    priceMonthly: 9.99,
    features: [
      'Unlimited likes',
      'See who liked you',
      'Video calls',
      'Advanced filters',
      'Priority support',
      'No ads',
      'Profile boost',
    ],
    popular: true,
    color: '#3b82f6',
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '$19.99',
    priceMonthly: 19.99,
    features: [
      'All Premium features',
      'Live streaming',
      'Verified badge',
      'Premium support 24/7',
      'Exclusive events',
      'Early access to features',
      'Custom profile themes',
      'Monthly super boost',
    ],
    color: '#a855f7',
  },
]

export interface PricingModalProps {
  visible: boolean
  onClose: () => void
  onSelectPlan: (planId: string) => void
  currentPlan?: string
}

export const PricingModal: React.FC<PricingModalProps> = ({
  visible,
  onClose,
  onSelectPlan,
  currentPlan = 'free',
}) => {
  const { theme } = useTheme()
  const [selectedPlan, setSelectedPlan] = useState<string>(currentPlan)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const scale = useSharedValue(0)
  const opacity = useSharedValue(0)

  React.useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, springConfigs.smooth)
      opacity.value = withTiming(1, { duration: 300 })
    } else {
      scale.value = withTiming(0, { duration: 200 })
      opacity.value = withTiming(0, { duration: 200 })
    }
  }, [visible, scale, opacity])

  const handleSelectPlan = useCallback(
    (planId: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setSelectedPlan(planId)
    },
    []
  )

  const handleSubscribe = useCallback(() => {
    if (selectedPlan !== currentPlan) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onSelectPlan(selectedPlan)
    }
    onClose()
  }, [selectedPlan, currentPlan, onSelectPlan, onClose])

  const handleBillingPeriodChange = useCallback(
    (period: 'monthly' | 'yearly') => {
      void Haptics.selectionAsync()
      setBillingPeriod(period)
    },
    []
  )

  const getPrice = useCallback(
    (plan: Plan): string => {
      if (plan.priceMonthly === 0) return plan.price
      if (billingPeriod === 'yearly') {
        const yearlyPrice = plan.priceMonthly * 12 * 0.8
        return `$${yearlyPrice.toFixed(2)}`
      }
      return plan.price
    },
    [billingPeriod]
  )

  const getSavings = useCallback(
    (plan: Plan): string | null => {
      if (billingPeriod === 'yearly' && plan.priceMonthly > 0) {
        const savings = plan.priceMonthly * 12 * 0.2
        return `Save $${savings.toFixed(2)}/year`
      }
      return null
    },
    [billingPeriod]
  )

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scale.value, [0, 1], [0.9, 1], Extrapolation.CLAMP) }],
    opacity: opacity.value,
  }))

  const renderPlanCard = (plan: Plan) => {
    return (
      <PlanCard
        key={plan.id}
        plan={plan}
        isSelected={selectedPlan === plan.id}
        isCurrent={currentPlan === plan.id}
        billingPeriod={billingPeriod}
        savings={getSavings(plan)}
        price={getPrice(plan)}
        onSelect={handleSelectPlan}
        theme={theme}
      />
    )
  }

  if (!visible) return null

  return (
    <PremiumModal
      visible={visible}
      onClose={onClose}
      title="Choose Your Plan"
      size="xl"
      variant="centered"
      showCloseButton
      closeOnBackdropPress
    >
      <AnimatedView style={animatedContainerStyle}>
        {/* Billing Period Toggle */}
        <View style={styles.billingToggleContainer}>
          <Pressable
            style={[
              styles.billingToggle,
              billingPeriod === 'monthly' && [
                styles.billingToggleActive,
                { backgroundColor: theme.colors.primary },
              ],
            ]}
            onPress={() => handleBillingPeriodChange('monthly')}
            accessibilityRole="button"
            accessibilityLabel="Monthly billing"
            accessibilityState={{ selected: billingPeriod === 'monthly' }}
          >
            <Text
              style={[
                styles.billingToggleText,
                billingPeriod === 'monthly' && styles.billingToggleTextActive,
              ]}
            >
              Monthly
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.billingToggle,
              billingPeriod === 'yearly' && [
                styles.billingToggleActive,
                { backgroundColor: theme.colors.primary },
              ],
            ]}
            onPress={() => handleBillingPeriodChange('yearly')}
            accessibilityRole="button"
            accessibilityLabel="Yearly billing, save 20%"
            accessibilityState={{ selected: billingPeriod === 'yearly' }}
          >
            <Text
              style={[
                styles.billingToggleText,
                billingPeriod === 'yearly' && styles.billingToggleTextActive,
              ]}
            >
              Yearly (Save 20%)
            </Text>
          </Pressable>
        </View>

        {/* Plans */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.plansContainer}
          showsVerticalScrollIndicator={false}
          accessible
          accessibilityLabel="Available subscription plans"
        >
          {PLANS.map(renderPlanCard)}
        </ScrollView>

        {/* Subscribe Button */}
        <View style={styles.footer}>
          <PremiumButton
            variant="primary"
            size="lg"
            onPress={handleSubscribe}
            disabled={selectedPlan === currentPlan}
            style={styles.subscribeButton}
          >
            {selectedPlan === currentPlan ? 'Current Plan' : 'Subscribe Now'}
          </PremiumButton>
          <Text style={[styles.disclaimer, { color: theme.colors.textSecondary }]}>
            Cancel anytime. Terms and conditions apply.
          </Text>
        </View>
      </AnimatedView>
    </PremiumModal>
  )
}

const styles = StyleSheet.create({
  billingToggleContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  billingToggle: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  billingToggleActive: {
    borderColor: '#3b82f6',
  },
  billingToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  billingToggleTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
    maxHeight: 500,
  },
  plansContainer: {
    padding: 16,
    gap: 16,
  },
  planCard: {
    position: 'relative',
  },
  planCardSelected: {
    borderWidth: 2,
  },
  planCardPopular: {
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  billingPeriod: {
    fontSize: 16,
    marginLeft: 4,
  },
  savingsContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featuresContainer: {
    gap: 12,
    marginTop: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkmark: {
    fontSize: 16,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  selectedIndicator: {
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  footer: {
    padding: 20,
    gap: 12,
  },
  subscribeButton: {
    width: '100%',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
  },
})
