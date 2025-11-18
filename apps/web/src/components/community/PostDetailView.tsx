'use client';

import { communityAPI } from '@/api/community-api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { communityService } from '@/lib/community-service';
import type { Comment, Post } from '@/lib/community-types';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import { userService } from '@/lib/user-service';
import {
  ArrowLeft,
  BookmarkSimple,
  ChatCircle,
  Flag,
  Heart,
  MapPin,
  Share,
  Tag,
} from '@phosphor-icons/react';
import { isTruthy } from '@petspark/shared';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Suspense } from 'react';
import { MediaViewer } from '@/components/lazy-exports';
import { ReportDialog } from './ReportDialog';
import { ProgressiveImage } from '@/components/enhanced/ProgressiveImage';

const logger = createLogger('PostDetailView');

interface PostDetailViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  onAuthorClick?: (authorId: string) => void;
}

export function PostDetailView({ open, onOpenChange, postId, onAuthorClick }: PostDetailViewProps) {
  const { t } = useApp();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [mediaViewerIndex, setMediaViewerIndex] = useState(0);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && postId) {
      void loadPost();
      void loadComments();
    } else {
      setPost(null);
      setComments([]);
      setCommentText('');
    }
  }, [open, postId]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const loadedPost = await communityAPI.getPostById(postId);
      if (loadedPost) {
        setPost(loadedPost);
        setLikesCount(loadedPost.reactionsCount ?? 0);
        // Check if user has reacted/saved by fetching current state
        userService
          .user()
          .then((user) => {
            const userId = user?.id;
            if (userId) {
              // Check if post is saved
              communityService
                .isPostSaved(postId)
                .then((saved) => setIsSaved(saved))
                .catch(() => setIsSaved(false));

              // Note: User reaction state will be updated when user interacts with the post
              // For initial load, default to false as we don't have reaction list in Post type
              setIsLiked(false);
            } else {
              // No user logged in, default to false
              setIsLiked(false);
              setIsSaved(false);
            }
          })
          .catch(() => {
            // If user fetch fails, default to false
            setIsLiked(false);
            setIsSaved(false);
          });
      } else {
        toast.error('Post not found');
        onOpenChange(false);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load post', err, { postId });
      toast.error('Failed to load post');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const response = await communityService.getComments(postId);
      setComments(response);

      // Scroll to bottom after loading
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load comments', err, { postId });
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;

    haptics.impact('light');

    try {
      const user = await userService.user();
      if (!user) {
        toast.error('You must be logged in to react');
        return;
      }

      const userId = typeof user.id === 'string' ? user.id : '';
      const userName = typeof user.name === 'string' ? user.name : 'User';
      const result = await communityAPI.toggleReaction(
        post.id,
        userId,
        userName,
        typeof user.avatarUrl === 'string' ? user.avatarUrl : undefined,
        '❤️'
      );

      setIsLiked(result.added);
      setLikesCount(result.reactionsCount);

      if (result.added) {
        haptics.impact('medium');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to toggle reaction', err);
      toast.error('Failed to react to post');
    }
  };

  const handleSave = async () => {
    if (!post) return;

    haptics.impact('light');

    try {
      if (isSaved) {
        await communityService.unsavePost(post.id);
        setIsSaved(false);
        toast.success(t.community?.unsaved ?? 'Post removed from saved');
      } else {
        await communityService.savePost(post.id);
        setIsSaved(true);
        toast.success(t.community?.saved ?? 'Post saved');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to save post', err);
      toast.error('Failed to save post');
    }
  };

  const handleShare = async () => {
    if (!post) return;

    haptics.impact('light');

    try {
      if (isTruthy(navigator.share)) {
        await navigator.share({
          title: `Post by ${String(post.authorName ?? '')}`,
          ...(post.text ? { text: post.text } : {}),
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch (_error) {
      // User cancelled share
    }
  };

  const handleSubmitComment = async () => {
    if (!post || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const user = await userService.user();
      if (!user) {
        toast.error('You must be logged in to comment');
        return;
      }

      const userId = typeof user.id === 'string' ? user.id : '';
      const userName = typeof user.name === 'string' ? user.name : 'User';
      const commentData: Parameters<typeof communityAPI.createComment>[0] = {
        postId: post.id,
        text: commentText.trim(),
        authorId: userId,
        authorName: userName,
      };
      const avatarUrl = typeof user.avatarUrl === 'string' ? user.avatarUrl : undefined;
      if (avatarUrl !== undefined) {
        commentData.authorAvatar = avatarUrl;
      }
      await communityAPI.createComment(commentData);

      setCommentText('');
      await loadComments();
      haptics.impact('medium');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to submit comment', err);
      toast.error('Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getTopLevelComments = (): Comment[] => {
    return comments.filter((c) => !c.parentCommentId && !c.parentId);
  };

  const getReplies = (commentId: string): Comment[] => {
    return comments.filter((c) => (c.parentCommentId ?? c.parentId) === commentId);
  };

  if (!open) return null;

  const allMedia = (post?.media ?? []).map((media, index) => {
    if (typeof media === 'string') {
      return { id: `media-${index}`, url: media, type: 'photo' as const };
    }
    return media;
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : post ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { onOpenChange(false); }}
                  className="rounded-full"
                  aria-label="Close post details"
                >
                  <ArrowLeft size={20} />
                </Button>
                <h2 className="text-lg font-semibold">Post Details</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setShowReportDialog(true); }}
                  className="rounded-full"
                  aria-label="Report post"
                >
                  <Flag size={20} />
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  {/* Post Header */}
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={post.authorAvatar} alt={post.authorName} />
                      <AvatarFallback>{post.authorName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <button
                        onClick={() => onAuthorClick?.(post.authorId)}
                        className="font-semibold hover:underline"
                      >
                        {post.authorName}
                      </button>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* Post Text */}
                  {post.text && (
                    <p className="text-base leading-relaxed whitespace-pre-wrap">{post.text}</p>
                  )}

                  {/* Post Media */}
                  {allMedia.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {allMedia.map((media, index) => {
                        const url = typeof media === 'string' ? media : media.url;
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              setMediaViewerIndex(index);
                              setShowMediaViewer(true);
                            }}
                            className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                          >
                              <ProgressiveImage
                                src={url}
                                alt={`Post media ${String(index + 1)}`}
                                className="w-full h-full object-cover"
                                aria-label={`Post media ${index + 1}`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Tags and Location */}
                  {((post.tags && post.tags.length > 0) || post.location) && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag size={12} className="mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {post.location && (
                        <Badge variant="outline" className="text-xs">
                          <MapPin size={12} className="mr-1" />
                          {post.location.city}, {post.location.country}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 py-4 border-t border-b">
                    <button
                      onClick={() => void handleLike()}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      <Heart
                        size={24}
                        weight={isLiked ? 'fill' : 'regular'}
                        className={isLiked ? 'text-red-500' : ''}
                      />
                      <span className="text-sm font-medium">{likesCount}</span>
                    </button>
                    <button
                      onClick={() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      <ChatCircle size={24} />
                      <span className="text-sm font-medium">{comments.length}</span>
                    </button>
                    <button onClick={() => void handleSave()} className="hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--color-focus-ring)" aria-label="Button">
                      <BookmarkSimple
                        size={24}
                        weight={isSaved ? 'fill' : 'regular'}
                        className={isSaved ? 'text-primary' : ''}
                      />
                    </button>
                    <button onClick={() => void handleShare()} className="hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--color-focus-ring)" aria-label="Button">
                      <Share size={24} />
                    </button>
                  </div>

                  {/* Comments Section */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Comments ({comments.length})</h3>

                    {commentsLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No comments yet. Be the first to comment!
                      </p>
                    ) : (
                      <div className="space-y-6">
                        {getTopLevelComments().map((comment) => {
                          const commentId = comment._id ?? comment.id;
                          const replies = getReplies(commentId);
                          return (
                            <div key={commentId} className="space-y-4">
                              <div className="flex gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage
                                    src={comment.authorAvatar}
                                    alt={comment.authorName}
                                  />
                                  <AvatarFallback>
                                    {comment.authorName.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="bg-muted rounded-lg p-3">
                                    <p className="font-semibold text-sm">{comment.authorName}</p>
                                    <p className="text-sm mt-1">{comment.text}</p>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(comment.createdAt), {
                                      addSuffix: true,
                                    })}
                                  </p>
                                </div>
                              </div>

                              {replies.length > 0 && (
                                <div className="ml-12 space-y-4 pl-4 border-l-2 border-border/50">
                                  {replies.map((reply) => {
                                    const replyId = reply._id ?? reply.id;
                                    return (
                                      <div key={replyId} className="flex gap-3">
                                        <Avatar className="w-8 h-8">
                                          <AvatarImage
                                            src={reply.authorAvatar}
                                            alt={reply.authorName}
                                          />
                                          <AvatarFallback>
                                            {reply.authorName.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                          <div className="bg-muted/50 rounded-lg p-2">
                                            <p className="font-semibold text-xs">
                                              {reply.authorName}
                                            </p>
                                            <p className="text-sm mt-1">{reply.text}</p>
                                          </div>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(reply.createdAt), {
                                              addSuffix: true,
                                            })}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <div ref={commentsEndRef} />
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>

              {/* Comment Input */}
              <div className="p-4 border-t bg-background">
                <div className="flex gap-2">
                  <Textarea
                    value={commentText}
                    onChange={(e) => { setCommentText(e.target.value); }}
                    placeholder="Add a comment..."
                    rows={2}
                    className="resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        void handleSubmitComment();
                      }
                    }}
                  />
                  <Button
                    onClick={() => void handleSubmitComment()}
                    disabled={!commentText.trim() || submittingComment}
                    className="self-end"
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {showMediaViewer && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>}>
          <MediaViewer
            open={showMediaViewer}
            onOpenChange={setShowMediaViewer}
            media={allMedia}
            initialIndex={mediaViewerIndex}
            authorName={post?.authorName ?? ''}
          />
        </Suspense>
      )}

      {post && (
        <ReportDialog
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          resourceType="post"
          resourceId={post.id}
          resourceName={`Post by ${String(post.authorName ?? '')}`}
          onReported={() => {
            toast.success('Report submitted. Thank you for helping keep our community safe.');
          }}
        />
      )}
    </>
  );
}
