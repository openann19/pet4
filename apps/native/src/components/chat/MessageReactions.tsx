import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🎉', '🔥', '💯', '🙏', '👀'];

export interface Reaction {
  emoji: string;
  users: string[];
}

interface MessageReactionsProps {
  messageId: string;
  reactions: Reaction[];
  currentUserId: string;
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  onLongPress?: () => void;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  reactions,
  currentUserId,
  onAddReaction,
  onRemoveReaction,
  onLongPress,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const scale = useSharedValue(1);

  const handleReactionPress = (emoji: string) => {
    const existingReaction = reactions.find((r) => r.emoji === emoji);
    const userHasReacted = existingReaction?.users.includes(currentUserId);

    if (userHasReacted) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }

    // Animate
    scale.value = withSpring(1.2, {}, () => {
      scale.value = withSpring(1);
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getUserReaction = (): string | null => {
    const userReaction = reactions.find((r) => r.users.includes(currentUserId));
    return userReaction ? userReaction.emoji : null;
  };

  return (
    <View style={styles.container}>
      {/* Display existing reactions */}
      {reactions.length > 0 && (
        <View style={styles.reactionsDisplay}>
          {reactions.map((reaction, index) => (
            <Pressable
              key={index}
              style={[
                styles.reactionBubble,
                reaction.users.includes(currentUserId) && styles.reactionBubbleActive,
              ]}
              onPress={() => handleReactionPress(reaction.emoji)}
            >
              <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
              {reaction.users.length > 1 && (
                <Text style={styles.reactionCount}>{reaction.users.length}</Text>
              )}
            </Pressable>
          ))}
        </View>
      )}

      {/* Add reaction button */}
      <Pressable
        style={styles.addReactionButton}
        onPress={() => setShowPicker(true)}
        onLongPress={onLongPress}
      >
        <Text style={styles.addReactionText}>+</Text>
      </Pressable>

      {/* Reaction Picker Modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPicker(false)}
        >
          <Animated.View style={[styles.pickerContainer, animatedStyle]}>
            <Text style={styles.pickerTitle}>React with</Text>
            <View style={styles.reactionGrid}>
              {REACTIONS.map((emoji, index) => (
                <Pressable
                  key={index}
                  style={styles.reactionOption}
                  onPress={() => {
                    handleReactionPress(emoji);
                    setShowPicker(false);
                  }}
                >
                  <Text style={styles.reactionOptionEmoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  reactionsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reactionBubbleActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  addReactionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  addReactionText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 350,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  reactionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  reactionOption: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  reactionOptionEmoji: {
    fontSize: 28,
  },
});
