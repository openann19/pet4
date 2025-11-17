import { memo, useMemo } from 'react';
import { motion, MotionView } from '@petspark/motion';
import { Plus } from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { filterActiveStories } from '@petspark/shared';
import type { Story } from '@petspark/shared';

interface StoryRingProps {
  stories: Story[];
  petName: string;
  petPhoto: string;
  isOwn?: boolean;
  hasUnviewed?: boolean;
  onClick: () => void;
}

function StoryRingComponent({
  stories,
  petName,
  petPhoto,
  isOwn = false,
  hasUnviewed = false,
  onClick,
}: StoryRingProps) {
  const activeStories = useMemo(() => filterActiveStories(stories), [stories]);
  const hasActiveStories = activeStories.length > 0;

  return (
        <motion.button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 shrink-0"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative">
        {isOwn && !hasActiveStories ? (
          <div className="w-16 h-16 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center border-2 border-dashed border-primary">
            <Plus size={24} weight="bold" className="text-primary" />
          </div>
        ) : (
          <>
            <div
              className={`w-16 h-16 rounded-full p-0.5 ${hasUnviewed ? 'bg-linear-to-tr from-primary via-accent to-secondary' : 'bg-muted'
                }`}
            >
              <Avatar className="w-full h-full border-2 border-background">
                <AvatarImage src={petPhoto} alt={petName} />
                <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white font-bold text-lg">
                  {petName[0]}
                </AvatarFallback>
              </Avatar>
            </div>

            {isOwn && hasActiveStories && (
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                <Plus size={12} weight="bold" className="text-white" />
              </div>
            )}
          </>
        )}
      </div>

      <span className="text-xs font-medium truncate w-16 text-center">
        {isOwn ? 'Your Story' : petName}
      </span>
    </motion.button>
  );
}

// Memoize StoryRing to prevent unnecessary re-renders
export default memo(StoryRingComponent, (prev, next) => {
  return (
    prev.petName === next.petName &&
    prev.petPhoto === next.petPhoto &&
    prev.isOwn === next.isOwn &&
    prev.hasUnviewed === next.hasUnviewed &&
    prev.stories.length === next.stories.length &&
    prev.stories.every((story, index) => story.id === next.stories[index]?.id) &&
    prev.onClick === next.onClick
  );
});
