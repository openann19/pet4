import { Button } from '@/components/ui/button'
import { useStorage } from '@/hooks/useStorage'
import { haptics } from '@/lib/haptics'
import type { StoryHighlight } from '@/lib/stories-types'
import { PushPin, PushPinSlash, Trash, X } from '@phosphor-icons/react'
import { motion } from '@petspark/motion'
import { useState } from 'react'
import { toast } from 'sonner'
import StoryViewer from './StoryViewer'
import { isTruthy, isDefined } from '@/core/guards';

interface HighlightViewerProps {
  highlight: StoryHighlight
  currentUserId: string
  currentUserName: string
  currentUserAvatar?: string
  onClose: () => void
}

export default function HighlightViewer({
  highlight,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onClose
}: HighlightViewerProps) {
  const [, setHighlights] = useStorage<StoryHighlight[]>('story-highlights', [])
  const [showStoryViewer, setShowStoryViewer] = useState(false)
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0)

  const isOwner = highlight.userId === currentUserId

  const handleStoryClick = (index: number) => {
    haptics.trigger('light')
    setSelectedStoryIndex(index)
    setShowStoryViewer(true)
  }

  const handleTogglePin = () => {
    haptics.trigger('selection')
    setHighlights((current) =>
      (current || []).map((h) =>
        h.id === highlight.id ? { ...h, isPinned: !h.isPinned } : h
      )
    )
    toast.success(highlight.isPinned ? 'Unpinned' : 'Pinned', {
      duration: 1500
    })
  }

  const handleDelete = () => {
    haptics.trigger('warning')
    setHighlights((current) =>
      (current || []).filter((h) => h.id !== highlight.id)
    )
    toast.success('Highlight deleted', {
      duration: 2000
    })
    onClose()
  }

  if (isTruthy(showStoryViewer)) {
    return (
      <StoryViewer
        stories={highlight.stories}
        initialIndex={selectedStoryIndex}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        {...(currentUserAvatar !== undefined ? { currentUserAvatar } : {})}
        onClose={() => { setShowStoryViewer(false); }}
      />
    )
  }

  return (
    <MotionView
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <MotionView
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-2xl bg-background rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold truncate">{highlight.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {highlight.stories.length} {highlight.stories.length === 1 ? 'story' : 'stories'}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {isOwner && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleTogglePin}
                  className="shrink-0"
                >
                  {highlight.isPinned ? (
                    <PushPinSlash size={20} weight="fill" />
                  ) : (
                    <PushPin size={20} />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="shrink-0 text-destructive hover:text-destructive"
                >
                  <Trash size={20} weight="bold" />
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0"
            >
              <X size={24} weight="bold" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-3">
            {highlight.stories.map((story, index) => (
              <MotionView as="button"
                key={story.id}
                onClick={() => { handleStoryClick(index); }}
                className="aspect-[9/16] rounded-2xl overflow-hidden relative group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
              >
                <img
                  src={story.thumbnailUrl || story.mediaUrl}
                  alt={story.caption || `Story ${String(index + 1 ?? '')}`}
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {story.caption && (
                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs line-clamp-2 font-medium drop-shadow-lg">
                      {story.caption}
                    </p>
                  </div>
                )}

                {story.type === 'video' && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">▶</span>
                  </div>
                )}
              </MotionView>
            ))}
          </div>
        </div>
      </MotionView>
    </MotionView>
  )
}
