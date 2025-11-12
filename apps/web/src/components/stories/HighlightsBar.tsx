import { useState } from 'react';
import { motion, MotionView } from '@petspark/motion';
import { Plus } from '@phosphor-icons/react';
import { useStorage } from '@/hooks/use-storage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { StoryHighlight } from '@/lib/stories-types';
import HighlightViewer from './HighlightViewer';
import CreateHighlightDialog from './CreateHighlightDialog';
import { haptics } from '@/lib/haptics';

interface HighlightsBarProps {
  petId?: string;
  userId?: string;
  onlyOwn?: boolean;
}

export default function HighlightsBar({ petId, userId, onlyOwn = false }: HighlightsBarProps) {
  const [highlights] = useStorage<StoryHighlight[]>('story-highlights', []);
  const [currentUser] = useStorage<{ id: string; name: string }>('current-user', {
    id: 'user-1',
    name: 'User',
  });
  const [selectedHighlight, setSelectedHighlight] = useState<StoryHighlight | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const filteredHighlights = (highlights || []).filter((h) => {
    if (petId) return h.petId === petId;
    if (userId) return h.userId === userId;
    if (onlyOwn) return h.userId === (currentUser?.id || 'user-1');
    return true;
  });

  const sortedHighlights = [...filteredHighlights].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  if (sortedHighlights.length === 0 && !onlyOwn) {
    return null;
  }

  return (
    <>
      <div className="w-full overflow-x-auto">
        <div className="flex gap-4 pb-2 min-w-min">
          {onlyOwn && (
            <MotionView
              as="button"
              onClick={() => {
                haptics.trigger('selection');
                setShowCreateDialog(true);
              }}
              className="flex flex-col items-center gap-2 shrink-0 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border-2 border-dashed border-border group-hover:border-primary transition-colors">
                  <Plus
                    size={28}
                    className="text-muted-foreground group-hover:text-primary transition-colors"
                    weight="bold"
                  />
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground max-w-20 truncate">
                New
              </span>
            </MotionView>
          )}

          {sortedHighlights.map((highlight, index) => (
            <MotionView
              as="button"
              key={highlight.id}
              onClick={() => {
                haptics.trigger('light');
                setSelectedHighlight(highlight);
              }}
              className="flex flex-col items-center gap-2 shrink-0 group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-accent to-secondary p-1">
                  <div className="w-full h-full rounded-full bg-background" />
                </div>

                <Avatar className="w-20 h-20 relative ring-2 ring-background">
                  <AvatarImage
                    src={highlight.coverImage}
                    alt={highlight.title}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold text-xl">
                    {highlight.title?.[0]?.toUpperCase() ?? 'H'}
                  </AvatarFallback>
                </Avatar>

                {highlight.isPinned && (
                  <MotionView
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center shadow-lg border-2 border-background"
                  >
                    <span className="text-[10px]">📌</span>
                  </MotionView>
                )}

                <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg text-[10px] font-bold text-white border border-background">
                  {highlight.stories.length}
                </div>
              </div>

              <span className="text-xs font-medium text-foreground max-w-20 truncate text-center leading-tight">
                {highlight.title}
              </span>
            </MotionView>
          ))}
        </div>
      </div>

      {selectedHighlight && (
        <HighlightViewer
          highlight={selectedHighlight}
          currentUserId={currentUser?.id || 'user-1'}
          currentUserName={currentUser?.name || 'User'}
          onClose={() => { setSelectedHighlight(null); }}
        />
      )}

      {showCreateDialog && (
        <CreateHighlightDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      )}
    </>
  );
}
