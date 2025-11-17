/**
 * PlaydateCard.native Component
 *
 * Mobile playdate card with Reanimated animations
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import type { Playdate } from '@petspark/core';
import { colors } from '@mobile/theme/colors';
import { useEntryAnimation } from '@mobile/effects/reanimated/use-entry-animation';
import { useBounceOnTap } from '@mobile/effects/reanimated/use-bounce-on-tap';
import * as Haptics from 'expo-haptics';
import { format, formatDistanceToNow } from 'date-fns';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface PlaydateCardProps {
  playdate: Playdate;
  onPress?: () => void;
  onJoin?: () => void;
  onCheckIn?: () => void;
  isParticipant?: boolean;
  index?: number;
}

export function PlaydateCard({
  playdate,
  onPress,
  onJoin,
  onCheckIn,
  isParticipant = false,
  index = 0,
}: PlaydateCardProps): React.JSX.Element {
  const entry = useEntryAnimation({ delay: index * 50 });
  const bounce = useBounceOnTap({ scale: 0.98 });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: entry.scale.value * bounce.scale.value }],
    opacity: entry.opacity.value,
  }));

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bounce.handlePress();
    onPress?.();
  };

  const scheduledDate = new Date(playdate.scheduledAt);
  const isUpcoming = scheduledDate > new Date();
  const isPast = scheduledDate < new Date();

  const statusColor =
    playdate.status === 'confirmed'
      ? colors.success
      : playdate.status === 'cancelled'
        ? colors.error
        : colors.warning;

  return (
    <AnimatedTouchable
      style={[styles.card, animatedStyle]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{playdate.title}</Text>
          {playdate.description && (
            <Text style={styles.description} numberOfLines={2}>
              {playdate.description}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {playdate.status}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📅</Text>
          <Text style={styles.detailText}>
            {format(scheduledDate, 'MMM d, yyyy • h:mm a')}
          </Text>
        </View>

        {playdate.location && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText} numberOfLines={1}>
              {playdate.location.name ?? 'Location'}
            </Text>
          </View>
        )}

        {playdate.participants && playdate.participants.length > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>👥</Text>
            <Text style={styles.detailText}>
              {playdate.participants.length} participant
              {playdate.participants.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {isUpcoming && !isParticipant && onJoin && (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onJoin();
            }}
          >
            <Text style={styles.joinButtonText}>Join</Text>
          </TouchableOpacity>
        )}
        {isUpcoming && isParticipant && onCheckIn && (
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onCheckIn();
            }}
          >
            <Text style={styles.checkInButtonText}>Check In</Text>
          </TouchableOpacity>
        )}
        {isPast && (
          <Text style={styles.pastText}>
            {formatDistanceToNow(scheduledDate, { addSuffix: true })}
          </Text>
        )}
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  details: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: {
    fontSize: 16,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  checkInButton: {
    backgroundColor: colors.success,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pastText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

