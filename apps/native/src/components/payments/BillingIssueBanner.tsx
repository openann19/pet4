import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';

interface BillingIssue {
  type: 'payment_failed' | 'card_expired' | 'insufficient_funds';
  gracePeriodEnd: string;
  message?: string;
}

interface BillingIssueBannerProps {
  issue: BillingIssue;
  onUpdatePayment: () => void;
  onDismiss: () => void;
}

const ISSUE_MESSAGES = {
  payment_failed: 'Your payment failed. Please update your payment method.',
  card_expired: 'Your card has expired. Please add a new payment method.',
  insufficient_funds: 'Insufficient funds. Please update your payment method.',
};

export const BillingIssueBanner: React.FC<BillingIssueBannerProps> = ({
  issue,
  onUpdatePayment,
  onDismiss,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const pulseAnimation = useSharedValue(1);

  useEffect(() => {
    // Pulse animation for urgency
    pulseAnimation.value = withRepeat(
      withTiming(1.05, { duration: 1000 }),
      -1,
      true
    );
  }, [pulseAnimation]);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const end = new Date(issue.gracePeriodEnd).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days > 0) {
        setTimeRemaining(`${days} day${days > 1 ? 's' : ''} left`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours} hour${hours > 1 ? 's' : ''} left`);
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${minutes} minute${minutes > 1 ? 's' : ''} left`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [issue.gracePeriodEnd]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const getMessage = (): string => {
    return issue.message || ISSUE_MESSAGES[issue.type];
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.content}>
        {/* Warning Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⚠️</Text>
        </View>

        {/* Message Content */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>Payment Issue</Text>
          <Text style={styles.message}>{getMessage()}</Text>

          {/* Countdown Timer */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerIcon}>⏱️</Text>
            <Text style={styles.timerText}>
              Grace period: <Text style={styles.timerValue}>{timeRemaining}</Text>
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <Pressable style={styles.updateButton} onPress={onUpdatePayment}>
              <Text style={styles.updateButtonText}>Update Payment</Text>
            </Pressable>
            <Pressable style={styles.dismissButton} onPress={onDismiss}>
              <Text style={styles.dismissButtonText}>Dismiss</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fecaca',
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  messageContainer: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#991b1b',
  },
  message: {
    fontSize: 14,
    color: '#7f1d1d',
    lineHeight: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  timerIcon: {
    fontSize: 14,
  },
  timerText: {
    fontSize: 13,
    color: '#7f1d1d',
  },
  timerValue: {
    fontWeight: 'bold',
    color: '#991b1b',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  dismissButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991b1b',
  },
});
