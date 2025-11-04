import { useState, useEffect, memo } from 'react'
import { motion } from 'framer-motion'
import { Heart, ChatCircle, BookmarkSimple, Share, DotsThree, MapPin, Tag, Flag } from '@phosphor-icons/react'                                                        
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Post } from '@/lib/community-types'
import { communityAPI } from '@/api/community-api'
import { communityService } from '@/lib/community-service'
import { triggerHaptic } from '@/lib/haptics'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { useApp } from '@/contexts/AppContext'
import { CommentsSheet } from './CommentsSheet'
import { MediaViewer } from './MediaViewer'
import { ReportDialog } from './ReportDialog'
import { createLogger } from '@/lib/logger'

const logger = createLogger('PostCard')

interface PostCardProps {
  post: Post
  onAuthorClick?: (authorId: string) => void
}

function PostCardComponent({ post, onAuthorClick }: PostCardProps) {
  const { t } = useApp()
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [likesCount, setLikesCount] = useState(post.reactionsCount || 0)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [showFullText, setShowFullText] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showMediaViewer, setShowMediaViewer] = useState(false)
  const [mediaViewerIndex, setMediaViewerIndex] = useState(0)
  const [showReportDialog, setShowReportDialog] = useState(false)

  useEffect(() => {
    // Check if user has reacted to this post
    // NOTE: User reaction check should query user's reactions for this post
    setIsLiked(false)
    setIsSaved(false)
  }, [post.id])

  const handleLike = async () => {
    triggerHaptic('selection')
    
    try {
      const user = await spark.user()
      const result = await communityAPI.toggleReaction(
        post.id,
        user.id,
        user.login || 'User',
        user.avatarUrl,
        '❤️'
      )
      
      setIsLiked(result.added)
      setLikesCount(result.reactionsCount)
      
      if (result.added) {
        triggerHaptic('success')
      }
    } catch (error) {
      logger.error('Failed to toggle reaction', error instanceof Error ? error : new Error(String(error)))
      toast.error('Failed to react to post')
    }
  }

  const handleSave = async () => {
    triggerHaptic('selection')
    
    if (isSaved) {
      await communityService.unsavePost(post.id)
      setIsSaved(false)
      toast.success(t.community?.unsaved || 'Post removed from saved')
    } else {
      await communityService.savePost(post.id)
      setIsSaved(true)
      toast.success(t.community?.saved || 'Post saved')
    }
  }

  const handleShare = async () => {
    triggerHaptic('selection')
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.authorName}`,
          text: post.text?.slice(0, 100) || '',
          url: `${window.location.origin}/community/post/${post.id}`
        })
      } catch {
        // Share was cancelled by user - no need to log
      }
    } else {
      await navigator.clipboard.writeText(`${window.location.origin}/community/post/${post.id}`)
      toast.success(t.community?.linkCopied || 'Link copied to clipboard')
    }
  }

  const handleReport = () => {
    triggerHaptic('selection')
    setShowReportDialog(true)
  }

  const handleCommentClick = () => {
    setShowComments(true)
    triggerHaptic('selection')
  }

  const handleMediaClick = (index: number) => {
    setMediaViewerIndex(index)
    setShowMediaViewer(true)
    triggerHaptic('selection')
  }

  const truncatedText = (post.text?.length || 0) > 150 ? post.text?.slice(0, 150) + '...' : post.text || ''
  const shouldShowMore = (post.text?.length || 0) > 150

  // Convert media strings or PostMedia objects to MediaItem format for MediaViewer
  const allMedia = (post.media || []).map((item, index) => {
    if (typeof item === 'string') {
      return {
        id: `media-${index}`,
        url: item,
        thumbnail: item,
        type: 'photo' as const,
        width: undefined,
        height: undefined
      }
    } else {
      // It's already a PostMedia object
      return {
        id: item.id || `media-${index}`,
        url: item.url,
        thumbnail: item.thumbnail || item.url,
        type: item.type,
        width: item.width,
        height: item.height
      }
    }
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className="overflow-hidden bg-linear-to-br from-card via-card to-card/95 border border-border/60 shadow-lg hover:shadow-xl hover:border-border transition-all duration-500 backdrop-blur-sm">
        {/* Author Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <motion.button
            onClick={() => onAuthorClick?.(post.authorId)}
            className="flex items-center gap-3 group"
            whileHover={{ x: 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Avatar className="h-11 w-11 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all duration-300">
                {post.authorAvatar ? (
                  <img src={post.authorAvatar} alt={post.authorName} className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold text-base">
                    {post.authorName?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </Avatar>
            </motion.div>
            <div className="text-left">
              <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors duration-200">
                {post.authorName}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </motion.button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full hover:bg-primary/10 transition-colors duration-200"
                  aria-label="Post options"
                >
                  <DotsThree size={22} weight="bold" />
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleReport} className="text-destructive">
                <Flag size={18} className="mr-2" />
                Report Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      {/* Post Text */}
      {post.text && (
        <div className="px-4 pb-3">
          <p className="text-foreground whitespace-pre-wrap wrap-break-word">
            {showFullText ? post.text : truncatedText}
          </p>
          {shouldShowMore && (
            <button
              onClick={() => setShowFullText(!showFullText)}
              className="text-sm text-primary font-medium mt-1 hover:underline"
            >
              {showFullText ? (t.community?.showLess || 'Show less') : (t.community?.showMore || 'Show more')}
            </button>
          )}
        </div>
      )}

      {/* Media Carousel */}
      {post.media && post.media.length > 0 && post.media[currentMediaIndex] && (
        <div className="relative bg-muted">
          <div className="relative aspect-square overflow-hidden">
            <motion.img
              key={currentMediaIndex}
              src={typeof post.media[currentMediaIndex] === 'string' 
                ? post.media[currentMediaIndex]
                : (post.media[currentMediaIndex] as { url: string }).url}
              alt="Post media"
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => handleMediaClick(currentMediaIndex)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          {/* Media Navigation Dots */}
          {post.media.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {post.media.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentMediaIndex(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentMediaIndex 
                      ? 'w-6 bg-white' 
                      : 'w-1.5 bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`View photo ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Media Counter */}
          {post.media.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm">
              {currentMediaIndex + 1} / {post.media.length}
            </div>
          )}
        </div>
      )}

      {/* Actions Row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 group"
          >
            <motion.div
              whileTap={{ scale: 0.85 }}
              animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Heart
                size={24}
                weight={isLiked ? 'fill' : 'regular'}
                className={`transition-colors ${
                  isLiked ? 'text-red-500' : 'text-foreground group-hover:text-red-500'
                }`}
              />
            </motion.div>
            {likesCount > 0 && (
              <span className="text-sm font-medium text-foreground">{likesCount}</span>
            )}
          </button>

          <button
            onClick={handleCommentClick}
            className="flex items-center gap-1.5 group"
          >
            <ChatCircle
              size={24}
              weight="regular"
              className="text-foreground group-hover:text-primary transition-colors"
            />
            {(post.commentsCount ?? 0) > 0 && (
              <span className="text-sm font-medium text-foreground">{post.commentsCount}</span>
            )}
          </button>

          <button onClick={handleShare} className="group">
            <Share
              size={24}
              weight="regular"
              className="text-foreground group-hover:text-primary transition-colors"
            />
          </button>
        </div>

        <button onClick={handleSave}>
          <motion.div whileTap={{ scale: 0.85 }}>
            <BookmarkSimple
              size={24}
              weight={isSaved ? 'fill' : 'regular'}
              className={`transition-colors ${
                isSaved ? 'text-primary' : 'text-foreground hover:text-primary'
              }`}
            />
          </motion.div>
        </button>
      </div>

      {/* Tags and Location */}
      {((post.tags && post.tags.length > 0) || post.location) && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {post.tags && post.tags.slice(0, 3).map(tag => (
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

      {/* Views Footer */}
      {(post.viewsCount ?? 0) > 0 && (
        <div className="px-4 pb-3 text-xs text-muted-foreground">
          {post.viewsCount} {post.viewsCount === 1 ? 'view' : 'views'}
        </div>
      )}

      <CommentsSheet
        open={showComments}
        onOpenChange={setShowComments}
        postId={post.id}
        postAuthor={post.authorName}
      />

      <MediaViewer
        open={showMediaViewer}
        onOpenChange={setShowMediaViewer}
        media={allMedia}
        initialIndex={mediaViewerIndex}
        authorName={post.authorName}
      />

      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        resourceType="post"
        resourceId={post.id}
        resourceName={`Post by ${post.authorName}`}
        onReported={() => {
          toast.success('Report submitted. Thank you for helping keep our community safe.')
        }}
      />
      </Card>
    </motion.div>
  )
}

// Memoize PostCard to prevent unnecessary re-renders
export const PostCard = memo(PostCardComponent, (prev, next) => {
  return (
    prev.post.id === next.post.id &&
    prev.post.reactionsCount === next.post.reactionsCount &&
    prev.post.commentsCount === next.post.commentsCount &&
    prev.post.text === next.post.text
  )
})
