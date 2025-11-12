import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { communityService } from '@/lib/community-service';
import type { Comment } from '@/lib/community-types';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import { ArrowBendUpLeft, DotsThree, Heart, PaperPlaneRight, X } from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { Presence, motion, MotionView } from '@petspark/motion';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const logger = createLogger('CommentsSheet');

function EmptyCommentsView({ t }: { t: ReturnType<typeof useApp>['t'] }) {
  const entry = useEntryAnimation({ initialY: 20, initialOpacity: 0 })
  const scale = useSharedValue(1)

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    )
  }, [scale])

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  })) as AnimatedStyle

  return (
    <AnimatedView
      style={entry.animatedStyle}
      className="text-center py-16"
    >
      <AnimatedView
        style={pulseStyle}
        className="text-6xl mb-4"
      >
        💬
      </AnimatedView>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {t.community?.noComments || 'No comments yet'}
      </h3>
      <p className="text-sm text-muted-foreground">
        {t.community?.beFirst || 'Be the first to share your thoughts!'}
      </p>
    </AnimatedView>
  )
}

function CommentListItem({
  comment,
  index,
  onReply,
  isAuthor,
  replies,
  postAuthor
}: {
  comment: Comment
  index: number
  onReply: (comment: Comment) => void
  isAuthor: boolean
  replies: Comment[]
  postAuthor: string
}) {
  const entry = useEntryAnimation({
    initialY: 20,
    initialOpacity: 0,
    delay: index * 50
  })

  return (
    <AnimatedView style={entry.animatedStyle}>
      <CommentItem 
        comment={comment}
        onReply={onReply}
        isAuthor={isAuthor}
      />
      
      {replies.length > 0 && (
        <div className="ml-12 mt-4 space-y-4 pl-4 border-l-2 border-border/50">
          {replies.map(reply => {
            const replyId = reply._id ?? reply.id
            return (
              <CommentItem
                key={replyId}
                comment={reply}
                onReply={onReply}
                isReply
                isAuthor={reply.authorName === postAuthor}
              />
            )
          })}
        </div>
      )}
    </AnimatedView>
  )
}

interface CommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postAuthor: string;
}

