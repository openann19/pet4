import { useState } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { motion, MotionView } from '@petspark/motion';
import { Plus, Check, BookmarkSimple } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Story, StoryHighlight } from '@petspark/shared';
import type { Pet } from '@/lib/types';
import { createStoryHighlight } from '@/lib/stories-utils';
import { haptics } from '@/lib/haptics';
import { toast } from 'sonner';

interface SaveToHighlightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  story: Story;
  onSaved?: () => void;
}

export default function SaveToHighlightDialog({
  open,
  onOpenChange,
  story,
  onSaved,
}: SaveToHighlightDialogProps) {
  const [highlights, setHighlights] = useStorage<StoryHighlight[]>('story-highlights', []);
  const [userPets] = useStorage<Pet[]>('user-pets', []);

  const [showNewHighlight, setShowNewHighlight] = useState(false);
  const [newHighlightTitle, setNewHighlightTitle] = useState('');
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);

  const userHighlights = (highlights ?? []).filter((h) => h.userId === story.userId);
  const storyAlreadyInHighlight = (highlightId: string) => {
    const highlight = userHighlights.find((h) => h.id === highlightId);
    return highlight?.stories.some((s) => s.id === story.id) || false;
  };

  const handleSelectHighlight = (highlightId: string) => {
    if (storyAlreadyInHighlight(highlightId)) {
      toast.error('Story already in this highlight');
      return;
    }
    haptics.trigger('selection');
    setSelectedHighlightId(highlightId);
  };

  const handleSaveToExisting = () => {
    if (!selectedHighlightId) return;

    haptics.trigger('success');

    setHighlights((current) =>
      (current ?? []).map((h) =>
        h.id === selectedHighlightId
          ? {
            ...h,
            stories: [...h.stories, story],
            updatedAt: new Date().toISOString(),
          }
          : h
      )
    );

    toast.success('Story saved to highlight!', {
      duration: 2000,
      description: 'You can view it anytime in your highlights',
    });

    onSaved?.();
    onOpenChange(false);
    resetState();
  };

  const handleCreateNew = () => {
    if (!newHighlightTitle.trim()) {
      toast.error('Please enter a highlight title');
      return;
    }

    haptics.trigger('success');

    const firstPet = userPets?.[0];
    const newHighlight = createStoryHighlight(
      story.userId,
      firstPet?.id || story.petId,
      newHighlightTitle,
      story.thumbnailUrl || story.mediaUrl,
      [story]
    );

    setHighlights((current) => [...(current ?? []), newHighlight]);

    toast.success('Highlight created!', {
      duration: 2000,
      description: `"${newHighlightTitle}" has been created with this story`,
    });

    onSaved?.();
    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setShowNewHighlight(false);
    setNewHighlightTitle('');
    setSelectedHighlightId(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookmarkSimple size={24} weight="fill" className="text-primary" />
            Save to Highlight
          </DialogTitle>
          <DialogDescription>Save this story to a permanent highlight collection</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {showNewHighlight ? (
                                  <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <Label htmlFor="new-highlight-title">Highlight Name</Label>
                <Input
                  id="new-highlight-title"
                  value={newHighlightTitle}
                  onChange={(e) => { setNewHighlightTitle(e.target.value); }}
                  placeholder="e.g., Summer Adventures, Best Moments"
                  maxLength={30}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  {newHighlightTitle.length}/30 characters
                </p>
              </div>

              <div className="aspect-[9/16] max-h-48 rounded-2xl overflow-hidden bg-muted">
                <img
                  src={story.thumbnailUrl || story.mediaUrl}
                  alt="Story preview"
                  className="w-full h-full object-cover"
                />
              </div>
                                  </motion.button>
          ) : (
            <ScrollArea className="h-100 pr-4">
              <div className="space-y-3 py-4">
                {userHighlights.length === 0 ? (
                  <div className="text-center py-12">
                    <BookmarkSimple size={48} className="mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-2">No highlights yet</p>
                    <p className="text-sm text-muted-foreground">
                      Create your first highlight to save this story
                    </p>
                  </div>
                ) : (
                  userHighlights.map((highlight) => {
                    const alreadyInHighlight = storyAlreadyInHighlight(highlight.id);
                    const isSelected = selectedHighlightId === highlight.id;

                    return (
                                            <motion.button
                        type="button"
                        key={highlight.id}
                        onClick={() => !alreadyInHighlight && handleSelectHighlight(highlight.id)}
                        disabled={alreadyInHighlight}
                        className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${alreadyInHighlight
                          ? 'opacity-50 cursor-not-allowed bg-muted'
                          : isSelected
                            ? 'bg-primary/20 border-2 border-primary'
                            : 'glass-effect hover:bg-white/20 dark:hover:bg-white/5'
                          }`}
                        whileHover={!alreadyInHighlight ? { scale: 1.02 } : {}}
                        whileTap={!alreadyInHighlight ? { scale: 0.98 } : {}}
                      >
                        <Avatar className="w-16 h-16 ring-2 ring-border">
                          <AvatarImage src={highlight.coverImage} alt={highlight.title} />
                          <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white font-bold">
                            {highlight.title?.[0]?.toUpperCase() ?? '?'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 text-left min-w-0">
                          <p className="font-semibold truncate">{highlight.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {highlight.stories?.length ?? 0}{' '}
                            {highlight.stories?.length === 1 ? 'story' : 'stories'}
                          </p>
                          {alreadyInHighlight && (
                            <p className="text-xs text-muted-foreground mt-1">Already added</p>
                          )}
                        </div>

                        {isSelected && !alreadyInHighlight && (
                          <div className="shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <Check size={18} weight="bold" className="text-white" />
                          </div>
                        )}

                        {highlight.isPinned && (
                          <div className="shrink-0 text-lg" aria-label="Pinned">
                            📌
                          </div>
                        )}
                                            </motion.button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          {showNewHighlight ? (
            <>
              <Button variant="outline" onClick={() => setShowNewHighlight(false)}>
                Back
              </Button>
              <Button
                onClick={handleCreateNew}
                disabled={!newHighlightTitle.trim()}
                className="bg-linear-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <Plus size={18} weight="bold" className="mr-2" />
                Create Highlight
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => { setShowNewHighlight(true); }}
                className="flex-1"
              >
                <Plus size={18} weight="bold" className="mr-2" />
                New Highlight
              </Button>
              <Button
                onClick={handleSaveToExisting}
                disabled={!selectedHighlightId}
                className="flex-1 bg-linear-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <BookmarkSimple size={18} weight="fill" className="mr-2" />
                Save Story
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
