/**
 * StoryViewer.native Component
 *
 * Mobile story viewer with swipe gestures and Reanimated animations
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  Dimensions,
  TouchableOpacity,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import type { Story } from '@petspark/core';
import { ProgressiveImage } from '@mobile/components/enhanced/ProgressiveImage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
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

export function StoryViewer({
  stories,
  initialIndex = 0,
  currentUserId: _currentUserId,
  onClose,
  onComplete,
  onStoryUpdate: _onStoryUpdate,
}: StoryViewerProps): React.JSX.Element {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const progress = useSharedValue(0);
  const translateX = useSharedValue(0);
  const _opacity = useSharedValue(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentStory = stories[currentIndex];

  const startProgress = useCallback(() => {
    if (isPaused || !currentStory) return;

    progress.value = 0;
    progress.value = withTiming(1, {
      duration: STORY_DURATION,
    });

    timerRef.current = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onComplete?.();
        onClose();
      }
    }, STORY_DURATION);
  }, [currentIndex, stories.length, isPaused, currentStory, progress, onComplete, onClose]);

  useEffect(() => {
    startProgress();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [startProgress]);

  const handleTap = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPaused) {
      setIsPaused(false);
      startProgress();
    } else {
      setIsPaused(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }
  }, [isPaused, startProgress]);

  const handleSwipeLeft = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [currentIndex, stories.length]);

  const handleSwipeRight = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [currentIndex]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const threshold = SCREEN_WIDTH / 3;
      if (e.translationX > threshold) {
        runOnJS(handleSwipeRight)();
      } else if (e.translationX < -threshold) {
        runOnJS(handleSwipeLeft)();
      }
      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: interpolate(
      Math.abs(translateX.value),
      [0, SCREEN_WIDTH / 2],
      [1, 0.5],
      Extrapolation.CLAMP
    ),
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  if (!currentStory) {
    return <View />;
  }

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <StatusBar hidden />
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={[]}>
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.storyContainer, animatedStyle]}>
              <TouchableOpacity
                style={styles.tapArea}
                activeOpacity={1}
                onPress={handleTap}
              >
                <ProgressiveImage
                  src={currentStory.mediaUrl}
                  style={styles.image}
                  imageStyle={styles.imageContent}
                />

                <View style={styles.progressContainer}>
                  {stories.map((_, index) => (
                    <View key={index} style={styles.progressBar}>
                      {index === currentIndex && (
                        <Animated.View
                          style={[styles.progressFill, progressBarStyle]}
                        />
                      )}
                    </View>
                  ))}
                </View>

                <View style={styles.header}>
                  <View style={styles.headerInfo}>
                    {currentStory.petPhoto && (
                      <Image
                        source={{ uri: currentStory.petPhoto }}
                        style={styles.avatar}
                      />
                    )}
                    <Text style={styles.petName}>{currentStory.petName}</Text>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {currentStory.caption && (
                  <View style={styles.captionContainer}>
                    <Text style={styles.caption}>{currentStory.caption}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </GestureDetector>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  storyContainer: {
    flex: 1,
  },
  tapArea: {
    flex: 1,
  },
  image: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  imageContent: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 4,
  },
  progressBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  petName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  caption: {
    color: '#fff',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