export function CommentsSheet({ open, onOpenChange, postId, postAuthor }: CommentsSheetProps) {
  const { t } = useApp();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      loadComments();
    } else {
      setCommentText('');
      setReplyingTo(null);
    }
  }, [open, postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const response = await communityService.getComments(postId);
      setComments(response);
    } catch (error) {
      logger.error(
        'Failed to load comments',
        error instanceof Error ? error : new Error(String(error))
      );
      toast.error(t.community?.commentsLoadError || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!commentText.trim() || submitting) return;

    haptics.impact();
    setSubmitting(true);

    try {
      const commentData: Parameters<typeof communityService.addComment>[1] = {
        text: commentText.trim(),
      };
      const parentId = replyingTo?._id ?? replyingTo?.id;
      if (parentId) {
        commentData.parentId = parentId;
      }
      const newComment = await communityService.addComment(postId, commentData);

      setComments((currentComments) =>
        replyingTo
          ? [...(currentComments || []), newComment]
          : [newComment, ...(currentComments || [])]
      );

      setCommentText('');
      setReplyingTo(null);

      haptics.success();
      toast.success(t.community?.commentPosted || 'Comment posted!');

      setTimeout(() => {
        scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      logger.error(
        'Failed to post comment',
        error instanceof Error ? error : new Error(String(error))
      );
      toast.error(t.community?.commentError || 'Failed to post comment');
      haptics.error();
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
    textareaRef.current?.focus();
    haptics.selection();
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    haptics.selection();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const topLevelComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  // Helper function to extract comment ID
  const getCommentId = (comment: Comment): string | null => {
    return comment._id ?? comment.id ?? null;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl">{t.community?.comments || 'Comments'}</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground mt-1">
                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { onOpenChange(false); }}
              className="rounded-full"
            >
              <X size={24} />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea ref={scrollAreaRef} className="flex-1 px-6">
          <div className="py-4 space-y-6">
            {loading && comments.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </div>
                </div>
              ))
            ) : comments.length === 0 ? (
              <MotionView
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <MotionView
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="text-6xl mb-4"
                >
                  💬
                </MotionView>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t.community?.noComments || 'No comments yet'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t.community?.beFirst || 'Be the first to share your thoughts!'}
                </p>
              </MotionView>
            ) : (
              <Presence visible={topLevelComments.length > 0}>
                {topLevelComments.map((comment, index) => {
                  const commentId = getCommentId(comment);
                  if (!commentId) return null;
                  return (
                    <CommentThread
                      key={commentId}
                      comment={comment}
                      index={index}
                      postAuthor={postAuthor}
                      getReplies={getReplies}
                      onReply={handleReply}
                      getCommentId={getCommentId}
                    />
                  );
                })}
              </Presence>
            )}
          </div>
        </ScrollArea>

        <div className="shrink-0 border-t border-border bg-card/50 backdrop-blur-xl">
          <Presence visible={!!replyingTo}>
            {replyingTo && (
              <MotionView
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-6 py-3 bg-muted/50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <ArrowBendUpLeft size={16} className="text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {t.community?.replyingTo || 'Replying to'}
                    </span>
                    <span className="font-medium text-foreground">@{replyingTo.authorName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelReply}
                    className="h-7 text-xs"
                  >
                    {t.common?.cancel || 'Cancel'}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelReply}
                  className="h-7 text-xs"
                >
                  {t.common?.cancel || 'Cancel'}
                </Button>
              </div>
            </AnimatedView>
          )}

          <div className="px-6 py-4">
            <div className="flex gap-3 items-end">
              <Textarea
                ref={textareaRef}
                value={commentText}
                onChange={(e) => { setCommentText(e.target.value); }}
                onKeyDown={handleKeyDown}
                placeholder={
                  replyingTo
                    ? t.community?.replyPlaceholder || 'Write a reply...'
                    : t.community?.commentPlaceholder || 'Write a comment...'
                }
                className="min-h-11 max-h-30 resize-none"
                maxLength={500}
              />
              <Button
                onClick={handleSubmit}
                disabled={!commentText.trim() || submitting}
                size="icon"
                className="h-11 w-11 shrink-0"
              >
                {submitting ? (
                  <MotionView
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <PaperPlaneRight size={20} weight="bold" />
                  </MotionView>
                ) : (
                  <PaperPlaneRight size={20} weight="bold" />
                )}
              </Button>
            </div>
            {commentText.length > 0 && (
              <CharacterCount count={commentText.length} />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface CommentThreadProps {
  comment: Comment;
  index: number;
  postAuthor: string;
  getReplies: (parentId: string) => Comment[];
  onReply: (comment: Comment) => void;
  getCommentId: (comment: Comment) => string | null;
}

function CommentThread({
  comment,
  index,
  postAuthor,
  getReplies,
  onReply,
  getCommentId,
}: CommentThreadProps): React.ReactElement {
  const commentId = getCommentId(comment);
  if (!commentId) {
    return <></>;
  }

  const replies = getReplies(commentId);

  return (
    <MotionView
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <CommentItem
        comment={comment}
        onReply={onReply}
        isAuthor={comment.authorName === postAuthor}
      />

      {replies.length > 0 && (
        <div className="ml-12 mt-4 space-y-4 pl-4 border-l-2 border-border/50">
          {replies.map((reply) => {
            const replyId = getCommentId(reply);
            if (!replyId) return null;
            return (
              <CommentItem
                key={replyId}
                comment={reply}
                onReply={onReply}
                isReply
                isAuthor={reply.authorName === postAuthor}
              />
            );
          })}
        </div>
      )}
    </MotionView>
  );
}

interface CommentItemProps {
  comment: Comment;
  onReply: (comment: Comment) => void;
  isReply?: boolean;
  isAuthor?: boolean;
}

function RotatingIcon() {
  const rotate = useSharedValue(0)

  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      -1,
      false
    )
  }, [rotate])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${String(rotate.value)}deg` }]
  })) as AnimatedStyle

  return (
    <AnimatedView style={animatedStyle}>
      <PaperPlaneRight size={20} weight="bold" />
    </AnimatedView>
  )
}

function CharacterCount({ count }: { count: number }) {
  const opacity = useSharedValue(0)

  useEffect(() => {
    opacity.value = withTiming(1, timingConfigs.fast)
  }, [opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  })) as AnimatedStyle

  return (
    <AnimatedView
      style={animatedStyle}
      className="text-xs text-muted-foreground mt-2 text-right"
    >
      {count}/500
    </AnimatedView>
  )
}

function CommentItem({ comment, onReply, isReply = false, isAuthor = false }: CommentItemProps) {
  const { t } = useApp();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.reactionsCount ?? 0);

  const handleLike = async () => {
    haptics.selection();

    if (isLiked) {
      setIsLiked(false);
      setLikesCount((prev: number) => Math.max(0, prev - 1));
    } else {
      setIsLiked(true);
      setLikesCount((prev: number) => prev + 1);
      haptics.success();
    }
  };

  return (
    <div className="flex gap-3 group">
      <Avatar className="h-10 w-10 shrink-0">
        {comment.authorAvatar ? (
          <img src={comment.authorAvatar} alt={comment.authorName} className="object-cover" />
        ) : (
          <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
            {comment.authorName?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="bg-muted/50 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-foreground">{comment.authorName}</span>
            {isAuthor && (
              <span className="text-xs px-1.5 py-0.5 bg-primary/15 text-primary font-medium rounded">
                {t.community?.author || 'Author'}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap wrap-break-word">
            {comment.text}
          </p>
        </div>

        <div className="flex items-center gap-4 mt-2 ml-4">
          <button onClick={handleLike} className="flex items-center gap-1 group/like focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--color-focus-ring)" aria-label="Button">
            <MotionView whileTap={{ scale: 0.85 }}>
              <Heart
                size={16}
                weight={isLiked ? 'fill' : 'regular'}
                className={`transition-colors ${
                  String(isLiked ? 'text-red-500' : 'text-muted-foreground group-hover/like:text-red-500')
                }`}
              />
            </AnimatedView>
            {likesCount > 0 && (
              <span className="text-xs font-medium text-muted-foreground">{likesCount}</span>
            )}
          </button>

          {!isReply && (
            <button
              onClick={() => { onReply(comment); }}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.community?.reply || 'Reply'}
            </button>
          )}

          <button className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--color-focus-ring)" aria-label="Button">
            <DotsThree size={16} weight="bold" className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
