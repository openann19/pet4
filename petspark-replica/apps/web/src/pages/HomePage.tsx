import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserAvatar } from '@/components/ui/Avatar';
import { Heart, MessageCircle, Share2, Camera } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

// Mock data for demonstration
const mockPosts = [
  {
    id: '1',
    author: {
      id: '1',
      displayName: 'Sarah Johnson',
      username: 'sarahj',
      avatar: '',
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
      avatar: '',
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
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Create Post */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <UserAvatar user={{
              id: 'current-user',
              displayName: 'John Doe',
              username: 'johndoe',
              email: 'john@example.com',
            }} size="md" />
            <div className="flex-1">
              <input
                type="text"
                placeholder="Share what your pet is up to..."
                className="w-full rounded-full border border-border bg-muted px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button variant="outline" size="sm">
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        {mockPosts.map((post) => (
          <Card key={post.id}>
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
                <Button variant="ghost" size="sm">
                  ⋯
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <p className="text-sm">{post.content}</p>
              
              {post.images.length > 0 && (
                <div className="aspect-square rounded-lg bg-muted" />
              )}
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="sm" className={post.isLiked ? 'text-red-500' : ''}>
                    <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                    {post.likeCount}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-4 w-4" />
                    {post.commentCount}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4" />
                    {post.shareCount}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}