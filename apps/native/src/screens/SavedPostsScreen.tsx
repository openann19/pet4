import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AnimatedButton } from '../components/AnimatedButton';
import { AnimatedCard } from '../components/AnimatedCard';
import { FadeInView } from '../components/FadeInView';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useStorage } from '../hooks/useStorage';
import type { Post } from '../types';
import { communityApi } from '../utils/api-client';
import { createLogger } from '../utils/logger';

const logger = createLogger('SavedPostsScreen');

export default function SavedPostsScreen() {
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storedSavedPostIds, setStoredSavedPostIds] = useStorage<string[]>('savedPostIds', []);

  useEffect(() => {
    loadSavedPosts();
  }, [storedSavedPostIds]);

  const loadSavedPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      if (storedSavedPostIds.length === 0) {
        setSavedPosts([]);
        setLoading(false);
        return;
      }

      // Fetch posts by saved IDs from API
      const posts: Post[] = [];
      for (const postId of storedSavedPostIds) {
        try {
          const postData = await communityApi.getPostById(postId);
          posts.push({
            id: postData.id,
            userId: postData.authorId,
            userName: postData.authorName,
            userAvatar: postData.authorAvatar,
            content: postData.content,
            imageUrl: postData.images?.[0],
            timestamp: new Date(postData.timestamp).getTime(),
            likes: postData.likes,
            comments: postData.comments,
            shares: postData.shares,
            liked: false,
          });
        } catch (err) {
          logger.warn('Failed to fetch post', { postId, error: err });
        }
      }

      setSavedPosts(posts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load saved posts';
      logger.error(
        'Failed to load saved posts',
        err instanceof Error ? err : new Error(String(err))
      );
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const unsavePost = (postId: string) => {
    setSavedPosts(savedPosts.filter((p) => p.id !== postId));
    setStoredSavedPostIds(storedSavedPostIds.filter((id) => id !== postId));
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📖 Saved Posts</Text>
        </View>
        <View style={styles.content}>
          <LoadingSkeleton height={200} />
          <LoadingSkeleton height={200} style={{ marginTop: 16 }} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📖 Saved Posts</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadSavedPosts} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📖 Saved Posts</Text>
        <Text style={styles.subtitle}>{savedPosts.length} saved posts</Text>
      </View>

      <ScrollView style={styles.postsList} showsVerticalScrollIndicator={false}>
        {savedPosts.map((post, index) => (
          <FadeInView key={post.id} delay={100 + index * 50}>
            <AnimatedCard style={styles.postCard}>
              <View style={styles.postHeader}>
                <Image source={{ uri: post.userAvatar }} style={styles.avatar} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{post.userName}</Text>
                  <Text style={styles.postTime}>{formatTime(post.timestamp)}</Text>
                </View>
                <TouchableOpacity onPress={() => unsavePost(post.id)}>
                  <Text style={styles.unsaveButton}>✓ Saved</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.postContent}>{post.content}</Text>

              {post.imageUrl && (
                <Image
                  source={{ uri: post.imageUrl }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.postStats}>
                <View style={styles.stat}>
                  <Text style={styles.statIcon}>❤️</Text>
                  <Text style={styles.statText}>{post.likes}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statIcon}>💬</Text>
                  <Text style={styles.statText}>{post.comments}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statIcon}>🔄</Text>
                  <Text style={styles.statText}>{post.shares}</Text>
                </View>
              </View>

              <View style={styles.postActions}>
                <AnimatedButton style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>{post.liked ? '❤️' : '🤍'} Like</Text>
                </AnimatedButton>
                <AnimatedButton style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>💬 Comment</Text>
                </AnimatedButton>
                <AnimatedButton style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>🔄 Share</Text>
                </AnimatedButton>
              </View>
            </AnimatedCard>
          </FadeInView>
        ))}

        {savedPosts.length === 0 && (
          <FadeInView delay={100}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={styles.emptyTitle}>No saved posts yet</Text>
              <Text style={styles.emptyText}>Save posts from the community to see them here</Text>
              <AnimatedButton style={styles.exploreButton}>
                <Text style={styles.exploreButtonText}>Explore Community</Text>
              </AnimatedButton>
            </View>
          </FadeInView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  postsList: {
    flex: 1,
  },
  postCard: {
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  postTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unsaveButton: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 16,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  postActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  exploreButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: '#6366f1',
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#6366f1',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
