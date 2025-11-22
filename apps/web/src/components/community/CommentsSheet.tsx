'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactElement } from 'react'
import { ArrowBendUpLeft, DotsThree, Heart, PaperPlaneRight, X } from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'
import { MotionView, Presence } from '@petspark/motion'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useApp } from '@/contexts/AppContext'
import { communityService } from '@/lib/community-service'
import type { Comment } from '@/lib/community-types'
import { haptics } from '@/lib/haptics'
import { createLogger } from '@/lib/logger'

const logger = createLogger('CommentsSheet')

type Translator = ReturnType<typeof useApp>['t']

interface CommentsSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly postId: string
  readonly postAuthor: string
}

export function CommentsSheet({ open, onOpenChange, postId, postAuthor }: CommentsSheetProps) {
  const { t } = useApp()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const loadComments = useCallback(async () => {
    setLoading(true)
    try {
      const response = await communityService.getComments(postId)
      setComments(response)
    } catch (error) {
      logger.error('Failed to load comments', error instanceof Error ? error : new Error(String(error)))
      toast.error(t.community?.commentsLoadError ?? 'Failed to load comments')
    } finally {
      setLoading(false)
    }
  }, [postId, t.community?.commentsLoadError])

  useEffect(() => {
    if (open) {
      void loadComments()
      return
    }

    setCommentText('')
    setReplyingTo(null)
  }, [loadComments, open])

  const topLevelComments = useMemo(
    () => comments.filter((comment) => !comment.parentId),
    [comments],
  )

  const getReplies = useCallback(
    (parentId: string) => comments.filter((comment) => comment.parentId === parentId),
    [comments],
  )

  const getCommentId = useCallback((comment: Comment): string | null => {
    return comment._id ?? comment.id ?? null
  }, [])

  const handleSubmit = useCallback(async () => {
    const trimmed = commentText.trim()
    if (!trimmed || submitting) {
      return
    }

    setSubmitting(true)
    haptics.impact()

    try {
      const commentPayload: Parameters<typeof communityService.addComment>[1] = {
        text: trimmed,
      }

      const parentId = replyingTo?._id ?? replyingTo?.id
      if (parentId) {
        commentPayload.parentId = parentId
      }

      const newComment = await communityService.addComment(postId, commentPayload)

      setComments((current) => {
        if (replyingTo) {
          return [...current, newComment]
        }
        return [newComment, ...current]
      })

      setCommentText('')
      setReplyingTo(null)

      haptics.success()
      toast.success(t.community?.commentPosted ?? 'Comment posted!')

      window.setTimeout(() => {
        scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      }, 120)
    } catch (error) {
      logger.error('Failed to post comment', error instanceof Error ? error : new Error(String(error)))
      toast.error(t.community?.commentError ?? 'Failed to post comment')
      haptics.error()
    } finally {
      setSubmitting(false)
    }
  }, [commentText, postId, replyingTo, submitting, t.community?.commentError, t.community?.commentPosted])

  const handleReply = useCallback((comment: Comment) => {
    setReplyingTo(comment)
    textareaRef.current?.focus()
    haptics.selection()
  }, [])

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null)
    haptics.selection()
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        void handleSubmit()
      }
    },
    [handleSubmit],
  )

  const commentCountLabel = comments.length === 1 ? 'comment' : 'comments'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[85vh] flex-col gap-0 p-0">
        <SheetHeader className="shrink-0 border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl">{t.community?.comments ?? 'Comments'}</SheetTitle>
              <SheetDescription className="mt-1 text-sm text-muted-foreground">
                {comments.length} {commentCountLabel}
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onOpenChange(false)
              }}
              className="rounded-full"
              aria-label={t.common?.close ?? 'Close comments'}
            >
              <span className="sr-only">{t.common?.close ?? 'Close comments'}</span>
              <X size={24} />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea ref={scrollAreaRef} className="flex-1 px-6">
          <div className="space-y-6 py-4">
            {loading && comments.length === 0 ? (
              <LoadingSkeletons />
            ) : comments.length === 0 ? (
              <EmptyCommentsView
                title={t.community?.noComments ?? 'No comments yet'}
                description={t.community?.beFirst ?? 'Be the first to share your thoughts!'}
              />
            ) : (
              <Presence visible={topLevelComments.length > 0}>
                {topLevelComments.map((comment, index) => {
                  const commentId = getCommentId(comment)
                  if (!commentId) {
                    return null
                  }

                  return (
                    <CommentThread
                      key={commentId}
                      comment={comment}
                      index={index}
                      postAuthor={postAuthor}
                      onReply={handleReply}
                      getReplies={getReplies}
                      getCommentId={getCommentId}
                      translator={t}
                    />
                  )
                })}
              </Presence>
            )}
          </div>
        </ScrollArea>

        <div className="shrink-0 border-t border-border bg-card/50 backdrop-blur-xl">
          <Presence visible={Boolean(replyingTo)}>
            {replyingTo ? (
              <ReplyBanner
                replyingTo={replyingTo}
                onCancel={handleCancelReply}
                translator={t}
              />
            ) : null}
          </Presence>

          <div className="px-6 py-4">
            <div className="flex items-end gap-3">
              <Textarea
                ref={textareaRef}
                value={commentText}
                onChange={(event) => {
                  setCommentText(event.target.value)
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  replyingTo
                    ? t.community?.replyPlaceholder ?? 'Write a reply...'
                    : t.community?.commentPlaceholder ?? 'Write a comment...'
                }
                className="min-h-11 max-h-30 resize-none"
                maxLength={500}
              />
              <Button
                onClick={() => {
                  void handleSubmit()
                }}
                disabled={!commentText.trim() || submitting}
                size="icon"
                className="h-11 w-11 shrink-0"
                aria-label={t.community?.postComment ?? 'Send comment'}
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
            {commentText.length > 0 ? <CharacterCount count={commentText.length} /> : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function LoadingSkeletons() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-3">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyCommentsView({ title, description }: { readonly title: string; readonly description: string }) {
  return (
    <MotionView
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="py-16 text-center"
    >
      <MotionView
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-4 text-6xl"
        aria-hidden
      >
        💬
      </MotionView>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </MotionView>
  )
}

interface CommentThreadProps {
  readonly comment: Comment
  readonly index: number
  readonly postAuthor: string
  readonly onReply: (comment: Comment) => void
  readonly getReplies: (parentId: string) => Comment[]
  readonly getCommentId: (comment: Comment) => string | null
  readonly translator: Translator
}

function CommentThread({
  comment,
  index,
  postAuthor,
  onReply,
  getReplies,
  getCommentId,
  translator,
}: CommentThreadProps): ReactElement | null {
  const commentId = getCommentId(comment)
  if (!commentId) {
    return null
  }

  const replies = getReplies(commentId)

  return (
    <MotionView
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="space-y-4"
    >
      <CommentItem
        comment={comment}
        onReply={onReply}
        isAuthor={comment.authorName === postAuthor}
        translator={translator}
      />

      {replies.length > 0 ? (
        <div className="ml-12 space-y-4 border-l-2 border-border/50 pl-4">
          {replies.map((reply) => {
            const replyId = getCommentId(reply)
            if (!replyId) {
              return null
            }

            return (
              <CommentItem
                key={replyId}
                comment={reply}
                onReply={onReply}
                isReply
                isAuthor={reply.authorName === postAuthor}
                translator={translator}
              />
            )
          })}
        </div>
      ) : null}
    </MotionView>
  )
}

interface CommentItemProps {
  readonly comment: Comment
  readonly onReply: (comment: Comment) => void
  readonly translator: Translator
  readonly isReply?: boolean
  readonly isAuthor?: boolean
}

function CommentItem({ comment, onReply, translator, isReply = false, isAuthor = false }: CommentItemProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(comment.reactionsCount ?? 0)

  const handleLike = useCallback(() => {
    haptics.selection()

    setIsLiked((current) => {
      if (current) {
        setLikesCount((previous) => Math.max(0, previous - 1))
        return false
      }

      setLikesCount((previous) => previous + 1)
      haptics.success()
      return true
    })
  }, [])

  const createdAt = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
  const authorInitial = comment.authorName?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="group flex gap-3">
      <Avatar className="h-10 w-10 shrink-0">
        {comment.authorAvatar ? (
          <img src={comment.authorAvatar} alt={comment.authorName ?? authorInitial} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {authorInitial}
          </div>
        )}
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-muted/50 px-4 py-3">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{comment.authorName}</span>
            {isAuthor ? (
              <span className="rounded bg-primary/15 px-1.5 py-0.5 text-xs font-medium text-primary">
                {translator.community?.author ?? 'Author'}
              </span>
            ) : null}
            <span className="text-xs text-muted-foreground">{createdAt}</span>
          </div>
          <p className="whitespace-pre-wrap break-words text-sm text-foreground">{comment.text}</p>
        </div>

        <div className="mt-2 ml-4 flex items-center gap-4">
          <button
            type="button"
            onClick={handleLike}
            className="group/like flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-ring) focus-visible:ring-offset-2"
            aria-pressed={isLiked}
            aria-label={
              isLiked
                ? translator.community?.liked ?? 'Liked comment'
                : translator.community?.like ?? 'Like comment'
            }
          >
            <MotionView whileTap={{ scale: 0.85 }}>
              <Heart
                size={16}
                weight={isLiked ? 'fill' : 'regular'}
                className={`transition-colors ${isLiked ? 'text-red-500' : 'text-muted-foreground group-hover/like:text-red-500'}`}
              />
            </MotionView>
            {likesCount > 0 ? (
              <span className="text-xs font-medium text-muted-foreground">{likesCount}</span>
            ) : null}
          </button>

          {isReply ? null : (
            <button
              type="button"
              onClick={() => {
                onReply(comment)
              }}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-ring) focus-visible:ring-offset-2"
            >
              {translator.community?.reply ?? 'Reply'}
            </button>
          )}

          <button
            type="button"
            className="ml-auto opacity-0 transition-opacity group-hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-ring) focus-visible:ring-offset-2"
            aria-label={`${translator.community?.comment ?? 'Comment'} options`}
          >
            <DotsThree size={16} weight="bold" className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ReplyBanner({ replyingTo, onCancel, translator }: { readonly replyingTo: Comment; readonly onCancel: () => void; readonly translator: Translator }) {
  return (
    <MotionView
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="flex items-center justify-between bg-muted/50 px-6 py-3 text-sm">
        <div className="flex items-center gap-2">
          <ArrowBendUpLeft size={16} className="text-muted-foreground" />
          <span className="text-muted-foreground">{translator.community?.replyingTo ?? 'Replying to'}</span>
          <span className="font-medium text-foreground">@{replyingTo.authorName}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-7 text-xs"
        >
          {translator.common?.cancel ?? 'Cancel'}
        </Button>
      </div>
    </MotionView>
  )
}

function CharacterCount({ count }: { readonly count: number }) {
  return (
    <MotionView
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-2 text-right text-xs text-muted-foreground"
    >
      {count}/500
    </MotionView>
  )
}
