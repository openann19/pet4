import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';

export interface Highlight {
  id: string;
  title: string;
  coverImage: string;
  storyIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface StoryHighlightsProps {
  highlights: Highlight[];
  onHighlightPress: (highlight: Highlight) => void;
  onAddHighlight: () => void;
  isOwner?: boolean;
}

const HighlightRing: React.FC<{
  highlight: Highlight;
  onPress: () => void;
}> = ({ highlight, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={[styles.highlightContainer, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.highlightRing}>
          {highlight.coverImage ? (
            <Image
              source={{ uri: highlight.coverImage }}
              style={styles.highlightImage}
            />
          ) : (
            <View style={styles.highlightPlaceholder}>
              <Text style={styles.highlightPlaceholderIcon}>📸</Text>
            </View>
          )}
        </View>
        <Text style={styles.highlightTitle} numberOfLines={1}>
          {highlight.title}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export const StoryHighlights: React.FC<StoryHighlightsProps> = ({
  highlights,
  onHighlightPress,
  onAddHighlight,
  isOwner = false,
}) => {
  if (highlights.length === 0 && !isOwner) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Highlights</Text>
        {isOwner && (
          <Text style={styles.count}>
            {highlights.length} highlight{highlights.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Add New Highlight (Owner Only) */}
        {isOwner && (
          <Animated.View style={styles.highlightContainer}>
            <Pressable onPress={onAddHighlight}>
              <View style={styles.addHighlightRing}>
                <View style={styles.addHighlightButton}>
                  <Text style={styles.addHighlightIcon}>+</Text>
                </View>
              </View>
              <Text style={styles.highlightTitle}>New</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Existing Highlights */}
        {highlights.map((highlight) => (
          <HighlightRing
            key={highlight.id}
            highlight={highlight}
            onPress={() => { onHighlightPress(highlight); }}
          />
        ))}

        {/* Empty State for Owner */}
        {isOwner && highlights.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Create highlights to save your favorite stories
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.3,
  },
  count: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  highlightContainer: {
    alignItems: 'center',
    width: 80,
  },
  highlightRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#d1d5db',
    padding: 3,
    marginBottom: 6,
    backgroundColor: '#ffffff',
  },
  highlightImage: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
  },
  highlightPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightPlaceholderIcon: {
    fontSize: 32,
  },
  highlightTitle: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 80,
  },
  addHighlightRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    marginBottom: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addHighlightButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addHighlightIcon: {
    fontSize: 32,
    color: '#3b82f6',
    fontWeight: '300',
  },
  emptyState: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxWidth: 250,
  },
  emptyText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
});
