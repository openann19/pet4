import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';

interface Plan {
  id: string;
  name: string;
  price: string;
  priceMonthly: number;
  features: string[];
  popular?: boolean;
  color: string;
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
];

interface PricingModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPlan: (planId: string) => void;
  currentPlan?: string;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  visible,
  onClose,
  onSelectPlan,
  currentPlan = 'free',
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>(currentPlan);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = () => {
    if (selectedPlan !== currentPlan) {
      onSelectPlan(selectedPlan);
    }
    onClose();
  };

  const getPrice = (plan: Plan): string => {
    if (plan.priceMonthly === 0) return plan.price;
    if (billingPeriod === 'yearly') {
      const yearlyPrice = plan.priceMonthly * 12 * 0.8; // 20% discount
      return `$${yearlyPrice.toFixed(2)}`;
    }
    return plan.price;
  };

  const getSavings = (plan: Plan): string | null => {
    if (billingPeriod === 'yearly' && plan.priceMonthly > 0) {
      const savings = plan.priceMonthly * 12 * 0.2;
      return `Save $${savings.toFixed(2)}/year`;
    }
    return null;
  };

  const renderPlanCard = (plan: Plan) => {
    const isSelected = selectedPlan === plan.id;
    const isCurrent = currentPlan === plan.id;
    const savings = getSavings(plan);

    return (
      <Pressable
        key={plan.id}
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          plan.popular && styles.planCardPopular,
        ]}
        onPress={() => handleSelectPlan(plan.id)}
      >
        {plan.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>MOST POPULAR</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
          {isCurrent && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentText}>Current</Text>
            </View>
          )}
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>{getPrice(plan)}</Text>
          {plan.priceMonthly > 0 && (
            <Text style={styles.billingPeriod}>
              /{billingPeriod === 'monthly' ? 'month' : 'year'}
            </Text>
          )}
        </View>

        {savings && (
          <View style={styles.savingsContainer}>
            <Text style={styles.savingsText}>{savings}</Text>
          </View>
        )}

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedText}>✓ Selected</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        {/* Billing Period Toggle */}
        <View style={styles.billingToggleContainer}>
          <Pressable
            style={[
              styles.billingToggle,
              billingPeriod === 'monthly' && styles.billingToggleActive,
            ]}
            onPress={() => setBillingPeriod('monthly')}
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
            style={[styles.billingToggle, billingPeriod === 'yearly' && styles.billingToggleActive]}
            onPress={() => setBillingPeriod('yearly')}
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
        >
          {PLANS.map(renderPlanCard)}
        </ScrollView>

        {/* Subscribe Button */}
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.subscribeButton,
              selectedPlan === currentPlan && styles.subscribeButtonDisabled,
            ]}
            onPress={handleSubscribe}
            disabled={selectedPlan === currentPlan}
          >
            <Text style={styles.subscribeButtonText}>
              {selectedPlan === currentPlan ? 'Current Plan' : 'Subscribe Now'}
            </Text>
          </Pressable>
          <Text style={styles.disclaimer}>Cancel anytime. Terms and conditions apply.</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6b7280',
  },
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
    backgroundColor: '#3b82f6',
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
  },
  plansContainer: {
    padding: 16,
    gap: 16,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  planCardPopular: {
    borderColor: '#3b82f6',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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
    backgroundColor: '#10b981',
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
    color: '#111827',
  },
  billingPeriod: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 4,
  },
  savingsContainer: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
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
    color: '#10b981',
  },
  featureText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  selectedIndicator: {
    marginTop: 16,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
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
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  subscribeButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  subscribeButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  disclaimer: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});
