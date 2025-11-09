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
  withTiming,
  runOnJS,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import type { Story } from '@petspark/shared';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

interface StoryViewerProps {
  stories: Story[];
  initialIndex?: number;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  onClose: () => void;
  onComplete?: () => void;
  onStoryUpdate?: (story: Story) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  initialIndex = 0,
  currentUserId: _currentUserId,
  currentUserName: _currentUserName,
  currentUserAvatar: _currentUserAvatar,
  onClose,
  onComplete,
  onStoryUpdate: _onStoryUpdate,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [, setProgress] = useState(0);

  const progressAnimation = useSharedValue(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentStory = stories[currentIndex];

  // Progress animation
  useEffect(() => {
    if (isPaused || !currentStory) return;

    progressAnimation.value = 0;
    const duration = currentStory.duration * 1000 || STORY_DURATION;

    progressAnimation.value = withTiming(1, {
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
  }, [currentIndex, isPaused, currentStory]);

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      progressAnimation.value = 0;
    } else {
      onComplete?.();
      onClose();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      progressAnimation.value = 0;
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
  const panGesture = Gesture.Pan().onUpdate((event) => {
    if (event.translationY > 100) {
      runOnJS(onClose)();
    }
  });

  const composedGesture = Gesture.Race(tapGesture, longPressGesture, panGesture);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressAnimation.value * 100}%`,
  }));

  const getInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  if (!currentStory) return null;

  return (
    <Modal visible={true} animationType="fade" statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
          {/* Progress Bars */}
          <View style={styles.progressContainer}>
            {stories.map((_, index) => (
              <View key={index} style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    index < currentIndex && styles.progressBarCompleted,
                    index > currentIndex && styles.progressBarEmpty,
                  ]}
                >
                  {index === currentIndex && (
                    <Animated.View style={[styles.progressBarFill, progressBarStyle]} />
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              {currentStory.userAvatar ? (
                <Image source={{ uri: currentStory.userAvatar }} style={styles.userPhoto} />
              ) : (
                <View style={styles.userPhotoPlaceholder}>
                  <Text style={styles.userPhotoText}>{getInitial(currentStory.userName)}</Text>
                </View>
              )}
              <View>
                <Text style={styles.userName}>{currentStory.petName}</Text>
                <Text style={styles.timestamp}>
                  {new Date(currentStory.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {/* Story Content */}
          <GestureDetector gesture={composedGesture}>
            <View style={styles.content}>
              {currentStory.type === 'photo' && (
                <Image
                  source={{ uri: currentStory.mediaUrl }}
                  style={styles.storyImage}
                  resizeMode="contain"
                />
              )}

              {currentStory.type === 'video' && (
                <View style={styles.videoPlaceholder}>
                  <Text style={styles.videoText}>Video Player</Text>
                  <Text style={styles.videoSubtext}>Video support coming soon</Text>
                </View>
              )}

              {currentStory.caption && (
                <View style={styles.captionContainer}>
                  <Text style={styles.caption}>{currentStory.caption}</Text>
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
  timestamp: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
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
  captionContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
  },
  caption: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
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

export default StoryViewer;
