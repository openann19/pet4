/**
 * VerificationLevelSelector.native Component
 *
 * Mobile verification level selector
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Animated } from '@petspark/motion';
import { colors } from '@mobile/theme/colors';
import { useEntryAnimation } from '@mobile/effects/reanimated/use-entry-animation';
import { useBounceOnTap } from '@mobile/effects/reanimated/use-bounce-on-tap';
import * as Haptics from 'expo-haptics';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

type VerificationLevel = 'basic' | 'standard' | 'premium';

interface VerificationLevelSelectorProps {
  selectedLevel: VerificationLevel;
  onLevelSelect: (level: VerificationLevel) => void;
}

const LEVELS: Array<{ value: VerificationLevel; label: string; description: string }> = [
  {
    value: 'basic',
    label: 'Basic',
    description: 'ID verification only',
  },
  {
    value: 'standard',
    label: 'Standard',
    description: 'ID + Address verification',
  },
  {
    value: 'premium',
    label: 'Premium',
    description: 'Full verification with pet documents',
  },
];

export function VerificationLevelSelector({
  selectedLevel,
  onLevelSelect,
}: VerificationLevelSelectorProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verification Level</Text>
      <View style={styles.levels}>
        {LEVELS.map((level, index) => (
          <LevelCard
            key={level.value}
            level={level}
            isSelected={selectedLevel === level.value}
            onSelect={() => onLevelSelect(level.value)}
            index={index}
          />
        ))}
      </View>
    </View>
  );
}

interface LevelCardProps {
  level: { value: VerificationLevel; label: string; description: string };
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

function LevelCard({ level, isSelected, onSelect, index }: LevelCardProps): React.JSX.Element {
  const entry = useEntryAnimation({ delay: index * 50 });
  const bounce = useBounceOnTap({ scale: 0.98 });

  const handlePress = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bounce.handlePress();
    onSelect();
  };

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
        entry.animatedStyle,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <Text style={[styles.label, isSelected && styles.labelSelected]}>
          {level.label}
        </Text>
        <Text style={[styles.description, isSelected && styles.descriptionSelected]}>
          {level.description}
        </Text>
      </View>
      {isSelected && <View style={styles.checkmark}>✓</View>}
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  levels: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  cardContent: {
    flex: 1,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  labelSelected: {
    color: colors.primary,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  descriptionSelected: {
    color: colors.text,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

