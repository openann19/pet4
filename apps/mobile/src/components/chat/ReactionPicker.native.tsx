/**
 * ReactionPicker.native Component
 *
 * Mobile reaction picker with haptics and Reanimated
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@mobile/theme/colors';
import { useEntryAnimation } from '@mobile/effects/reanimated/use-entry-animation';
import { useBounceOnTap } from '@mobile/effects/reanimated/use-bounce-on-tap';

const REACTION_EMOJIS = ['❤️', '😂', '👍', '👎', '🔥', '🙏', '⭐', '🎉', '😮', '😢', '😡', '💯'] as const;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ReactionPickerProps {
  visible: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
  position?: { x: number; y: number };
}

export function ReactionPicker({
  visible,
  onSelect,
  onClose,
  position,
}: ReactionPickerProps): React.JSX.Element {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.8, { duration: 150 });
    }
  }, [visible, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handleSelect = useCallback(
    (emoji: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(emoji);
      onClose();
    },
    [onSelect, onClose]
  );

  if (!visible) return <></>;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.container,
            position && { top: position.y, left: position.x },
            animatedStyle,
          ]}
        >
          <View style={styles.grid}>
            {REACTION_EMOJIS.map((emoji, index) => (
              <EmojiButton
                key={emoji}
                emoji={emoji}
                index={index}
                onSelect={handleSelect}
              />
            ))}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

interface EmojiButtonProps {
  emoji: string;
  index: number;
  onSelect: (emoji: string) => void;
}

function EmojiButton({ emoji, index, onSelect }: EmojiButtonProps): React.JSX.Element {
  const entry = useEntryAnimation({ delay: index * 30 });
  const bounce = useBounceOnTap({ scale: 0.8 });

  const handlePress = useCallback(() => {
    bounce.handlePress();
    onSelect(emoji);
  }, [bounce, onSelect, emoji]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: entry.scale.value * bounce.scale.value },
    ],
    opacity: entry.opacity.value,
  }));

  return (
    <AnimatedTouchable
      style={[styles.emojiButton, animatedStyle]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={styles.emoji}>{emoji}</Text>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 240,
    gap: 8,
  },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emoji: {
    fontSize: 24,
  },
});

