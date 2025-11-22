import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { VirtualList } from '@/components/virtual';
import { RankingSkeleton } from '@/components/community/RankingSkeleton';
import { PostCard } from '@/components/community/PostCard';
import type { Post } from '@/lib/community-types';
import { haptics } from '@/lib/haptics';
import { Sparkle, Fire, TrendUp, Plus } from '@phosphor-icons/react';

interface FeedSectionProps {
    readonly feedTab: 'for-you' | 'following';
    readonly onFeedTabChange: (value: string) => void;
    readonly onCreatePost: () => void;
    readonly posts: readonly Post[];
    readonly loading: boolean;
    readonly hasMore: boolean;
    readonly loadMore: (more: boolean) => void;
    readonly trendingTags: readonly string[];
    readonly labels: {
        readonly trending: string;
        readonly forYou: string;
        readonly following: string;
        readonly noPosts: string;
        readonly noFollowingPosts: string;
        readonly noPostsDesc: string;
        readonly createPost: string;
        readonly loading: string;
        readonly endOfFeed: string;
    };
}

const TrendingTagsBlock = memo(function TrendingTagsBlock({ tags, label }: { tags: readonly string[]; label: string }) {
    if (tags.length === 0) return null;
    return (
        <div className="bg-linear-to-br from-card via-card to-card/50 rounded-xl p-4 border border-border/50 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
                <TrendUp size={20} className="text-accent" weight="bold" />
                <h3 className="font-semibold text-foreground">{label}</h3>
                <Fire size={16} className="text-destructive ml-auto" weight="fill" />
            </div>
            <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => haptics.selection()}>
                        #{tag}
                    </Badge>
                ))}
            </div>
        </div>
    );
});

const EmptyState = memo(function EmptyState({ feedTab, labels, onCreatePost }: { feedTab: 'for-you' | 'following'; labels: FeedSectionProps['labels']; onCreatePost: () => void }) {
    return (
        <div className="text-center py-20">
            <div className="text-8xl mb-6">🐾</div>
            <h3 className="text-2xl font-bold text-foreground mb-2">{labels.noPosts}</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                {feedTab === 'following' ? labels.noFollowingPosts : labels.noPostsDesc}
            </p>
            <Button size="lg" className="gap-2 shadow-lg" onClick={onCreatePost}>
                <Plus size={20} weight="bold" />
                {labels.createPost}
            </Button>
        </div>
    );
});

export const CommunityFeedSection = memo(function CommunityFeedSection({
    feedTab,
    onFeedTabChange,
    onCreatePost,
    posts,
    loading,
    hasMore,
    loadMore,
    trendingTags,
    labels,
}: FeedSectionProps) {

    return (
        <div className="space-y-6">
            <TrendingTagsBlock tags={trendingTags} label={labels.trending} />
            <Tabs value={feedTab} onValueChange={onFeedTabChange}>
                <TabsList className="grid w-full grid-cols-2 bg-card shadow-md max-w-md mx-auto">
                    <TabsTrigger value="for-you" className="gap-2">
                        <Sparkle size={18} weight={feedTab === 'for-you' ? 'fill' : 'regular'} />
                        {labels.forYou}
                    </TabsTrigger>
                    <TabsTrigger value="following" className="gap-2">
                        <Fire size={18} weight={feedTab === 'following' ? 'fill' : 'regular'} />
                        {labels.following}
                    </TabsTrigger>
                </TabsList>
                <TabsContent value={feedTab} className="mt-6 space-y-4 max-w-3xl mx-auto">
                    {loading && posts.length === 0 ? (
                        <RankingSkeleton count={3} variant="post" />
                    ) : posts.length === 0 ? (
                        <EmptyState feedTab={feedTab} labels={labels} onCreatePost={onCreatePost} />
                    ) : (
                        <>
                            <VirtualList
                                items={[...posts] as Post[]}
                                renderItem={(post: Post) => <PostCard post={post} />}
                                estimateSize={() => 400}
                                overscan={3}
                                containerClassName="space-y-4"
                                onEndReached={() => { if (hasMore && !loading) void loadMore(true); }}
                                endReachedThreshold={300}
                                keyExtractor={(p: Post) => p.id}
                            />
                            {loading && posts.length > 0 && (
                                <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
                                    <Sparkle size={20} className="animate-spin" />
                                    <span className="text-sm">{labels.loading}</span>
                                </div>
                            )}
                            {!hasMore && posts.length > 0 && (
                                <div className="text-center text-muted-foreground text-sm py-8">{labels.endOfFeed}</div>
                            )}
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
});
