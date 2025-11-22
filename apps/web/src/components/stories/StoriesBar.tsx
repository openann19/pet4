import { useState, useMemo, useCallback, Suspense } from 'react';
import { MotionView } from '@petspark/motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import StoryRing from './StoryRing';
import { StoryViewer } from '@/components/lazy-exports';
import CreateStoryDialog from './CreateStoryDialog';
import { groupStoriesByUser, filterActiveStories } from '@petspark/shared';
import type { Story } from '@petspark/shared';

interface StoriesBarProps {
  allStories: Story[];
  currentUserId: string;
  currentUserName: string;
  currentUserPetId: string;
  currentUserPetName: string;
  currentUserPetPhoto: string;
  currentUserAvatar?: string;
  onStoryCreated: (story: Story) => void;
  onStoryUpdate: (story: Story) => void;
}

export default function StoriesBar({
  allStories,
  currentUserId,
  currentUserName,
  currentUserPetId,
  currentUserPetName,
  currentUserPetPhoto,
  currentUserAvatar,
  onStoryCreated,
  onStoryUpdate,
}: StoriesBarProps) {
  const [viewingStories, setViewingStories] = useState<Story[] | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Memoize expensive computations
  const activeStories = useMemo(() => filterActiveStories(allStories), [allStories]);
  const storiesByUser = useMemo(() => groupStoriesByUser(activeStories), [activeStories]);

  const ownStories = useMemo(
    () => activeStories.filter((s) => s.userId === currentUserId),
    [activeStories, currentUserId]
  );
  const otherStories = useMemo(
    () => activeStories.filter((s) => s.userId !== currentUserId),
    [activeStories, currentUserId]
  );

  const uniqueUserIds = useMemo(
    () => Array.from(new Set([...otherStories.map((s) => s.userId)])),
    [otherStories]
  );

  const handleStoryRingClick = useCallback((userId: string) => {
    const userStories = storiesByUser.get(userId);
    if (userStories && userStories.length > 0) {
      setViewingStories(userStories);
    }
  }, [storiesByUser]);

  const handleOwnStoryClick = useCallback(() => {
    if (ownStories.length > 0) {
      setViewingStories(ownStories);
    } else {
      setShowCreateDialog(true);
    }
  }, [ownStories]);

  const handleCloseViewer = useCallback(() => {
    setViewingStories(null);
  }, []);

  const handleShowCreateDialog = useCallback(() => {
    setShowCreateDialog(true);
  }, []);

  if (activeStories.length === 0 && ownStories.length === 0) {
    return (
      <>
        <MotionView
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong p-4 rounded-3xl backdrop-blur-2xl border border-white/20 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Share Your Story</h3>
              <p className="text-sm text-muted-foreground">Be the first to share a story!</p>
            </div>
            <button
              onClick={handleShowCreateDialog}
              className="w-12 h-12 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg hover:scale-105 transition-transform"
            >
              +
            </button>
          </div>
        </MotionView>

        <CreateStoryDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          userId={currentUserId}
          userName={currentUserName}
          petId={currentUserPetId}
          petName={currentUserPetName}
          petPhoto={currentUserPetPhoto}
          userAvatar={currentUserAvatar}
          onStoryCreated={onStoryCreated}
        />
      </>
    );
  }

  return (
    <>
      <MotionView
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong p-4 rounded-3xl backdrop-blur-2xl border border-white/20 mb-6"
      >
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-2">
            <StoryRing
              stories={ownStories}
              petName={currentUserPetName}
              petPhoto={currentUserPetPhoto}
              isOwn
              onClick={handleOwnStoryClick}
            />

            {uniqueUserIds.map((userId) => {
              const userStories = storiesByUser.get(userId);

              if (!userStories || userStories.length === 0) return null;

              const firstStory = userStories[0]!;

              return (
                <StoryRing
                  key={userId}
                  stories={userStories}
                  petName={firstStory.petName}
                  petPhoto={firstStory.petPhoto}
                  hasUnviewed={
                    !userStories.some(
                      (s) =>
                        Array.isArray(s.views) && s.views.some((v) => v.userId === currentUserId)
                    )
                  }
                  onClick={() => handleStoryRingClick(userId)}
                />
              );
            })}
          </div>
        </ScrollArea>
      </MotionView>

      {viewingStories && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>}>
          <StoryViewer
            stories={viewingStories}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserAvatar={currentUserAvatar}
            onClose={handleCloseViewer}
            onStoryUpdate={onStoryUpdate}
          />
        </Suspense>
      )}

      <CreateStoryDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        userId={currentUserId}
        userName={currentUserName}
        petId={currentUserPetId}
        petName={currentUserPetName}
        petPhoto={currentUserPetPhoto}
        userAvatar={currentUserAvatar}
        onStoryCreated={onStoryCreated}
      />
    </>
  );
}
