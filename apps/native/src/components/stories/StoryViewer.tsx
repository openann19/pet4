import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  runOnJS,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import type { Story } from '@petspark/shared';
import type { AVPlaybackStatus, VideoProps, ResizeMode } from '../../types/expo-av';
import type { HapticsAPI, NotificationFeedbackType, ImpactFeedbackStyle } from '../../types/expo-haptics';

// Dynamic imports for optional dependencies - loaded at runtime
let Video: React.ComponentType<VideoProps> | null = null;
let ResizeModeValue: typeof ResizeMode | null = null;
let HapticsInstance: HapticsAPI | null = null;

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
  const [videoStatus, setVideoStatus] = useState<{
    isLoading: boolean;
    hasError: boolean;
    errorMessage?: string;
  }>({
    isLoading: true,
    hasError: false,
  });

  const progressAnimation = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<React.ComponentType<VideoProps> & { pauseAsync?: () => Promise<AVPlaybackStatus>; playAsync?: () => Promise<AVPlaybackStatus>; reloadAsync?: () => Promise<void> } | null>(null);
  const [isVideoModuleLoaded, setIsVideoModuleLoaded] = useState(false);

  const currentStory = stories[currentIndex];

  // Load video module dynamically
  useEffect(() => {
    if (currentStory?.type === 'video' && !isVideoModuleLoaded) {
      void Promise.all([
        import('expo-av' as string)
          .then((module: { Video: unknown; ResizeMode: unknown }) => {
            Video = module.Video as React.ComponentType<VideoProps>;
            ResizeModeValue = module.ResizeMode as typeof ResizeMode;
            return true;
          })
          .catch(() => {
            // expo-av not available, video will show error state
            setVideoStatus({
              isLoading: false,
              hasError: true,
              errorMessage: 'Video player not available. Please install expo-av.',
            });
            return false;
          }),
        import('expo-haptics' as string)
          .then((module: { default: unknown } | HapticsAPI) => {
            if ('default' in module && module.default) {
              HapticsInstance = module.default as HapticsAPI;
            } else {
              HapticsInstance = module as HapticsAPI;
            }
            return true;
          })
          .catch(() => {
            // expo-haptics not available, continue without haptics
            return true;
          }),
      ]).then(() => {
        setIsVideoModuleLoaded(true);
      });
    }
  }, [currentStory?.type, isVideoModuleLoaded]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev < stories.length - 1) {
        setProgress(0);
        progressAnimation.value = 0;
        return prev + 1;
      } else {
        setProgress(0);
        progressAnimation.value = 0;
        onComplete?.();
        onClose();
        return prev;
      }
    });
  }, [stories.length, onComplete, onClose, progressAnimation]);

  // Handle video playback status
  const handleVideoStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!currentStory) return;

      if (!status.isLoaded) {
        if (status.error) {
          setVideoStatus({
            isLoading: false,
            hasError: true,
            errorMessage: 'Failed to load video. Please try again.',
          });
          if (HapticsInstance?.notificationAsync) {
            void HapticsInstance.notificationAsync(NotificationFeedbackType.Error);
          }
        } else {
          setVideoStatus({ isLoading: true, hasError: false });
        }
        return;
      }

      setVideoStatus({ isLoading: false, hasError: false });

      // Update progress based on video position
      if (status.isPlaying && status.durationMillis) {
        const progress = status.positionMillis / status.durationMillis;
        progressAnimation.value = progress;

        // Auto-advance when video completes
        if (status.didJustFinish) {
          goToNext();
        }
      }

      // Handle playback state
      if (status.isPlaying !== !isPaused) {
        setIsPaused(!status.isPlaying);
      }
    },
    [currentStory, isPaused, progressAnimation, goToNext]
  );

  // Progress animation for photos and video loading
  useEffect(() => {
    if (isPaused || !currentStory) return;
    if (currentStory.type === 'video' && videoStatus.isLoading) return;

    progressAnimation.value = 0;
    const duration = currentStory.duration * 1000 || STORY_DURATION;

    if (currentStory.type === 'photo') {
      progressAnimation.value = withTiming(1, {
        duration,
      });

      timerRef.current = setTimeout(() => {
        goToNext();
      }, duration);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex, isPaused, currentStory, videoStatus.isLoading, goToNext, progressAnimation]);

  // Reset video state when story changes
  useEffect(() => {
    if (currentStory?.type === 'video') {
      setVideoStatus({ isLoading: true, hasError: false });
      progressAnimation.value = 0;
    }
  }, [currentIndex, currentStory?.type, progressAnimation]);

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
      if (currentStory?.type === 'video' && videoRef.current && isVideoModuleLoaded) {
        videoRef.current.pauseAsync().catch(() => {
          // Error handling for video pause
        });
      }
      if (HapticsInstance) {
        void HapticsInstance.impactAsync(ImpactFeedbackStyle.Light);
      }
    })
    .onEnd(() => {
      runOnJS(setIsPaused)(false);
      if (currentStory?.type === 'video' && videoRef.current && isVideoModuleLoaded) {
        videoRef.current.playAsync().catch(() => {
          // Error handling for video play
        });
      }
      if (HapticsInstance) {
        void HapticsInstance.impactAsync(ImpactFeedbackStyle.Light);
      }
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

  if (!currentStory) {
    return null;
  }

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
                <View style={styles.videoContainer}>
                  {!isVideoModuleLoaded || videoStatus.isLoading ? (
                    <View style={styles.videoLoadingContainer}>
                      <ActivityIndicator size="large" color="#ffffff" />
                      <Text style={styles.videoLoadingText}>Loading video...</Text>
                    </View>
                  ) : videoStatus.hasError ? (
                    <View style={styles.videoErrorContainer}>
                      <Text style={styles.videoErrorText}>
                        {videoStatus.errorMessage || 'Failed to load video'}
                      </Text>
                      <Pressable
                        style={styles.retryButton}
                        onPress={() => {
                          setVideoStatus({ isLoading: true, hasError: false });
                          if (videoRef.current) {
                            videoRef.current.reloadAsync().catch(() => {
                              // Error handling for video reload
                            });
                          }
                          if (HapticsInstance) {
                            void HapticsInstance.impactAsync(ImpactFeedbackStyle.Light);
                          }
                        }}
                      >
                        <Text style={styles.retryButtonText}>Retry</Text>
                      </Pressable>
                    </View>
                  ) : Video && ResizeModeValue ? (
                    <Video
                      ref={videoRef as never}
                      source={{ uri: currentStory.mediaUrl }}
                      style={styles.video}
                      resizeMode={ResizeModeValue.CONTAIN}
                      shouldPlay={!isPaused}
                      isLooping={false}
                      isMuted={false}
                      useNativeControls={false}
                      onPlaybackStatusUpdate={handleVideoStatusUpdate as never}
                      onLoadStart={() => {
                        setVideoStatus({ isLoading: true, hasError: false });
                      }}
                    />
                  ) : (
                    <View style={styles.videoErrorContainer}>
                      <Text style={styles.videoErrorText}>Video player not available</Text>
                    </View>
                  )}
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
  videoContainer: {
    width: width,
    height: height * 0.8,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: width,
    height: height * 0.8,
  },
  videoLoadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  videoLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
  },
  videoErrorContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 10,
  },
  videoErrorText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
