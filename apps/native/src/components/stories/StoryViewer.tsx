import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import type { Story, StoryItem } from './StoriesBar';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

interface StoryViewerProps {
  visible: boolean;
  stories: Story[];
  initialStoryIndex: number;
  initialItemIndex?: number;
  onClose: () => void;
  onStoryComplete: (storyId: string) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  visible,
  stories,
  initialStoryIndex,
  initialItemIndex = 0,
  onClose,
  onStoryComplete,
}) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [currentItemIndex, setCurrentItemIndex] = useState(initialItemIndex);
  const [isPaused, setIsPaused] = useState(false);
  
  const progress = useSharedValue(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentStory = stories[currentStoryIndex];
  const currentItem = currentStory?.stories[currentItemIndex];

  // Progress bar animation
  useEffect(() => {
    if (!visible || isPaused || !currentItem) return;

    progress.value = 0;
    const duration = currentItem.duration || STORY_DURATION;

    progress.value = withTiming(1, {
      duration,
    });

    timerRef.current = setTimeout(() => {
      goToNext();
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [visible, currentStoryIndex, currentItemIndex, isPaused]);

  const goToNext = () => {
    if (currentItemIndex < currentStory.stories.length - 1) {
      // Next item in current story
      setCurrentItemIndex((prev) => prev + 1);
    } else if (currentStoryIndex < stories.length - 1) {
      // Next story
      onStoryComplete(currentStory.id);
      setCurrentStoryIndex((prev) => prev + 1);
      setCurrentItemIndex(0);
    } else {
      // End of all stories
      onStoryComplete(currentStory.id);
      onClose();
    }
  };

  const goToPrevious = () => {
    if (currentItemIndex > 0) {
      // Previous item in current story
      setCurrentItemIndex((prev) => prev - 1);
    } else if (currentStoryIndex > 0) {
      // Previous story
      const prevStoryIndex = currentStoryIndex - 1;
      setCurrentStoryIndex(prevStoryIndex);
      setCurrentItemIndex(stories[prevStoryIndex].stories.length - 1);
    }
  };

  // Tap gestures
  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd((event) => {
      const x = event.x;
      if (x < width / 2) {
        runOnJS(goToPrevious)();
      } else {
        runOnJS(goToNext)();
      }
    });

  // Long press to pause
  const longPressGesture = Gesture.LongPress()
    .minDuration(100)
    .onStart(() => {
      runOnJS(setIsPaused)(true);
    })
    .onEnd(() => {
      runOnJS(setIsPaused)(false);
    });

  // Swipe down to close
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 100) {
        runOnJS(onClose)();
      }
    });

  const composedGesture = Gesture.Race(
    tapGesture,
    longPressGesture,
    panGesture
  );

  if (!visible || !currentStory || !currentItem) return null;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
          {/* Progress Bars */}
          <View style={styles.progressContainer}>
            {currentStory.stories.map((_, index) => (
              <View key={index} style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    index < currentItemIndex && styles.progressBarCompleted,
                    index > currentItemIndex && styles.progressBarEmpty,
                  ]}
                >
                  {index === currentItemIndex && (
                    <Animated.View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${progress.value * 100}%`,
                        },
                      ]}
                    />
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              {currentStory.userPhoto ? (
                <Image
                  source={{ uri: currentStory.userPhoto }}
                  style={styles.userPhoto}
                />
              ) : (
                <View style={styles.userPhotoPlaceholder}>
                  <Text style={styles.userPhotoText}>
                    {currentStory.userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.userName}>{currentStory.userName}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {/* Story Content */}
          <GestureDetector gesture={composedGesture}>
            <View style={styles.content}>
              {currentItem.type === 'image' ? (
                <Image
                  source={{ uri: currentItem.uri }}
                  style={styles.storyImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.videoPlaceholder}>
                  <Text style={styles.videoText}>Video Player</Text>
                  <Text style={styles.videoSubtext}>
                    Video support coming soon
                  </Text>
                </View>
              )}
            </View>
          </GestureDetector>

          {/* Pause Indicator */}
          {isPaused && (
            <View style={styles.pauseIndicator}>
              <Text style={styles.pauseText}>⏸</Text>
            </View>
          )}
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 4,
  },
  progressBarContainer: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBarCompleted: {
    backgroundColor: '#ffffff',
  },
  progressBarEmpty: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userPhotoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userPhotoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyImage: {
    width: width,
    height: height * 0.8,
  },
  videoPlaceholder: {
    width: width * 0.8,
    height: height * 0.5,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  videoSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  pauseIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseText: {
    fontSize: 36,
    color: '#ffffff',
  },
});
