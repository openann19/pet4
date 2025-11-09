import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { Post } from '../types';
import { useStorage } from '../hooks/use-storage';
import { FadeInView } from '../components/FadeInView';
import { AnimatedCard } from '../components/AnimatedCard';
import { AnimatedButton } from '../components/AnimatedButton';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { SpringConfig } from '../animations/springConfigs';

interface AnimatedPostItemProps {
  item: Post;
  index: number;
  onLike: (postId: string) => void;
}

const AnimatedPostItem: React.FC<AnimatedPostItemProps> = ({ item, index, onLike }) => {
  const likeScale = useSharedValue(1);
  const likeOpacity = useSharedValue(1);

  const handleLike = () => {
    likeScale.value = withSequence(
      withSpring(1.5, SpringConfig.bouncy),
      withSpring(1, SpringConfig.snappy)
    );
    onLike(item.id);
  };

  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
    opacity: likeOpacity.value,
  }));

  return (
    <FadeInView delay={index * 50} style={{ marginBottom: 16 }}>
      <AnimatedCard style={styles.postCard}>
        <View style={styles.postHeader}>
          {item.authorAvatar ? (
            <Image source={{ uri: item.authorAvatar }} style={styles.authorAvatar} />
          ) : (
            <View style={[styles.authorAvatar, styles.authorAvatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{item.authorName[0]}</Text>
            </View>
          )}
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{item.authorName}</Text>
            <Text style={styles.postTime}>{new Date(item.timestamp).toLocaleDateString()}</Text>
          </View>
        </View>

        <Text style={styles.postContent}>{item.content}</Text>

        {item.images && item.images.length > 0 && (
          <Image source={{ uri: item.images[0] }} style={styles.postImage} />
        )}

        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Animated.View style={likeAnimatedStyle}>
              <Text style={[styles.actionIcon, item.likes > 0 && styles.actionIconLiked]}>♥</Text>
            </Animated.View>
            <Text style={styles.actionText}>{item.likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionText}>{item.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>↗</Text>
            <Text style={styles.actionText}>{item.shares}</Text>
          </TouchableOpacity>
        </View>
      </AnimatedCard>
    </FadeInView>
  );
};

export default function CommunityScreen(): React.JSX.Element {
  const [posts, setPosts] = useStorage<Post[]>('community-posts', []);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  // Loading state handled by refresh state

  const modalScale = useSharedValue(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const createPost = async () => {
    if (newPostContent.trim() === '') return;

    const newPost: Post = {
      id: Date.now().toString(),
      authorId: 'my-user-id',
      authorName: 'My Name',
      content: newPostContent,
      likes: 0,
      comments: 0,
      shares: 0,
      timestamp: new Date().toISOString(),
      type: 'text',
    };

    await setPosts([newPost, ...posts]);
    setNewPostContent('');
    handleCloseModal();
  };

  const handleLike = async (postId: string) => {
    const updatedPosts = posts.map((post) =>
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    );
    await setPosts(updatedPosts);
  };

  const handleOpenModal = () => {
    setShowCreatePost(true);
    modalScale.value = withSpring(1, SpringConfig.bouncy);
  };

  const handleCloseModal = () => {
    modalScale.value = withTiming(0, { duration: 200 }, () => {
      setShowCreatePost(false);
    });
  };

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalScale.value,
  }));

  React.useEffect(() => {
    if (showCreatePost) {
      modalScale.value = 0;
      modalScale.value = withSpring(1, SpringConfig.bouncy);
    }
  }, [showCreatePost]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <FadeInView>
          <Text style={styles.headerTitle}>Community</Text>
        </FadeInView>
        <FadeInView delay={100}>
          <AnimatedButton
            title="+ Create Post"
            onPress={handleOpenModal}
            style={styles.createButton}
            textStyle={styles.createButtonText}
          />
        </FadeInView>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          {[...Array(3)].map((_, index) => (
            <View key={index} style={styles.skeletonCard}>
              <View style={styles.skeletonHeader}>
                <LoadingSkeleton width={48} height={48} borderRadius={24} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <LoadingSkeleton width="60%" height={16} style={{ marginBottom: 6 }} />
                  <LoadingSkeleton width="40%" height={12} />
                </View>
              </View>
              <LoadingSkeleton width="100%" height={60} style={{ marginVertical: 12 }} />
              <LoadingSkeleton width="100%" height={200} borderRadius={12} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item, index }) => (
            <AnimatedPostItem item={item} index={index} onLike={handleLike} />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366f1"
              colors={['#6366f1']}
            />
          }
          ListEmptyComponent={
            <FadeInView>
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📝</Text>
                <Text style={styles.emptyTitle}>No Posts Yet</Text>
                <Text style={styles.emptySubtitle}>Be the first to share something!</Text>
              </View>
            </FadeInView>
          }
        />
      )}

      <Modal visible={showCreatePost} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleCloseModal}
          >
            <Animated.View style={[styles.modalContent, modalAnimatedStyle]}>
              <TouchableOpacity activeOpacity={1}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Create Post</Text>
                  <TouchableOpacity onPress={handleCloseModal}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.postInput}
                  placeholder="What's on your mind?"
                  placeholderTextColor="#9ca3af"
                  multiline
                  value={newPostContent}
                  onChangeText={setNewPostContent}
                  autoFocus
                />

                <AnimatedButton
                  title="Post"
                  onPress={createPost}
                  disabled={newPostContent.trim() === ''}
                  style={styles.postButton}
                />
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  postCard: {
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  authorAvatarPlaceholder: {
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 13,
    color: '#6b7280',
  },
  postContent: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    fontSize: 20,
    color: '#6b7280',
  },
  actionIconLiked: {
    color: '#ef4444',
  },
  actionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalClose: {
    fontSize: 28,
    color: '#6b7280',
    fontWeight: '300',
  },
  postInput: {
    height: 150,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'top',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  postButton: {
    width: '100%',
  },
  loadingContainer: {
    padding: 16,
  },
  skeletonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  skeletonHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
});
