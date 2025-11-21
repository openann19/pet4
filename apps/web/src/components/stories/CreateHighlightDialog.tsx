import { useState, useEffect } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { motion, MotionView } from '@petspark/motion';
import { Plus, Check } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { isTruthy } from '@petspark/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Story, StoryHighlight } from '@petspark/shared';
import type { Pet } from '@/lib/types';
import { createStoryHighlight } from '@/lib/stories-utils';
import { filterActiveStories } from '@/lib/stories-utils';
import { haptics } from '@/lib/haptics';
import { toast } from 'sonner';

interface CreateHighlightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingHighlight?: StoryHighlight;
}

export default function CreateHighlightDialog({
  open,
  onOpenChange,
  existingHighlight,
}: CreateHighlightDialogProps) {
  const [stories] = useStorage<Story[]>('stories', []);
  const [userPets] = useStorage<Pet[]>('user-pets', []);
  const [currentUser] = useStorage<{ id: string; name: string }>('current-user', {
    id: 'user-1',
    name: 'User',
  });
  const [, setHighlights] = useStorage<StoryHighlight[]>('story-highlights', []);

  const [title, setTitle] = useState(existingHighlight?.title ?? '');
  const [selectedStories, setSelectedStories] = useState<Set<string>>(
    new Set(existingHighlight?.stories.map((s) => s.id) ?? [])
  );
  const [coverImageUrl, setCoverImageUrl] = useState(existingHighlight?.coverImage ?? '');

  const myStories = (stories ?? []).filter((s) => s.userId === (currentUser?.id ?? 'user-1'));

  const userStories = filterActiveStories(myStories);

  useEffect(() => {
    if (selectedStories.size > 0 && !coverImageUrl) {
      const firstSelected = userStories.find((s) => selectedStories.has(s.id));
      if (firstSelected) {
        setCoverImageUrl(firstSelected.thumbnailUrl ?? firstSelected.mediaUrl);
      }
    }
  }, [selectedStories, userStories, coverImageUrl]);

  const handleToggleStory = (storyId: string) => {
    haptics.trigger('selection');
    setSelectedStories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
  };

  const handleSetCover = (story: Story) => {
    haptics.trigger('light');
    setCoverImageUrl(story.thumbnailUrl ?? story.mediaUrl);
    toast.success('Cover image set', { duration: 1500 });
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (selectedStories.size === 0) {
      toast.error('Please select at least one story');
      return;
    }

    haptics.trigger('success');

    const selectedStoryObjects = userStories.filter((s) => selectedStories.has(s.id));
    const firstPet = userPets?.[0];

    if (isTruthy(existingHighlight)) {
      setHighlights((current) =>
        (current ?? []).map((h) =>
          h.id === existingHighlight.id
            ? {
              ...h,
              title,
              coverImage: coverImageUrl,
              stories: selectedStoryObjects,
              updatedAt: new Date().toISOString(),
            }
            : h
        )
      );
      toast.success('Highlight updated!');
    } else {
      const newHighlight = createStoryHighlight(
        currentUser?.id ?? 'user-1',
        firstPet?.id ?? 'pet-1',
        title,
        coverImageUrl,
        selectedStoryObjects
      );

      setHighlights((current) => [...(current ?? []), newHighlight]);
      toast.success('Highlight created!');
    }

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setSelectedStories(new Set());
    setCoverImageUrl('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{existingHighlight ? 'Edit Highlight' : 'Create Highlight'}</DialogTitle>
          <DialogDescription>
            Save your favorite stories to a permanent highlight collection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          <div className="space-y-2">
            <Label htmlFor="highlight-title">Highlight Title</Label>
            <Input
              id="highlight-title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); }}
              placeholder="e.g., Summer Adventures, Best Moments"
              maxLength={30}
            />
            <p className="text-xs text-muted-foreground">{title.length}/30 characters</p>
          </div>

          {userStories.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">You don't have any active stories yet</p>
              <p className="text-sm text-muted-foreground">
                Create some stories first to add them to highlights
              </p>
            </div>
          ) : (
            <>
              <div>
                <Label className="mb-3 block">Select Stories ({selectedStories.size})</Label>
                <div className="grid grid-cols-3 gap-3">
                  {userStories.map((story, index) => {
                    const isSelected = selectedStories.has(story.id);
                    const isCover = coverImageUrl === (story.thumbnailUrl ?? story.mediaUrl);

                    return (
                      <MotionView
                        key={story.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="relative"
                      >
                        <button
                          onClick={() => { handleToggleStory(story.id); }}
                          className={`aspect-[9/16] rounded-2xl overflow-hidden relative group w-full border-2 transition-all ${String(isSelected
                            ? 'border-primary shadow-lg'
                            : 'border-transparent hover:border-border')
                            }`}
                        >
                          <img
                            src={story.thumbnailUrl ?? story.mediaUrl}
                            alt={story.caption ?? 'Story'}
                            className="w-full h-full object-cover"
                          />

                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />

                          {isSelected && (
                            <MotionView
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"
                            >
                              <Check size={16} weight="bold" className="text-white" />
                            </MotionView>
                          )}

                          {isCover && (
                            <div className="absolute bottom-2 left-2 right-2">
                              <div className="bg-primary/90 backdrop-blur-sm rounded-lg px-2 py-1">
                                <p className="text-white text-xs font-semibold text-center">
                                  Cover
                                </p>
                              </div>
                            </div>
                          )}
                        </button>

                        {isSelected && !isCover && (
                          <Button
                            onClick={() => { handleSetCover(story); }}
                            variant="secondary"
                            size="sm"
                            className="absolute bottom-2 left-2 right-2 text-xs h-7"
                          >
                            Set as Cover
                          </Button>
                        )}
                      </MotionView>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || selectedStories.size === 0}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            <Plus size={18} weight="bold" className="mr-2" />
            {existingHighlight ? 'Update' : 'Create'} Highlight
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
