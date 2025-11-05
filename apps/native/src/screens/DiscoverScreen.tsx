import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { Pet, SwipeAction, UserProfile } from '../types';
import { useStorage } from '../hooks/useStorage';
import { SwipeableCard } from '../components/SwipeableCard';
import { FadeInView } from '../components/FadeInView';
import { AnimatedButton } from '../components/AnimatedButton';
import { SpringConfig } from '../animations/springConfigs';
import { StoriesBar, StoryViewer, CreateStoryDialog, type Story } from '../components/stories';
import { useStories } from '../hooks/stories/useStories';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function DiscoverScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const [pets, setPets] = useStorage<Pet[]>('available-pets', []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeHistory, setSwipeHistory] = useStorage<SwipeAction[]>('swipe-history', []);
  const [userProfile] = useStorage<UserProfile>('user-profile', {
    id: 'user-1',
    name: 'Pet Owner',
    email: 'owner@pet3.com',
    location: 'San Francisco, CA',
    pets: [],
    createdAt: new Date().toISOString(),
  });
  const buttonScale = useSharedValue(1);

  // Stories management
  const { stories, createStory, markStoryAsViewed } = useStories(userProfile.id);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [showCreateStoryDialog, setShowCreateStoryDialog] = useState(false);

  const handleStoryPress = (story: Story) => {
    const storyIndex = stories.findIndex((s) => s.id === story.id);
    setSelectedStoryIndex(storyIndex);
    setShowStoryViewer(true);
  };

  const handleStoryComplete = async (storyId: string) => {
    await markStoryAsViewed(storyId);
  };

  const handleCreateStory = async (
    imageUri: string,
    text?: string,
    privacy?: 'public' | 'friends' | 'private'
  ) => {
    const result = await createStory(
      imageUri,
      userProfile.name,
      userProfile.avatar,
      text,
      privacy
    );
    if (result.success) {
      Alert.alert('Success', 'Story created!');
    } else {
      Alert.alert('Error', result.error || 'Failed to create story');
    }
  };

  const handleSwipe = async (action: 'like' | 'pass' | 'superlike') => {
    const currentPet = pets[currentIndex];
    if (!currentPet) return;

    const swipe: SwipeAction = {
      petId: 'my-pet-id',
      targetPetId: currentPet.id,
      action,
      timestamp: new Date().toISOString(),
    };

    await setSwipeHistory([...swipeHistory, swipe]);
    setCurrentIndex(currentIndex + 1);
  };

  const animateButton = (index: number) => {
    buttonScale.value = withSpring(1.2, SpringConfig.bouncy, () => {
      buttonScale.value = withSpring(1, SpringConfig.snappy);
    });
  };

  const currentPet = pets[currentIndex];
  const nextPet = pets[currentIndex + 1];

  if (!currentPet) {
    return (
      <View style={styles.container}>
        <FadeInView>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>🐾</Text>
            <Text style={styles.emptyTitle}>No More Pets</Text>
            <Text style={styles.emptySubtitle}>
              Check back later for new matches!
            </Text>
          </View>
        </FadeInView>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Stories Bar */}
      <StoriesBar
        stories={stories}
        onStoryPress={handleStoryPress}
        onAddStory={() => setShowCreateStoryDialog(true)}
        currentUserId={userProfile.id}
      />

      <View style={styles.cardContainer}>
        {/* Next card (underneath) */}
        {nextPet && (
          <FadeInView style={styles.nextCard}>
            <View style={styles.card}>
              <Image source={{ uri: nextPet.photo }} style={styles.image} />
              <View style={styles.cardOverlay} />
            </View>
          </FadeInView>
        )}

        {/* Current card (on top) */}
        <SwipeableCard
          onSwipeLeft={() => {
            animateButton(0);
            handleSwipe('pass');
          }}
          onSwipeRight={() => {
            animateButton(2);
            handleSwipe('like');
          }}
          onSwipeUp={() => {
            animateButton(1);
            handleSwipe('superlike');
          }}
        >
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => navigation.navigate('PetDetail' as never, { pet: currentPet } as never)}
            style={styles.card}
          >
            <Image source={{ uri: currentPet.photo }} style={styles.image} />
            <View style={styles.gradient} />
            <View style={styles.cardContent}>
              <FadeInView delay={100}>
                <View style={styles.header}>
                  <Text style={styles.name}>{currentPet.name}, {currentPet.age}</Text>
                  {currentPet.verified && <Text style={styles.verified}>✓</Text>}
                </View>
              </FadeInView>
              <FadeInView delay={150}>
                <Text style={styles.breed}>{currentPet.breed}</Text>
              </FadeInView>
              <FadeInView delay={200}>
                <Text style={styles.location}>📍 {currentPet.location}</Text>
              </FadeInView>
              <FadeInView delay={250}>
                <Text style={styles.bio} numberOfLines={3}>
                  {currentPet.bio}
                </Text>
              </FadeInView>
              <FadeInView delay={300}>
                <Text style={styles.tapHint}>Tap for details • Swipe to match</Text>
              </FadeInView>
            </View>
          </TouchableOpacity>
        </SwipeableCard>
      </View>

      <FadeInView delay={350} style={styles.actions}>
        <AnimatedButton
          title="✕"
          onPress={() => {
            animateButton(0);
            handleSwipe('pass');
          }}
          style={[styles.button, styles.passButton]}
          textStyle={styles.buttonText}
        />
        <AnimatedButton
          title="★"
          onPress={() => {
            animateButton(1);
            handleSwipe('superlike');
          }}
          style={[styles.button, styles.superlikeButton]}
          textStyle={styles.buttonText}
        />
        <AnimatedButton
          title="♥"
          onPress={() => {
            animateButton(2);
            handleSwipe('like');
          }}
          style={[styles.button, styles.likeButton]}
          textStyle={styles.buttonText}
        />
      </FadeInView>

      {/* Story Viewer Modal */}
      <StoryViewer
        visible={showStoryViewer}
        stories={stories}
        initialStoryIndex={selectedStoryIndex}
        onClose={() => setShowStoryViewer(false)}
        onStoryComplete={handleStoryComplete}
      />

      {/* Create Story Dialog */}
      <CreateStoryDialog
        visible={showCreateStoryDialog}
        onClose={() => setShowCreateStoryDialog(false)}
        onCreateStory={handleCreateStory}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.7,
    position: 'relative',
  },
  nextCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.5,
    transform: [{ scale: 0.95 }],
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  verified: {
    fontSize: 24,
    color: '#22c55e',
    marginLeft: 8,
  },
  breed: {
    fontSize: 18,
    color: '#f3f4f6',
    marginBottom: 6,
    fontWeight: '500',
  },
  location: {
    fontSize: 16,
    color: '#e5e7eb',
    marginBottom: 12,
  },
  bio: {
    fontSize: 15,
    color: '#f9fafb',
    lineHeight: 22,
  },
  tapHint: {
    fontSize: 13,
    color: '#d1d5db',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: SCREEN_WIDTH * 0.75,
    marginTop: 30,
    paddingHorizontal: 20,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  passButton: {
    backgroundColor: '#ef4444',
  },
  likeButton: {
    backgroundColor: '#22c55e',
  },
  superlikeButton: {
    backgroundColor: '#3b82f6',
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  buttonText: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
  },
});
