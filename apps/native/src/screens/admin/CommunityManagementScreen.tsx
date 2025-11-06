/**
 * Community Management Screen (Mobile)
 * 
 * Mobile admin screen for moderating community posts and comments.
 */

import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedCard } from '../components/AnimatedCard';
import { FadeInView } from '../components/FadeInView';

interface CommunityPost {
  id: string;
  authorName: string;
  content: string;
  status: 'active' | 'flagged' | 'hidden' | 'deleted';
  createdAt: string;
  likesCount: number;
  commentsCount: number;
}

export const CommunityManagementScreen: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'flagged' | 'hidden'>('all');

  useEffect(() => {
    loadPosts();
  }, [filter]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const data = await adminApi.getCommunityPosts(filter);
      // setPosts(data);
      setPosts([]);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (postId: string, action: 'approve' | 'hide' | 'delete') => {
    try {
      // TODO: Implement moderation API call
      // await adminApi.moderatePost(postId, action);
      await loadPosts();
    } catch (error) {
      console.error('Failed to moderate post:', error);
    }
  };

  const filteredPosts = posts.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FadeInView delay={0}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community Posts</Text>
          <Text style={styles.headerSubtitle}>Moderate community content</Text>
        </View>
      </FadeInView>

      <View style={styles.filterContainer}>
        {(['all', 'active', 'flagged', 'hidden'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No posts found</Text>
          </View>
        ) : (
          filteredPosts.map((post, index) => (
            <FadeInView key={post.id} delay={index * 50}>
              <AnimatedCard style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Text style={styles.authorName}>{post.authorName}</Text>
                  <Text style={styles.postDate}>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.postContent} numberOfLines={3}>
                  {post.content}
                </Text>
                <View style={styles.postStats}>
                  <Text style={styles.statText}>{post.likesCount} likes</Text>
                  <Text style={styles.statText}>{post.commentsCount} comments</Text>
                </View>
                {post.status === 'flagged' && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleModerate(post.id, 'approve')}
                    >
                      <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.hideButton]}
                      onPress={() => handleModerate(post.id, 'hide')}
                    >
                      <Text style={styles.hideText}>Hide</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleModerate(post.id, 'delete')}
                    >
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </AnimatedCard>
            </FadeInView>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
  },
  filterTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: '#6366f1',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  postCard: {
    marginBottom: 12,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  postDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  postContent: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#22c55e',
  },
  hideButton: {
    backgroundColor: '#f59e0b',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  approveText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  hideText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

