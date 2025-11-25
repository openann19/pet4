import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserAvatar } from '@/components/ui/Avatar';
import { StoriesBar } from '@/components/stories/StoriesBar';
import { Heart, MessageCircle, Share2, Camera } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { Story } from '@petspark/shared';

// Mock data for demonstration
const mockStories: readonly Story[] = [
  {
    id: '1',
    userId: '1',
    petId: '1',
    petName: 'Max',
    petPhoto: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&h=150&fit=crop&crop=face',
    content: 'Max had a great day at the park today! 🐕',
    views: [],
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    isExpired: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '2',
    userId: '2',
    petId: '2',
    petName: 'Luna',
    petPhoto: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&h=150&fit=crop&crop=face',
    content: 'Luna discovered the perfect sunbeam ☀️',
    views: [],
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    isExpired: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
];

const mockPosts = [
  {
    id: '1',
    author: {
      id: '1',
      displayName: 'Sarah Johnson',
      username: 'sarahj',
      email: 'sarah@example.com',
      avatar: '',
      verified: false,
      premium: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    pet: {
      id: '1',
      name: 'Max',
      type: 'Dog',
      breed: 'Golden Retriever',
      images: [''],
    },
    content: 'Max had a great day at the park today! 🐕',
    images: [],
    likeCount: 42,
    commentCount: 8,
    shareCount: 3,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isLiked: false,
  },
  {
    id: '2',
    author: {
      id: '2',
      displayName: 'Mike Chen',
      username: 'mikec',
      email: 'mike@example.com',
      avatar: '',
      verified: false,
      premium: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    pet: {
      id: '2',
      name: 'Luna',
      type: 'Cat',
      breed: 'Persian',
      images: [''],
    },
    content: 'Luna discovered the perfect sunbeam ☀️',
    images: [],
    likeCount: 28,
    commentCount: 5,
    shareCount: 1,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    isLiked: true,
  },
];

export function HomePage() {
  const handleStoryRingPress = (_stories: readonly Story[]) => {
    // TODO: Implement story viewer modal
    // This should open a modal to view the selected stories
  };

  return (
    <motion.div
      className="mx-auto max-w-2xl space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Stories Bar */}
      <StoriesBar
        allStories={mockStories}
        currentUserId="current-user"
        currentUserName="John Doe"
        currentUserPetId="pet-1"
        currentUserPetName="Buddy"
        currentUserPetPhoto="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=150&h=150&fit=crop&crop=face"
        onStoryRingPress={handleStoryRingPress}
      />

      {/* Create Post */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <UserAvatar user={{
                id: 'current-user',
                displayName: 'John Doe',
                username: 'johndoe',
                email: 'john@example.com',
                verified: false,
                premium: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              }} size="md" />
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Share what your pet is up to..."
                  className="w-full border-none bg-muted shadow-none focus-visible:ring-0"
                />
              </div>
              <Button variant="outline" size="sm">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Posts Feed */}
      <div className="space-y-4">
        <AnimatePresence>
          {mockPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              layout
            >
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <UserAvatar user={post.author} size="md" />
                      <div>
                        <CardTitle className="text-base">{post.author.displayName}</CardTitle>
                        <CardDescription className="text-xs">
                          {post.pet.name} • {formatDateTime(post.createdAt)}
                        </CardDescription>
                      </div>
                    </div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="ghost" size="sm">
                        ⋯
                      </Button>
                    </motion.div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <motion.p
                    className="text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {post.content}
                  </motion.p>

                  {post.images.length > 0 && (
                    <motion.div
                      className="aspect-square rounded-lg bg-muted"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                    />
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-4">
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={post.isLiked ? 'text-red-500' : ''}
                        >
                          <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                          {post.likeCount}
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="h-4 w-4" />
                          {post.commentCount}
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4" />
                          {post.shareCount}
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
