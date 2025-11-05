import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import type { Pet, SwipeAction } from '../types';
import { useStorage } from '../hooks/useStorage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

export default function DiscoverScreen(): React.JSX.Element {
  const [pets, setPets] = useStorage<Pet[]>('available-pets', []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeHistory, setSwipeHistory] = useStorage<SwipeAction[]>('swipe-history', []);
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          handleSwipe('like');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          handleSwipe('pass');
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

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

    Animated.timing(position, {
      toValue: {
        x: action === 'like' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5,
        y: 0,
      },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex(currentIndex + 1);
    });
  };

  const currentPet = pets[currentIndex];

  if (!currentPet) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>🐾</Text>
          <Text style={styles.emptyTitle}>No More Pets</Text>
          <Text style={styles.emptySubtitle}>
            Check back later for new matches!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Image source={{ uri: currentPet.photo }} style={styles.image} />
        <View style={styles.cardContent}>
          <View style={styles.header}>
            <Text style={styles.name}>{currentPet.name}, {currentPet.age}</Text>
            {currentPet.verified && <Text style={styles.verified}>✓</Text>}
          </View>
          <Text style={styles.breed}>{currentPet.breed}</Text>
          <Text style={styles.location}>📍 {currentPet.location}</Text>
          <Text style={styles.bio} numberOfLines={3}>
            {currentPet.bio}
          </Text>
        </View>
      </Animated.View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.passButton]}
          onPress={() => handleSwipe('pass')}
        >
          <Text style={styles.buttonText}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.superlikeButton]}
          onPress={() => handleSwipe('superlike')}
        >
          <Text style={styles.buttonText}>★</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.likeButton]}
          onPress={() => handleSwipe('like')}
        >
          <Text style={styles.buttonText}>♥</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.7,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  verified: {
    fontSize: 20,
    color: '#4CAF50',
    marginLeft: 8,
  },
  breed: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: SCREEN_WIDTH * 0.7,
    marginTop: 20,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  passButton: {
    backgroundColor: '#ff4458',
  },
  likeButton: {
    backgroundColor: '#4CAF50',
  },
  superlikeButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    fontSize: 28,
    color: '#fff',
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
